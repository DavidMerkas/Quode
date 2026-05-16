"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileCode2, Plus, X } from "lucide-react";
import { LANGUAGES, type LanguageId } from "@/types/language";
import type { EditorTab } from "@/types/tab";
import { cn } from "@/lib/utils/cn";

interface TabStripProps {
  tabs: readonly EditorTab[];
  activeId: string;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onNew: (language: LanguageId) => void;
  rightSlot?: React.ReactNode;
}

export function TabStrip({
  tabs,
  activeId,
  onActivate,
  onClose,
  onNew,
  rightSlot,
}: TabStripProps) {
  return (
    <div className="border-border bg-surface/30 flex h-10 shrink-0 items-center border-b pl-1 pr-2">
      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            tab={tab}
            active={tab.id === activeId}
            canClose={tabs.length > 1}
            onActivate={() => onActivate(tab.id)}
            onClose={() => onClose(tab.id)}
          />
        ))}
        <NewTabButton onPick={onNew} />
      </div>
      {rightSlot && (
        <div className="ml-2 flex shrink-0 items-center">{rightSlot}</div>
      )}
    </div>
  );
}

function Tab({
  tab,
  active,
  canClose,
  onActivate,
  onClose,
}: {
  tab: EditorTab;
  active: boolean;
  canClose: boolean;
  onActivate: () => void;
  onClose: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onActivate}
      onMouseDown={(e) => {
        // middle-click closes
        if (e.button === 1 && canClose) {
          e.preventDefault();
          onClose();
        }
      }}
      role="tab"
      aria-selected={active}
      className={cn(
        "group relative flex h-full shrink-0 items-center gap-1.5 rounded-t-md px-3 text-xs transition-colors",
        active
          ? "text-fg"
          : "text-fg-muted hover:text-fg hover:bg-surface-2/50",
      )}
    >
      <FileCode2
        className={cn(
          "size-3.5",
          active ? "text-fg-muted" : "text-fg-subtle",
        )}
        aria-hidden
      />
      <span className="font-mono">{tab.name}</span>
      {canClose ? (
        <span
          role="button"
          tabIndex={-1}
          aria-label={`Close ${tab.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={cn(
            "text-fg-subtle hover:bg-surface-3 hover:text-fg ml-0.5 inline-flex size-4 cursor-pointer items-center justify-center rounded transition-colors",
            !active && "opacity-0 group-hover:opacity-100",
          )}
        >
          <X className="size-3" />
        </span>
      ) : (
        <span className="ml-0.5 inline-block size-4" aria-hidden />
      )}
      {active && (
        <motion.span
          layoutId="tab-active-underline"
          className="absolute inset-x-2 bottom-0 h-px bg-[var(--color-duck)]"
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        />
      )}
    </button>
  );
}

function NewTabButton({ onPick }: { onPick: (lang: LanguageId) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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
    <div ref={wrapRef} className="relative ml-0.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="New tab"
        title="New tab"
        className="text-fg-muted hover:text-fg hover:bg-surface-2/50 flex size-7 items-center justify-center rounded transition-colors"
      >
        <Plus className="size-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="border-border bg-surface absolute top-full left-0 z-30 mt-1 min-w-[10rem] overflow-hidden rounded-lg border p-1 shadow-lg"
          >
            <div className="text-fg-subtle px-2 py-1 text-[10px] font-medium tracking-wider uppercase">
              New tab
            </div>
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                role="menuitem"
                type="button"
                onClick={() => {
                  onPick(l.id);
                  setOpen(false);
                }}
                className="text-fg-muted hover:bg-surface-2 hover:text-fg flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors"
              >
                <span>{l.label}</span>
                <span className="text-fg-subtle font-mono text-[10px]">
                  .{extOf(l.id)}
                </span>
              </button>
            ))}
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
