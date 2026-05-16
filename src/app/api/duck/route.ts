import { streamDuckReply } from "@/lib/duck/gemini";
import { buildSystemPrompt, buildUserTurn } from "@/lib/duck/prompts";
import { DUCK_MODES, type DuckMode } from "@/types/duck";
import { LANGUAGES, type LanguageId } from "@/types/language";

export const runtime = "nodejs";

const VALID_MODES = new Set<DuckMode>(DUCK_MODES.map((m) => m.id));
const VALID_LANGS = new Set<LanguageId>(LANGUAGES.map((l) => l.id));
const MAX_MESSAGE = 4_000;
const MAX_CODE = 20_000;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const { message, mode, code, language } = (body ?? {}) as {
    message?: string;
    mode?: string;
    code?: string;
    language?: string;
  };

  if (typeof message !== "string" || !message.trim()) {
    return jsonError("Missing `message`", 400);
  }
  if (typeof mode !== "string" || !VALID_MODES.has(mode as DuckMode)) {
    return jsonError("Invalid `mode`", 400);
  }
  if (typeof language !== "string" || !VALID_LANGS.has(language as LanguageId)) {
    return jsonError("Invalid `language`", 400);
  }
  if (message.length > MAX_MESSAGE) {
    return jsonError("Message too long", 413);
  }
  const safeCode = (typeof code === "string" ? code : "").slice(0, MAX_CODE);

  if (!process.env.GEMINI_API_KEY) {
    return jsonError(
      "GEMINI_API_KEY is not configured on the server. See README for setup.",
      500,
    );
  }

  const systemPrompt = buildSystemPrompt(mode as DuckMode);
  const userMessage = buildUserTurn({
    message,
    code: safeCode,
    language,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of streamDuckReply({
          systemPrompt,
          userMessage,
        })) {
          controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unknown streaming error";
        controller.enqueue(encoder.encode(`\n\n[Duck error: ${msg}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

function jsonError(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
