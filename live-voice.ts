import type http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality } from "@google/genai";

const ALLOWED_VOICES = new Set(["Zephyr", "Puck", "Charon", "Kore", "Fenrir"]);
const LIVE_MODEL = "gemini-3.8-live";

function getApiKey(): string {
  return (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
}

function sendJson(ws: WebSocket, payload: Record<string, unknown>) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function localizedLiveError(code: string, lang: string, rawMsg = ""): string {
  const pick = (ar: string, en: string, fr: string) => (lang === "ar" ? ar : lang === "fr" ? fr : en);
  if (code === "MISSING_API_KEY") {
    return pick(
      "مفتاح GEMINI_API_KEY غير مضبوط على الخادم لتشغيل المحادثة الصوتية المباشرة.",
      "GEMINI_API_KEY is not configured on the server for Live Voice.",
      "Clé GEMINI_API_KEY manquante pour la voix en direct."
    );
  }
  if (/403|401|API_KEY_INVALID|PERMISSION_DENIED/i.test(rawMsg)) {
    return pick(
      "فشلت مصادقة مفتاح Gemini API أثناء بدء الجلسة الصوتية.",
      "Gemini API authentication failed starting Live Voice.",
      "Échec d'authentification Gemini API."
    );
  }
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(rawMsg)) {
    return pick(
      "تم بلوغ حد الحصة المؤقت للجلسة الصوتية المباشرة. يرجى الانتظار قليلًا ثم إعادة المحاولة.",
      "Live Voice API quota limit reached. Please wait a moment and try again.",
      "Quota Gemini Live atteint. Patientez puis réessayez."
    );
  }
  return (
    rawMsg.slice(0, 260) ||
    pick(
      "تعذر الاتصال بجلسة المحادثة الصوتية المباشرة.",
      "Could not connect to the Live Voice session.",
      "Impossible de se connecter à la session vocale."
    )
  );
}

function buildLiveSystemInstruction(lang: string, field: string, sourceTitle: string): string {
  const targetLang = lang === "ar" ? "Arabic" : lang === "fr" ? "French" : "English";
  return [
    "You are the 7Salah Scholar Live Academic Voice Tutor (المعلّم والباحث الصوتي الذكي), speaking directly in real time with a university student or researcher.",
    `Respond concisely and naturally for spoken conversation in ${targetLang} unless the speaker addresses you in another language, in which case match their language seamlessly.`,
    "Keep spoken explanations clear, structured, and engaging (2-5 concise sentences per turn unless asked for a detailed deep dive), pausing naturally so the student can interrupt or ask follow-up questions.",
    field ? `Current academic discipline focus: ${field}.` : "",
    sourceTitle ? `The student currently has this attached reference source open: "${sourceTitle}". Refer to it accurately when asked.` : "",
    "Academic rigor: never fabricate DOIs, author names, or exact quotes from memory; clearly note if a detail needs verification against a primary reference."
  ]
    .filter(Boolean)
    .join(" ");
}

export function createLiveVoiceWss(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", async (ws: WebSocket, req: http.IncomingMessage) => {
    let lang = "ar";
    let voice = "Zephyr";
    let field = "";
    let sourceTitle = "";

    try {
      const u = new URL(req.url || "/ws-live", "http://localhost");
      lang = (u.searchParams.get("lang") || "ar").slice(0, 8);
      const reqVoice = u.searchParams.get("voice") || "Zephyr";
      voice = ALLOWED_VOICES.has(reqVoice) ? reqVoice : "Zephyr";
      field = (u.searchParams.get("field") || "").trim().slice(0, 80);
      sourceTitle = (u.searchParams.get("sourceTitle") || "").trim().slice(0, 160);
    } catch {}

    const apiKey = getApiKey();
    if (!apiKey) {
      sendJson(ws, {
        type: "error",
        code: "MISSING_API_KEY",
        message: localizedLiveError("MISSING_API_KEY", lang)
      });
      ws.close(1008, "MISSING_API_KEY");
      return;
    }

    let session: any = null;
    let closed = false;
    let readySent = false;

    const closeAll = () => {
      if (closed) return;
      closed = true;
      try {
        session?.close?.();
      } catch {}
      session = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        try {
          ws.close();
        } catch {}
      }
    };

    const sendReady = () => {
      if (readySent || closed) return;
      readySent = true;
      sendJson(ws, { type: "ready", model: LIVE_MODEL, voice });
    };

    ws.on("message", (raw) => {
      let msg: Record<string, any>;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }
      if (!msg || typeof msg.type !== "string") return;

      if (msg.type === "end") {
        closeAll();
        return;
      }

      if (!session || closed) return;

      if (msg.type === "audio" && typeof msg.data === "string" && msg.data.length > 0) {
        try {
          session.sendRealtimeInput({
            audio: {
              data: msg.data,
              mimeType: "audio/pcm;rate=16000"
            }
          });
        } catch (err: any) {
          console.warn("[live-voice] sendRealtimeInput(audio) failed:", err?.message || err);
        }
        return;
      }

      if ((msg.type === "text" || msg.type === "context") && typeof msg.text === "string" && msg.text.trim()) {
        try {
          session.sendClientContent({
            turns: [{ role: "user", parts: [{ text: msg.text.trim().slice(0, 6000) }] }],
            turnComplete: msg.type === "text"
          });
        } catch (err: any) {
          console.warn("[live-voice] sendClientContent failed:", err?.message || err);
        }
      }
    });

    ws.on("close", () => {
      closeAll();
    });

    ws.on("error", () => {
      closeAll();
    });

    try {
      const connectWithVersion = async (apiVersion: "v1beta" | "v1alpha") => {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            apiVersion,
            headers: {
              "User-Agent": "aistudio-build"
            }
          }
        });

        return await ai.live.connect({
          model: LIVE_MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice }
              }
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: buildLiveSystemInstruction(lang, field, sourceTitle)
          },
          callbacks: {
            onopen: () => {
              // Wait until ai.live.connect() resolves and assigns `session` before sending ready
            },
            onmessage: (message: any) => {
              if (closed) return;
              const sc = message?.serverContent;
              if (!sc) return;

              if (sc.interrupted) {
                sendJson(ws, { type: "interrupted" });
              }

              if (sc.inputTranscription?.text) {
                sendJson(ws, { type: "inputTranscript", text: sc.inputTranscription.text });
              }

              if (sc.outputTranscription?.text) {
                sendJson(ws, { type: "outputTranscript", text: sc.outputTranscription.text });
              }

              const parts = sc.modelTurn?.parts;
              if (Array.isArray(parts)) {
                for (const part of parts) {
                  if (part?.inlineData?.data) {
                    sendJson(ws, {
                      type: "audio",
                      data: part.inlineData.data,
                      mimeType: part.inlineData.mimeType || "audio/pcm;rate=24000"
                    });
                  }
                }
              }

              if (sc.turnComplete) {
                sendJson(ws, { type: "turnComplete" });
              }
            },
            onerror: (err: any) => {
              const msgText = String(err?.message || err || "");
              console.error("[live-voice] Gemini Live error:", msgText);
              if (!closed) {
                sendJson(ws, {
                  type: "error",
                  code: "LIVE_ERROR",
                  message: localizedLiveError("LIVE_ERROR", lang, msgText)
                });
              }
            },
            onclose: (ev: any) => {
              if (!closed) {
                sendJson(ws, {
                  type: "ended",
                  reason: ev?.reason ? String(ev.reason) : ""
                });
                closeAll();
              }
            }
          }
        });
      };

      try {
        session = await connectWithVersion("v1beta");
      } catch (betaErr: any) {
        if (closed) return;
        console.warn("[live-voice] v1beta connect failed, trying v1alpha:", betaErr?.message || betaErr);
        session = await connectWithVersion("v1alpha");
      }

      if (closed) {
        try {
          session?.close?.();
        } catch {}
        return;
      }
      sendReady();
    } catch (err: any) {
      const msgText = String(err?.message || err || "");
      console.error("[live-voice] failed to open Gemini Live session:", msgText);
      sendJson(ws, {
        type: "error",
        code: "CONNECT_FAILED",
        message: localizedLiveError("CONNECT_FAILED", lang, msgText)
      });
      closeAll();
    }
  });

  return wss;
}
