import type { LanguageId } from "@/types/language";
import type { RunResult } from "./types";

/**
 * Piston client. Use only with a self-hosted Piston instance — set
 * `PISTON_URL` to your instance's `/api/v2/execute` endpoint.
 *
 * The public Piston instance at emkc.org went whitelist-only on 2026-02-15,
 * so there is no default URL. If `PISTON_URL` is unset, this client is unused.
 *
 * Self-host with Docker:
 *   docker run --privileged -p 2000:2000 ghcr.io/engineer-man/piston
 * Then deploy that container on Render / Railway / Fly.io / Oracle Cloud.
 */

const PISTON_LANGS: Record<
  LanguageId,
  { language: string; version: string; filename: string }
> = {
  python: { language: "python", version: "3.10.0", filename: "main.py" },
  javascript: { language: "javascript", version: "18.15.0", filename: "main.js" },
  typescript: { language: "typescript", version: "5.0.3", filename: "main.ts" },
  go: { language: "go", version: "1.16.2", filename: "main.go" },
  rust: { language: "rust", version: "1.68.2", filename: "main.rs" },
  java: { language: "java", version: "15.0.2", filename: "Main.java" },
  cpp: { language: "c++", version: "10.2.0", filename: "main.cpp" },
};

export async function runCode(
  language: LanguageId,
  code: string,
  stdin = "",
): Promise<RunResult> {
  const url = process.env.PISTON_URL;
  if (!url) {
    throw new Error("PISTON_URL is not set");
  }
  const cfg = PISTON_LANGS[language];

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: cfg.language,
      version: cfg.version,
      files: [{ name: cfg.filename, content: code }],
      stdin,
      compile_timeout: 10000,
      run_timeout: 5000,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Piston ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    run?: {
      stdout?: string;
      stderr?: string;
      code?: number;
      signal?: string | null;
    };
    compile?: { stdout?: string; stderr?: string; code?: number };
  };

  const compileFailed = data.compile && (data.compile.code ?? 0) !== 0;

  return {
    stdout: data.run?.stdout ?? "",
    stderr: data.run?.stderr ?? "",
    exitCode: data.run?.code ?? -1,
    signal: data.run?.signal ?? null,
    compileError: compileFailed
      ? (data.compile?.stderr ?? data.compile?.stdout ?? "")
      : undefined,
  };
}
