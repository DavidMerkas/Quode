"use client";

import { useMemo, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { createHighlighter, type Highlighter } from "shiki";

const THEME = "github-dark-default";
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
    loading = createHighlighter({ themes: [THEME], langs: LANGS }).then((h) => {
      highlighter = h;
    });
  }
  loading.then(onReady);
  return null;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [, force] = useState(0);
  const h = ensureHighlighter(() => force((n) => n + 1));

  const html = useMemo(() => {
    if (!h) return null;
    const loaded = h.getLoadedLanguages() as string[];
    const lang = loaded.includes(language) ? language : "text";
    try {
      return h.codeToHtml(code, { lang, theme: THEME });
    } catch {
      return null;
    }
  }, [h, language, code]);

  if (html) {
    return (
      <div
        className="duck-code my-3 overflow-x-auto rounded-md border border-[var(--color-border)]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <pre className="bg-surface text-fg my-3 overflow-x-auto rounded-md border border-[var(--color-border)] p-3 font-mono text-[13px] leading-relaxed">
      <code>{code}</code>
    </pre>
  );
}

const components: Components = {
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
    return <CodeBlock language={match?.[1] ?? "text"} code={text} />;
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
      <blockquote className="text-fg-muted my-2 border-l-2 border-[var(--color-border-strong)] pl-3 italic">
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

export function DuckMarkdown({ children }: { children: string }) {
  return (
    <div className="duck-md text-fg text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
