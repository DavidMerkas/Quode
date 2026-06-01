"use client";

import { useMemo, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { createHighlighter, type Highlighter } from "shiki";
import { Check, FileInput } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { markNewLines } from "@/lib/diff";
import type { LanguageId } from "@/types/language";

const LIGHT_THEME = "solarized-light";
const DARK_THEME = "github-dark-default";
const LANGS = [
  "python",
  "javascript",
  "typescript",
  "tsx",
  "jsx",
  "go",
  "rust",
  "java",
  "cpp",
  "c",
  "csharp",
  "bash",
  "shell",
  "json",
  "html",
  "css",
  "sql",
  "markdown",
  "yaml",
  "diff",
];

let highlighter: Highlighter | null = null;
let loading: Promise<void> | null = null;

function ensureHighlighter(onReady: () => void): Highlighter | null {
  if (highlighter) return highlighter;
  if (!loading) {
    loading = createHighlighter({
      themes: [LIGHT_THEME, DARK_THEME],
      langs: LANGS,
    }).then((h) => {
      highlighter = h;
    });
  }
  loading.then(onReady);
  return null;
}

function CodeBlock({
  language,
  code,
  themeName,
  currentCode,
  currentLanguage,
}: {
  language: string;
  code: string;
  themeName: string;
  currentCode?: string;
  currentLanguage?: LanguageId;
}) {
  const [, force] = useState(0);
  const [applied, setApplied] = useState(false);
  const h = ensureHighlighter(() => force((n) => n + 1));

  // Lines in the snippet that don't appear in the user's current code.
  const newMask = useMemo(() => {
    if (!currentCode) return [] as boolean[];
    return markNewLines(code, currentCode);
  }, [code, currentCode]);

  const html = useMemo(() => {
    if (!h) return null;
    const loaded = h.getLoadedLanguages() as string[];
    const lang = loaded.includes(language) ? language : "text";
    try {
      return h.codeToHtml(code, {
        lang,
        theme: themeName,
        transformers: newMask.length
          ? [
              {
                line(node, lineNumber) {
                  if (newMask[lineNumber - 1]) {
                    const cls = node.properties.class;
                    const existing = typeof cls === "string" ? cls : "";
                    node.properties.class = `${existing} is-new`.trim();
                  }
                },
              },
            ]
          : undefined,
      });
    } catch {
      return null;
    }
  }, [h, language, code, themeName, newMask]);

  // Only show Apply when the snippet looks like real code (not a one-liner
  // or shell command) and matches the active tab's language (when known).
  const canApply =
    code.split("\n").length >= 2 &&
    (currentLanguage == null || matchesLang(language, currentLanguage));

  const apply = () => {
    window.dispatchEvent(
      new CustomEvent("quode:replace-with-code", {
        detail: { code, language },
      }),
    );
    setApplied(true);
    setTimeout(() => setApplied(false), 1800);
  };

  return (
    <div className="duck-code my-3 overflow-hidden rounded-md border border-[var(--color-border)]">
      {canApply && (
        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] bg-surface-2/60 px-2.5 py-1">
          <span className="text-fg-subtle font-mono text-[10.5px] tracking-wide uppercase">
            {language}
          </span>
          <button
            type="button"
            onClick={apply}
            className="text-fg-muted hover:text-fg hover:bg-surface inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium transition-colors"
            title="Replace your editor's code with this snippet"
          >
            {applied ? (
              <>
                <Check className="size-3 text-[var(--color-success)]" />
                Applied
              </>
            ) : (
              <>
                <FileInput className="size-3" />
                Apply
              </>
            )}
          </button>
        </div>
      )}
      {html ? (
        <div
          className="overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="bg-surface text-fg overflow-x-auto p-3 font-mono text-[13px] leading-relaxed">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

// Map between shiki language slugs and our LanguageId.
function matchesLang(shikiLang: string, current: LanguageId): boolean {
  const map: Record<string, LanguageId> = {
    python: "python",
    py: "python",
    javascript: "javascript",
    js: "javascript",
    jsx: "javascript",
    typescript: "typescript",
    ts: "typescript",
    tsx: "typescript",
    go: "go",
    rust: "rust",
    rs: "rust",
    java: "java",
    cpp: "cpp",
    "c++": "cpp",
    cxx: "cpp",
    csharp: "csharp",
    cs: "csharp",
  };
  return map[shikiLang.toLowerCase()] === current;
}

function makeComponents(
  themeName: string,
  currentCode?: string,
  currentLanguage?: LanguageId,
): Components {
  return {
    code({ className, children, ...props }) {
      const match = /language-([\w-]+)/.exec(className || "");
      const text = String(children).replace(/\n$/, "");
      const isBlock = !!match || text.includes("\n");

      if (!isBlock) {
        return (
          <code
            className="bg-surface-2 text-fg rounded px-1 py-0.5 font-mono text-[0.9em]"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <CodeBlock
          language={match?.[1] ?? "text"}
          code={text}
          themeName={themeName}
          currentCode={currentCode}
          currentLanguage={currentLanguage}
        />
      );
    },
  pre({ children }) {
    return <>{children}</>;
  },
  a({ children, href, ...props }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-[var(--color-duck)] underline underline-offset-2"
        {...props}
      >
        {children}
      </a>
    );
  },
  ul({ children }) {
    return <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>;
  },
  li({ children }) {
    return <li className="leading-relaxed">{children}</li>;
  },
  p({ children }) {
    return <p className="my-1.5">{children}</p>;
  },
  h1({ children }) {
    return <h1 className="mt-3 mb-1 text-base font-semibold">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="mt-3 mb-1 text-sm font-semibold">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="mt-2 mb-1 text-sm font-semibold">{children}</h3>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="text-fg-muted bg-surface/60 border-border my-2 rounded-md border px-3 py-1.5 italic">
        {children}
      </blockquote>
    );
  },
  hr() {
    return <hr className="my-3 border-[var(--color-border)]" />;
  },
  table({ children }) {
    return (
      <div className="my-2 overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">{children}</table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border border-[var(--color-border)] px-2 py-1 text-left font-medium">
        {children}
      </th>
    );
  },
    td({ children }) {
      return (
        <td className="border border-[var(--color-border)] px-2 py-1 align-top">
          {children}
        </td>
      );
    },
  };
}

export function DuckMarkdown({
  children,
  currentCode,
  currentLanguage,
}: {
  children: string;
  currentCode?: string;
  currentLanguage?: LanguageId;
}) {
  const { theme } = useTheme();
  const themeName = theme === "dark" ? DARK_THEME : LIGHT_THEME;
  const components = useMemo(
    () => makeComponents(themeName, currentCode, currentLanguage),
    [themeName, currentCode, currentLanguage],
  );

  return (
    <div className="duck-md text-fg text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
