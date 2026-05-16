"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const KEY = "quode-theme";

// Module-level store shared across all useTheme() callers so a single toggle
// re-renders every consumer (Header, EditorPanel, DuckMarkdown, ...).
let current: Theme = "light";
const listeners = new Set<() => void>();

function readStored(): Theme | null {
  try {
    const s = window.localStorage.getItem(KEY);
    if (s === "light" || s === "dark") return s;
  } catch {
    /* ignore */
  }
  return null;
}

function applyToDom(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark");
}

function setTheme(t: Theme) {
  if (t === current) return;
  current = t;
  applyToDom(t);
  try {
    window.localStorage.setItem(KEY, t);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): Theme {
  return current;
}

function getServerSnapshot(): Theme {
  return "light";
}

// Initialize on the client at module load — runs before any hook is called.
if (typeof window !== "undefined") {
  const stored = readStored();
  current = stored
    ? stored
    : window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  applyToDom(current);

  // Follow OS pref if the user hasn't picked.
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (readStored()) return;
      setTheme(e.matches ? "dark" : "light");
    });
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = useCallback(() => {
    setTheme(current === "light" ? "dark" : "light");
  }, []);
  return { theme, setTheme, toggle };
}
