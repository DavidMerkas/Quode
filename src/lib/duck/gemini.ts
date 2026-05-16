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

  const response = await ai.models.generateContentStream({
    model: DUCK_MODEL,
    contents: [{ role: "user", parts: [{ text: opts.userMessage }] }],
    config: {
      systemInstruction: opts.systemPrompt,
      temperature: 0.6,
    },
  });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) yield text;
  }
}
