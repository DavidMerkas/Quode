"use client";

import { useEffect, useRef } from "react";
import { Check, Clock, Square, Terminal as TerminalIcon, XCircle } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils/cn";
import type { RunStatus, RunSummary, UseInteractiveRun } from "@/hooks/useInteractiveRun";
// Static import — Next bundles the CSS at build time so it's present
// before the terminal mounts (dynamic import races the first paint).
import "@xterm/xterm/css/xterm.css";

interface InteractiveTerminalProps {
  height: number;
  runner: UseInteractiveRun;
}

const LIGHT_THEME = {
  background: "#fffbe6",
  foreground: "#2b1f02",
  cursor: "#ff8c42",
  cursorAccent: "#fffbe6",
  selectionBackground: "#ffd43b80",
  black: "#2b1f02",
  red: "#b85c00",
  green: "#3f7a1a",
  yellow: "#c9a943",
  blue: "#1f6f8b",
  magenta: "#a45ea0",
  cyan: "#1f8a8a",
  white: "#5e4b15",
  brightBlack: "#98763b",
  brightRed: "#d96a1c",
  brightGreen: "#5a9e2f",
  brightYellow: "#e5b800",
  brightBlue: "#3990b3",
  brightMagenta: "#c272bc",
  brightCyan: "#3aa8a8",
  brightWhite: "#2b1f02",
};

const DARK_THEME = {
  background: "#0b0b0f",
  foreground: "#f4f4f5",
  cursor: "#ffd43b",
  cursorAccent: "#0b0b0f",
  selectionBackground: "#ffd43b33",
  black: "#15151b",
  red: "#ff8c8c",
  green: "#b5e58c",
  yellow: "#ffd43b",
  blue: "#82b5ff",
  magenta: "#e0a0ff",
  cyan: "#8af0f0",
  white: "#d4d4d8",
  brightBlack: "#52525b",
  brightRed: "#ffb0b0",
  brightGreen: "#d2f0a8",
  brightYellow: "#ffe580",
  brightBlue: "#a8ccff",
  brightMagenta: "#ecc0ff",
  brightCyan: "#b0f5f5",
  brightWhite: "#fafafa",
};

export function InteractiveTerminal({ height, runner }: InteractiveTerminalProps) {
  const { theme } = useTheme();
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<import("@xterm/xterm").Terminal | null>(null);
  const fitRef = useRef<import("@xterm/addon-fit").FitAddon | null>(null);

  // Mount xterm once on first client render.
  useEffect(() => {
    let disposed = false;
    let resizeObs: ResizeObserver | null = null;

    (async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
      ]);
      // Canvas renderer needs the font fully loaded before first paint, else
      // it falls back to default monospace and never re-measures.
      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          /* ignore */
        }
      }
      if (disposed || !hostRef.current) return;

      // xterm renders to canvas, so it can't resolve CSS vars — pass the
      // computed value of --font-geist-mono if available, else literal stack.
      const computedFont =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--font-geist-mono")
          .trim() || "";
      const fontFamily = [
        computedFont,
        "Geist Mono",
        "ui-monospace",
        "JetBrains Mono",
        "Menlo",
        "monospace",
      ]
        .filter(Boolean)
        .join(", ");

      const term = new Terminal({
        cursorBlink: true,
        cursorStyle: "bar",
        fontFamily,
        fontSize: 12.5,
        lineHeight: 1.4,
        letterSpacing: 0,
        convertEol: true,
        scrollback: 5000,
        theme: theme === "dark" ? DARK_THEME : LIGHT_THEME,
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(hostRef.current);
      fit.fit();

      termRef.current = term;
      fitRef.current = fit;

      term.onData((data) => runner.stdin(data));
      runner.setOnData((d) => term.write(d));
      runner.setOnClear(() => term.reset());

      resizeObs = new ResizeObserver(() => {
        try {
          fit.fit();
        } catch {
          /* terminal may be detaching */
        }
        runner.resize(term.cols, term.rows);
      });
      resizeObs.observe(hostRef.current);
    })();

    return () => {
      disposed = true;
      resizeObs?.disconnect();
      runner.setOnData(null);
      runner.setOnClear(null);
      termRef.current?.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to theme switches.
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.theme = theme === "dark" ? DARK_THEME : LIGHT_THEME;
  }, [theme]);

  // Re-fit when the panel height changes.
  useEffect(() => {
    const fit = fitRef.current;
    const term = termRef.current;
    if (!fit || !term) return;
    try {
      fit.fit();
      runner.resize(term.cols, term.rows);
    } catch {
      /* ignore */
    }
  }, [height, runner]);

  return (
    <section
      aria-label="Interactive terminal"
      className="shrink-0 overflow-hidden px-3 pb-3 pt-2"
    >
      <div
        className="neu-inset flex flex-col overflow-hidden rounded-2xl"
        style={{ height }}
      >
        <TerminalHeader
          status={runner.status}
          summary={runner.summary}
          errorMessage={runner.errorMessage}
          onKill={runner.kill}
        />
        <div
          ref={hostRef}
          className="min-h-0 flex-1 px-3 pb-2 pt-1"
          style={{
            backgroundColor:
              theme === "dark" ? DARK_THEME.background : LIGHT_THEME.background,
          }}
        />
      </div>
    </section>
  );
}

function TerminalHeader({
  status,
  summary,
  errorMessage,
  onKill,
}: {
  status: RunStatus;
  summary: RunSummary | null;
  errorMessage: string | null;
  onKill: () => void;
}) {
  const isLive = status === "connecting" || status === "running";
  return (
    <header className="flex h-9 shrink-0 items-center justify-between px-3 pt-1">
      <div className="flex items-center gap-2.5">
        <TerminalIcon className="text-fg-muted size-3.5" aria-hidden />
        <span className="text-fg text-xs font-semibold">Terminal</span>
        <StatusBadge status={status} summary={summary} errorMessage={errorMessage} />
      </div>
      <div className="flex items-center gap-2">
        {summary && (
          <span className="text-fg-subtle flex items-center gap-1 font-mono text-[11px]">
            <Clock className="size-3" aria-hidden />
            {formatDuration(summary.durationMs)}
          </span>
        )}
        {isLive && (
          <button
            type="button"
            onClick={onKill}
            className="text-fg-muted hover:text-[var(--color-danger)] inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]"
            title="Stop (SIGTERM)"
          >
            <Square className="size-3 fill-current" />
            Stop
          </button>
        )}
      </div>
    </header>
  );
}

function StatusBadge({
  status,
  summary,
  errorMessage,
}: {
  status: RunStatus;
  summary: RunSummary | null;
  errorMessage: string | null;
}) {
  if (status === "connecting") {
    return (
      <Pill tone="quack">
        <span className="size-1.5 animate-pulse rounded-full bg-current" />
        Connecting
      </Pill>
    );
  }
  if (status === "running") {
    return (
      <Pill tone="quack">
        <span className="size-1.5 animate-pulse rounded-full bg-current" />
        Running
      </Pill>
    );
  }
  if (status === "error") {
    return (
      <Pill tone="danger" title={errorMessage ?? undefined}>
        <XCircle className="size-2.5" />
        Error
      </Pill>
    );
  }
  if (status === "exited" && summary) {
    const ok = summary.exitCode === 0;
    return (
      <Pill tone={ok ? "success" : "danger"}>
        {ok ? <Check className="size-2.5" /> : <XCircle className="size-2.5" />}
        {ok ? "Success" : `Exit ${summary.exitCode ?? "?"}`}
      </Pill>
    );
  }
  return null;
}

function Pill({
  children,
  tone,
  title,
}: {
  children: React.ReactNode;
  tone: "quack" | "success" | "danger";
  title?: string;
}) {
  const cls =
    tone === "quack"
      ? "bg-[var(--color-quack)]/15 text-[var(--color-quack)]"
      : tone === "success"
      ? "bg-[var(--color-success)]/12 text-[var(--color-success)]"
      : "bg-[var(--color-danger)]/12 text-[var(--color-danger)]";
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
        cls,
      )}
    >
      {children}
    </span>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
