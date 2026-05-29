import { NextResponse } from "next/server";
import { runCode } from "@/lib/runner";
import {
  checkLimit,
  clientIp,
  rateLimitHeaders,
} from "@/lib/rate-limit";
import { LANGUAGES, type LanguageId } from "@/types/language";

export const runtime = "nodejs";

const VALID_LANGS = new Set<LanguageId>(LANGUAGES.map((l) => l.id));
const MAX_CODE_BYTES = 100_000;
const MAX_STDIN_BYTES = 10_000;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { language, code, stdin } = (body ?? {}) as {
    language?: string;
    code?: string;
    stdin?: string;
  };

  if (typeof code !== "string" || typeof language !== "string") {
    return NextResponse.json(
      { error: "Missing `code` or `language`" },
      { status: 400 },
    );
  }
  if (!VALID_LANGS.has(language as LanguageId)) {
    return NextResponse.json(
      { error: `Unsupported language: ${language}` },
      { status: 400 },
    );
  }
  if (code.length > MAX_CODE_BYTES) {
    return NextResponse.json({ error: "Code too large" }, { status: 413 });
  }
  const stdinText = typeof stdin === "string" ? stdin : "";
  if (stdinText.length > MAX_STDIN_BYTES) {
    return NextResponse.json({ error: "Input too large" }, { status: 413 });
  }

  const limit = await checkLimit("run", clientIp(req));
  if (!limit.ok) {
    const human =
      limit.scope === "day"
        ? "Daily run limit reached. Try again tomorrow."
        : `Slow down — try again in ${limit.retryAfterSec}s.`;
    return NextResponse.json(
      { error: human },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSec),
          ...rateLimitHeaders(limit),
        },
      },
    );
  }

  const start = Date.now();
  try {
    const result = await runCode(language as LanguageId, code, stdinText);
    return NextResponse.json(
      {
        stdout: result.stdout,
        stderr: result.compileError
          ? `${result.compileError}\n${result.stderr}`.trim()
          : result.stderr,
        exitCode: result.exitCode,
        durationMs: Date.now() - start,
      },
      { headers: rateLimitHeaders(limit) },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Runner failed", detail: message },
      { status: 502 },
    );
  }
}
