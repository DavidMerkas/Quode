"use client";

import { DUCK_MODES, type DuckMode } from "@/types/duck";
import { cn } from "@/lib/utils/cn";

interface ModePillsProps {
  value: DuckMode;
  onChange: (mode: DuckMode) => void;
}

export function ModePills({ value, onChange }: ModePillsProps) {
  return (
    <div
      role="tablist"
      aria-label="Duck mode"
      className="border-border bg-surface-2/60 inline-flex items-center gap-0.5 rounded-lg border p-0.5"
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
            className={cn(
              "h-7 rounded-md px-3 text-xs font-medium transition-all",
              active
                ? "bg-[var(--color-duck)] text-[#1a1300] shadow-sm"
                : "text-fg-muted hover:bg-surface-3 hover:text-fg",
            )}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
