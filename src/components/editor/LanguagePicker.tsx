"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { LANGUAGES, getLanguage, type LanguageId } from "@/types/language";
import { LanguageLogo } from "@/components/editor/LanguageLogo";
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
          "neu-raised-sm neu-press text-fg-muted hover:text-fg",
          "inline-flex h-9 items-center gap-2 rounded-xl pl-2.5 pr-2 text-[13px] font-medium",
          "transition-all duration-150",
          open && "text-fg",
        )}
      >
        <LanguageLogo lang={current.id} size={16} />
        <span>{current.label}</span>
        <ChevronDown
          className={cn(
            "size-3.5 opacity-60 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{
              type: "spring",
              stiffness: 520,
              damping: 32,
              mass: 0.6,
            }}
            style={{ transformOrigin: "top center" }}
            className="neu-raised absolute top-full left-1/2 z-30 mt-2 min-w-[11rem] -translate-x-1/2 overflow-hidden rounded-2xl p-1.5"
          >
            <div className="text-fg-subtle px-2 py-1 text-[10px] font-medium tracking-wider uppercase">
              Language
            </div>
            {LANGUAGES.map((l, i) => {
              const active = l.id === value;
              return (
                <motion.button
                  key={l.id}
                  role="menuitem"
                  type="button"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 * i, duration: 0.14 }}
                  onClick={() => {
                    setOpen(false);
                    if (l.id !== value) onChange(l.id);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors",
                    active
                      ? "text-fg bg-surface-2/70"
                      : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <LanguageLogo lang={l.id} size={14} />
                    <span>{l.label}</span>
                  </span>
                  {active ? (
                    <Check className="text-fg-muted size-3" />
                  ) : (
                    <span className="text-fg-subtle font-mono text-[10px]">
                      .{extOf(l.id)}
                    </span>
                  )}
                </motion.button>
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
          : id === "csharp"
            ? "cs"
            : id;
}
