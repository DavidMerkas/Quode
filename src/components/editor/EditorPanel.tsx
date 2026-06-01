"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Hash, Play, Wand2 } from "lucide-react";
import { DuckMascot } from "@/components/duck/DuckMascot";
import { formatCode, isFormattable } from "@/lib/format";
import type { OnMount, OnChange } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useTheme } from "@/lib/theme";
import { useEditorFontSize } from "@/lib/editor-font-size";
import { getLanguage } from "@/types/language";
import type { EditorTab } from "@/types/tab";
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
  tab: EditorTab;
  onChange: (code: string) => void;
  onRun: () => void;
}

export function EditorPanel({ tab, onChange, onRun }: EditorPanelProps) {
  const lang = getLanguage(tab.language);
  const { theme } = useTheme();
  const { size, inc, dec, reset } = useEditorFontSize();
  const onRunRef = useRef(onRun);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const formatDocumentRef = useRef<(() => Promise<void>) | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [selToolbar, setSelToolbar] = useState<{
    top: number;
    left: number;
    flipBelow: boolean;
    text: string;
  } | null>(null);
  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  // Keep latest theme in a ref so handleMount (called once async by Monaco)
  // can apply the *current* theme rather than a stale closure value.
  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // Listen for global "format" event from the command palette.
  useEffect(() => {
    const onFormat = () => {
      void formatDocumentRef.current?.();
    };
    window.addEventListener("quode:format", onFormat);
    return () => window.removeEventListener("quode:format", onFormat);
  }, []);

  // Listen for "replace with snippet" from Duck. Swap the editor's contents,
  // then briefly highlight the changed lines via Monaco decorations.
  useEffect(() => {
    const onReplace = (e: Event) => {
      const detail = (e as CustomEvent<{ code: string; language?: string }>)
        .detail;
      const ed = editorRef.current;
      if (!ed || !detail?.code) return;
      const model = ed.getModel();
      if (!model) return;

      const prev = model.getValue();
      if (prev === detail.code) return;

      ed.executeEdits("duck-apply", [
        { range: model.getFullModelRange(), text: detail.code },
      ]);
      ed.pushUndoStop();

      // Compute changed line ranges in the new content and decorate them.
      import("@/lib/diff")
        .then(({ changedLineRanges }) => {
          const ranges = changedLineRanges(prev, detail.code);
          if (!ranges.length) return;
          const monaco = monacoRef.current;
          if (!monaco) return;
          const decorations = ranges.map((r) => ({
            range: new monaco.Range(r.start, 1, r.end, 1),
            options: {
              isWholeLine: true,
              className: "quode-applied-line",
            },
          }));
          const collection = ed.createDecorationsCollection(decorations);
          // Fade out after a moment by replacing with a 0-opacity variant,
          // then clear entirely.
          setTimeout(() => {
            collection.set(
              ranges.map((r) => ({
                range: new monaco.Range(r.start, 1, r.end, 1),
                options: {
                  isWholeLine: true,
                  className: "quode-applied-line-fade",
                },
              })),
            );
          }, 2400);
          setTimeout(() => collection.clear(), 4400);
        })
        .catch(() => {
          /* ignore */
        });
    };
    window.addEventListener("quode:replace-with-code", onReplace);
    return () =>
      window.removeEventListener("quode:replace-with-code", onReplace);
  }, []);

  useEffect(() => {
    formatDocumentRef.current = async () => {
      const ed = editorRef.current;
      if (!ed) return;
      const model = ed.getModel();
      if (!model) return;
      if (!isFormattable(tab.language)) return;
      const original = model.getValue();
      setIsFormatting(true);
      setFormatError(null);
      try {
        const next = await formatCode(original, tab.language);
        if (next == null || next === original) return;
        const fullRange = model.getFullModelRange();
        ed.executeEdits("prettier", [{ range: fullRange, text: next }]);
        ed.pushUndoStop();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Format failed.";
        setFormatError(msg);
        setTimeout(() => setFormatError(null), 3500);
      } finally {
        setIsFormatting(false);
      }
    };
  }, [tab.language]);

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

      monaco.editor.setTheme(
        themeRef.current === "dark" ? "quode-dark" : "quode-cream",
      );

      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => onRunRef.current(),
      );
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

      // Shift+Alt+F → format document (VS Code parity)
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
        () => {
          void formatDocumentRef.current?.();
        },
      );

      // Ctrl/Cmd+K → open the command palette (Monaco would otherwise eat it)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
        () => {
          window.dispatchEvent(new CustomEvent("quode:toggle-palette"));
        },
      );

      const TOOLBAR_H = 40;
      const TOOLBAR_GAP = 14;
      let isPointerDown = false;
      const updateToolbar = () => {
        const sel = editor.getSelection();
        const model = editor.getModel();
        if (!sel || !model || sel.isEmpty()) {
          setSelToolbar(null);
          return;
        }
        const text = model.getValueInRange(sel);
        if (text.trim().length < 2) {
          setSelToolbar(null);
          return;
        }
        const startPos = sel.getStartPosition();
        const endPos = sel.getEndPosition();
        const startVis = editor.getScrolledVisiblePosition(startPos);
        const endVis = editor.getScrolledVisiblePosition(endPos);
        const domNode = editor.getDomNode();
        if (!startVis || !endVis || !domNode) {
          setSelToolbar(null);
          return;
        }
        const editorRect = domNode.getBoundingClientRect();
        const sameLine = startPos.lineNumber === endPos.lineNumber;

        // Direction 0 = cursor at end (dragged down), 1 = cursor at start
        // (dragged up). Show the toolbar on the cursor's side so it never
        // covers the line the user is actively working with.
        const cursorAtEnd = sel.getDirection() === 0;
        const placeBelow = cursorAtEnd;

        // Vertical: above start line OR below end line.
        const aboveTop = editorRect.top + startVis.top - TOOLBAR_GAP;
        const belowTop = editorRect.top + endVis.top + endVis.height + TOOLBAR_GAP;

        // Force flip if the preferred side would clip the viewport.
        let flipBelow = placeBelow;
        if (!placeBelow && aboveTop - TOOLBAR_H < 8) flipBelow = true;
        if (placeBelow && belowTop + TOOLBAR_H > window.innerHeight - 8) {
          flipBelow = false;
        }

        const finalTop = flipBelow ? belowTop : aboveTop;

        // Horizontal: center near the cursor side of the selection.
        const anchorLeft = cursorAtEnd
          ? editorRect.left + endVis.left
          : editorRect.left + startVis.left;
        const rawLeft = sameLine
          ? editorRect.left + (startVis.left + endVis.left) / 2
          : anchorLeft;

        // Clamp horizontally. The toolbar is ~440px wide with 5 labeled
        // buttons + divider; we keep a 12px safety margin on each side.
        const TOOLBAR_W_HALF = 230;
        const EDGE = 12;
        const minLeft = EDGE + TOOLBAR_W_HALF;
        const maxLeft = window.innerWidth - EDGE - TOOLBAR_W_HALF;
        const clampedLeft =
          maxLeft < minLeft
            ? window.innerWidth / 2
            : Math.max(minLeft, Math.min(maxLeft, rawLeft));

        setSelToolbar({
          top: finalTop,
          left: clampedLeft,
          flipBelow,
          text,
        });
      };
      editor.onDidChangeCursorSelection(() => {
        if (isPointerDown) {
          setSelToolbar(null);
          return;
        }
        updateToolbar();
      });
      editor.onDidScrollChange(() => {
        const sel = editor.getSelection();
        if (!sel || sel.isEmpty() || isPointerDown) return;
        updateToolbar();
      });

      // DOM-level pointer tracking — Monaco's onMouseDown/Up can miss the
      // very first selection change of a drag, so we mirror it on the
      // editor's DOM node and on window for the pointerup (which can land
      // outside the editor when the user drags past its edge).
      const domNode = editor.getDomNode();
      const onPointerDown = () => {
        isPointerDown = true;
        setSelToolbar(null);
      };
      const onPointerUp = () => {
        if (!isPointerDown) return;
        isPointerDown = false;
        // Wait one frame so Monaco's final selection update is committed.
        requestAnimationFrame(() => {
          const sel = editor.getSelection();
          if (!sel || sel.isEmpty()) {
            setSelToolbar(null);
            return;
          }
          updateToolbar();
        });
      };
      domNode?.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointerup", onPointerUp);
      editor.onDidBlurEditorWidget(() => {
        // small delay so clicking toolbar still works
        setTimeout(() => {
          const sel = editor.getSelection();
          if (!sel || sel.isEmpty()) setSelToolbar(null);
        }, 150);
      });
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

  return (
    <div className="bg-base flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        <MonacoEditor
          path={tab.id}
          value={tab.code}
          language={lang.monaco}
          theme={theme === "dark" ? "quode-dark" : "quode-cream"}
          onChange={handleChange}
          onMount={handleMount}
          options={MONACO_OPTIONS}
        />
        <MonacoSelectionToolbar
          pos={selToolbar}
          language={lang.monaco}
          editor={editorRef.current}
          onFormat={() => {
            void formatDocumentRef.current?.();
            setSelToolbar(null);
          }}
          onDismiss={() => setSelToolbar(null)}
        />
        <FormatToast
          isFormatting={isFormatting}
          error={formatError}
        />
      </div>
    </div>
  );
}

function MonacoSelectionToolbar({
  pos,
  language,
  editor,
  onFormat,
  onDismiss,
}: {
  pos: {
    top: number;
    left: number;
    flipBelow: boolean;
    text: string;
  } | null;
  language: string;
  editor: Monaco.editor.IStandaloneCodeEditor | null;
  onFormat: () => void;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pos) setCopied(false);
  }, [pos]);

  const copy = async () => {
    if (!pos) return;
    try {
      await navigator.clipboard.writeText(pos.text);
      setCopied(true);
      setTimeout(onDismiss, 650);
    } catch {
      /* ignore */
    }
  };

  const askDuck = () => {
    if (!pos) return;
    window.dispatchEvent(
      new CustomEvent("quode:ask-duck", {
        detail: { text: pos.text, language },
      }),
    );
    onDismiss();
  };

  const runSelection = () => {
    if (!pos) return;
    window.dispatchEvent(
      new CustomEvent("quode:run-selection", { detail: { text: pos.text } }),
    );
    onDismiss();
  };

  const toggleComment = () => {
    if (!editor) return;
    editor.focus();
    editor.trigger("toolbar", "editor.action.commentLine", null);
    onDismiss();
  };

  return (
    <AnimatePresence>
      {pos && (
        <div
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            transform: pos.flipBelow
              ? "translate(-50%, 0)"
              : "translate(-50%, -100%)",
            zIndex: 50,
          }}
          className="pointer-events-none"
        >
        <motion.div
          initial={{ opacity: 0, y: pos.flipBelow ? -4 : 4, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: pos.flipBelow ? -4 : 4, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 600, damping: 30, mass: 0.5 }}
          style={{
            transformOrigin: pos.flipBelow ? "top center" : "bottom center",
          }}
          className="bg-surface border-border/60 pointer-events-auto flex items-center gap-0.5 rounded-xl border p-1 shadow-[0_4px_14px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_4px_14px_-6px_rgba(0,0,0,0.55)]"
          onMouseDown={(e) => e.preventDefault()}
        >
          <ToolbarBtn
            label={copied ? "Copied" : "Copy"}
            icon={
              copied ? (
                <Check className="size-3.5 text-[var(--color-success)]" />
              ) : (
                <Copy className="size-3.5" />
              )
            }
            onClick={copy}
          />
          <ToolbarBtn
            label="Comment"
            icon={<Hash className="size-3.5" />}
            onClick={toggleComment}
            title="Toggle comment on selected lines (Ctrl+/)"
          />
          <ToolbarBtn
            label="Format"
            icon={<Wand2 className="size-3.5" />}
            onClick={onFormat}
            title="Format the whole file (Shift+Alt+F)"
          />
          <ToolbarBtn
            label="Run"
            icon={<Play className="size-3 fill-current" />}
            onClick={runSelection}
            title="Run only the selected code"
          />
          <div className="bg-border/60 mx-0.5 h-4 w-px" aria-hidden />
          <ToolbarBtn
            label="Ask Duck"
            icon={<DuckMascot size={16} />}
            onClick={askDuck}
            accent
          />
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ToolbarBtn({
  label,
  icon,
  onClick,
  accent,
  title,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  accent?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-medium transition-colors",
        accent
          ? "text-[var(--color-quack)] hover:bg-[var(--color-quack)]/12"
          : "text-fg-muted hover:text-fg hover:bg-surface-2/70",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
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

function FormatToast({
  isFormatting,
  error,
}: {
  isFormatting: boolean;
  error: string | null;
}) {
  const show = isFormatting || !!error;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18 }}
          className={cn(
            "neu-raised absolute bottom-3 right-3 z-30 max-w-[20rem] rounded-xl px-3 py-2 text-[12px]",
            error ? "text-[var(--color-danger)]" : "text-fg-muted",
          )}
        >
          {isFormatting ? (
            <span className="flex items-center gap-2">
              <span className="border-fg-subtle border-t-fg-muted inline-block size-3 animate-spin rounded-full border-2" />
              Formatting…
            </span>
          ) : (
            <span>{error}</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
