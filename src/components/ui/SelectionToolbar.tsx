"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { DuckMascot } from "@/components/duck/DuckMascot";
import { cn } from "@/lib/utils/cn";

interface Pos {
  top: number;
  left: number;
  text: string;
}

const MIN_CHARS = 2;

function isEditableTarget(node: Node | null): boolean {
  let el: Node | null = node;
  while (el) {
    if (el.nodeType === 1) {
      const e = el as HTMLElement;
      const tag = e.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return true;
      if (e.isContentEditable) return true;
      // Monaco editor root has class .monaco-editor
      if (e.classList?.contains("monaco-editor")) return true;
    }
    el = (el as Node).parentNode;
  }
  return false;
}

export function SelectionToolbar() {
  const [pos, setPos] = useState<Pos | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const compute = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setPos(null);
        return;
      }
      const text = sel.toString().trim();
      if (text.length < MIN_CHARS) {
        setPos(null);
        return;
      }
      if (isEditableTarget(sel.anchorNode) || isEditableTarget(sel.focusNode)) {
        setPos(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPos(null);
        return;
      }
      setPos({
        top: rect.top + window.scrollY - 10,
        left: rect.left + rect.width / 2 + window.scrollX,
        text,
      });
      setCopied(false);
    };

    const onUp = () => {
      // small delay lets the selection settle (esp. on double/triple click)
      setTimeout(compute, 0);
    };
    const onDown = (e: MouseEvent) => {
      // hide on new click unless click was on the toolbar itself
      const t = e.target as HTMLElement | null;
      if (t?.closest("[data-selection-toolbar]")) return;
      setPos(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPos(null);
    };
    const onScroll = () => setPos(null);

    document.addEventListener("mouseup", onUp);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  const copy = async () => {
    if (!pos) return;
    try {
      await navigator.clipboard.writeText(pos.text);
      setCopied(true);
      setTimeout(() => setPos(null), 650);
    } catch {
      /* ignore */
    }
  };

  const askDuck = () => {
    if (!pos) return;
    window.dispatchEvent(
      new CustomEvent("quode:ask-duck", { detail: { text: pos.text } }),
    );
    setPos(null);
  };

  return (
    <AnimatePresence>
      {pos && (
        <motion.div
          data-selection-toolbar
          initial={{ opacity: 0, y: 4, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 600, damping: 30, mass: 0.5 }}
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            transform: "translate(-50%, -100%)",
            transformOrigin: "bottom center",
          }}
          className="neu-raised z-50 flex items-center gap-0.5 rounded-xl p-1"
          onMouseDown={(e) => e.preventDefault()}
        >
          <ToolbarButton
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
          <div className="bg-border/60 mx-0.5 h-4 w-px" aria-hidden />
          <ToolbarButton
            label="Ask Duck"
            icon={<DuckMascot size={16} />}
            onClick={askDuck}
            accent
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ToolbarButton({
  label,
  icon,
  onClick,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
