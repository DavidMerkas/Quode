"use client";

import { ChevronDown, Loader2, Play } from "lucide-react";
import { motion } from "motion/react";
import { DuckMascot } from "@/components/duck/DuckMascot";
import { LANGUAGES, type LanguageId } from "@/types/language";
import { cn } from "@/lib/utils/cn";

interface HeaderProps {
  language: LanguageId;
  onLanguageChange: (id: LanguageId) => void;
  onRun: () => void;
  isRunning: boolean;
}

export function Header({
  language,
  onLanguageChange,
  onRun,
  isRunning,
}: HeaderProps) {
  return (
    <header className="border-border/70 bg-base/85 supports-[backdrop-filter]:bg-base/60 sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <DuckMascot size={30} />
          <span className="absolute -right-0.5 -bottom-0.5 size-1.5 rounded-full bg-[var(--color-duck)] shadow-[0_0_8px_var(--color-duck)]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-fg text-[15px] font-semibold tracking-tight">
            Quode
          </span>
          <span className="text-fg-subtle hidden text-[11px] font-medium tracking-wide sm:inline">
            code with Duck
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSelect value={language} onChange={onLanguageChange} />

        <motion.button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
          className={cn(
            "group relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-md px-3 text-sm font-medium",
            "bg-[var(--color-quack)] text-[#1a0d00]",
            "shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_2px_8px_-2px_rgba(255,140,66,0.5)]",
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
    </header>
  );
}

function LanguageSelect({
  value,
  onChange,
}: {
  value: LanguageId;
  onChange: (id: LanguageId) => void;
}) {
  return (
    <div className="group relative">
      <label className="sr-only" htmlFor="language">
        Language
      </label>
      <select
        id="language"
        value={value}
        onChange={(e) => onChange(e.target.value as LanguageId)}
        className={cn(
          "bg-surface-2/80 border-border text-fg",
          "hover:border-border-strong hover:bg-surface-3/80",
          "h-8 cursor-pointer appearance-none rounded-md border pr-7 pl-3 text-sm",
          "transition-colors focus:outline-none",
        )}
      >
        {LANGUAGES.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="text-fg-muted group-hover:text-fg pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 transition-colors"
      />
    </div>
  );
}
