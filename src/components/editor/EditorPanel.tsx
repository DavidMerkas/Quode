"use client";

import { useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { OnMount, OnChange } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { FileCode2, ZoomIn, ZoomOut } from "lucide-react";
import { useTheme } from "@/lib/theme";
import {
  MAX_SIZE,
  MIN_SIZE,
  useEditorFontSize,
} from "@/lib/editor-font-size";
import { getLanguage, type LanguageId } from "@/types/language";
import { cn } from "@/lib/utils/cn";

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
  const { theme } = useTheme();
  const { size, inc, dec, reset } = useEditorFontSize();
  const onRunRef = useRef(onRun);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      monacoRef.current = monaco;
      editorRef.current = editor;

      monaco.editor.defineTheme("quode-cream", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "comment", foreground: "98763b", fontStyle: "italic" },
          { token: "keyword", foreground: "b85c00" },
          { token: "string", foreground: "6d4c1c" },
          { token: "number", foreground: "9a4d00" },
          { token: "type", foreground: "905c00" },
          { token: "function", foreground: "c95a1a" },
        ],
        colors: {
          "editor.background": "#fffbe6",
          "editor.foreground": "#2b1f02",
          "editorLineNumber.foreground": "#c9aa44",
          "editorLineNumber.activeForeground": "#5e4b15",
          "editor.selectionBackground": "#ffd43b80",
          "editor.lineHighlightBackground": "#fff5cc",
          "editor.lineHighlightBorder": "#fff5cc",
          "editorCursor.foreground": "#ff8c42",
          "editorIndentGuide.background1": "#f0e0a8",
          "editorIndentGuide.activeBackground1": "#e0c87c",
          "editorWidget.background": "#fdf8ea",
          "editorWidget.border": "#e0c87c",
          "editorSuggestWidget.background": "#fdf8ea",
          "editorSuggestWidget.border": "#e0c87c",
          "editorSuggestWidget.selectedBackground": "#f6ecc8",
          "scrollbar.shadow": "#00000000",
          "scrollbarSlider.background": "#c9a94340",
          "scrollbarSlider.hoverBackground": "#c9a94380",
          "scrollbarSlider.activeBackground": "#c9a943",
        },
      });

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

      monaco.editor.setTheme(theme === "dark" ? "quode-dark" : "quode-cream");

      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => onRunRef.current(),
      );
      // Cmd/Ctrl + Plus / Minus / 0 — zoom controls inside the editor
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal,
        () => inc(),
      );
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus,
        () => dec(),
      );
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0,
        () => reset(),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // React to theme switches after mount.
  useEffect(() => {
    const m = monacoRef.current;
    if (!m) return;
    m.editor.setTheme(theme === "dark" ? "quode-dark" : "quode-cream");
  }, [theme]);

  // React to font-size changes.
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.updateOptions({ fontSize: size, lineHeight: Math.round(size * 1.6) });
  }, [size]);

  const handleChange: OnChange = (value) => {
    onChange(value ?? "");
  };

  const monacoLang = lang.monaco;
  const ext = extFor(language);

  return (
    <div className="bg-base flex min-h-0 flex-1 flex-col">
      <div className="border-border bg-surface/30 flex h-10 shrink-0 items-center justify-between border-b pl-1 pr-2">
        {/* file tab */}
        <div className="relative flex h-full items-center gap-2 pl-3 pr-4 text-xs">
          <FileCode2 className="text-fg-muted size-3.5" aria-hidden />
          <span className="text-fg font-mono">main.{ext}</span>
          <span
            aria-hidden
            className="absolute inset-x-2 bottom-0 h-px bg-[var(--color-duck)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <ZoomControl
            size={size}
            onInc={inc}
            onDec={dec}
            onReset={reset}
          />
          <span className="text-fg-subtle font-mono text-[10px] tracking-wider uppercase">
            {lang.label}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <MonacoEditor
          value={code}
          language={monacoLang}
          theme={theme === "dark" ? "quode-dark" : "quode-cream"}
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

function ZoomControl({
  size,
  onInc,
  onDec,
  onReset,
}: {
  size: number;
  onInc: () => void;
  onDec: () => void;
  onReset: () => void;
}) {
  const atMin = size <= MIN_SIZE;
  const atMax = size >= MAX_SIZE;
  return (
    <div
      role="group"
      aria-label="Editor zoom"
      className="border-border bg-surface/60 inline-flex h-7 items-center overflow-hidden rounded-md border text-xs"
    >
      <button
        type="button"
        onClick={onDec}
        disabled={atMin}
        aria-label="Zoom out"
        title="Zoom out (⌘−)"
        className={cn(
          "flex h-full w-7 items-center justify-center transition-colors",
          atMin
            ? "text-fg-subtle cursor-not-allowed"
            : "text-fg-muted hover:text-fg hover:bg-surface-2",
        )}
      >
        <ZoomOut className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onReset}
        onWheel={(e) => {
          if (e.deltaY < 0) onInc();
          else if (e.deltaY > 0) onDec();
        }}
        title="Scroll to zoom · click to reset"
        aria-label={`Editor zoom, ${size} pixels. Click to reset, scroll to change.`}
        className="text-fg-muted hover:text-fg hover:bg-surface-2 flex h-full min-w-[2.25rem] items-center justify-center px-1 font-mono text-[11px] transition-colors"
      >
        {size}
      </button>
      <button
        type="button"
        onClick={onInc}
        disabled={atMax}
        aria-label="Zoom in"
        title="Zoom in (⌘+)"
        className={cn(
          "flex h-full w-7 items-center justify-center transition-colors",
          atMax
            ? "text-fg-subtle cursor-not-allowed"
            : "text-fg-muted hover:text-fg hover:bg-surface-2",
        )}
      >
        <ZoomIn className="size-3.5" />
      </button>
    </div>
  );
}

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
