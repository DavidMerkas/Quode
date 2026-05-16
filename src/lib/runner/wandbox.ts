import type { LanguageId } from "@/types/language";
import type { RunResult } from "./types";

const WANDBOX_URL = "https://wandbox.org/api/compile.json";

/**
 * Wandbox compiler IDs. Wandbox occasionally updates available compilers and
 * retires older ones. If you start seeing "No such compiler" errors, query
 * https://wandbox.org/api/list.json and replace the affected ID below.
 *
 * Each entry pins a known-good compiler at the time of writing. Options is the
 * stringified compiler-options Wandbox expects (comma-separated flags).
 */
const COMPILERS: Record<
  LanguageId,
  { compiler: string; options?: string }
> = {
  python: { compiler: "cpython-3.13.8" },
  javascript: { compiler: "nodejs-20.17.0" },
  typescript: { compiler: "typescript-5.6.2" },
  go: { compiler: "go-1.23.2" },
  rust: { compiler: "rust-1.82.0", options: "2021" },
  java: { compiler: "openjdk-jdk-22+36" },
  cpp: { compiler: "gcc-13.2.0", options: "warning,gnu++23" },
};

interface WandboxResponse {
  status?: string;
  signal?: string | null;
  compiler_output?: string;
  compiler_error?: string;
  compiler_message?: string;
  program_output?: string;
  program_error?: string;
  program_message?: string;
}

/**
 * Wandbox occasionally returns transient OCI/cgroup errors when the host is
 * under load (e.g. `crun: clone: Resource temporarily unavailable`). These are
 * not bugs in user code — they're container-runtime hiccups. We detect them
 * and retry transparently.
 */
const TRANSIENT_ERROR_PATTERNS = [
  /OCI runtime error/i,
  /Resource temporarily unavailable/i,
  /clone:/i,
  /cgroup/i,
];

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

function isTransient(data: WandboxResponse): boolean {
  const msg = `${data.compiler_error ?? ""}\n${data.compiler_message ?? ""}`;
  return TRANSIENT_ERROR_PATTERNS.some((re) => re.test(msg));
}

/**
 * Wandbox-specific source transforms. Wandbox writes the main file as
 * `prog.<ext>`, which conflicts with Java's rule that `public class X` must
 * live in `X.java`. Stripping `public` from top-level class declarations is
 * a semantic no-op for single-file scripts and lets standard Java tutorials
 * paste-and-run.
 */
function preprocess(language: LanguageId, code: string): string {
  if (language === "java") {
    return code.replace(/\bpublic\s+(class|interface|enum|record)\b/g, "$1");
  }
  return code;
}

/**
 * Runs code via the public Wandbox API. No auth required. Wandbox is a
 * community-maintained free service used by many tutorial sites and online
 * compilers — reliable enough for a personal demo. Don't hammer it.
 *
 * Retries up to MAX_RETRIES times on transient container-runtime errors.
 */
export async function runCode(
  language: LanguageId,
  code: string,
): Promise<RunResult> {
  const cfg = COMPILERS[language];
  code = preprocess(language, code);

  let lastData: WandboxResponse | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(WANDBOX_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        compiler: cfg.compiler,
        options: cfg.options ?? "",
        stdin: "",
        save: false,
      }),
    });

    if (!res.ok) {
      // Retry 5xx, fail fast on 4xx
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      const body = await res.text().catch(() => "");
      throw new Error(`Wandbox ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as WandboxResponse;

    if (isTransient(data) && attempt < MAX_RETRIES) {
      lastData = data;
      await sleep(RETRY_DELAY_MS * (attempt + 1));
      continue;
    }

    return toResult(data);
  }

  // Exhausted retries on a transient error
  return toResult(
    lastData ?? {
      status: "-1",
      compiler_error: "Wandbox runtime is busy. Please try again.",
    },
  );
}

function toResult(data: WandboxResponse): RunResult {
  const exitCode = Number.parseInt(data.status ?? "-1", 10);
  const compileError =
    data.compiler_error && data.compiler_error.trim().length > 0
      ? data.compiler_error
      : undefined;

  return {
    stdout: data.program_output ?? "",
    stderr: data.program_error ?? "",
    exitCode: Number.isNaN(exitCode) ? -1 : exitCode,
    signal: data.signal ?? null,
    compileError,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
