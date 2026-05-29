"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { LANGUAGES, getLanguage, type LanguageId } from "@/types/language";
import { cn } from "@/lib/utils/cn";

interface LanguagePickerProps {
  value: LanguageId;
  onChange: (next: LanguageId) => void;
}

export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = getLanguage(value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Change language (resets code)"
        className={cn(
          "border-border/70 bg-surface/40 text-fg-muted hover:text-fg hover:bg-surface-2/60",
          "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium",
          "transition-colors",
        )}
      >
        <span className="font-mono">{current.label}</span>
        <ChevronDown
          className={cn(
            "size-3 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="border-border bg-surface absolute top-full left-1/2 z-30 mt-1 min-w-[10rem] -translate-x-1/2 overflow-hidden rounded-lg border p-1 shadow-lg"
          >
            <div className="text-fg-subtle px-2 py-1 text-[10px] font-medium tracking-wider uppercase">
              Language
            </div>
            {LANGUAGES.map((l) => {
              const active = l.id === value;
              return (
                <button
                  key={l.id}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    if (l.id !== value) onChange(l.id);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors",
                    active
                      ? "text-fg bg-surface-2/70"
                      : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <span>{l.label}</span>
                  {active ? (
                    <Check className="text-fg-muted size-3" />
                  ) : (
                    <span className="text-fg-subtle font-mono text-[10px]">
                      .{extOf(l.id)}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function extOf(id: LanguageId): string {
  return id === "python"
    ? "py"
    : id === "javascript"
      ? "js"
      : id === "typescript"
        ? "ts"
        : id === "rust"
          ? "rs"
          : id;
}
