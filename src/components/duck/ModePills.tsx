"use client";

import { motion } from "motion/react";
import { DUCK_MODES, type DuckMode } from "@/types/duck";

interface ModePillsProps {
  value: DuckMode;
  onChange: (mode: DuckMode) => void;
}

export function ModePills({ value, onChange }: ModePillsProps) {
  return (
    <div
      role="tablist"
      aria-label="Duck mode"
      className="border-border bg-surface-2/70 inline-flex items-center rounded-lg border p-0.5"
    >
      {DUCK_MODES.map((m) => {
        const active = m.id === value;
        return (
          <button
            key={m.id}
            role="tab"
            type="button"
            aria-selected={active}
            title={m.blurb}
            onClick={() => onChange(m.id)}
            className="relative h-7 rounded-md px-3 text-xs font-medium transition-colors"
          >
            {active && (
              <motion.span
                layoutId="mode-pill-active"
                className="absolute inset-0 rounded-md bg-[var(--color-duck)] shadow-[0_1px_0_rgba(255,255,255,0.25)_inset]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span
              className={
                active
                  ? "relative z-10 text-[#1a1300]"
                  : "text-fg-muted hover:text-fg relative z-10 transition-colors"
              }
            >
              {m.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
