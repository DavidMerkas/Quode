"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Keyboard sound packs (Mechvibes format).
 *
 * - "single": one audio file, defines[scancode] = [offset_ms, duration_ms]
 * - "multi" : per-key audio files, defines[scancode] = "filename.wav"
 *
 * Scancodes are uiohook codes (IBM PC AT scancode set), the same set
 * Mechvibes ships. We map browser KeyboardEvent.code → scancode below.
 */

export const KEYBOARD_PACKS = [
  { id: "off", name: "Off" },
  { id: "cherrymx-brown-pbt", name: "Cherry MX Brown (PBT)" },
  { id: "eg-crystal-purple", name: "EG Crystal Purple" },
  { id: "eg-oreo", name: "EG Oreo" },
  { id: "nk-cream", name: "NK Cream" },
  { id: "anime moan", name: "Anime Moan" },
] as const;

export type KeyboardPackId = (typeof KEYBOARD_PACKS)[number]["id"];

const KEY = "quode-keyboard-pack";
const DEFAULT_PACK: KeyboardPackId = "off";

let currentPack: KeyboardPackId = DEFAULT_PACK;
const listeners = new Set<() => void>();

let ctx: AudioContext | null = null;
let installed = false;

// Browser KeyboardEvent.code -> uiohook scancode
const CODE_TO_SCAN: Record<string, number> = {
  Escape: 1,
  Digit1: 2, Digit2: 3, Digit3: 4, Digit4: 5, Digit5: 6,
  Digit6: 7, Digit7: 8, Digit8: 9, Digit9: 10, Digit0: 11,
  Minus: 12, Equal: 13, Backspace: 14, Tab: 15,
  KeyQ: 16, KeyW: 17, KeyE: 18, KeyR: 19, KeyT: 20,
  KeyY: 21, KeyU: 22, KeyI: 23, KeyO: 24, KeyP: 25,
  BracketLeft: 26, BracketRight: 27, Enter: 28, ControlLeft: 29,
  KeyA: 30, KeyS: 31, KeyD: 32, KeyF: 33, KeyG: 34,
  KeyH: 35, KeyJ: 36, KeyK: 37, KeyL: 38,
  Semicolon: 39, Quote: 40, Backquote: 41, ShiftLeft: 42, Backslash: 43,
  KeyZ: 44, KeyX: 45, KeyC: 46, KeyV: 47, KeyB: 48,
  KeyN: 49, KeyM: 50,
  Comma: 51, Period: 52, Slash: 53, ShiftRight: 54,
  AltLeft: 56, Space: 57, CapsLock: 58,
  F1: 59, F2: 60, F3: 61, F4: 62, F5: 63,
  F6: 64, F7: 65, F8: 66, F9: 67, F10: 68,
  ArrowUp: 57416, ArrowDown: 57424, ArrowLeft: 57419, ArrowRight: 57421,
};

interface MechvibesConfig {
  name: string;
  key_define_type: "single" | "multi";
  sound?: string;
  defines: Record<string, [number, number] | string>;
}

interface SinglePack {
  type: "single";
  buffer: AudioBuffer;
  defines: Record<string, [number, number]>;
}

interface MultiPack {
  type: "multi";
  buffers: Record<string, AudioBuffer>; // by scancode string
}

type LoadedPack = SinglePack | MultiPack;

let loadedPackId: KeyboardPackId | null = null;
let loadedPack: LoadedPack | null = null;
let loading: Promise<void> | null = null;

function read(): KeyboardPackId {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v && KEYBOARD_PACKS.some((p) => p.id === v)) {
      return v as KeyboardPackId;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PACK;
}

function write(v: KeyboardPackId) {
  try {
    window.localStorage.setItem(KEY, v);
  } catch {
    /* ignore */
  }
}

function ensureCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  } catch {
    return null;
  }
  return ctx;
}

async function fetchBuffer(url: string): Promise<AudioBuffer | null> {
  const ac = ensureCtx();
  if (!ac) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return await ac.decodeAudioData(arr);
  } catch {
    return null;
  }
}

async function loadPack(id: KeyboardPackId): Promise<void> {
  if (id === "off") {
    loadedPackId = "off";
    loadedPack = null;
    return;
  }
  const base = `/sounds/keyboard/${encodeURIComponent(id)}`;
  let cfg: MechvibesConfig;
  try {
    const r = await fetch(`${base}/config.json`);
    if (!r.ok) throw new Error(`config ${r.status}`);
    cfg = (await r.json()) as MechvibesConfig;
  } catch (err) {
    console.error("[keyboard-sound] failed to load config:", err);
    return;
  }

  if (cfg.key_define_type === "single") {
    const soundFile = cfg.sound ?? "sound.ogg";
    const buf = await fetchBuffer(`${base}/${soundFile}`);
    if (!buf) return;
    const defines: Record<string, [number, number]> = {};
    for (const [k, v] of Object.entries(cfg.defines)) {
      if (Array.isArray(v)) defines[k] = v;
    }
    loadedPack = { type: "single", buffer: buf, defines };
    loadedPackId = id;
  } else {
    // Multi: load each unique filename once and reuse.
    const uniqueFiles = new Set<string>();
    for (const v of Object.values(cfg.defines)) {
      if (typeof v === "string" && v) uniqueFiles.add(v);
    }
    const fileBuffers: Record<string, AudioBuffer> = {};
    await Promise.all(
      Array.from(uniqueFiles).map(async (file) => {
        const buf = await fetchBuffer(`${base}/${encodeURIComponent(file)}`);
        if (buf) fileBuffers[file] = buf;
      }),
    );
    const buffers: Record<string, AudioBuffer> = {};
    for (const [scan, v] of Object.entries(cfg.defines)) {
      if (typeof v === "string" && fileBuffers[v]) {
        buffers[scan] = fileBuffers[v];
      }
    }
    loadedPack = { type: "multi", buffers };
    loadedPackId = id;
  }
}

function scanForEvent(e: KeyboardEvent): number | null {
  const code = e.code;
  if (code in CODE_TO_SCAN) return CODE_TO_SCAN[code];
  return null;
}

function play(scan: number) {
  const ac = ctx;
  if (!ac || !loadedPack) return;
  const now = ac.currentTime;

  if (loadedPack.type === "single") {
    const def =
      loadedPack.defines[String(scan)] ?? pickFallbackSingle(loadedPack);
    if (!def) return;
    const [startMs, durMs] = def;
    const src = ac.createBufferSource();
    src.buffer = loadedPack.buffer;
    const gain = ac.createGain();
    // Small ramp to avoid clicks at sprite boundary.
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.55, now + 0.004);
    gain.gain.setValueAtTime(0.55, now + durMs / 1000 - 0.01);
    gain.gain.linearRampToValueAtTime(0, now + durMs / 1000);
    src.connect(gain).connect(ac.destination);
    src.start(now, startMs / 1000, durMs / 1000);
    return;
  }

  // multi
  const buf = loadedPack.buffers[String(scan)] ?? pickFallbackMulti(loadedPack);
  if (!buf) return;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const gain = ac.createGain();
  gain.gain.value = 0.7;
  src.connect(gain).connect(ac.destination);
  src.start(now);
}

function pickFallbackSingle(p: SinglePack): [number, number] | null {
  const keys = Object.keys(p.defines);
  if (!keys.length) return null;
  return p.defines[keys[Math.floor(Math.random() * keys.length)]];
}
function pickFallbackMulti(p: MultiPack): AudioBuffer | null {
  const keys = Object.keys(p.buffers);
  if (!keys.length) return null;
  return p.buffers[keys[Math.floor(Math.random() * keys.length)]];
}

function shouldPlayFor(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (e.repeat) return false;
  return scanForEvent(e) !== null;
}

function onKeyDown(e: KeyboardEvent) {
  if (currentPack === "off") return;
  if (!shouldPlayFor(e)) return;
  const ac = ensureCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  if (loadedPackId !== currentPack) {
    if (!loading) {
      loading = loadPack(currentPack).finally(() => {
        loading = null;
      });
    }
    return; // skip this keystroke; pack still loading
  }
  const scan = scanForEvent(e);
  if (scan == null) return;
  play(scan);
}

function ensureInstalled() {
  if (installed || typeof window === "undefined") return;
  window.addEventListener("keydown", onKeyDown, { capture: true });
  installed = true;
}

function setPack(v: KeyboardPackId) {
  if (v === currentPack) return;
  currentPack = v;
  write(v);
  if (v !== "off" && loadedPackId !== v && !loading) {
    loading = loadPack(v).finally(() => {
      loading = null;
    });
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  currentPack = read();
  ensureInstalled();
  if (currentPack !== "off") {
    // Defer load until first user gesture; AudioContext can't start without one.
    // We'll lazy-load inside onKeyDown.
  }
}

export function useKeyboardSound() {
  const value = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => currentPack,
    () => DEFAULT_PACK,
  );
  const set = useCallback((v: KeyboardPackId) => setPack(v), []);
  return { pack: value, setPack: set };
}
