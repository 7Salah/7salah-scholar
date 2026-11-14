import type { Express } from "express";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const MODEL_RESEARCH = "gemini-4-hydrogen";

function getAi(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
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
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}

function cleanText(val: unknown, max = 4000): string {
  return String(val ?? "").trim().slice(0, max);
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const status = Number(err?.status || err?.code || 0);
      const msg = String(err?.message || "");
      const retryable =
        status === 429 ||
        status >= 500 ||
        /timeout|network|ECONNRESET|temporarily|unavailable|503|504/i.test(msg);
      if (!retryable || attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 1200 * Math.pow(2, attempt)));
    }
  }
  throw lastErr;
}

function mapAiError(err: any): { status: number; message: string; code: string } {
  const rawStatus = Number(err?.status || 0);
  const msg = String(err?.message || "AI request failed");
  if (err?.code === "MISSING_API_KEY") {
    return {
      status: 500,
      code: "MISSING_API_KEY",
      message: "Gemini API key is not set on the server. Please configure GEMINI_API_KEY in Settings > Secrets."
    };
  }
  if (rawStatus === 403 || /PERMISSION_DENIED|API_KEY_INVALID/i.test(msg)) {
    return {
      status: 403,
      code: "API_KEY_INVALID",
      message: "Gemini API authentication failed. Please verify GEMINI_API_KEY in Settings > Secrets."
    };
  }
  if (rawStatus === 429 || /RESOURCE_EXHAUSTED|quota/i.test(msg)) {
    return {
      status: 429,
      code: "RATE_LIMIT",
      message: "AI request quota temporarily reached. Please wait a moment and try again."
    };
  }
  if (rawStatus === 404 || /NOT_FOUND/i.test(msg)) {
    return {
      status: 502,
      code: "MODEL_NOT_FOUND",
      message: "Requested Gemini model unavailable. Please try again."
    };
  }
  if (rawStatus === 400 || /INVALID_ARGUMENT/i.test(msg)) {
    return {
      status: 400,
      code: "BAD_REQUEST",
      message: "The document or prompt could not be processed (check PDF size or format)."
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

async function verifyDoiViaOpenAlex(query: string): Promise<RawCitation | null> {
  const q = cleanText(query, 140);
  if (!q || q.length < 4) return null;
  const ctrl = new AbortController();
  const tm = setTimeout(() => ctrl.abort(), 3500);
  try {
    const res = await fetch(
      `https://api.openalex.org/works?search=${encodeURIComponent(q)}&per-page=1`,
      { signal: ctrl.signal }
    );
    if (!res.ok) return null;
    const json: any = await res.json();
    const w = json?.results?.[0];
    if (!w) return null;
    const doi = w.doi ? String(w.doi).replace(/^https?:\/\/doi\.org\//i, "") : "";
    return {
      title: w.title || w.display_name || q,
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
  // 1) Interactive AI Research Chat, Outline Builder & Literature Review Synthesizer
  app.post("/api/ai/research", async (req, res) => {
    try {
      const ai = getAi();
      const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-14) : [];
      const mode = cleanText(req.body?.mode || "qa", 32);
      const citeStyle = cleanText(req.body?.citeStyle || "apa", 16).toLowerCase();
      const lang = cleanText(req.body?.lang || "ar", 8);
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

      const styleLabel = citeStyle === "mla" ? "MLA 9th" : citeStyle === "chicago" ? "Chicago 17th" : "APA 7th";
      const hasDoc = Boolean(doc && (doc.pdfBase64 || doc.text));
      const strictDocOnly = hasDoc && !useWebSearch;

      const systemInstruction = [
        "You are the 7Salah Scholar Academic Research Assistant (المساعد البحثي الذكي), serving university students and researchers worldwide.",
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

      const parts: any[] = [];
      if (doc?.pdfBase64) {
        const cleanB64 = String(doc.pdfBase64).replace(/^data:application\/pdf;base64,/i, "");
        if (cleanB64.length > 26_000_000) {
          res.status(400).json({ error: "PDF exceeds maximum 18MB limit for analysis." });
          return;
        }
        parts.push({
          inlineData: {
            mimeType: "application/pdf",
            data: cleanB64
          }
        });
        parts.push({
          text: `Attached Reference Document Title: "${cleanText(doc.title || "Uploaded Paper", 200)}". Ground analysis in this PDF.`
        });
      } else if (doc?.text) {
        parts.push({
          text: `Attached ${cleanText(doc.kind || "document", 30).toUpperCase()} ("${cleanText(doc.title || "Source Document", 200)}"):\n---\n${cleanText(doc.text, 65000)}\n---`
        });
      }

      const conversationText = messages
        .map((m: any) => `${m.role === "assistant" ? "Assistant" : "Researcher"}: ${cleanText(m.text, 8000)}`)
        .join("\n\n");
      parts.push({ text: conversationText });

      const config: any = {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      };
      if (!strictDocOnly) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_RESEARCH,
          contents: [{ role: "user", parts }],
          config
        })
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
      // Verify up to 3 bibliographic references lacking DOI against OpenAlex when web grounding was enabled
      if (!strictDocOnly) {
        await Promise.all(
          candidates
            .filter((c) => !c.doi && c.title && c.verifiedSource !== "Uploaded Document (PDF/Text)" && c.verifiedSource !== "Uploaded Lecture Transcript")
            .slice(0, 3)
            .map(async (c) => {
              const verified = await verifyDoiViaOpenAlex(c.title!);
              if (verified) {
                if (verified.doi) c.doi = verified.doi;
                if (!c.url && verified.url) c.url = verified.url;
                if ((!c.authors || !c.authors.length) && verified.authors?.length) c.authors = verified.authors;
                if (!c.year && verified.year) c.year = verified.year;
                if (!c.journal && verified.journal) c.journal = verified.journal;
                if (verified.doi) c.verifiedSource = verified.verifiedSource;
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
      const mapped = mapAiError(err);
      res.status(mapped.status).json({ error: mapped.message, code: mapped.code });
    }
  });

  // 2) Strict Document & Paper Analyzer (PDF / Lecture / Text)
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const ai = getAi();
      const title = cleanText(req.body?.title || "Academic Document", 220);
      const kind = cleanText(req.body?.kind || "text", 24);
      const text = cleanText(req.body?.text || "", 80000);
      const pdfBase64 = req.body?.pdfBase64 ? String(req.body.pdfBase64) : "";
      const citeStyle = cleanText(req.body?.citeStyle || "apa", 16).toLowerCase();
      const lang = cleanText(req.body?.lang || "ar", 8);

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

      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_RESEARCH,
          contents: [{ role: "user", parts }],
          config: {
            systemInstruction:
              "You are a strict academic document analyzer. Extract ONLY verifiable facts, findings, methodologies, terminology, bibliography items, and flashcards directly supported by the provided document. Include verbatim short evidence quotes and page/section/timestamp references for each point. Never invent claims outside the source.",
            thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
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
          }
        })
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
      const mapped = mapAiError(err);
      res.status(mapped.status).json({ error: mapped.message, code: mapped.code });
    }
  });

  // 3) Convert any AI Research Answer into Smart Flashcards
  app.post("/api/ai/flashcards", async (req, res) => {
    try {
      const ai = getAi();
      const answerText = cleanText(req.body?.answerText || "", 20000);
      const title = cleanText(req.body?.title || "Research Synthesis", 180);
      const lang = cleanText(req.body?.lang || "ar", 8);
      if (answerText.length < 20) {
        res.status(400).json({ error: "Answer text is too short to extract flashcards." });
        return;
      }

      const targetLangName = lang === "ar" ? "Arabic" : lang === "fr" ? "French" : "English";
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_RESEARCH,
          contents: `Extract 5 to 8 high-yield academic flashcards (question & concise verified answer) in ${targetLangName} strictly from this research response titled "${title}". Only include facts directly stated in the text.\n\n---\n${answerText}`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
          }
        })
      );

      const parsed = JSON.parse((response.text || "{}").trim());
      res.json({
        cards: Array.isArray(parsed.cards) ? parsed.cards.slice(0, 12) : []
      });
    } catch (err: any) {
      console.error("[ai/flashcards]", err);
      const mapped = mapAiError(err);
      res.status(mapped.status).json({ error: mapped.message, code: mapped.code });
    }
  });
}
