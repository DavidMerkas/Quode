import type { LanguageId } from "@/types/language";

/**
 * Quode's formatting pipeline.
 *
 * - JS/TS: Prettier runs in the browser (client-side, ~0ms network).
 * - Python: black, Go: gofmt, Rust: rustfmt, Java: google-java-format,
 *   C++: clang-format — all run on the server via `/api/format`, which
 *   spawns the native binary. On the local dev machine those binaries
 *   probably aren't installed; the route returns a clear message saying
 *   so. On the VPS we install them once and everything works.
 */

export const FORMATTABLE: Record<LanguageId, boolean> = {
  javascript: true,
  typescript: true,
  python: true,
  go: true,
  rust: true,
  java: true,
  cpp: true,
  csharp: false,
};

export function isFormattable(lang: LanguageId): boolean {
  return FORMATTABLE[lang];
}

const PRETTIER_PARSER: Partial<Record<LanguageId, string>> = {
  javascript: "babel",
  typescript: "typescript",
};

async function formatWithPrettier(
  code: string,
  parser: string,
): Promise<string> {
  const [prettier, estree, babel, typescript] = await Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/estree"),
    import("prettier/plugins/babel"),
    import("prettier/plugins/typescript"),
  ]);

  return prettier.format(code, {
    parser,
    plugins: [estree.default, babel.default, typescript.default],
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    bracketSpacing: true,
    arrowParens: "always",
  });
}

async function formatOnServer(
  code: string,
  language: LanguageId,
): Promise<string> {
  const res = await fetch("/api/format", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language }),
  });
  const data = (await res.json()) as
    | { formatted: string }
    | { error: string };
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Format failed.");
  }
  return data.formatted;
}

export async function formatCode(
  code: string,
  lang: LanguageId,
): Promise<string | null> {
  const parser = PRETTIER_PARSER[lang];
  if (parser) {
    return formatWithPrettier(code, parser);
  }
  if (!isFormattable(lang)) return null;
  return formatOnServer(code, lang);
}
