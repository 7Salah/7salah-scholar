window.SUPA = (window.SUPA && window.SUPA.url && window.SUPA.key) ? window.SUPA : { url: "https://sgacauoadufbuotreeeh.supabase.co", key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYWNhdW9hZHVmYnVvdHJlZWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NTMwMjcsImV4cCI6MjEwOTIyOTAyN30.tBQCxrFkE2cWfJGmx4QRWUI8tI_Uw3VWwA3LhIDTp1U" };
// 7Salah Scholar — الدخول بالبريد وكلمة المرور عبر Supabase
window.APP = window.APP || {}; window.APP.apiBase = "https://sgacauoadufbuotreeeh.supabase.co/functions/v1/scholar-api";
(function () {
  "use strict";

  var listeners = [];
  var currentUser = null;
  var currentToken = null;
  var clientPromise = null;
  var recoveryPending = /type=recovery/.test(String(location.hash) + String(location.search));

  function lang() {
    try {
      return (window.S && window.S.lang) || document.documentElement.lang || "ar";
    } catch (e) {
      return "ar";
    }
  }
  function tr(ar, en, fr) {
    var l = lang();
    return l === "ar" ? ar : l === "fr" ? fr || en : en;
  }

  function wrapUser(u) {
    if (!u) return null;
    var md = u.user_metadata || {};
    var name = md.full_name || md.name || (u.email ? u.email.split("@")[0] : "");
    return Object.assign({}, u, {
      uid: u.id,
      displayName: name,
      photoURL: md.avatar_url || md.picture || "",
      email: u.email || ""
    });
  }

  function syncAppState(session) {
    try {
      if (typeof SC !== "undefined" && SC) SC.user = session && session.user ? session.user : null;
    } catch (e) {}
  }

  function setSession(session) {
    currentUser = session && session.user ? wrapUser(session.user) : null;
    currentToken = session && session.access_token ? session.access_token : null;
    syncAppState(session);
    listeners.slice().forEach(function (cb) {
      try {
        cb(currentUser);
      } catch (e) {}
    });
    try {
      if (typeof window.render === "function") window.render();
    } catch (e) {}
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () {
        reject(new Error("load failed"));
      };
      document.head.appendChild(s);
    });
  }

  async function getClient() {
    try {
      if (typeof SC !== "undefined" && SC && SC.sb) return SC.sb;
    } catch (e) {}
    if (typeof window.loadSb === "function") {
      try {
        await window.loadSb();
      } catch (e) {}
      try {
        if (typeof SC !== "undefined" && SC && SC.sb) return SC.sb;
      } catch (e) {}
    }
    if (clientPromise) return clientPromise;
    clientPromise = (async function () {
      var cfg = window.SUPA || (typeof SUPA !== "undefined" ? SUPA : null);
      if (!cfg || !cfg.url || !cfg.key) {
        throw new Error(tr("إعدادات الاتصال بالخادم غير موجودة.", "Server connection settings are missing.", "Paramètres du serveur manquants."));
      }
      if (!window.supabase || !window.supabase.createClient) {
        await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js");
      }
      return window.supabase.createClient(cfg.url, cfg.key);
    })();
    return clientPromise;
  }

  async function signInEmail(email, password) {
    var c = await getClient();
    var r = await c.auth.signInWithPassword({ email: email, password: password });
    if (r.error) throw r.error;
    setSession(r.data.session);
    return currentUser;
  }

  async function signUpEmail(email, password, name) {
    var c = await getClient();
    var r = await c.auth.signUp({ email: email, password: password, options: { data: { full_name: name || "" } } });
    if (r.error) throw r.error;
    if (r.data && r.data.session) {
      setSession(r.data.session);
      return currentUser;
    }
    return null; // يحتاج تأكيد البريد
  }

  async function resetPassword(email) {
    var c = await getClient();
    var r = await c.auth.resetPasswordForEmail(email, { redirectTo: location.href.split("#")[0].split("?")[0] });
    if (r.error) throw r.error;
  }

  async function signOutScholar() {
    try {
      var c = await getClient();
      await c.auth.signOut();
    } catch (e) {}
    setSession(null);
  }

  async function getFreshIdToken() {
    try {
      var c = await getClient();
      var r = await c.auth.getSession();
      var s = r && r.data && r.data.session;
      currentToken = s && s.access_token ? s.access_token : null;
      return currentToken;
    } catch (e) {
      return currentToken;
    }
  }

  function friendlyError(err) {
    var m = String((err && err.message) || err || "");
    if (/Invalid login credentials/i.test(m)) return tr("البريد أو كلمة المرور غير صحيحة.", "Wrong email or password.", "E-mail ou mot de passe incorrect.");
    if (/Email not confirmed/i.test(m)) return tr("أكّد بريدك أولاً من الرسالة التي وصلتك.", "Confirm your email first using the message we sent.", "Confirmez d'abord votre e-mail.");
    if (/already registered|already been registered/i.test(m)) return tr("هذا البريد مسجّل من قبل. سجّل الدخول.", "This email is already registered. Sign in instead.", "Cet e-mail est déjà inscrit.");
    if (/at least \d+ characters|Password should be/i.test(m)) return tr("كلمة المرور قصيرة، استخدم 6 أحرف على الأقل.", "Password is too short. Use at least 6 characters.", "Mot de passe trop court (6 caractères minimum).");
    if (/valid email|invalid format/i.test(m)) return tr("اكتب بريداً إلكترونياً صحيحاً.", "Enter a valid email address.", "Entrez un e-mail valide.");
    if (/rate limit/i.test(m)) return tr("محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.", "Too many attempts. Wait a moment and retry.", "Trop de tentatives.");
    return m || tr("حدث خطأ. حاول مجدداً.", "Something went wrong. Try again.", "Une erreur s'est produite.");
  }

  // ===== نافذة الدخول =====
  var modalEl = null;

  function el(tag, style, text) {
    var n = document.createElement(tag);
    if (style) n.style.cssText = style;
    if (text != null) n.textContent = text;
    return n;
  }

  function closeModal() {
    if (modalEl && modalEl.parentNode) modalEl.parentNode.removeChild(modalEl);
    modalEl = null;
  }

  function openAuthModal() {
    if (modalEl) return;
    var rtl = lang() === "ar";
    var mode = "in"; // in | up

    var overlay = el("div", "position:fixed;inset:0;z-index:99999;background:rgba(0,12,40,.72);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'IBM Plex Sans Arabic','Plus Jakarta Sans',system-ui,sans-serif;");
    overlay.setAttribute("dir", rtl ? "rtl" : "ltr");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });

    var card = el("div", "width:100%;max-width:380px;background:#fff;color:#001449;border-radius:18px;padding:22px 20px;border-bottom:4px solid #d5a83e;box-shadow:0 18px 48px rgba(0,0,0,.35);");
    var title = el("h2", "margin:0 0 4px;font-size:20px;font-weight:700;");
    var sub = el("p", "margin:0 0 14px;font-size:13.5px;color:#4a5b78;line-height:1.7;");

    var tabs = el("div", "display:flex;gap:6px;background:#eef2f8;border-radius:12px;padding:4px;margin-bottom:14px;");
    var tabIn = el("button", "", "");
    var tabUp = el("button", "", "");
    [tabIn, tabUp].forEach(function (b) {
      b.type = "button";
      b.style.cssText = "flex:1;border:0;border-radius:9px;padding:9px 6px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;";
    });
    tabs.appendChild(tabIn);
    tabs.appendChild(tabUp);

    var inputCss = "width:100%;box-sizing:border-box;border:1px solid #c8d2e2;border-radius:12px;padding:12px 13px;font:inherit;font-size:15px;color:#001449;background:#f8fafd;margin-bottom:10px;";
    var nameIn = el("input", inputCss);
    nameIn.type = "text";
    nameIn.autocomplete = "name";
    var emailIn = el("input", inputCss);
    emailIn.type = "email";
    emailIn.autocomplete = "email";
    emailIn.setAttribute("dir", "ltr");
    emailIn.inputMode = "email";
    var passIn = el("input", inputCss);
    passIn.type = "password";
    passIn.setAttribute("dir", "ltr");

    var msg = el("div", "min-height:20px;font-size:13.5px;line-height:1.6;margin:0 0 10px;");
    msg.setAttribute("role", "status");
    msg.setAttribute("aria-live", "polite");

    var submit = el("button", "width:100%;border:0;border-radius:12px;padding:13px;font:inherit;font-size:16px;font-weight:700;background:#d5a83e;color:#001449;cursor:pointer;");
    submit.type = "button";

    var forgot = el("button", "display:block;margin:12px auto 0;border:0;background:none;font:inherit;font-size:13.5px;color:#1c4d8f;text-decoration:underline;cursor:pointer;");
    forgot.type = "button";
    forgot.textContent = tr("نسيت كلمة المرور؟", "Forgot password?", "Mot de passe oublié ?");

    var close = el("button", "display:block;margin:6px auto 0;border:0;background:none;font:inherit;font-size:13px;color:#6b7a93;cursor:pointer;");
    close.type = "button";
    close.textContent = tr("إغلاق", "Close", "Fermer");
    close.addEventListener("click", closeModal);

    function setMsg(text, ok) {
      msg.textContent = text || "";
      msg.style.color = ok ? "#14663a" : "#b3261e";
    }

    function paint() {
      var up = mode === "up";
      title.textContent = up ? tr("إنشاء حساب جديد", "Create your account", "Créer un compte") : tr("تسجيل الدخول", "Sign in", "Connexion");
      sub.textContent = up
        ? tr("بريدك وكلمة مرور من 6 أحرف على الأقل. حسابك يحفظ نقاطك وملفك ومحادثاتك.", "Your email and a password of 6+ characters. Your account saves your points, profile and chats.", "E-mail et mot de passe (6 caractères min.).")
        : tr("ادخل ببريدك وكلمة المرور لتستخدم المساعد الذكي والمجتمع والغرف.", "Sign in to use the AI assistant, community and rooms.", "Connectez-vous pour utiliser l'assistant, la communauté et les salons.");
      tabIn.textContent = tr("دخول", "Sign in", "Connexion");
      tabUp.textContent = tr("حساب جديد", "New account", "Nouveau compte");
      tabIn.style.background = up ? "transparent" : "#fff";
      tabIn.style.color = "#001449";
      tabUp.style.background = up ? "#fff" : "transparent";
      tabUp.style.color = "#001449";
      nameIn.style.display = up ? "block" : "none";
      nameIn.placeholder = tr("الاسم", "Your name", "Votre nom");
      emailIn.placeholder = tr("البريد الإلكتروني", "Email", "E-mail");
      passIn.placeholder = tr("كلمة المرور", "Password", "Mot de passe");
      passIn.autocomplete = up ? "new-password" : "current-password";
      submit.textContent = up ? tr("إنشاء الحساب", "Create account", "Créer le compte") : tr("دخول", "Sign in", "Se connecter");
      forgot.style.display = up ? "none" : "block";
      setMsg("");
    }

    tabIn.addEventListener("click", function () {
      mode = "in";
      paint();
    });
    tabUp.addEventListener("click", function () {
      mode = "up";
      paint();
    });

    var busy = false;
    async function run() {
      if (busy) return;
      var email = emailIn.value.trim();
      var pass = passIn.value;
      if (!email || !pass) return setMsg(tr("اكتب البريد وكلمة المرور.", "Enter your email and password.", "Entrez e-mail et mot de passe."));
      busy = true;
      submit.disabled = true;
      submit.style.opacity = ".6";
      setMsg(tr("جارٍ المعالجة…", "Working…", "En cours…"), true);
      try {
        if (mode === "up") {
          var u = await signUpEmail(email, pass, nameIn.value.trim());
          if (u) {
            closeModal();
            return;
          }
          setMsg(tr("أرسلنا رسالة تأكيد إلى بريدك. افتحها ثم سجّل الدخول.", "We sent a confirmation email. Open it, then sign in.", "E-mail de confirmation envoyé."), true);
          mode = "in";
          tabIn.style.background = "#fff";
          tabUp.style.background = "transparent";
        } else {
          await signInEmail(email, pass);
          closeModal();
          return;
        }
      } catch (err) {
        setMsg(friendlyError(err));
      } finally {
        busy = false;
        submit.disabled = false;
        submit.style.opacity = "1";
      }
    }

    submit.addEventListener("click", run);
    [emailIn, passIn, nameIn].forEach(function (inp) {
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          run();
        }
      });
    });
    forgot.addEventListener("click", async function () {
      var email = emailIn.value.trim();
      if (!email) return setMsg(tr("اكتب بريدك أولاً ثم اضغط «نسيت كلمة المرور».", "Enter your email first, then tap Forgot password.", "Entrez d'abord votre e-mail."));
      try {
        await resetPassword(email);
        setMsg(tr("أرسلنا رابط إعادة التعيين إلى بريدك.", "We sent a reset link to your email.", "Lien de réinitialisation envoyé."), true);
      } catch (err) {
        setMsg(friendlyError(err));
      }
    });

    card.appendChild(title);
    card.appendChild(sub);
    card.appendChild(tabs);
    card.appendChild(nameIn);
    card.appendChild(emailIn);
    card.appendChild(passIn);
    card.appendChild(msg);
    card.appendChild(submit);
    card.appendChild(forgot);
    card.appendChild(close);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    modalEl = overlay;
    paint();
    setTimeout(function () {
      try {
        emailIn.focus();
      } catch (e) {}
    }, 50);
  }

  // ===== شاشة تعيين كلمة مرور جديدة (بعد رابط الاسترجاع) =====
  function openRecoveryModal() {
    closeModal();
    var rtl = lang() === "ar";
    var overlay = el("div", "position:fixed;inset:0;z-index:99999;background:rgba(0,12,40,.78);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'IBM Plex Sans Arabic','Plus Jakarta Sans',system-ui,sans-serif;");
    overlay.setAttribute("dir", rtl ? "rtl" : "ltr");
    var card = el("div", "width:100%;max-width:380px;background:#fff;color:#001449;border-radius:18px;padding:22px 20px;border-bottom:4px solid #d5a83e;box-shadow:0 18px 48px rgba(0,0,0,.35);");
    var title = el("h2", "margin:0 0 6px;font-size:20px;font-weight:700;", tr("تعيين كلمة مرور جديدة", "Set a new password", "Nouveau mot de passe"));
    var sub = el("p", "margin:0 0 14px;font-size:13.5px;color:#4a5b78;line-height:1.7;", tr("اكتب كلمة المرور الجديدة (6 أحرف على الأقل) وكررها.", "Type your new password (6+ characters) and repeat it.", "Saisissez le nouveau mot de passe (6 caractères min.)."));
    var css = "width:100%;box-sizing:border-box;border:1px solid #c8d2e2;border-radius:12px;padding:12px 13px;font:inherit;font-size:15px;color:#001449;background:#f8fafd;margin-bottom:10px;";
    var p1 = el("input", css); p1.type = "password"; p1.autocomplete = "new-password"; p1.setAttribute("dir", "ltr"); p1.placeholder = tr("كلمة المرور الجديدة", "New password", "Nouveau mot de passe");
    var p2 = el("input", css); p2.type = "password"; p2.autocomplete = "new-password"; p2.setAttribute("dir", "ltr"); p2.placeholder = tr("أعد كتابتها", "Repeat it", "Répétez-le");
    var msg = el("div", "min-height:20px;font-size:13.5px;line-height:1.6;margin:0 0 10px;");
    var btn = el("button", "width:100%;border:0;border-radius:12px;padding:13px;font:inherit;font-size:16px;font-weight:700;background:#d5a83e;color:#001449;cursor:pointer;", tr("حفظ كلمة المرور", "Save password", "Enregistrer"));
    btn.type = "button";
    function setMsg(t, ok) { msg.textContent = t || ""; msg.style.color = ok ? "#14663a" : "#b3261e"; }
    var busy = false;
    async function save() {
      if (busy) return;
      if (p1.value.length < 6) return setMsg(tr("كلمة المرور قصيرة، استخدم 6 أحرف على الأقل.", "Password is too short (6+ characters).", "Mot de passe trop court."));
      if (p1.value !== p2.value) return setMsg(tr("كلمتا المرور غير متطابقتين.", "Passwords do not match.", "Les mots de passe ne correspondent pas."));
      busy = true; btn.disabled = true; btn.style.opacity = ".6";
      setMsg(tr("جارٍ الحفظ…", "Saving…", "Enregistrement…"), true);
      try {
        var c = await getClient();
        var r = await c.auth.updateUser({ password: p1.value });
        if (r.error) throw r.error;
        recoveryPending = false;
        try { history.replaceState(null, "", location.pathname); } catch (e) {}
        setMsg(tr("تم تغيير كلمة المرور. أنت داخل الآن.", "Password changed. You are signed in.", "Mot de passe modifié."), true);
        var g = await c.auth.getSession();
        setSession(g && g.data ? g.data.session : null);
        setTimeout(closeModal, 1200);
      } catch (err) {
        setMsg(friendlyError(err));
        btn.disabled = false; btn.style.opacity = "1";
      } finally { busy = false; }
    }
    btn.addEventListener("click", save);
    [p1, p2].forEach(function (i) { i.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); save(); } }); });
    [title, sub, p1, p2, msg, btn].forEach(function (n) { card.appendChild(n); });
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    modalEl = overlay;
    setTimeout(function () { try { p1.focus(); } catch (e) {} }, 50);
  }

  // ===== الواجهة العامة (نفس أسماء الواجهة القديمة) =====
  var ScholarAuth = {
    getUser: function () {
      return currentUser;
    },
    getToken: function () {
      return currentToken;
    },
    getFreshIdToken: getFreshIdToken,
    // الزر القديم يستدعي هذه الدالة: صارت تفتح نافذة الدخول بالبريد
    signInWithGoogle: function () {
      openAuthModal();
      return Promise.resolve(currentUser);
    },
    signIn: function () {
      openAuthModal();
      return Promise.resolve(currentUser);
    },
    signInEmail: signInEmail,
    signUpEmail: signUpEmail,
    resetPassword: resetPassword,
    signOut: signOutScholar,
    openRecovery: openRecoveryModal,
    onChange: function (cb) {
      listeners.push(cb);
      return function () {
        listeners = listeners.filter(function (x) {
          return x !== cb;
        });
      };
    }
  };
  window.ScholarAuth = ScholarAuth;

  // استعادة الجلسة بعد تحميل كل الملفات (حتى يكون loadSb وSUPA جاهزين)
  window.addEventListener("load", async function () {
    try {
      var c = await getClient();
      var r = await c.auth.getSession();
      setSession(r && r.data ? r.data.session : null);
      if (recoveryPending) openRecoveryModal();
      c.auth.onAuthStateChange(function (_event, session) {
        if (_event === "PASSWORD_RECOVERY") { setSession(session); openRecoveryModal(); return; }
        var prev = currentUser && currentUser.id;
        var next = session && session.user ? session.user.id : null;
        if (prev !== next || (session && session.access_token !== currentToken)) setSession(session);
      });
    } catch (e) {
      /* بدون اتصال: يبقى المستخدم ضيفاً */
    }
  });
})();
(function () {
  function clean(s) {
    return String(s).replace(/\s*(with|avec|بحساب)?\s*Google\s*/gi, " ").replace(/\s{2,}/g, " ").trim();
  }
  function fixBtn() {
    var b = document.getElementById("auth-btn");
    if (!b) return;
    var w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      if (/Google/i.test(n.nodeValue)) {
        var t = clean(n.nodeValue);
        if (t) n.nodeValue = t;
      }
    }
    var a = b.getAttribute("aria-label");
    if (a && /Google/i.test(a)) {
      var c = clean(a);
      if (c) b.setAttribute("aria-label", c);
    }
  }
  window.addEventListener("load", function () {
    var orig = window.syncAuthBtn;
    if (typeof orig === "function") {
      window.syncAuthBtn = function () {
        var r = orig.apply(this, arguments);
        fixBtn();
        return r;
      };
    }
    fixBtn();
    var b = document.getElementById("auth-btn");
    if (b) new MutationObserver(fixBtn).observe(b, { childList: true, characterData: true, subtree: true });
  });
})();
