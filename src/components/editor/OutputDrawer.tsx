"use client";

import { cn } from "@/lib/utils/cn";

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

interface OutputDrawerProps {
  open: boolean;
  result: RunResult | null;
  isRunning: boolean;
  onClose: () => void;
}

export function OutputDrawer({
  open,
  result,
  isRunning,
  onClose,
}: OutputDrawerProps) {
  const ok = result ? result.exitCode === 0 : null;

  return (
    <section
      aria-label="Run output"
      className={cn(
        "border-border bg-surface flex shrink-0 flex-col overflow-hidden border-t transition-[max-height,opacity] duration-200 ease-out",
        open ? "max-h-64 opacity-100" : "max-h-0 opacity-0",
      )}
    >
      <header className="border-border/60 flex h-9 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              "size-1.5 rounded-full",
              isRunning
                ? "bg-[var(--color-quack)] animate-pulse"
                : ok === null
                  ? "bg-fg-subtle"
                  : ok
                    ? "bg-[var(--color-success)]"
                    : "bg-[var(--color-danger)]",
            )}
          />
          <span className="text-fg font-medium">Output</span>
          {result && (
            <span className="text-fg-muted font-mono">
              · exit {result.exitCode} · {result.durationMs}ms
            </span>
          )}
          {isRunning && <span className="text-fg-muted">· running…</span>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close output"
          className="text-fg-muted hover:text-fg rounded p-1 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M3 3l6 6M9 3l-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-xs leading-5">
        {!result && !isRunning && (
          <div className="text-fg-subtle">No output yet. Press Run.</div>
        )}
        {isRunning && (
          <div className="text-fg-muted">Sending code to runner…</div>
        )}
        {result && (
          <>
            {result.stdout && (
              <pre className="text-fg whitespace-pre-wrap">{result.stdout}</pre>
            )}
            {result.stderr && (
              <pre className="whitespace-pre-wrap text-[var(--color-danger)]">
                {result.stderr}
              </pre>
            )}
            {!result.stdout && !result.stderr && (
              <div className="text-fg-subtle">(no output)</div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
