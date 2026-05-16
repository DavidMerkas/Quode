import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

export const DUCK_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

/**
 * Streams a Duck reply from Gemini. Yields text deltas as they arrive.
 */
export async function* streamDuckReply(opts: {
  systemPrompt: string;
  userMessage: string;
}): AsyncGenerator<string, void, void> {
  const ai = getClient();

  let response;
  try {
    response = await ai.models.generateContentStream({
      model: DUCK_MODEL,
      contents: [{ role: "user", parts: [{ text: opts.userMessage }] }],
      config: {
        systemInstruction: opts.systemPrompt,
        temperature: 0.6,
      },
    });
  } catch (err) {
    throw new Error(formatGeminiError(err));
  }

  try {
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (err) {
    throw new Error(formatGeminiError(err));
  }
}

function formatGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);

  // The SDK often returns a string containing a JSON envelope. Try to parse.
  const jsonStart = raw.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart));
      const outer = parsed?.error ?? parsed;
      const code = outer?.code ?? outer?.status;
      const inner =
        typeof outer?.message === "string" && outer.message.includes("{")
          ? safeParseInner(outer.message)
          : null;
      const msg = inner?.error?.message ?? outer?.message ?? raw;

      if (code === 429 || /quota|rate/i.test(String(msg))) {
        const retry = /retry in ([\d.]+)s/i.exec(String(msg))?.[1];
        return retry
          ? `Duck is rate-limited by Gemini. Try again in ~${Math.ceil(Number(retry))}s.`
          : "Duck is rate-limited by Gemini. Try again in a minute.";
      }
      return `Duck call failed: ${truncate(String(msg), 200)}`;
    } catch {
      /* fall through */
    }
  }
  return `Duck call failed: ${truncate(raw, 200)}`;
}

function safeParseInner(s: string): { error?: { message?: string } } | null {
  try {
    return JSON.parse(s) as { error?: { message?: string } };
  } catch {
    return null;
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
