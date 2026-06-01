"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { LANGUAGES, type LanguageId } from "@/types/language";
import { LanguageLogo } from "@/components/editor/LanguageLogo";
import type { EditorTab } from "@/types/tab";
import { cn } from "@/lib/utils/cn";

interface TabStripProps {
  tabs: readonly EditorTab[];
  activeId: string;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onNew: (language: LanguageId) => void;
  onRename: (id: string, name: string) => void;
  onReorder: (fromId: string, toId: string) => void;
  rightSlot?: React.ReactNode;
}

export function TabStrip({
  tabs,
  activeId,
  onActivate,
  onClose,
  onNew,
  onRename,
  onReorder,
  rightSlot,
}: TabStripProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  return (
    <div className="relative flex h-11 shrink-0 items-center bg-transparent pl-1.5 pr-2">
      <div className="flex min-w-0 items-center gap-0.5">
        <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              tab={tab}
              active={tab.id === activeId}
              canClose={tabs.length > 1}
              dragOver={dragOverId === tab.id}
              onActivate={() => onActivate(tab.id)}
              onClose={() => onClose(tab.id)}
              onRename={(name) => onRename(tab.id, name)}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/x-quode-tab", tab.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes("text/x-quode-tab")) {
                  e.preventDefault();
                  if (dragOverId !== tab.id) setDragOverId(tab.id);
                }
              }}
              onDragLeave={() => {
                if (dragOverId === tab.id) setDragOverId(null);
              }}
              onDrop={(e) => {
                const fromId = e.dataTransfer.getData("text/x-quode-tab");
                setDragOverId(null);
                if (fromId && fromId !== tab.id) onReorder(fromId, tab.id);
              }}
              onDragEnd={() => setDragOverId(null)}
              existingNames={tabs
                .filter((t) => t.id !== tab.id)
                .map((t) => t.name)}
            />
          ))}
        </div>
        <NewTabButton onPick={onNew} />
      </div>
      <div className="flex-1" />
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
  dragOver,
  onActivate,
  onClose,
  onRename,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  existingNames,
}: {
  tab: EditorTab;
  active: boolean;
  canClose: boolean;
  dragOver: boolean;
  onActivate: () => void;
  onClose: () => void;
  onRename: (name: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  existingNames: readonly string[];
}) {
  const dotIdx = tab.name.lastIndexOf(".");
  const base = dotIdx > 0 ? tab.name.slice(0, dotIdx) : tab.name;
  const ext = dotIdx > 0 ? tab.name.slice(dotIdx) : "";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(base);
  const [shake, setShake] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const collision = !!draft.trim() && existingNames.includes(`${draft.trim().replace(/[\\/]+/g, "")}${ext}`);

  useEffect(() => {
    if (!editing) return;
    setDraft(base);
    const id = requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
    return () => cancelAnimationFrame(id);
  }, [editing, base]);

  const tryCommit = (silentOnCollision: boolean) => {
    const trimmed = draft.trim().replace(/[\\/]+/g, "");
    const next = `${trimmed}${ext}`;
    if (!trimmed || next === tab.name) {
      setError(null);
      setEditing(false);
      return;
    }
    if (existingNames.includes(next)) {
      if (silentOnCollision) {
        setError(null);
        setEditing(false);
        return;
      }
      setError(`"${next}" already exists.`);
      setShake((n) => n + 1);
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(0, draft.length);
      return;
    }
    setError(null);
    onRename(next);
    setEditing(false);
  };

  useEffect(() => {
    if (collision && editing) setError(`"${draft.trim()}${ext}" already exists.`);
    else if (!collision && error) setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, editing]);

  return (
    <div
      role="tab"
      aria-selected={active}
      draggable={!editing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={() => {
        if (!editing) onActivate();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!active) onActivate();
        setEditing(true);
      }}
      onMouseDown={(e) => {
        // middle-click closes
        if (e.button === 1 && canClose && !editing) {
          e.preventDefault();
          onClose();
        }
      }}
      className={cn(
        "group relative flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 text-[13px] transition-colors",
        active
          ? "text-fg bg-surface-2/70"
          : "text-fg-muted hover:text-fg hover:bg-surface-2/40",
        dragOver && "ring-2 ring-[var(--color-quack)]/60 ring-inset",
      )}
    >
      {editing ? (
        <motion.span
          key={shake}
          animate={
            shake > 0
              ? { x: [0, -4, 4, -3, 3, 0] }
              : undefined
          }
          transition={{ duration: 0.32, ease: "easeInOut" }}
          className={cn("font-mono", collision && "text-[var(--color-danger)]")}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[\\/.]+/g, ""))}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onBlur={() => tryCommit(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                tryCommit(false);
              } else if (e.key === "Escape") {
                e.preventDefault();
                setError(null);
                setEditing(false);
              }
              e.stopPropagation();
            }}
            spellCheck={false}
            style={{ width: `${Math.max(draft.length, 1)}ch`, outline: "none", boxShadow: "none" }}
            className={cn(
              "m-0 appearance-none border-0 bg-transparent p-0 font-mono outline-none ring-0 focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none",
              collision ? "text-[var(--color-danger)]" : "text-fg",
            )}
          />
          {ext && (
            <span className={collision ? "text-[var(--color-danger)]" : undefined}>
              {ext}
            </span>
          )}
          {error && (
            <span
              role="status"
              className="neu-raised-sm pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-medium text-[var(--color-danger)]"
            >
              {error}
            </span>
          )}
        </motion.span>
      ) : (
        <span className="font-mono">{tab.name}</span>
      )}
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
            "text-fg-subtle hover:bg-surface-3/70 hover:text-fg ml-0.5 inline-flex size-5 cursor-pointer items-center justify-center rounded-md transition-colors",
            !active && "opacity-0 group-hover:opacity-100",
          )}
        >
          <X className="size-3.5" />
        </span>
      ) : (
        <span className="ml-0.5 inline-block size-5" aria-hidden />
      )}
    </div>
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
        className="text-fg-muted hover:text-fg hover:bg-surface-2/50 flex size-8 items-center justify-center rounded-lg transition-colors"
      >
        <Plus className="size-4" />
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
            style={{ transformOrigin: "top left" }}
            className="neu-raised absolute top-full left-0 z-30 mt-2 min-w-[11rem] overflow-hidden rounded-2xl p-1.5"
          >
            <div className="text-fg-subtle px-2 py-1 text-[10px] font-medium tracking-wider uppercase">
              New tab
            </div>
            {LANGUAGES.map((l, i) => (
              <motion.button
                key={l.id}
                role="menuitem"
                type="button"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.02 * i, duration: 0.14 }}
                onClick={() => {
                  onPick(l.id);
                  setOpen(false);
                }}
                className="text-fg-muted hover:bg-surface-2 hover:text-fg flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors"
              >
                <span className="flex items-center gap-2">
                  <LanguageLogo lang={l.id} size={14} />
                  <span>{l.label}</span>
                </span>
                <span className="text-fg-subtle font-mono text-[10px]">
                  .{extOf(l.id)}
                </span>
              </motion.button>
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
