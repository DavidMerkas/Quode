"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Clock, Terminal, X, XCircle } from "lucide-react";
import { useState } from "react";
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
  stdin: string;
  onStdinChange: (next: string) => void;
  onClose: () => void;
}

export function OutputDrawer({
  open,
  result,
  isRunning,
  stdin,
  onStdinChange,
  onClose,
}: OutputDrawerProps) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.section
          key="output"
          aria-label="Run output"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            height: { type: "spring", stiffness: 380, damping: 36 },
            opacity: { duration: 0.15 },
          }}
          className="border-border bg-surface/60 shrink-0 overflow-hidden border-t backdrop-blur-sm"
        >
          <div className="flex max-h-96 min-h-0 flex-col">
            <DrawerHeader
              isRunning={isRunning}
              result={result}
              onClose={onClose}
            />

            <StdinSection value={stdin} onChange={onStdinChange} />

            <div className="min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-[12.5px] leading-[1.55]">
              {!result && !isRunning && <EmptyHint />}
              {isRunning && <RunningHint />}
              {result && <ResultBody result={result} />}
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function StdinSection({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const lines = value ? value.split("\n").length : 0;
  return (
    <div className="border-border/60 shrink-0 border-b">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-fg-muted hover:text-fg flex w-full items-center justify-between px-3 py-1.5 text-[11px] transition-colors"
      >
        <span className="flex items-center gap-2">
          <ChevronDown
            className={cn(
              "size-3 transition-transform",
              !expanded && "-rotate-90",
            )}
          />
          <span className="font-semibold">Input</span>
          <span className="text-fg-subtle font-mono text-[10px] normal-case">
            stdin
          </span>
        </span>
        <span className="text-fg-subtle font-mono text-[10px]">
          {lines === 0
            ? "empty"
            : `${lines} line${lines === 1 ? "" : "s"}`}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Type input here — one value per line. Programs read it as stdin (input(), Scanner, std::cin, …)."
              spellCheck={false}
              rows={3}
              className={cn(
                "text-fg placeholder:text-fg-subtle block w-full resize-y bg-transparent px-4 pb-2 font-mono text-[12.5px] leading-[1.55] outline-none",
                "min-h-[3.5rem]",
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DrawerHeader({
  isRunning,
  result,
  onClose,
}: {
  isRunning: boolean;
  result: RunResult | null;
  onClose: () => void;
}) {
  return (
    <header className="border-border/60 flex h-10 shrink-0 items-center justify-between border-b px-3">
      <div className="flex items-center gap-2.5">
        <Terminal className="text-fg-muted size-3.5" aria-hidden />
        <span className="text-fg text-xs font-semibold">Output</span>

        <StatusBadge isRunning={isRunning} result={result} />

        {result && (
          <span className="text-fg-subtle flex items-center gap-1 font-mono text-[11px]">
            <Clock className="size-3" aria-hidden />
            {formatDuration(result.durationMs)}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close output"
        className="text-fg-muted hover:bg-surface-3 hover:text-fg rounded p-1 transition-colors"
      >
        <X className="size-3.5" />
      </button>
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

function EmptyHint() {
  return (
    <div className="text-fg-subtle flex items-center gap-2 text-xs">
      <Terminal className="size-3.5" aria-hidden />
      <span>
        No output yet. Press{" "}
        <kbd className="bg-surface-3 border-border rounded border px-1 py-px font-mono text-[10px]">
          ⌘↵
        </kbd>{" "}
        to run.
      </span>
    </div>
  );
}

function RunningHint() {
  return (
    <div className="text-fg-muted flex items-center gap-2 text-xs">
      <span className="border-fg-subtle border-t-fg-muted inline-block size-3 animate-spin rounded-full border-2" />
      Sending code to the runner…
    </div>
  );
}

function ResultBody({ result }: { result: RunResult }) {
  if (!result.stdout && !result.stderr) {
    return <div className="text-fg-subtle">(no output)</div>;
  }
  return (
    <div className="space-y-2">
      {result.stdout && (
        <pre className="text-fg whitespace-pre-wrap break-words">
          {result.stdout}
        </pre>
      )}
      {result.stderr && (
        <pre className="border-l-2 border-[var(--color-danger)]/60 pl-3 whitespace-pre-wrap break-words text-[var(--color-danger)]">
          {result.stderr}
        </pre>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
