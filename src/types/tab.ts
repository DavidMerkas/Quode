import { LANGUAGES, type LanguageId } from "./language";

export interface EditorTab {
  id: string;
  name: string;
  language: LanguageId;
  code: string;
}

const EXTS: Record<LanguageId, string> = {
  python: "py",
  javascript: "js",
  typescript: "ts",
  go: "go",
  rust: "rs",
  java: "java",
  cpp: "cpp",
};

export function extFor(id: LanguageId): string {
  return EXTS[id];
}

/**
 * Build a fresh file name for a new tab in `language`, avoiding collisions
 * with existing tab names. First file gets "main.py", duplicates get
 * "main(2).py", "main(3).py", etc.
 */
export function newTabName(
  language: LanguageId,
  existing: readonly { name: string }[],
): string {
  const ext = extFor(language);
  const taken = new Set(existing.map((t) => t.name));
  if (!taken.has(`main.${ext}`)) return `main.${ext}`;
  for (let i = 2; i < 1000; i++) {
    const candidate = `main(${i}).${ext}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `main.${Date.now()}.${ext}`;
}

export function newTab(
  language: LanguageId,
  existing: readonly EditorTab[],
): EditorTab {
  const lang = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0];
  return {
    id: crypto.randomUUID(),
    name: newTabName(language, existing),
    language: lang.id,
    code: lang.starter,
  };
}
