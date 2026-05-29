import type { LanguageId } from "@/types/language";
import type { RunResult } from "./types";

const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_HOST = "judge0-ce.p.rapidapi.com";

/** Judge0 CE language IDs (https://ce.judge0.com/languages). */
const LANGUAGE_IDS: Record<LanguageId, number> = {
  python: 71, // Python 3.8.1
  javascript: 63, // Node.js 12.14.0
  typescript: 74, // TypeScript 3.7.4
  go: 60, // Go 1.13.5
  rust: 73, // Rust 1.40.0
  java: 62, // Java (OpenJDK 13.0.1)
  cpp: 54, // C++ (GCC 9.2.0)
};

/**
 * Runs code via Judge0 CE on RapidAPI. Free tier on the BASIC plan allows
 * ~50 requests/day, no card required.
 *
 * Uses `wait=true` for synchronous results — simpler than polling and supported
 * on the RapidAPI hosted instance. If we ever migrate to a deployment that
 * disallows long-running requests, switch to submit + poll.
 */
export async function runCode(
  language: LanguageId,
  code: string,
  stdin = "",
): Promise<RunResult> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY is not set");
  }

  const res = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true&fields=*`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": JUDGE0_HOST,
      },
      body: JSON.stringify({
        source_code: code,
        language_id: LANGUAGE_IDS[language],
        stdin,
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Judge0 ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    stdout?: string | null;
    stderr?: string | null;
    compile_output?: string | null;
    message?: string | null;
    exit_code?: number | null;
    status?: { id?: number; description?: string };
    time?: string | null;
  };

  const stderrParts = [data.stderr, data.compile_output, data.message]
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .join("\n")
    .trim();

  return {
    stdout: data.stdout ?? "",
    stderr: stderrParts,
    exitCode: data.exit_code ?? -1,
    signal: null,
  };
}
