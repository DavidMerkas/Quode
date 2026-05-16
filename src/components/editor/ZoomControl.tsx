"use client";

import { ZoomIn, ZoomOut } from "lucide-react";
import {
  MAX_SIZE,
  MIN_SIZE,
  useEditorFontSize,
} from "@/lib/editor-font-size";
import { cn } from "@/lib/utils/cn";

export function ZoomControl() {
  const { size, inc, dec, reset } = useEditorFontSize();
  const atMin = size <= MIN_SIZE;
  const atMax = size >= MAX_SIZE;

  return (
    <div
      role="group"
      aria-label="Editor zoom"
      className="border-border bg-surface/60 inline-flex h-7 items-center overflow-hidden rounded-md border text-xs"
    >
      <button
        type="button"
        onClick={dec}
        disabled={atMin}
        aria-label="Zoom out"
        title="Zoom out (⌘−)"
        className={cn(
          "flex h-full w-7 items-center justify-center transition-colors",
          atMin
            ? "text-fg-subtle cursor-not-allowed"
            : "text-fg-muted hover:text-fg hover:bg-surface-2",
        )}
      >
        <ZoomOut className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={reset}
        onWheel={(e) => {
          if (e.deltaY < 0) inc();
          else if (e.deltaY > 0) dec();
        }}
        title="Scroll to zoom · click to reset"
        aria-label={`Editor zoom, ${size} pixels. Click to reset, scroll to change.`}
        className="text-fg-muted hover:text-fg hover:bg-surface-2 flex h-full min-w-[2.25rem] items-center justify-center px-1 font-mono text-[11px] transition-colors"
      >
        {size}
      </button>
      <button
        type="button"
        onClick={inc}
        disabled={atMax}
        aria-label="Zoom in"
        title="Zoom in (⌘+)"
        className={cn(
          "flex h-full w-7 items-center justify-center transition-colors",
          atMax
            ? "text-fg-subtle cursor-not-allowed"
            : "text-fg-muted hover:text-fg hover:bg-surface-2",
        )}
      >
        <ZoomIn className="size-3.5" />
      </button>
    </div>
  );
}
