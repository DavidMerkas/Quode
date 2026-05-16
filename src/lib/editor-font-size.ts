"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "quode-editor-font";
export const MIN_SIZE = 11;
export const MAX_SIZE = 24;
export const DEFAULT_SIZE = 14;

let current: number = DEFAULT_SIZE;
const listeners = new Set<() => void>();

function clamp(n: number): number {
  return Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(n)));
}

function read(): number {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v) {
      const n = parseInt(v, 10);
      if (Number.isFinite(n)) return clamp(n);
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_SIZE;
}

function set(n: number) {
  const next = clamp(n);
  if (next === current) return;
  current = next;
  try {
    window.localStorage.setItem(KEY, String(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  current = read();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function snap(): number {
  return current;
}

function serverSnap(): number {
  return DEFAULT_SIZE;
}

export function useEditorFontSize() {
  const size = useSyncExternalStore(subscribe, snap, serverSnap);
  const inc = useCallback(() => set(current + 1), []);
  const dec = useCallback(() => set(current - 1), []);
  const reset = useCallback(() => set(DEFAULT_SIZE), []);
  return { size, inc, dec, reset, setSize: set };
}
