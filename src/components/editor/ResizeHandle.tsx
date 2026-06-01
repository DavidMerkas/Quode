"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface ResizeHandleProps {
  /** Current height of the bottom panel in pixels. */
  height: number;
  /** Called with the new clamped height during drag. */
  onChange: (next: number) => void;
  /** Minimum allowed height in px. */
  min?: number;
  /** Maximum allowed height. Defaults to 70% of viewport. */
  max?: number;
}

export function ResizeHandle({
  height,
  onChange,
  min = 80,
  max,
}: ResizeHandleProps) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<{ y: number; h: number } | null>(null);

  const clamp = useCallback(
    (h: number) => {
      const maxH = max ?? Math.round(window.innerHeight * 0.7);
      return Math.max(min, Math.min(maxH, Math.round(h)));
    },
    [min, max],
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      if (!startRef.current) return;
      const dy = startRef.current.y - e.clientY; // up = bigger
      onChange(clamp(startRef.current.h + dy));
    };
    const onUp = () => {
      setDragging(false);
      startRef.current = null;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragging, clamp, onChange]);

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize terminal"
      onMouseDown={(e) => {
        startRef.current = { y: e.clientY, h: height };
        setDragging(true);
      }}
      onDoubleClick={() => onChange(clamp(240))}
      title="Drag to resize · double-click to reset"
      className={cn(
        "group relative h-1.5 shrink-0 cursor-ns-resize",
        "before:pointer-events-none before:absolute before:left-1/2 before:top-1/2 before:h-1 before:w-10 before:-translate-x-1/2 before:-translate-y-1/2",
        "before:rounded-full before:bg-[var(--color-border)]/0 before:transition-colors",
        "hover:before:bg-[var(--color-border-strong)]/60 group-hover:before:bg-[var(--color-border-strong)]/60",
        dragging && "before:bg-[var(--color-quack)]/70",
      )}
    />
  );
}
