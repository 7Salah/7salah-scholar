import type { Express } from "express";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const VALID_MODEL_RX = /^gemini-\d[a-z0-9._-]*$/i;

const SEARCH_GROUNDING_MODEL = "gemini-4-hydrogen";

function primaryModel(): string {
  const raw = (process.env.GEMINI_MODEL || "").trim();
  if (VALID_MODEL_RX.test(raw) && !/^gemini-(?:1\.[05]|2\.0|2\.5)-/i.test(raw)) {
    return raw;
  }
  return SEARCH_GROUNDING_MODEL;
}

function modelCandidates(preferSearchGrounding = false): string[] {
  const raw = (process.env.GEMINI_MODEL || "").trim();
  const validRaw =
    VALID_MODEL_RX.test(raw) &&
    !/^gemini-(?:1\.[05]|2\.0|2\.5)-/i.test(raw) &&
    !/carbon|argon|pro-image|nano-banana|omni|lyria/i.test(raw)
      ? raw
      : "";
  const list = preferSearchGrounding
    ? [
        SEARCH_GROUNDING_MODEL,
        validRaw,
        "gemini-3.1-flash-lite"
      ]
    : [
        validRaw,
        SEARCH_GROUNDING_MODEL,
        "gemini-3.1-flash-lite"
      ];
  return list.filter((m, i) => Boolean(m) && list.indexOf(m) === i);
}

function resolveRouteSelection(routeRaw: string): { model: string; level: ThinkingLevel } {
  const route = cleanText(routeRaw || "general", 24).toLowerCase();
  if (route === "fast") {
    return { model: "gemini-3.1-flash-lite", level: ThinkingLevel.LOW };
  }
  if (route === "deep") {
    return { model: SEARCH_GROUNDING_MODEL, level: ThinkingLevel.HIGH };
  }
  if (route === "complex") {
    return { model: SEARCH_GROUNDING_MODEL, level: ThinkingLevel.MEDIUM };
  }
  return { model: SEARCH_GROUNDING_MODEL, level: ThinkingLevel.LOW };
}

function buildConfigForModel(model: string, baseConfig: Record<string, any>, level: ThinkingLevel) {
  const cfg = { ...baseConfig };
  if (/^gemini-(?:3|4)/i.test(model) && !/lite/i.test(model)) {
    cfg.thinkingConfig = { thinkingLevel: level };
  }
  return cfg;
}

function getApiKey(): string {
  return (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
}

function getAi(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY is not configured on the server.") as Error & {
      status?: number;
      code?: string;
    };
    err.status = 500;
    err.code = "MISSING_API_KEY";
    throw err;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      apiVersion: "v1beta",
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}

function cleanText(val: unknown, max = 4000): string {
  return String(val ?? "").trim().slice(0, max);
}

async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const status = Number(err?.status || err?.code || 0);
      const msg = String(err?.message || "");
      const retryable =
        status >= 500 ||
        /timeout|network|ECONNRESET/i.test(msg);
      if (!retryable || attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw lastErr;
}

async function generateWithFallback(
  ai: GoogleGenAI,
  contents: any,
  baseConfig: Record<string, any>,
  thinkingLevel: ThinkingLevel,
  preferredModel?: string
): Promise<{ response: any; actualModel: string }> {
  const hasSearchTool = Boolean(Array.isArray(baseConfig.tools) && baseConfig.tools.length);
  const baseCandidates = modelCandidates(hasSearchTool);
  const candidates = preferredModel
    ? [preferredModel, ...baseCandidates.filter((m) => m !== preferredModel)]
    : baseCandidates;
  let lastErr: any;
  for (let i = 0; i < candidates.length; i++) {
    const model = candidates[i];
    const cfg = buildConfigForModel(model, baseConfig, thinkingLevel);
    try {
      const response = await withRetry(
        () =>
          ai.models.generateContent({
            model,
            contents,
            config: cfg
          }),
        0
      );
      return { response, actualModel: model };
    } catch (err: any) {
      lastErr = err;
      const status = Number(err?.status || 0);
      const msg = String(err?.message || "");
      const shouldTryNext =
        status === 404 ||
        status === 429 ||
        status === 400 ||
        status >= 500 ||
        /NOT_FOUND|RESOURCE_EXHAUSTED|UNAVAILABLE|quota|unsupported|INVALID_ARGUMENT|high demand/i.test(msg);
      console.warn(`[ai-research] model ${model} fallback (${status}): ${msg.slice(0, 140)}`);
      if (shouldTryNext && i < candidates.length - 1) {
        continue;
      }
      // As a final resort if every candidate failed with Search Grounding tools, retry without tools
      if (cfg.tools) {
        try {
          const fallbackModel = candidates[candidates.length - 1] || SEARCH_GROUNDING_MODEL;
          const { tools: _ignored, ...noToolCfg } = buildConfigForModel(fallbackModel, baseConfig, thinkingLevel);
          const response = await ai.models.generateContent({
            model: fallbackModel,
            contents,
            config: noToolCfg
          });
          return { response, actualModel: fallbackModel };
        } catch (innerErr: any) {
          lastErr = innerErr;
        }
      }
      throw lastErr;
    }
  }
  throw lastErr;
}

export function mapAiError(err: any, lang = "ar"): { status: number; message: string; code: string } {
  const rawStatus = Number(err?.status || 0);
  const msg = String(err?.message || "AI request failed");
  const pick = (ar: string, en: string, fr: string) => (lang === "ar" ? ar : lang === "fr" ? fr : en);

  if (err?.code === "MISSING_API_KEY") {
    return {
      status: 500,
      code: "MISSING_API_KEY",
      message: pick(
        "مفتاح GEMINI_API_KEY غير مضبوط على الخادم. يرجى إضافته في ملف .env أو إعدادات المفاتيح (Secrets).",
        "GEMINI_API_KEY is not configured on the server. Add it to .env or Settings > Secrets.",
        "Clé GEMINI_API_KEY manquante sur le serveur. Configurez .env ou les Secrets."
      )
    };
  }
  if (rawStatus === 403 || rawStatus === 401 || /PERMISSION_DENIED|API_KEY_INVALID|API key not valid/i.test(msg)) {
    return {
      status: 403,
      code: "API_KEY_INVALID",
      message: pick(
        "فشلت مصادقة مفتاح Gemini API. يرجى التحقق من صلاحية GEMINI_API_KEY في .env أو إعدادات الخادم.",
        "Gemini API authentication failed. Please verify your GEMINI_API_KEY in .env or server Secrets.",
        "Échec d'authentification Gemini API. Vérifiez votre GEMINI_API_KEY."
      )
    };
  }
  if (rawStatus === 429 || /RESOURCE_EXHAUSTED|quota/i.test(msg)) {
    return {
      status: 429,
      code: "RATE_LIMIT",
      message: pick(
        "تم بلوغ حد الحصة المؤقت لخدمة Gemini API حاليًا. يرجى الانتظار قليلًا ثم المحاولة مجددًا أو مراجعة حصة المفتاح في .env.",
        "Gemini API quota limit temporarily reached. Please wait a moment and try again, or verify your key quota.",
        "Quota Gemini API temporairement atteint. Patientez un instant et réessayez."
      )
    };
  }
  if (rawStatus === 404 || /NOT_FOUND/i.test(msg)) {
    return {
      status: 502,
      code: "MODEL_NOT_FOUND",
      message: pick(
        "نموذج Gemini المطلوب غير متاح حاليًا لهذا المفتاح.",
        "Requested Gemini model is unavailable for this API key.",
        "Modèle Gemini indisponible pour cette clé."
      )
    };
  }
  if (rawStatus === 400 || /INVALID_ARGUMENT/i.test(msg)) {
    return {
      status: 400,
      code: "BAD_REQUEST",
      message: pick(
        "تعذرت معالجة المستند أو السؤال (تحقق من حجم PDF أو تنسيق النص).",
        "The document or prompt could not be processed (check PDF size or format).",
        "Impossible de traiter le document ou la question."
      )
    };
  }
  return {
    status: 502,
    code: "AI_ERROR",
    message: msg.slice(0, 300)
  };
}

interface RawCitation {
  index?: number;
  title?: string;
  authors?: string[];
  year?: number | string | null;
  journal?: string;
  doi?: string;
  url?: string;
  quote?: string;
  verifiedSource?: string;
}

function formatAuthorShort(name: string): string {
  const n = String(name || "").trim();
  if (!n) return "";
  if (n.includes(",")) return n;
  const parts = n.split(/\s+/);
  if (parts.length < 2) return n;
  const last = parts.pop()!;
  const initials = parts.map((p) => (p[0] ? p[0].toUpperCase() + "." : "")).join(" ");
  return `${last}, ${initials}`.trim();
}

function formatCitationServer(c: RawCitation, style: string): string {
  const title = String(c.title || "Untitled Source").replace(/\.$/, "").trim();
  const authors = Array.isArray(c.authors) ? c.authors.filter(Boolean) : [];
  const yr = c.year ? String(c.year) : "n.d.";
  const journal = String(c.journal || "").trim();
  const link = c.doi ? `https://doi.org/${c.doi.replace(/^https?:\/\/doi\.org\//i, "")}` : String(c.url || "").trim();

  if (style === "mla") {
    const au =
      authors.length === 1
        ? authors[0]
        : authors.length === 2
        ? `${authors[0]}, and ${authors[1]}`
        : authors.length > 2
        ? `${authors[0]}, et al.`
        : "";
    return [au ? `${au}.` : "", `"${title}."`, journal ? `${journal},` : "", `${yr}.`, link]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (style === "chicago") {
    const au =
      authors.length === 1
        ? authors[0]
        : authors.length === 2
        ? `${authors[0]} and ${authors[1]}`
        : authors.length > 2
        ? `${authors[0]} et al.`
        : "";
    return [au ? `${au}.` : "", `${yr}.`, `"${title}."`, journal ? `${journal}.` : "", link]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }
  // Default APA
  const apaAu =
    authors.length === 1
      ? formatAuthorShort(authors[0])
      : authors.length === 2
      ? `${formatAuthorShort(authors[0])}, & ${formatAuthorShort(authors[1])}`
      : authors.length > 2
      ? `${authors.slice(0, 3).map(formatAuthorShort).join(", ")}, et al.`
      : "";
  return [
    apaAu ? `${apaAu} (${yr}).` : `${title}. (${yr}).`,
    apaAu ? `${title}.` : "",
    journal ? `${journal}.` : "",
    link
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function verifyDoiViaOpenAlex(query: string, explicitDoi?: string): Promise<RawCitation | null> {
  const ctrl = new AbortController();
  const tm = setTimeout(() => ctrl.abort(), 3500);
  try {
    let url = "";
    const cleanDoi = cleanText(explicitDoi || "", 120).replace(/^https?:\/\/doi\.org\//i, "");
    if (cleanDoi && /^10\.\d{4,9}\//.test(cleanDoi) && !/00000/.test(cleanDoi)) {
      url = `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(cleanDoi)}`;
    } else {
      const q = cleanText(query, 140);
      if (!q || q.length < 4) return null;
      url = `https://api.openalex.org/works?search=${encodeURIComponent(q)}&per-page=1`;
    }
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const json: any = await res.json();
    const w = cleanDoi ? json : json?.results?.[0];
    if (!w || !w.id) return null;
    const doi = w.doi ? String(w.doi).replace(/^https?:\/\/doi\.org\//i, "") : "";
    return {
      title: w.title || w.display_name || query,
      authors: (w.authorships || [])
        .slice(0, 4)
        .map((a: any) => a?.author?.display_name)
        .filter(Boolean),
      year: w.publication_year || null,
      journal: w.primary_location?.source?.display_name || "",
      doi: doi || undefined,
      url: doi
        ? `https://doi.org/${doi}`
        : w.primary_location?.landing_page_url || "",
      verifiedSource: doi ? "OpenAlex · Peer-Reviewed DOI" : "OpenAlex"
    };
  } catch {
    return null;
  } finally {
    clearTimeout(tm);
  }
}

function extractTrailingRefs(rawText: string): { cleanBody: string; parsedRefs: RawCitation[] } {
  const match = rawText.match(/```references_json\s*([\s\S]*?)```\s*$/i);
  if (!match) {
    return { cleanBody: rawText.trim(), parsedRefs: [] };
  }
  const cleanBody = rawText.slice(0, match.index).trim();
  try {
    const parsed = JSON.parse(match[1].trim());
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.references) ? parsed.references : [];
    return { cleanBody, parsedRefs: arr };
  } catch {
    return { cleanBody, parsedRefs: [] };
  }
}

export function registerAiResearchRoutes(app: Express) {
  app.get("/api/ai/status", (_req, res) => {
    res.json({
      ok: true,
      configured: Boolean(getApiKey()),
      model: primaryModel(),
      searchGroundingModel: SEARCH_GROUNDING_MODEL,
      liveModel: "gemini-3.8-live"
    });
  });

  // Live Google Search Grounding Synthesis for Academic Research Tab
  app.post("/api/ai/web-grounding", async (req, res) => {
    const lang = cleanText(req.body?.lang || "ar", 8);
    try {
      const ai = getAi();
      const query = cleanText(req.body?.query || "", 400);
      const citeStyle = cleanText(req.body?.citeStyle || "apa", 16).toLowerCase();
      if (!query || query.length < 2) {
        res.status(400).json({ error: "Search query is required." });
        return;
      }
      const targetLangName = lang === "ar" ? "Arabic" : lang === "fr" ? "French" : "English";
      const { response, actualModel } = await generateWithFallback(
        ai,
        `Provide an up-to-date, concise scholarly synthesis (2 short paragraphs max + 3 key verified takeaways with inline [1], [2] markers) on the academic topic: "${query}". Respond in ${targetLangName}. Rely ONLY on up-to-date verified Google Search findings and never invent citations or URLs.`,
        {
          systemInstruction:
            "You are an academic search grounding synthesizer for university researchers. Summarize recent scholarly consensus, key recent developments/studies, and verified factual evidence concisely with inline markers [1], [2].",
          tools: [{ googleSearch: {} }]
        },
        ThinkingLevel.MEDIUM
      );

      const gm: any = response.candidates?.[0]?.groundingMetadata;
      const groundingChunks: any[] = Array.isArray(gm?.groundingChunks) ? gm.groundingChunks : [];
      const seen = new Set<string>();
      const sources: Array<{ index: number; title: string; url: string; formatted: string; verifiedSource: string }> = [];
      for (const ch of groundingChunks) {
        const uri = ch?.web?.uri;
        if (!uri || seen.has(uri)) continue;
        seen.add(uri);
        const title = ch.web.title || uri;
        sources.push({
          index: sources.length + 1,
          title,
          url: uri,
          verifiedSource: "Google Search Grounding",
          formatted: formatCitationServer({ title, url: uri }, citeStyle)
        });
        if (sources.length >= 8) break;
      }

      res.json({
        synthesis: (response.text || "").trim(),
        modelUsed: actualModel,
        webSearchQueries: Array.isArray(gm?.webSearchQueries) ? gm.webSearchQueries.slice(0, 5) : [],
        sources
      });
    } catch (err: any) {
      console.error("[ai/web-grounding]", err);
      const mapped = mapAiError(err, lang);
      res.status(mapped.status).json({ error: mapped.message, code: mapped.code });
    }
  });

  // 1) Interactive AI Research Chat, Outline Builder & Literature Review Synthesizer
  app.post("/api/ai/research", async (req, res) => {
    const lang = cleanText(req.body?.lang || "ar", 8);
    try {
      const ai = getAi();
      const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-14) : [];
      const mode = cleanText(req.body?.mode || "qa", 32);
      const taskRoute = cleanText(req.body?.taskRoute || "general", 24);
      const persona = cleanText(req.body?.persona || "advisor", 24);
      const citeStyle = cleanText(req.body?.citeStyle || "apa", 16).toLowerCase();
      const field = cleanText(req.body?.field || "", 80);
      const useWebSearch = req.body?.useWebSearch !== false;
      const doc = req.body?.documentContext && typeof req.body.documentContext === "object"
        ? req.body.documentContext
        : null;

      if (!messages.length) {
        res.status(400).json({ error: "At least one message is required." });
        return;
      }

      const modeInstructions: Record<string, string> = {
        qa: "Answer the academic question thoroughly, define technical terms rigorously, simplify difficult theories with concrete scholarly analogies where helpful, and cite verifiable evidence.",
        simplify: "Deconstruct the difficult scientific or philosophical theory step-by-step for university students: core thesis, foundational concepts, key debate, and real-world/scholarly example.",
        outline: "Produce a rigorous, university-grade research paper/thesis outline with numbered sections (Abstract objectives, Introduction & Research Question, Theoretical Framework, Literature Review themes, Methodology, Discussion/Analysis, Expected Contributions, and Bibliography).",
        litreview: "Draft a comparative academic literature review synthesizing competing schools of thought, key empirical findings, methodological trends, and research gaps with inline citations."
      };

      const personaInstructions: Record<string, string> = {
        advisor: "Adopt the role of a senior University Research Advisor: structured, scholarly, and methodical.",
        reviewer: "Adopt the role of a Peer Reviewer: probe assumptions, flag methodological blind spots, and highlight competing evidence.",
        stem: "Adopt the role of an Interactive STEM & Quantitative Tutor: break derivations, formulas, and empirical designs down step-by-step.",
        summarizer: "Adopt the role of a Rapid Academic Explainer: deliver concise, crystal-clear bullet takeaways and crisp definitions."
      };

      const styleLabel = citeStyle === "mla" ? "MLA 9th" : citeStyle === "chicago" ? "Chicago 17th" : "APA 7th";
      const hasDoc = Boolean(doc && (doc.pdfBase64 || doc.text));
      const strictDocOnly = hasDoc && !useWebSearch;

      const systemInstruction = [
        "You are the 7Salah Scholar Academic Research Assistant (المساعد البحثي الذكي), serving university students and researchers worldwide.",
        personaInstructions[persona] || personaInstructions.advisor,
        "Respond in the same language as the user's latest question (Arabic, English, or French); if ambiguous, prefer " + (lang === "ar" ? "Arabic" : lang === "fr" ? "French" : "English") + ".",
        modeInstructions[mode] || modeInstructions.qa,
        field ? `Academic discipline focus: ${field}.` : "",
        "STRICT ACADEMIC INTEGRITY RULES:",
        "1. NEVER fabricate DOIs, URLs, page numbers, or author names. Only include DOIs or URLs that come directly from the attached document or verified web search grounding results.",
        strictDocOnly
          ? "2. STRICT DOCUMENT GROUNDING IS ACTIVE: Base every factual claim strictly on the attached document/lecture. Quote or cite section/page/timestamp markers ([Doc p.X] or [Transcript mm:ss]). If the uploaded document does not contain the answer, explicitly state that it is not covered in the source."
          : "2. Ground claims in verified academic sources using inline markers like [1], [2]" + (hasDoc ? " and [Doc]" : "") + ". Format cited bibliography references in " + styleLabel + " style.",
        "3. When unsure or when evidence is preliminary, explicitly note the limitation rather than guessing.",
        "4. At the very end of your response, append a fenced JSON block tagged EXACTLY ```references_json containing an array of the cited works used (each item: {\"index\":1,\"title\":\"...\",\"authors\":[\"...\"],\"year\":2022,\"journal\":\"...\",\"doi\":\"\",\"url\":\"\",\"quote\":\"short supporting excerpt\"}). Do not mention this JSON block in the visible prose."
      ]
        .filter(Boolean)
        .join("\n");

      const docParts: any[] = [];
      if (doc?.pdfBase64) {
        const cleanB64 = String(doc.pdfBase64).replace(/^data:application\/pdf;base64,/i, "");
        if (cleanB64.length > 26_000_000) {
          res.status(400).json({ error: "PDF exceeds maximum 18MB limit for analysis." });
          return;
        }
        docParts.push({
          inlineData: {
            mimeType: "application/pdf",
            data: cleanB64
          }
        });
        docParts.push({
          text: `Attached Reference Document Title: "${cleanText(doc.title || "Uploaded Paper", 200)}". Ground analysis in this PDF.`
        });
      } else if (doc?.text) {
        docParts.push({
          text: `Attached ${cleanText(doc.kind || "document", 30).toUpperCase()} ("${cleanText(doc.title || "Source Document", 200)}"):\n---\n${cleanText(doc.text, 65000)}\n---`
        });
      }

      // Build multi-turn conversation history cleanly
      const contents = messages
        .filter((m: any) => cleanText(m?.text, 8000).length > 0)
        .map((m: any, idx: number) => {
          const role = m.role === "assistant" ? "model" : "user";
          const txt = cleanText(m.text, 8000);
          const turnParts = idx === 0 && role === "user" && docParts.length
            ? [...docParts, { text: txt }]
            : [{ text: txt }];
          return { role, parts: turnParts };
        });

      if (!contents.length || contents[0].role !== "user") {
        contents.unshift({ role: "user", parts: docParts.length ? docParts : [{ text: "Hello" }] });
      }

      const routeSel = resolveRouteSelection(taskRoute);
      const baseConfig: Record<string, any> = {
        systemInstruction
      };
      if (useWebSearch && !strictDocOnly && routeSel.model !== "gemini-3.1-flash-lite") {
        baseConfig.tools = [{ googleSearch: {} }];
      }

      const { response, actualModel } = await generateWithFallback(
        ai,
        contents,
        baseConfig,
        routeSel.level,
        routeSel.model
      );

      const rawText = response.text || "";
      const { cleanBody, parsedRefs } = extractTrailingRefs(rawText);

      // Extract real Google Search grounding metadata chunks
      const gm: any = response.candidates?.[0]?.groundingMetadata;
      const groundingChunks: any[] = Array.isArray(gm?.groundingChunks) ? gm.groundingChunks : [];
      const webChunks: RawCitation[] = groundingChunks
        .filter((ch) => ch?.web?.uri)
        .map((ch) => ({
          title: ch.web.title || ch.web.uri,
          url: ch.web.uri,
          verifiedSource: "Google Search Grounding"
        }));

      // Merge model references + web grounding chunks + OpenAlex verification
      const mergedMap = new Map<string, RawCitation>();
      const pushRef = (r: RawCitation) => {
        const key = (r.doi || r.url || r.title || "").toLowerCase().trim();
        if (!key) return;
        if (!mergedMap.has(key)) mergedMap.set(key, { ...r });
      };

      if (hasDoc && doc?.title) {
        pushRef({
          index: 0,
          title: cleanText(doc.title, 200),
          authors: [],
          year: new Date().getFullYear(),
          journal: doc.kind === "lecture" ? "7Salah Lecture AI Transcript" : "Uploaded Research Document",
          verifiedSource: doc.kind === "lecture" ? "Uploaded Lecture Transcript" : "Uploaded Document (PDF/Text)"
        });
      }
      parsedRefs.forEach(pushRef);
      webChunks.forEach(pushRef);

      const candidates = [...mergedMap.values()].slice(0, 8);
      // Verify bibliographic references against OpenAlex (stripping fabricated/placeholder DOIs)
      if (!strictDocOnly) {
        await Promise.all(
          candidates
            .filter((c) => c.title && c.verifiedSource !== "Uploaded Document (PDF/Text)" && c.verifiedSource !== "Uploaded Lecture Transcript" && c.verifiedSource !== "Google Search Grounding")
            .slice(0, 4)
            .map(async (c) => {
              const verified = await verifyDoiViaOpenAlex(c.title!, c.doi);
              if (verified) {
                if (verified.doi) c.doi = verified.doi;
                else delete c.doi;
                if (!c.url && verified.url) c.url = verified.url;
                if ((!c.authors || !c.authors.length) && verified.authors?.length) c.authors = verified.authors;
                if (!c.year && verified.year) c.year = verified.year;
                if (!c.journal && verified.journal) c.journal = verified.journal;
                if (verified.doi) c.verifiedSource = verified.verifiedSource;
              } else if (c.doi && /00000/.test(c.doi)) {
                delete c.doi;
                c.url = "";
              }
            })
        );
      }

      const formattedCitations = candidates.map((c, idx) => ({
        index: c.index ?? idx + 1,
        title: c.title || "Source",
        authors: c.authors || [],
        year: c.year || null,
        journal: c.journal || "",
        doi: c.doi || "",
        url: c.doi ? `https://doi.org/${c.doi}` : c.url || "",
        quote: c.quote || "",
        verifiedSource: c.verifiedSource || (webChunks.length ? "Web Grounded" : "Academic Reference"),
        formatted: formatCitationServer(c, citeStyle)
      }));

      const groundedCount =
        (hasDoc ? 1 : 0) +
        webChunks.length +
        formattedCitations.filter((c) => Boolean(c.doi || c.url)).length;

      const status = strictDocOnly
        ? "strict-document-grounded"
        : webChunks.length > 0 || formattedCitations.some((c) => Boolean(c.doi))
        ? hasDoc
          ? "hybrid-grounded"
          : "web-grounded"
        : "unverified-warning";

      const confidenceScore = strictDocOnly
        ? 96
        : status === "hybrid-grounded"
        ? 95
        : status === "web-grounded"
        ? Math.min(96, 78 + Math.min(18, groundedCount * 4))
        : 62;

      res.json({
        answer: cleanBody,
        modelUsed: actualModel,
        taskRoute,
        persona,
        verification: {
          status,
          confidenceScore,
          groundedCount,
          groundingChunksCount: webChunks.length,
          hasAttachedSource: hasDoc,
          queries: Array.isArray(gm?.webSearchQueries) ? gm.webSearchQueries.slice(0, 4) : []
        },
        citations: formattedCitations
      });
    } catch (err: any) {
      console.error("[ai/research]", err);
      const mapped = mapAiError(err, lang);
      res.status(mapped.status).json({ error: mapped.message, code: mapped.code });
    }
  });

  // 2) Strict Document & Paper Analyzer (PDF / Lecture / Text)
  app.post("/api/ai/analyze", async (req, res) => {
    const lang = cleanText(req.body?.lang || "ar", 8);
    try {
      const ai = getAi();
      const title = cleanText(req.body?.title || "Academic Document", 220);
      const kind = cleanText(req.body?.kind || "text", 24);
      const text = cleanText(req.body?.text || "", 80000);
      const pdfBase64 = req.body?.pdfBase64 ? String(req.body.pdfBase64) : "";
      const citeStyle = cleanText(req.body?.citeStyle || "apa", 16).toLowerCase();

      if (!pdfBase64 && text.length < 30) {
        res.status(400).json({ error: "Provide a PDF file, lecture transcript, or at least 30 characters of text to analyze." });
        return;
      }

      const parts: any[] = [];
      if (pdfBase64) {
        const cleanB64 = pdfBase64.replace(/^data:application\/pdf;base64,/i, "");
        if (cleanB64.length > 26_000_000) {
          res.status(400).json({ error: "PDF file is too large (max 18 MB)." });
          return;
        }
        parts.push({
          inlineData: { mimeType: "application/pdf", data: cleanB64 }
        });
      }
      if (text) {
        parts.push({ text: `Source Content (${kind}):\n${text}` });
      }

      const targetLangName = lang === "ar" ? "Arabic" : lang === "fr" ? "French" : "English";
      parts.push({
        text: `Analyze this ${kind} titled "${title}" strictly based on the provided content. Output all prose descriptions, summaries, definitions, and flashcards in ${targetLangName} (preserve exact technical quotes from the document).`
      });

      const { response } = await generateWithFallback(
        ai,
        [{ role: "user", parts }],
        {
          systemInstruction:
            "You are a strict academic document analyzer. Extract ONLY verifiable facts, findings, methodologies, terminology, bibliography items, and flashcards directly supported by the provided document. Include verbatim short evidence quotes and page/section/timestamp references for each point. Never invent claims outside the source.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedTitle: { type: Type.STRING },
              authors: { type: Type.ARRAY, items: { type: Type.STRING } },
              year: { type: Type.STRING },
              summary: { type: Type.STRING, description: "Rigorous scholarly summary grounded strictly in the source." },
              keyFindings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    claim: { type: Type.STRING },
                    evidenceQuote: { type: Type.STRING },
                    location: { type: Type.STRING }
                  },
                  required: ["claim", "evidenceQuote"]
                }
              },
              methodologies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    evidenceQuote: { type: Type.STRING }
                  },
                  required: ["name", "description"]
                }
              },
              terminology: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING },
                    contextQuote: { type: Type.STRING }
                  },
                  required: ["term", "definition"]
                }
              },
              limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
              extractedCitations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    authors: { type: Type.ARRAY, items: { type: Type.STRING } },
                    year: { type: Type.STRING },
                    journal: { type: Type.STRING },
                    doi: { type: Type.STRING }
                  },
                  required: ["title"]
                }
              },
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    q: { type: Type.STRING },
                    a: { type: Type.STRING },
                    evidenceQuote: { type: Type.STRING }
                  },
                  required: ["q", "a"]
                }
              }
            },
            required: ["summary", "keyFindings", "methodologies", "terminology", "flashcards"]
          }
        },
        ThinkingLevel.MEDIUM
      );

      const parsed = JSON.parse((response.text || "{}").trim());
      const docTitle = parsed.detectedTitle || title;
      const selfCitation: RawCitation = {
        title: docTitle,
        authors: Array.isArray(parsed.authors) ? parsed.authors : [],
        year: parsed.year || new Date().getFullYear(),
        journal: kind === "lecture" ? "7Salah Lecture AI Transcript" : "Uploaded Academic Document",
        verifiedSource: kind === "lecture" ? "Lecture Transcript" : "Uploaded Document"
      };

      const rawCits: RawCitation[] = [
        selfCitation,
        ...(Array.isArray(parsed.extractedCitations) ? parsed.extractedCitations : [])
      ].slice(0, 10);

      const citations = rawCits.map((c, idx) => ({
        index: idx + 1,
        title: c.title || docTitle,
        authors: Array.isArray(c.authors) ? c.authors : [],
        year: c.year || null,
        journal: c.journal || "",
        doi: c.doi || "",
        url: c.doi ? `https://doi.org/${c.doi}` : "",
        verifiedSource: idx === 0 ? selfCitation.verifiedSource : "Cited Inside Document",
        formatted: formatCitationServer(c, citeStyle)
      }));

      res.json({
        analysis: {
          title: docTitle,
          authors: selfCitation.authors,
          year: parsed.year || null,
          kind,
          summary: parsed.summary || "",
          keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
          methodologies: Array.isArray(parsed.methodologies) ? parsed.methodologies : [],
          terminology: Array.isArray(parsed.terminology) ? parsed.terminology : [],
          limitations: Array.isArray(parsed.limitations) ? parsed.limitations : [],
          flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : [],
          citations,
          verification: {
            status: "strict-document-grounded",
            confidenceScore: 97,
            sourceTitle: docTitle
          }
        }
      });
    } catch (err: any) {
      console.error("[ai/analyze]", err);
      const mapped = mapAiError(err, lang);
      res.status(mapped.status).json({ error: mapped.message, code: mapped.code });
    }
  });

  // 3) Convert any AI Research Answer into Smart Flashcards
  app.post("/api/ai/flashcards", async (req, res) => {
    const lang = cleanText(req.body?.lang || "ar", 8);
    try {
      const ai = getAi();
      const answerText = cleanText(req.body?.answerText || "", 20000);
      const title = cleanText(req.body?.title || "Research Synthesis", 180);
      if (answerText.length < 20) {
        res.status(400).json({ error: "Answer text is too short to extract flashcards." });
        return;
      }

      const targetLangName = lang === "ar" ? "Arabic" : lang === "fr" ? "French" : "English";
      const { response } = await generateWithFallback(
        ai,
        `Extract 5 to 8 high-yield academic flashcards (question & concise verified answer) in ${targetLangName} strictly from this research response titled "${title}". Only include facts directly stated in the text.\n\n---\n${answerText}`,
        {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    q: { type: Type.STRING },
                    a: { type: Type.STRING },
                    citationIndex: { type: Type.INTEGER }
                  },
                  required: ["q", "a"]
                }
              }
            },
            required: ["cards"]
          }
        },
        ThinkingLevel.LOW
      );

      const parsed = JSON.parse((response.text || "{}").trim());
      res.json({
        cards: Array.isArray(parsed.cards) ? parsed.cards.slice(0, 12) : []
      });
    } catch (err: any) {
      console.error("[ai/flashcards]", err);
      const mapped = mapAiError(err, lang);
      res.status(mapped.status).json({ error: mapped.message, code: mapped.code });
    }
  });

  // 4) Google Maps Grounding via Gemini + Places API (New) grounded synthesis fallback
  app.post("/api/ai/maps-grounding", async (req, res) => {
    const lang = cleanText(req.body?.lang || "ar", 8);
    try {
      const query = cleanText(req.body?.query || "", 400);
      if (!query || query.length < 2) {
        res.status(400).json({ error: "Location or place query is required." });
        return;
      }
      const lat = Number(req.body?.lat);
      const lng = Number(req.body?.lng);
      const hasCoords =
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180 &&
        !(lat === 0 && lng === 0);

      const targetLangName = lang === "ar" ? "Arabic" : lang === "fr" ? "French" : "English";
      const cfg: Record<string, any> = {
        systemInstruction:
          "You are the 7Salah Scholar Campus & Study Location Assistant. Use the Google Maps grounding tool to recommend real libraries, university campuses, quiet study cafes, or research centers matching the user's request. Never invent addresses, coordinates, or Maps links; rely exclusively on Google Maps grounding results.",
        tools: [{ googleMaps: {} }]
      };
      if (hasCoords) {
        cfg.toolConfig = {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        };
      }

      const ai = getApiKey() ? getAi() : null;
      let geminiErr: any = null;

      if (ai) {
        for (const model of [SEARCH_GROUNDING_MODEL, "gemini-3.1-flash-lite"]) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: `Find real study locations, libraries, or academic spaces matching: "${query}". Respond clearly in ${targetLangName} using bullet points for top matches.`,
              config: cfg
            });
            const gm: any = response.candidates?.[0]?.groundingMetadata;
            const groundingChunks: any[] = Array.isArray(gm?.groundingChunks) ? gm.groundingChunks : [];
            const seen = new Set<string>();
            const places: Array<{
              index: number;
              title: string;
              address?: string;
              rating?: number | null;
              lat?: number;
              lng?: number;
              uri: string;
              placeId: string;
              reviewSnippets: Array<{ text: string; uri: string }>;
            }> = [];

            for (const ch of groundingChunks) {
              const m = ch?.maps;
              if (!m || (!m.uri && !m.title && !m.placeId)) continue;
              const key = String(m.placeId || m.uri || m.title).toLowerCase();
              if (seen.has(key)) continue;
              seen.add(key);

              const rawSnippets: any[] = Array.isArray(m?.placeAnswerSources?.reviewSnippets)
                ? m.placeAnswerSources.reviewSnippets
                : [];
              const reviewSnippets = rawSnippets
                .slice(0, 3)
                .map((rs: any) => ({
                  text: cleanText(rs?.text || rs?.reviewUri || "", 260),
                  uri: cleanText(rs?.googleMapsUri || rs?.reviewUri || m.uri || "", 400)
                }))
                .filter((x) => x.text || x.uri);

              places.push({
                index: places.length + 1,
                title: cleanText(m.title || "Google Maps Place", 180),
                uri: cleanText(m.uri || "", 400),
                placeId: cleanText(m.placeId || "", 120),
                reviewSnippets
              });
              if (places.length >= 10) break;
            }

            if (places.length > 0 || (response.text || "").trim().length > 20) {
              res.json({
                answer: (response.text || "").trim(),
                modelUsed: model,
                places
              });
              return;
            }
          } catch (e: any) {
            geminiErr = e;
            console.warn(`[ai/maps-grounding] ${model} fallback:`, String(e?.message || e).slice(0, 140));
          }
        }
      }

      // Grounded fallback via Google Places API (New) + Gemini Flash-Lite summary
      const mapsKey = (
        process.env.GOOGLE_MAPS_API_KEY ||
        process.env.VITE_GOOGLE_MAPS_API_KEY ||
        process.env.GOOGLE_MAPS_PLATFORM_API_KEY ||
        process.env.MAPS_API_KEY ||
        ""
      ).trim();

      if (mapsKey) {
        const bodyReq: Record<string, any> = {
          textQuery: query,
          maxResultCount: 6,
          languageCode: lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"
        };
        if (hasCoords) {
          bodyReq.locationBias = {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: 25000
            }
          };
        }
        const pr = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": mapsKey,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.rating,places.location"
          },
          body: JSON.stringify(bodyReq)
        });
        const pj: any = await pr.json().catch(() => ({}));
        if (pr.status === 429 || pj?.error?.status === "RESOURCE_EXHAUSTED") {
          res.status(429).json({
            error: "Google Maps API quota exceeded.",
            code: "RESOURCE_EXHAUSTED"
          });
          return;
        }
        if (pr.ok && Array.isArray(pj.places)) {
          const places = pj.places.map((pl: any, idx: number) => ({
            index: idx + 1,
            title: cleanText(pl?.displayName?.text || "Google Maps Place", 180),
            address: cleanText(pl?.formattedAddress || "", 260),
            rating: Number.isFinite(Number(pl?.rating)) ? Number(pl.rating) : null,
            lat: Number.isFinite(Number(pl?.location?.latitude)) ? Number(pl.location.latitude) : undefined,
            lng: Number.isFinite(Number(pl?.location?.longitude)) ? Number(pl.location.longitude) : undefined,
            uri: cleanText(pl?.googleMapsUri || "", 400),
            placeId: cleanText(pl?.id || "", 120),
            reviewSnippets: []
          }));

          let summary = "";
          if (ai && places.length) {
            try {
              const summaryPrompt = `Summarize these verified Google Places results for the study query "${query}" in ${targetLangName} in concise bullet points. Mention ONLY these exact names/addresses:\n${places
                .map((p: any) => `- ${p.title} (${p.address || "Verified Google Maps location"})${p.rating ? ` [★ ${p.rating}]` : ""}`)
                .join("\n")}`;
              const { response } = await generateWithFallback(
                ai,
                summaryPrompt,
                {
                  systemInstruction: "Summarize only the supplied Google Places records concisely for students. Do not invent facts or links."
                },
                ThinkingLevel.LOW,
                "gemini-3.1-flash-lite"
              );
              summary = (response.text || "").trim();
            } catch {}
          }
          if (!summary) {
            summary = places.length
              ? places.map((p: any) => `• **${p.title}**${p.address ? ` — ${p.address}` : ""}`).join("\n")
              : (lang === "ar" ? "لم يتم العثور على أماكن مطابقة." : "No matching study spaces found.");
          }

          res.json({
            answer: summary,
            modelUsed: "gemini-3.1-flash-lite + Google Places API",
            places
          });
          return;
        }
      }

      if (geminiErr) throw geminiErr;
      throw new Error("Maps grounding and Places API are currently unavailable.");
    } catch (err: any) {
      console.error("[ai/maps-grounding]", err);
      const mapped = mapAiError(err, lang);
      res.status(mapped.status).json({ error: mapped.message, code: mapped.code });
    }
  });
}

export async function generateCompanionReply(opts: {
  message: string;
  lang?: string;
  field?: string;
  studentContext?: {
    name?: string;
    field?: string;
    university?: string;
    academicTitle?: string;
    lastTopic?: string;
    memoryNotes?: string;
  };
}): Promise<{ reply: string; modelUsed: string; updatedNotes: string }> {
  const ai = getAi();
  const lang = cleanText(opts.lang || "ar", 8);
  const message = cleanText(opts.message, 4000);
  const ctx = opts.studentContext || {};
  const field = cleanText(opts.field || ctx.field || "", 80);
  const university = cleanText(ctx.university || "", 120);
  const lastTopic = cleanText(ctx.lastTopic || "", 160);
  const memoryNotes = cleanText(ctx.memoryNotes || "", 1200);
  const studentName = cleanText(ctx.name || "", 80);

  const memoryBlock = [
    studentName ? `Student name: ${studentName}` : "",
    ctx.academicTitle ? `Academic level/title: ${cleanText(ctx.academicTitle, 80)}` : "",
    field ? `Academic discipline/major: ${field}` : "",
    university ? `University/institution: ${university}` : "",
    lastTopic ? `Most recent study topic: ${lastTopic}` : "",
    memoryNotes ? `Persistent academic track memory:\n${memoryNotes}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  const targetLang = lang === "ar" ? "Arabic" : lang === "fr" ? "French" : "English";
  const systemInstruction = [
    "You are the 7Salah Scholar Personal Academic Voice Companion (المساعد الأكاديمي الشخصي بذاكرة المسار).",
    `Respond naturally, clearly, and concisely in ${targetLang} (match the student's language if they write/speak in Arabic, French, or English) so your answer is pleasant to listen to via speech synthesis as well as easy to scan.`,
    "Tailor explanations, examples, and methodological advice to the student's remembered discipline and previous study context when relevant.",
    "Never fabricate DOIs, citations, or facts; if a claim requires verification, advise verifying against peer-reviewed sources.",
    memoryBlock ? `--- REMEMBERED STUDENT CONTEXT ---\n${memoryBlock}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");

  const { response, actualModel } = await generateWithFallback(
    ai,
    [{ role: "user", parts: [{ text: message }] }],
    { systemInstruction },
    ThinkingLevel.LOW,
    "gemini-3.1-flash-lite"
  );

  const reply = (response.text || "").trim();
  const stamp = new Date().toISOString().slice(0, 10);
  const snippet = `[${stamp}] ${message.slice(0, 90)}`;
  const prevLines = memoryNotes
    ? memoryNotes.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    : [];
  const nextNotes = [snippet, ...prevLines.filter((l) => l !== snippet)].slice(0, 8).join("\n");

  return {
    reply,
    modelUsed: actualModel,
    updatedNotes: nextNotes
  };
}

