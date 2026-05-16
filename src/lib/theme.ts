"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const KEY = "quode-theme";

function readInitial(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readInitial);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem(KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  // React to OS-level changes if the user hasn't explicitly chosen.
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      try {
        if (window.localStorage.getItem(KEY)) return;
      } catch {
        /* ignore */
      }
      setThemeState(e.matches ? "dark" : "light");
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(
    () => setThemeState((t) => (t === "light" ? "dark" : "light")),
    [],
  );

  return { theme, setTheme: setThemeState, toggle };
}
