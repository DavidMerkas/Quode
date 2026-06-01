"use client";

import { useCallback, useSyncExternalStore } from "react";

const TRACK_KEY = "quode-duck-eye-tracking";
const DEFAULT_TRACKING = true;

let tracking: boolean = DEFAULT_TRACKING;
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    const v = window.localStorage.getItem(TRACK_KEY);
    if (v === "0") return false;
    if (v === "1") return true;
  } catch {
    /* ignore */
  }
  return DEFAULT_TRACKING;
}

function write(v: boolean) {
  try {
    window.localStorage.setItem(TRACK_KEY, v ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function set(v: boolean) {
  if (v === tracking) return;
  tracking = v;
  write(v);
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  tracking = read();
}

export function useDuckEyeTracking() {
  const value = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => tracking,
    () => DEFAULT_TRACKING,
  );
  const toggle = useCallback(() => set(!tracking), []);
  const setVal = useCallback((v: boolean) => set(v), []);
  return { eyeTracking: value, toggleEyeTracking: toggle, setEyeTracking: setVal };
}
