"use client";

import { Minus, Plus } from "lucide-react";
import {
  DEFAULT_SIZE,
  MAX_SIZE,
  MIN_SIZE,
  useEditorFontSize,
} from "@/lib/editor-font-size";
import { cn } from "@/lib/utils/cn";

export function ZoomControl() {
  const { size, inc, dec, reset } = useEditorFontSize();
  const atMin = size <= MIN_SIZE;
  const atMax = size >= MAX_SIZE;
  const pct = Math.round((size / DEFAULT_SIZE) * 100);
  const isDefault = size === DEFAULT_SIZE;

  return (
    <div
      role="group"
      aria-label="Editor zoom"
      className="neu-raised-sm inline-flex h-7 items-center overflow-hidden rounded-xl text-xs"
    >
      <button
        type="button"
        onClick={dec}
        disabled={atMin}
        aria-label="Zoom out"
        title="Zoom out"
        className={cn(
          "flex h-full w-7 items-center justify-center transition-colors",
          atMin
            ? "text-fg-subtle cursor-not-allowed"
            : "text-fg-muted hover:text-fg hover:bg-surface-2",
        )}
      >
        <Minus className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={reset}
        onWheel={(e) => {
          if (e.deltaY < 0) inc();
          else if (e.deltaY > 0) dec();
        }}
        title={
          isDefault
            ? "Scroll or use ± to zoom"
            : "Click to reset to 100% · scroll to change"
        }
        aria-label={`Editor zoom ${pct} percent. Click to reset, scroll to change.`}
        className={cn(
          "flex h-full min-w-[3.25rem] items-center justify-center px-1.5 font-mono text-[11px] tabular-nums transition-colors",
          isDefault
            ? "text-fg-muted hover:text-fg hover:bg-surface-2"
            : "text-fg hover:bg-surface-2",
        )}
      >
        {pct}%
      </button>
      <button
        type="button"
        onClick={inc}
        disabled={atMax}
        aria-label="Zoom in"
        title="Zoom in"
        className={cn(
          "flex h-full w-7 items-center justify-center transition-colors",
          atMax
            ? "text-fg-subtle cursor-not-allowed"
            : "text-fg-muted hover:text-fg hover:bg-surface-2",
        )}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
