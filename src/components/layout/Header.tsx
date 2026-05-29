"use client";

import { Loader2, Play, Terminal } from "lucide-react";
import { motion } from "motion/react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguagePicker } from "@/components/editor/LanguagePicker";
import type { LanguageId } from "@/types/language";
import { cn } from "@/lib/utils/cn";

interface HeaderProps {
  onRun: () => void;
  isRunning: boolean;
  language: LanguageId;
  onLanguageChange: (next: LanguageId) => void;
  onToggleInput: () => void;
  hasInput: boolean;
}

export function Header({
  onRun,
  isRunning,
  language,
  onLanguageChange,
  onToggleInput,
  hasInput,
}: HeaderProps) {
  return (
    <header className="border-border/70 bg-base/85 supports-[backdrop-filter]:bg-base/60 sticky top-0 z-20 grid h-14 shrink-0 grid-cols-3 items-center gap-4 border-b px-4 backdrop-blur-md">
      {/* Left: brand */}
      <div className="flex items-center gap-2">
        <span className="text-fg text-[15px] font-semibold tracking-tight">
          Quode
        </span>
        <span className="text-fg-subtle hidden text-[11px] font-medium tracking-wide sm:inline">
          · code with Duck
        </span>
      </div>

      {/* Center: Run + language + input */}
      <div className="flex items-center justify-center gap-2">
        <LanguagePicker value={language} onChange={onLanguageChange} />
        <button
          type="button"
          onClick={onToggleInput}
          title="Program input (stdin)"
          aria-label="Program input"
          className={cn(
            "border-border/70 bg-surface/40 text-fg-muted hover:text-fg hover:bg-surface-2/60",
            "relative inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium",
            "transition-colors",
          )}
        >
          <Terminal className="size-3.5" />
          <span>Input</span>
          {hasInput && (
            <span
              className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-[var(--color-quack)]"
              aria-hidden
            />
          )}
        </button>
        <motion.button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
          className={cn(
            "group relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-md px-3 text-sm font-medium",
            "bg-[var(--color-quack)] text-[#1a0d00]",
            "shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_4px_14px_-4px_rgba(255,140,66,0.55)]",
            "hover:brightness-105 active:brightness-95",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "transition-[filter,box-shadow] duration-150",
          )}
          aria-label={isRunning ? "Running code" : "Run code"}
        >
          {isRunning ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Running</span>
            </>
          ) : (
            <>
              <Play className="size-3.5 fill-current" />
              <span>Run</span>
              <kbd className="ml-0.5 hidden rounded bg-black/15 px-1 py-px font-mono text-[10px] font-medium sm:inline">
                ⌘↵
              </kbd>
            </>
          )}
        </motion.button>
      </div>

      {/* Right: theme toggle */}
      <div className="flex items-center justify-end">
        <ThemeToggle />
      </div>
    </header>
  );
}
