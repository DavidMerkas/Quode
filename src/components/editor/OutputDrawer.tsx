"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Clock, Terminal, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";
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
  height: number;
}

export function OutputDrawer({
  open,
  result,
  isRunning,
  height,
}: OutputDrawerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result || isRunning) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [result, isRunning]);

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.section
          key="output"
          aria-label="Terminal"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            height: { type: "spring", stiffness: 380, damping: 36 },
            opacity: { duration: 0.15 },
          }}
          className="shrink-0 overflow-hidden px-3 pb-3 pt-2"
        >
          <div
            className="neu-inset flex flex-col overflow-hidden rounded-2xl"
            style={{ height }}
          >
            <DrawerHeader isRunning={isRunning} result={result} />
            <div
              ref={scrollRef}
              className={cn(
                "min-h-0 flex-1 overflow-auto font-mono text-[12.5px] leading-[1.6]",
                "px-4 py-3",
              )}
            >
              {!result && !isRunning && <Hint />}
              {isRunning && <RunningLine />}
              {result && <OutputLines result={result} />}
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function OutputLines({ result }: { result: RunResult }) {
  const stdoutLines = result.stdout ? result.stdout.replace(/\n$/, "").split("\n") : [];
  const stderrLines = result.stderr ? result.stderr.replace(/\n$/, "").split("\n") : [];
  const ok = result.exitCode === 0;
  const hasAny = stdoutLines.length || stderrLines.length;

  return (
    <div className="relative">
      {stdoutLines.length > 0 && (
        <pre className="text-fg whitespace-pre-wrap break-words">
          {stdoutLines.join("\n")}
        </pre>
      )}
      {stderrLines.length > 0 && (
        <pre className="text-[var(--color-danger)] whitespace-pre-wrap break-words">
          {stderrLines.join("\n")}
        </pre>
      )}
      {!hasAny && (
        <div className="text-fg-subtle italic">(program produced no output)</div>
      )}
      <div className="text-fg-subtle mt-2 flex items-center gap-2 text-[11px] tracking-wide">
        <span
          className={cn(
            ok ? "text-[var(--color-success)]" : "text-[var(--color-danger)]",
          )}
        >
          {ok ? "✓" : "✗"}
        </span>
        <span>
          Exited {result.exitCode} · {formatDuration(result.durationMs)}
        </span>
      </div>
    </div>
  );
}

function RunningLine() {
  return (
    <div className="text-fg-muted flex items-center gap-2 text-xs">
      <span className="border-fg-subtle border-t-fg-muted inline-block size-3 animate-spin rounded-full border-2" />
      Running…
    </div>
  );
}

function Hint() {
  return (
    <div className="text-fg-subtle text-[11px]">
      Press{" "}
      <kbd className="bg-surface-2 text-fg-muted rounded-sm px-1 py-px font-mono text-[10px]">
        Ctrl ↵
      </kbd>{" "}
      to run. Output appears here.
    </div>
  );
}

function DrawerHeader({
  isRunning,
  result,
}: {
  isRunning: boolean;
  result: RunResult | null;
}) {
  return (
    <header className="flex h-9 shrink-0 items-center justify-between px-3 pt-1">
      <div className="flex items-center gap-2.5">
        <Terminal className="text-fg-muted size-3.5" aria-hidden />
        <span className="text-fg text-xs font-semibold">Terminal</span>
        <StatusBadge isRunning={isRunning} result={result} />
      </div>
      {result && (
        <span className="text-fg-subtle flex items-center gap-1 font-mono text-[11px]">
          <Clock className="size-3" aria-hidden />
          {formatDuration(result.durationMs)}
        </span>
      )}
    </header>
  );
}

function StatusBadge({
  isRunning,
  result,
}: {
  isRunning: boolean;
  result: RunResult | null;
}) {
  if (isRunning) {
    return (
      <span className="bg-[var(--color-quack)]/15 text-[var(--color-quack)] inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
        <span className="size-1.5 animate-pulse rounded-full bg-current" />
        Running
      </span>
    );
  }
  if (!result) return null;
  const ok = result.exitCode === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
        ok
          ? "bg-[var(--color-success)]/12 text-[var(--color-success)]"
          : "bg-[var(--color-danger)]/12 text-[var(--color-danger)]",
      )}
    >
      {ok ? <Check className="size-2.5" /> : <XCircle className="size-2.5" />}
      {ok ? "Success" : `Exit ${result.exitCode}`}
    </span>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
