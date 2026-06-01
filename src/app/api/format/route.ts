import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Language = "python" | "go" | "rust" | "java" | "cpp";

const SUPPORTED: ReadonlySet<Language> = new Set([
  "python",
  "go",
  "rust",
  "java",
  "cpp",
]);

interface SpawnResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

function run(
  cmd: string,
  args: readonly string[],
  stdin?: string,
  options: { cwd?: string } = {},
): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    let proc;
    try {
      proc = spawn(cmd, args, { cwd: options.cwd });
    } catch (err) {
      reject(err);
      return;
    }
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => resolve({ stdout, stderr, code }));
    if (stdin != null) {
      proc.stdin.write(stdin);
      proc.stdin.end();
    }
  });
}

function missingBinaryMessage(lang: Language, bin: string): string {
  return `${bin} is not installed on the server. Install it to enable ${lang} formatting.`;
}

async function formatPython(code: string): Promise<string> {
  // black reads from stdin with `-`
  try {
    const { stdout, stderr, code: exit } = await run(
      "black",
      ["--quiet", "-"],
      code,
    );
    if (exit !== 0) throw new Error(stderr.trim() || "black exited non-zero");
    return stdout;
  } catch (err) {
    if (isENOENT(err)) throw new Error(missingBinaryMessage("python", "black"));
    throw err;
  }
}

async function formatGo(code: string): Promise<string> {
  try {
    const { stdout, stderr, code: exit } = await run("gofmt", [], code);
    if (exit !== 0) throw new Error(stderr.trim() || "gofmt exited non-zero");
    return stdout;
  } catch (err) {
    if (isENOENT(err)) throw new Error(missingBinaryMessage("go", "gofmt"));
    throw err;
  }
}

async function formatCpp(code: string): Promise<string> {
  try {
    const { stdout, stderr, code: exit } = await run(
      "clang-format",
      ["--style=Google"],
      code,
    );
    if (exit !== 0)
      throw new Error(stderr.trim() || "clang-format exited non-zero");
    return stdout;
  } catch (err) {
    if (isENOENT(err))
      throw new Error(missingBinaryMessage("cpp", "clang-format"));
    throw err;
  }
}

async function formatJava(code: string): Promise<string> {
  try {
    const { stdout, stderr, code: exit } = await run(
      "google-java-format",
      ["-"],
      code,
    );
    if (exit !== 0)
      throw new Error(stderr.trim() || "google-java-format exited non-zero");
    return stdout;
  } catch (err) {
    if (isENOENT(err))
      throw new Error(missingBinaryMessage("java", "google-java-format"));
    throw err;
  }
}

// rustfmt doesn't read stdin reliably across versions, so go via a temp file.
async function formatRust(code: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "quode-fmt-"));
  const file = path.join(dir, "main.rs");
  try {
    await writeFile(file, code, "utf8");
    const { stderr, code: exit } = await run(
      "rustfmt",
      ["--edition", "2021", file],
      undefined,
      { cwd: dir },
    );
    if (exit !== 0) throw new Error(stderr.trim() || "rustfmt exited non-zero");
    return await readFile(file, "utf8");
  } catch (err) {
    if (isENOENT(err)) throw new Error(missingBinaryMessage("rust", "rustfmt"));
    throw err;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

function isENOENT(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "ENOENT"
  );
}

const FORMATTERS: Record<Language, (code: string) => Promise<string>> = {
  python: formatPython,
  go: formatGo,
  rust: formatRust,
  java: formatJava,
  cpp: formatCpp,
};

const MAX_CODE_BYTES = 100_000;

export async function POST(req: Request) {
  let body: { code?: unknown; language?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { code, language } = body;
  if (typeof code !== "string" || typeof language !== "string") {
    return NextResponse.json(
      { error: "Body must include `code` and `language` strings." },
      { status: 400 },
    );
  }
  if (code.length > MAX_CODE_BYTES) {
    return NextResponse.json(
      { error: "Code exceeds 100KB limit." },
      { status: 413 },
    );
  }
  if (!SUPPORTED.has(language as Language)) {
    return NextResponse.json(
      { error: `Language "${language}" is not supported by /api/format.` },
      { status: 400 },
    );
  }

  try {
    const formatted = await FORMATTERS[language as Language](code);
    return NextResponse.json({ formatted });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Formatter failed.";
    return NextResponse.json({ error: message }, { status: 501 });
  }
}
