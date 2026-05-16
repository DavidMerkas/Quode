import { NextResponse } from "next/server";
import { runCode } from "@/lib/runner";
import { LANGUAGES, type LanguageId } from "@/types/language";

export const runtime = "nodejs";

const VALID_LANGS = new Set<LanguageId>(LANGUAGES.map((l) => l.id));
const MAX_CODE_BYTES = 100_000;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { language, code } = (body ?? {}) as {
    language?: string;
    code?: string;
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

  const start = Date.now();
  try {
    const result = await runCode(language as LanguageId, code);
    return NextResponse.json({
      stdout: result.stdout,
      stderr: result.compileError
        ? `${result.compileError}\n${result.stderr}`.trim()
        : result.stderr,
      exitCode: result.exitCode,
      durationMs: Date.now() - start,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Runner failed", detail: message },
      { status: 502 },
    );
  }
}
