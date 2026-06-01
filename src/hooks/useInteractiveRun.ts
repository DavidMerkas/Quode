"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LanguageId } from "@/types/language";

const WS_URL =
  process.env.NEXT_PUBLIC_RUNNER_WS_URL ?? "ws://localhost:2001/ws/run";

export type RunStatus = "idle" | "connecting" | "running" | "exited" | "error";

export interface RunSummary {
  exitCode: number | null;
  signal: string | null;
  durationMs: number;
}

interface StartArgs {
  language: LanguageId;
  code: string;
  cols: number;
  rows: number;
}

export interface UseInteractiveRun {
  status: RunStatus;
  summary: RunSummary | null;
  errorMessage: string | null;
  /** Begin a new run. Tears down any previous session first. */
  start: (args: StartArgs) => void;
  /** Send text to stdin. Already-included newlines are forwarded as-is. */
  stdin: (data: string) => void;
  /** Send SIGINT (Ctrl+C) to the running process. */
  interrupt: () => void;
  /** Hard stop and close the socket. */
  kill: () => void;
  /** Tell server about a terminal resize. */
  resize: (cols: number, rows: number) => void;
  /** Subscribe to raw PTY output. The latest subscriber wins. */
  setOnData: (cb: ((data: string) => void) | null) => void;
  /** Subscribe to clear-screen events (called once per new run). */
  setOnClear: (cb: (() => void) | null) => void;
}

export function useInteractiveRun(): UseInteractiveRun {
  const wsRef = useRef<WebSocket | null>(null);
  const onDataRef = useRef<((d: string) => void) | null>(null);
  const onClearRef = useRef<(() => void) | null>(null);
  const startQueuedRef = useRef<StartArgs | null>(null);

  const [status, setStatus] = useState<RunStatus>("idle");
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const closeSocket = useCallback(() => {
    const ws = wsRef.current;
    if (!ws) return;
    wsRef.current = null;
    try {
      ws.close();
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => () => closeSocket(), [closeSocket]);

  const sendFrame = useCallback((frame: unknown) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(frame));
  }, []);

  const start = useCallback(
    (args: StartArgs) => {
      // Tear down any prior session.
      closeSocket();
      setSummary(null);
      setErrorMessage(null);
      setStatus("connecting");
      onClearRef.current?.();

      let ws: WebSocket;
      try {
        ws = new WebSocket(WS_URL);
      } catch (err) {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "WebSocket failed");
        return;
      }
      wsRef.current = ws;
      startQueuedRef.current = args;

      ws.onopen = () => {
        const queued = startQueuedRef.current;
        if (!queued) return;
        startQueuedRef.current = null;
        sendFrame({ type: "start", ...queued });
      };

      ws.onmessage = (ev) => {
        let frame: { type: string; [k: string]: unknown };
        try {
          frame = JSON.parse(typeof ev.data === "string" ? ev.data : "");
        } catch {
          return;
        }
        switch (frame.type) {
          case "ready":
            return;
          case "started":
            setStatus("running");
            return;
          case "stdout":
            if (typeof frame.data === "string") onDataRef.current?.(frame.data);
            return;
          case "exit":
            setStatus("exited");
            setSummary({
              exitCode: (frame.code as number | null) ?? null,
              signal: (frame.signal as string | null) ?? null,
              durationMs: Number(frame.durationMs) || 0,
            });
            return;
          case "error":
            setStatus("error");
            setErrorMessage(
              typeof frame.message === "string"
                ? frame.message
                : "Runner error",
            );
            return;
        }
      };

      ws.onerror = () => {
        // The browser doesn't expose detail; rely on onclose for status.
      };

      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null;
        setStatus((prev) => {
          if (prev === "running" || prev === "connecting") return "error";
          return prev;
        });
        setErrorMessage((prev) => {
          if (prev) return prev;
          // Only show a network error if we never received an `exit`.
          return null;
        });
      };
    },
    [closeSocket, sendFrame],
  );

  const stdin = useCallback(
    (data: string) => sendFrame({ type: "stdin", data }),
    [sendFrame],
  );
  const interrupt = useCallback(
    () => sendFrame({ type: "signal", name: "SIGINT" }),
    [sendFrame],
  );
  const resize = useCallback(
    (cols: number, rows: number) => sendFrame({ type: "resize", cols, rows }),
    [sendFrame],
  );
  const kill = useCallback(() => {
    sendFrame({ type: "signal", name: "SIGTERM" });
    closeSocket();
    setStatus((p) => (p === "running" || p === "connecting" ? "idle" : p));
  }, [closeSocket, sendFrame]);

  const setOnData = useCallback((cb: ((d: string) => void) | null) => {
    onDataRef.current = cb;
  }, []);
  const setOnClear = useCallback((cb: (() => void) | null) => {
    onClearRef.current = cb;
  }, []);

  return {
    status,
    summary,
    errorMessage,
    start,
    stdin,
    interrupt,
    kill,
    resize,
    setOnData,
    setOnClear,
  };
}
