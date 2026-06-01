"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Settings } from "lucide-react";
import {
  KEYBOARD_PACKS,
  useKeyboardSound,
  type KeyboardPackId,
} from "@/lib/keyboard-sound";
import { useDuckEyeTracking } from "@/lib/duck-prefs";
import { cn } from "@/lib/utils/cn";

export function SettingsButton() {
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

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("quode:open-settings", onOpen);
    return () => window.removeEventListener("quode:open-settings", onOpen);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 600, damping: 30 }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Settings"
        className={cn(
          "neu-raised-sm neu-press text-fg-muted hover:text-fg relative inline-flex size-9 items-center justify-center rounded-xl transition-all duration-150",
          open && "text-fg",
        )}
      >
        <Settings className="size-4" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.6 }}
            style={{ transformOrigin: "top right" }}
            className="neu-raised absolute top-full right-0 z-30 mt-2 w-72 overflow-visible rounded-2xl p-3"
          >
            <div className="text-fg-subtle mb-2 px-1 text-[10px] font-medium tracking-wider uppercase">
              Settings
            </div>
            <KeyboardSoundRow />
            <EyeTrackingRow />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EyeTrackingRow() {
  const { eyeTracking, toggleEyeTracking } = useDuckEyeTracking();
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-1 py-1.5">
      <div className="flex min-w-0 flex-col">
        <span className="text-fg text-[12.5px] font-medium">
          Duck follows cursor
        </span>
        <span className="text-fg-subtle text-[11px] leading-tight">
          Eyes track your mouse as you work
        </span>
      </div>
      <Switch
        on={eyeTracking}
        onClick={toggleEyeTracking}
        label="Duck follows cursor"
      />
    </div>
  );
}

function KeyboardSoundRow() {
  const { pack, setPack } = useKeyboardSound();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = KEYBOARD_PACKS.find((p) => p.id === pack) ?? KEYBOARD_PACKS[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="flex flex-col gap-1.5 rounded-xl px-1 py-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-fg text-[12.5px] font-medium">
            Keyboard sound
          </span>
          <span className="text-fg-subtle text-[11px] leading-tight">
            Click sound on each keystroke
          </span>
        </div>
        <div ref={wrapRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            className={cn(
              "bg-surface/60 hover:bg-surface border-border/60 hover:border-[var(--color-quack)]/40",
              "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2 text-[11.5px] font-medium",
              "text-fg-muted hover:text-fg transition-all duration-150",
            )}
          >
            <span className="max-w-[8rem] truncate">{current.name}</span>
            <ChevronDown
              className={cn(
                "size-3 opacity-60 transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{
                  type: "spring",
                  stiffness: 520,
                  damping: 32,
                  mass: 0.6,
                }}
                style={{ transformOrigin: "top right" }}
                className="neu-raised absolute top-full right-0 z-40 mt-2 w-52 overflow-hidden rounded-xl p-1"
              >
                {KEYBOARD_PACKS.map((p) => {
                  const active = p.id === pack;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPack(p.id as KeyboardPackId);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors",
                        active
                          ? "text-fg bg-surface-2/70"
                          : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                      )}
                    >
                      <span>{p.name}</span>
                      {active && <Check className="text-fg-muted size-3" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Switch({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "neu-raised-sm relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors",
        on ? "bg-[var(--color-quack)]/85" : "bg-surface-2",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 32 }}
        className={cn(
          "block size-[18px] rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
          on ? "ml-auto mr-[3px] bg-white" : "ml-[3px] bg-white/85",
        )}
      />
    </button>
  );
}
