"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { EditorPanel } from "@/components/editor/EditorPanel";
import { OutputDrawer, type RunResult } from "@/components/editor/OutputDrawer";
import { DuckPanel } from "@/components/duck/DuckPanel";
import {
  DEFAULT_LANGUAGE,
  getLanguage,
  type LanguageId,
} from "@/types/language";
import type { DuckMode } from "@/types/duck";

export function Workspace() {
  const [language, setLanguage] = useState<LanguageId>(DEFAULT_LANGUAGE);
  const [code, setCode] = useState<string>(
    getLanguage(DEFAULT_LANGUAGE).starter,
  );
  const [mode, setMode] = useState<DuckMode>("explain");

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<RunResult | null>(null);
  const [outputOpen, setOutputOpen] = useState(false);

  const handleLanguageChange = (id: LanguageId) => {
    setLanguage(id);
    setCode(getLanguage(id).starter);
    setOutput(null);
    setOutputOpen(false);
  };

  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutputOpen(true);
    setOutput(null);

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const data = (await res.json()) as
        | {
            stdout: string;
            stderr: string;
            exitCode: number;
            durationMs: number;
          }
        | { error: string; detail?: string };

      if (!res.ok || "error" in data) {
        const msg =
          "error" in data
            ? `${data.error}${data.detail ? `: ${data.detail}` : ""}`
            : "Run failed";
        setOutput({
          stdout: "",
          stderr: msg,
          exitCode: -1,
          durationMs: 0,
        });
      } else {
        setOutput(data);
      }
    } catch (err) {
      setOutput({
        stdout: "",
        stderr:
          err instanceof Error
            ? err.message
            : "Network error talking to the runner.",
        exitCode: -1,
        durationMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  }, [code, language, isRunning]);

  // Global ⌘/Ctrl+Enter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleRun]);

  const handleDuckSend = useCallback(
    async (
      text: string,
      duckMode: DuckMode,
      onDelta: (delta: string) => void,
    ) => {
      const res = await fetch("/api/duck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mode: duckMode,
          code,
          language,
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errBody.error ?? `Duck request failed (${res.status})`);
      }
      if (!res.body) throw new Error("No response body from Duck.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) onDelta(decoder.decode(value, { stream: true }));
      }
      const tail = decoder.decode();
      if (tail) onDelta(tail);
    },
    [code, language],
  );

  return (
    <div className="bg-base text-fg flex h-screen min-h-0 flex-col">
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        isRunning={isRunning}
      />

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <EditorPanel
            code={code}
            onChange={setCode}
            language={language}
            onRun={handleRun}
          />
          <OutputDrawer
            open={outputOpen}
            result={output}
            isRunning={isRunning}
            onClose={() => setOutputOpen(false)}
          />
        </main>

        <div className="hidden w-[400px] shrink-0 md:flex lg:w-[440px]">
          <DuckPanel
            mode={mode}
            onModeChange={setMode}
            onSend={handleDuckSend}
          />
        </div>
      </div>
    </div>
  );
}
