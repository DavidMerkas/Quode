"use client";

import { useCallback, useSyncExternalStore } from "react";

function makeBoolPref(storageKey: string, defaultValue: boolean) {
  let value = defaultValue;
  const listeners = new Set<() => void>();

  const read = (): boolean => {
    try {
      const v = window.localStorage.getItem(storageKey);
      if (v === "0") return false;
      if (v === "1") return true;
    } catch {
      /* ignore */
    }
    return defaultValue;
  };

  const write = (v: boolean) => {
    try {
      window.localStorage.setItem(storageKey, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const set = (v: boolean) => {
    if (v === value) return;
    value = v;
    write(v);
    listeners.forEach((l) => l());
  };

  if (typeof window !== "undefined") {
    value = read();
  }

  return {
    use() {
      return useSyncExternalStore(
        (cb) => {
          listeners.add(cb);
          return () => listeners.delete(cb);
        },
        () => value,
        () => defaultValue,
      );
    },
    set,
  };
}

const eyePref = makeBoolPref("quode-duck-eye-tracking", true);
const inspectPref = makeBoolPref("quode-duck-inspecting", true);

export function useDuckEyeTracking() {
  const value = eyePref.use();
  const toggle = useCallback(() => eyePref.set(!value), [value]);
  const setVal = useCallback((v: boolean) => eyePref.set(v), []);
  return { eyeTracking: value, toggleEyeTracking: toggle, setEyeTracking: setVal };
}

export function useDuckInspecting() {
  const value = inspectPref.use();
  const toggle = useCallback(() => inspectPref.set(!value), [value]);
  const setVal = useCallback((v: boolean) => inspectPref.set(v), []);
  return {
    inspecting: value,
    toggleInspecting: toggle,
    setInspecting: setVal,
  };
}
