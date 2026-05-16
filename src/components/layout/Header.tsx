"use client";

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
    <header className="border-border bg-surface/80 flex h-12 shrink-0 items-center justify-between gap-4 border-b px-4 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <DuckMascot size={28} />
        <span className="text-fg text-sm font-semibold tracking-tight">
          Quode
        </span>
        <span className="text-fg-subtle hidden text-xs sm:inline">
          code with Duck
        </span>
      </div>

      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="language">
          Language
        </label>
        <div className="relative">
          <select
            id="language"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as LanguageId)}
            className={cn(
              "bg-surface-2 border-border text-fg hover:border-border-strong",
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
          <svg
            className="text-fg-muted pointer-events-none absolute top-1/2 right-2 -translate-y-1/2"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          className={cn(
            "group inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium",
            "bg-[var(--color-quack)] text-[#1a0d00] hover:brightness-110",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "transition-all",
          )}
        >
          {isRunning ? (
            <>
              <Spinner />
              <span>Running…</span>
            </>
          ) : (
            <>
              <PlayIcon />
              <span>Run</span>
              <kbd className="ml-1 hidden rounded bg-black/20 px-1 py-px font-mono text-[10px] sm:inline">
                ⌘↵
              </kbd>
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="text-fg-muted hover:text-fg hidden text-sm transition-colors sm:inline"
        >
          Sign in
        </button>
      </div>
    </header>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <path d="M3 2.5v7a.5.5 0 0 0 .77.42l5.5-3.5a.5.5 0 0 0 0-.84l-5.5-3.5A.5.5 0 0 0 3 2.5z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
