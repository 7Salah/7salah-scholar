// 7Salah Scholar — Unified AcademicCore (Rooms, Profile Integrity & Persistent-Memory Voice Companion)
(function (global) {
  "use strict";

  const UUID_OR_UID_RX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[A-Za-z0-9_-]{20,128})$/i;

  function speechLocale(lang) {
    if (lang === "fr") return "fr-FR";
    if (lang === "en") return "en-US";
    return "ar-DZ";
  }

  function cleanSpeechText(text) {
    return String(text || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/\[(?:Doc[^\]]*|\d+)\]/g, "")
      .replace(/[*_`#>]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  class AcademicCore {
    constructor(opts) {
      opts = opts || {};
      this.companionUrl = opts.companionUrl || "/api/sql/companion";
      this.profileUrl = opts.profileUrl || "/api/sql/profile";
      this.meUrl = opts.meUrl || "/api/sql/me";
      this.recognition = null;
      this.memory = null;
      this.listening = false;
      this.initVoiceEngine();
    }

    async getAuthHeaders() {
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
      };
      try {
        if (global.ScholarAuth && typeof global.ScholarAuth.getFreshIdToken === "function") {
          const token = await global.ScholarAuth.getFreshIdToken();
          if (token) headers["Authorization"] = "Bearer " + token;
        }
      } catch (_) {}
      return headers;
    }

    // 1. Flexible room link / code resolution
    resolveRoomCode(rawInput) {
      if (!rawInput) return "";
      const clean = String(rawInput).trim();
      if (!clean) return "";
      try {
        if (/^https?:\/\//i.test(clean) || clean.includes("#room=") || clean.includes("room=") || clean.includes("/")) {
          const normalized = /^https?:\/\//i.test(clean)
            ? clean
            : "https://placeholder.local/" + clean.replace(/^\/+/, "");
          const u = new URL(normalized);
          const hashMatch = u.hash && u.hash.match(/[#&?](?:room|code)=([^&]+)/i);
          if (hashMatch && hashMatch[1]) return decodeURIComponent(hashMatch[1]).trim();
          const qRoom = u.searchParams.get("room") || u.searchParams.get("code");
          if (qRoom) return qRoom.trim();
          const segs = u.pathname.split("/").filter(Boolean);
          if (segs.length) return decodeURIComponent(segs[segs.length - 1]).trim();
        }
      } catch (_) {}

      const m = clean.match(/(?:^|[#&?])(?:room|code)=([^&#\s]+)/i);
      if (m && m[1]) {
        try {
          return decodeURIComponent(m[1]).trim();
        } catch (_) {
          return m[1].trim();
        }
      }
      const parts = clean.split("/").filter(Boolean);
      return parts.length ? parts[parts.length - 1].trim() : clean;
    }

    async joinOrVerifyRoom(rawInput) {
      const roomCode = this.resolveRoomCode(rawInput);
      if (!roomCode) {
        throw new Error("يرجى إدخال رمز الغرفة أو الرابط.");
      }
      try {
        const headers = await this.getAuthHeaders();
        let res = await fetch("/api/rooms/" + encodeURIComponent(roomCode), { method: "GET", cache: "no-store", headers });
        if (!res.ok) {
          res = await fetch("/api/sql/rooms/" + encodeURIComponent(roomCode), { method: "GET", cache: "no-store", headers });
        }
        if (!res.ok) {
          throw new Error("الغرفة غير متاحة حالياً أو انتهت الجلسة.");
        }
        const data = await res.json();
        const room = data && (data.room || data);
        if (!room || room.status === "closed") {
          throw new Error("الغرفة غير متاحة حالياً أو انتهت الجلسة.");
        }
        return data;
      } catch (e) {
        throw new Error((e && e.message) || "الغرفة غير متاحة حالياً أو انتهت الجلسة.");
      }
    }

    // 2. Strict user ID validation + academic profile persistence
    async saveAcademicProfile(userId, profileFields) {
      const cleanId = typeof userId === "string" ? userId.trim() : "";
      if (!cleanId || !UUID_OR_UID_RX.test(cleanId)) {
        throw new Error("خطأ في المصادقة: معرف المستخدم غير صالح.");
      }
      const headers = await this.getAuthHeaders();
      if (!headers["Authorization"]) {
        throw new Error("يرجى تسجيل الدخول بحساب Google لحفظ ملفك الأكاديمي.");
      }
      const res = await fetch(this.profileUrl, {
        method: "PUT",
        cache: "no-store",
        headers,
        body: JSON.stringify({
          userId: cleanId,
          name: profileFields && profileFields.name,
          field: profileFields && profileFields.field,
          university: profileFields && profileFields.university,
          academicTitle: profileFields && (profileFields.academicTitle || profileFields.title),
          bio: profileFields && profileFields.bio
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "تعذر حفظ الملف الأكاديمي.");
      }
      return json.profile;
    }

    async fetchAcademicBundle() {
      try {
        const headers = await this.getAuthHeaders();
        if (!headers["Authorization"]) return null;
        const res = await fetch(this.meUrl, { method: "GET", cache: "no-store", headers });
        if (!res.ok) return null;
        const bundle = await res.json().catch(() => null);
        if (bundle && bundle.memory) {
          this.memory = bundle.memory;
        }
        return bundle;
      } catch (_) {
        return null;
      }
    }

    // 3. Personal Academic Voice Companion (SpeechRecognition + Persistent Memory + SpeechSynthesis)
    initVoiceEngine(lang) {
      const SR = global.SpeechRecognition || global.webkitSpeechRecognition;
      if (!SR) {
        this.recognition = null;
        return null;
      }
      this.recognition = new SR();
      this.recognition.lang = speechLocale(lang || (global.S && global.S.lang) || "ar");
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      return this.recognition;
    }

    speakText(text, lang) {
      if (typeof global.speechSynthesis === "undefined" || typeof global.SpeechSynthesisUtterance === "undefined") {
        return false;
      }
      const spoken = cleanSpeechText(text);
      if (!spoken) return false;
      try {
        global.speechSynthesis.cancel();
        const utt = new global.SpeechSynthesisUtterance(spoken);
        const targetLang = speechLocale(lang || (global.S && global.S.lang) || "ar");
        utt.lang = targetLang;
        const voices = global.speechSynthesis.getVoices ? global.speechSynthesis.getVoices() : [];
        const prefix = targetLang.slice(0, 2).toLowerCase();
        const match = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(prefix));
        if (match) utt.voice = match;
        utt.rate = 1.0;
        global.speechSynthesis.speak(utt);
        return true;
      } catch (_) {
        return false;
      }
    }

    stopSpeaking() {
      try {
        if (typeof global.speechSynthesis !== "undefined") {
          global.speechSynthesis.cancel();
        }
      } catch (_) {}
    }

    async askCompanion(userMessage, opts) {
      opts = opts || {};
      const msg = String(userMessage || "").trim();
      if (!msg) throw new Error("يرجى كتابة أو قول سؤالك أولاً.");

      const headers = await this.getAuthHeaders();
      const lang = opts.lang || (global.S && global.S.lang) || "ar";
      let result = null;

      if (headers["Authorization"]) {
        try {
          const response = await fetch(this.companionUrl, {
            method: "POST",
            cache: "no-store",
            credentials: "same-origin",
            headers,
            body: JSON.stringify({
              message: msg,
              lang,
              field: opts.field || "",
              studentContext: opts.studentContext || this.memory || {}
            })
          });
          if (response.ok) {
            result = await response.json().catch(() => null);
          }
        } catch (_) {}
      }

      if (!result || !result.reply) {
        try {
          const res2 = await fetch("/api/ai/research", {
            method: "POST",
            cache: "no-store",
            credentials: "same-origin",
            headers,
            body: JSON.stringify({
              messages: [{ role: "user", text: msg }],
              mode: "qa",
              taskRoute: "fast",
              lang,
              field: opts.field || ""
            })
          });
          if (res2.ok) {
            const j2 = await res2.json().catch(() => null);
            if (j2 && j2.answer) result = { reply: j2.answer, modelUsed: j2.modelUsed || "gemini" };
          }
        } catch (_) {}
      }

      if (!result || !result.reply) {
        let localWorks = [];
        try {
          const oa = await fetch("https://api.openalex.org/works?search=" + encodeURIComponent(msg.slice(0, 140)) + "&per-page=2");
          if (oa.ok) {
            const oj = await oa.json().catch(() => ({}));
            localWorks = Array.isArray(oj.results) ? oj.results : [];
          }
        } catch (_) {}
        const trackNote = (this.memory && (this.memory.field || opts.field)) ? ` (${this.memory && this.memory.field || opts.field})` : "";
        const replyText = localWorks.length
          ? (lang === "ar"
            ? `أبرز الدراسات القريبة من موضوعك${trackNote}: ${localWorks.map((w) => `${w.title} (${w.publication_year || ""})`).join(" — ")}`
            : `Related scholarly works${trackNote}: ${localWorks.map((w) => `${w.title} (${w.publication_year || ""})`).join(" — ")}`)
          : (lang === "ar"
            ? `تم استلام سؤالك حول «${msg.slice(0, 80)}»${trackNote}. يمكنك المتابعة عبر تبويب البحث أو إرفاق ملف نصي لتحليل معمّق.`
            : `Question received regarding “${msg.slice(0, 80)}”${trackNote}. Use Research search or attach a text source for deeper study.`);
        result = { reply: replyText, modelUsed: "local-companion" };
      }

      if (result.memory) {
        this.memory = result.memory;
      }

      if (opts.speakReply !== false && result.reply) {
        this.speakText(result.reply, lang);
      }

      return result;
    }

    listenAndAsk(opts) {
      opts = opts || {};
      const lang = opts.lang || (global.S && global.S.lang) || "ar";
      const rec = this.initVoiceEngine(lang);
      if (!rec) {
        throw new Error("المتصفح لا يدعم الإدخال الصوتي المباشر (SpeechRecognition). يمكنك كتابة سؤالك أدناه.");
      }
      if (this.listening) {
        try {
          rec.stop();
        } catch (_) {}
        this.listening = false;
        return false;
      }

      this.listening = true;
      rec.onresult = async (ev) => {
        this.listening = false;
        const transcript = ev.results && ev.results[0] && ev.results[0][0] ? ev.results[0][0].transcript : "";
        if (!transcript) {
          if (opts.onError) opts.onError(new Error("لم يتم التقاط صوت واضح. حاول مجدداً."));
          return;
        }
        if (opts.onTranscript) opts.onTranscript(transcript);
        try {
          const result = await this.askCompanion(transcript, {
            lang,
            field: opts.field || "",
            studentContext: opts.studentContext,
            speakReply: opts.speakReply !== false
          });
          if (opts.onReply) opts.onReply(result);
        } catch (err) {
          if (opts.onError) opts.onError(err);
        }
      };

      rec.onerror = (ev) => {
        this.listening = false;
        if (opts.onError) {
          opts.onError(new Error(ev && ev.error === "not-allowed"
            ? "يرجى السماح بصلاحية الميكروفون للمتصفح."
            : "تعذر التقاط الصوت. تأكد من الميكروفون وحاول مجدداً."));
        }
      };

      rec.onend = () => {
        this.listening = false;
        if (opts.onEnd) opts.onEnd();
      };

      rec.start();
      return true;
    }
  }

  global.AcademicCore = AcademicCore;
  global.AcademicCoreInstance = new AcademicCore();
})(typeof window !== "undefined" ? window : globalThis);
