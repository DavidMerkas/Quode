"use client";

import { useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { OnMount, OnChange } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { FileCode2 } from "lucide-react";
import { getLanguage, type LanguageId } from "@/types/language";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="text-fg-muted flex h-full items-center justify-center gap-2 text-sm">
        <span className="border-fg-subtle border-t-fg-muted inline-block size-3 animate-spin rounded-full border-2" />
        Loading editor…
      </div>
    ),
  },
);

interface EditorPanelProps {
  code: string;
  onChange: (code: string) => void;
  language: LanguageId;
  onRun: () => void;
}

export function EditorPanel({
  code,
  onChange,
  language,
  onRun,
}: EditorPanelProps) {
  const lang = getLanguage(language);
  const onRunRef = useRef(onRun);
  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    monaco.editor.defineTheme("quode-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "71717a", fontStyle: "italic" },
        { token: "keyword", foreground: "ffd43b" },
        { token: "string", foreground: "ffb07a" },
        { token: "number", foreground: "f5c400" },
        { token: "type", foreground: "ffe580" },
        { token: "function", foreground: "ff8c42" },
      ],
      colors: {
        "editor.background": "#0b0b0f",
        "editor.foreground": "#f4f4f5",
        "editorLineNumber.foreground": "#52525b",
        "editorLineNumber.activeForeground": "#a1a1aa",
        "editor.selectionBackground": "#ffd43b33",
        "editor.lineHighlightBackground": "#15151b",
        "editor.lineHighlightBorder": "#15151b",
        "editorCursor.foreground": "#ffd43b",
        "editorIndentGuide.background1": "#1c1c24",
        "editorIndentGuide.activeBackground1": "#2a2a35",
        "editorWidget.background": "#15151b",
        "editorWidget.border": "#2a2a35",
        "editorSuggestWidget.background": "#15151b",
        "editorSuggestWidget.border": "#2a2a35",
        "editorSuggestWidget.selectedBackground": "#23232d",
        "scrollbar.shadow": "#00000000",
        "scrollbarSlider.background": "#2a2a3580",
        "scrollbarSlider.hoverBackground": "#3a3a47cc",
        "scrollbarSlider.activeBackground": "#3a3a47",
      },
    });
    monaco.editor.setTheme("quode-dark");

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => onRunRef.current(),
    );
  }, []);

  const handleChange: OnChange = (value) => {
    onChange(value ?? "");
  };

  const monacoLang = lang.monaco;
  const ext = extFor(language);

  return (
    <div className="bg-base flex min-h-0 flex-1 flex-col">
      <div className="border-border bg-surface/30 flex h-10 shrink-0 items-center justify-between border-b pl-1 pr-3">
        {/* file tab */}
        <div className="relative flex h-full items-center gap-2 pl-3 pr-4 text-xs">
          <FileCode2 className="text-fg-muted size-3.5" aria-hidden />
          <span className="text-fg font-mono">main.{ext}</span>
          <span
            aria-hidden
            className="absolute inset-x-2 bottom-0 h-px bg-[var(--color-duck)]"
          />
        </div>

        <div className="text-fg-subtle flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase">
          <span>{lang.label}</span>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <MonacoEditor
          value={code}
          language={monacoLang}
          theme="quode-dark"
          onChange={handleChange}
          onMount={handleMount}
          options={MONACO_OPTIONS}
        />
      </div>
    </div>
  );
}

const MONACO_OPTIONS: Monaco.editor.IStandaloneEditorConstructionOptions = {
  fontFamily:
    "var(--font-geist-mono), ui-monospace, 'JetBrains Mono', monospace",
  fontSize: 14,
  lineHeight: 22,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  padding: { top: 14, bottom: 14 },
  renderLineHighlight: "line",
  roundedSelection: false,
  guides: { indentation: true, bracketPairs: true },
  bracketPairColorization: { enabled: true },
  tabSize: 4,
  insertSpaces: true,
  automaticLayout: true,
  scrollbar: {
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
    useShadows: false,
  },
  fixedOverflowWidgets: true,
};

function extFor(id: LanguageId): string {
  switch (id) {
    case "python":
      return "py";
    case "javascript":
      return "js";
    case "typescript":
      return "ts";
    case "go":
      return "go";
    case "rust":
      return "rs";
    case "java":
      return "java";
    case "cpp":
      return "cpp";
  }
}
