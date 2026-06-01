"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface Command {
  id: string;
  label: string;
  group?: string;
  keywords?: string;
  shortcut?: string;
  icon?: ReactNode;
  run: () => void;
}

interface CommandPaletteProps {
  commands: Command[];
}

export function CommandPalette({ commands }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onToggle = () => setOpen((o) => !o);
    window.addEventListener("keydown", onKey);
    window.addEventListener("quode:toggle-palette", onToggle);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("quode:toggle-palette", onToggle);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const results = useMemo(() => filterCommands(commands, q), [commands, q]);

  useEffect(() => {
    setIndex(0);
  }, [q]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-row="${index}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [index]);

  const runAt = (i: number) => {
    const cmd = results[i];
    if (!cmd) return;
    setOpen(false);
    // microtask so the modal closes before the action runs
    setTimeout(() => cmd.run(), 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runAt(index);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-base/40 fixed inset-0 z-40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{
              type: "spring",
              stiffness: 520,
              damping: 32,
              mass: 0.6,
            }}
            className="neu-raised fixed left-1/2 top-[18%] z-50 w-[min(34rem,92vw)] -translate-x-1/2 overflow-hidden rounded-2xl"
          >
            <div className="flex items-center gap-2 px-3 py-2">
              <Search className="text-fg-subtle size-4 shrink-0" aria-hidden />
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type a command…"
                spellCheck={false}
                style={{ outline: "none", boxShadow: "none" }}
                className="text-fg placeholder:text-fg-subtle min-w-0 flex-1 bg-transparent text-sm outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
              />
              <kbd className="text-fg-subtle bg-surface-2 hidden rounded px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                Esc
              </kbd>
            </div>

            <div
              ref={listRef}
              className="max-h-[60vh] overflow-auto px-1.5 pb-2 pt-1"
              onKeyDown={onKeyDown}
            >
              {results.length === 0 ? (
                <div className="text-fg-subtle px-3 py-8 text-center text-sm">
                  No matching commands.
                </div>
              ) : (
                renderGrouped(results, index, runAt)
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function renderGrouped(
  cmds: Command[],
  active: number,
  onRun: (i: number) => void,
) {
  const groups = new Map<string, { cmd: Command; abs: number }[]>();
  cmds.forEach((cmd, abs) => {
    const key = cmd.group ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ cmd, abs });
  });

  const out: ReactNode[] = [];
  groups.forEach((items, group) => {
    out.push(
      <div
        key={`g-${group}`}
        className="text-fg-subtle px-2.5 pb-1 pt-2 text-[10px] font-medium tracking-wider uppercase"
      >
        {group}
      </div>,
    );
    for (const { cmd, abs } of items) {
      const isActive = abs === active;
      out.push(
        <button
          key={cmd.id}
          type="button"
          data-cmd-row={abs}
          onClick={() => onRun(abs)}
          onMouseEnter={() => {
            /* keyboard nav stays; hover sets visual hint */
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-[13px] transition-colors",
            isActive
              ? "bg-surface-2/80 text-fg"
              : "text-fg-muted hover:bg-surface-2/50 hover:text-fg",
          )}
        >
          {cmd.icon && (
            <span className="text-fg-subtle flex size-4 shrink-0 items-center justify-center">
              {cmd.icon}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate">{cmd.label}</span>
          {cmd.shortcut && (
            <kbd className="text-fg-subtle bg-surface-2/80 rounded px-1.5 py-0.5 font-mono text-[10px] tracking-tight">
              {cmd.shortcut}
            </kbd>
          )}
        </button>,
      );
    }
  });
  return out;
}

function filterCommands(commands: Command[], q: string): Command[] {
  const query = q.trim().toLowerCase();
  if (!query) return commands;
  return commands
    .map((c) => ({ c, score: score(c, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);
}

function score(cmd: Command, q: string): number {
  const hay = `${cmd.label} ${cmd.keywords ?? ""} ${cmd.group ?? ""}`
    .toLowerCase();
  if (hay.includes(q)) {
    let s = 5;
    if (cmd.label.toLowerCase().startsWith(q)) s += 10;
    else if (cmd.label.toLowerCase().includes(q)) s += 5;
    return s;
  }
  // fuzzy: every char of q appears in order
  let i = 0;
  for (const ch of hay) {
    if (ch === q[i]) i++;
    if (i === q.length) return 1;
  }
  return 0;
}
