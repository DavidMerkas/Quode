"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { EditorPanel } from "@/components/editor/EditorPanel";
import { TabStrip } from "@/components/editor/TabStrip";
import { ZoomControl } from "@/components/editor/ZoomControl";
import { OutputDrawer, type RunResult } from "@/components/editor/OutputDrawer";
import { DuckPanel } from "@/components/duck/DuckPanel";
import {
  DEFAULT_LANGUAGE,
  getLanguage,
  type LanguageId,
} from "@/types/language";
import { extFor, newTab, type EditorTab } from "@/types/tab";
import type { DuckMode } from "@/types/duck";

export function Workspace() {
  const [tabs, setTabs] = useState<EditorTab[]>(() => [newTab(DEFAULT_LANGUAGE, [])]);
  const [activeId, setActiveId] = useState<string>(() => tabs[0].id);
  const [mode, setMode] = useState<DuckMode>("explain");

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<RunResult | null>(null);
  const [outputOpen, setOutputOpen] = useState(false);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeId) ?? tabs[0],
    [tabs, activeId],
  );

  const handleNewTab = useCallback(
    (lang: LanguageId) => {
      const t = newTab(lang, tabs);
      setTabs((cur) => [...cur, t]);
      setActiveId(t.id);
      setOutput(null);
      setOutputOpen(false);
    },
    [tabs],
  );

  const handleCloseTab = useCallback(
    (id: string) => {
      setTabs((cur) => {
        if (cur.length <= 1) return cur;
        const idx = cur.findIndex((t) => t.id === id);
        const next = cur.filter((t) => t.id !== id);
        if (id === activeId) {
          const fallback = next[Math.max(0, idx - 1)];
          setActiveId(fallback.id);
        }
        return next;
      });
    },
    [activeId],
  );

  const handleLanguageChange = useCallback(
    (next: LanguageId) => {
      setTabs((cur) =>
        cur.map((t) => {
          if (t.id !== activeId) return t;
          if (t.language === next) return t;
          const lang = getLanguage(next);
          const dot = t.name.lastIndexOf(".");
          const base = dot > 0 ? t.name.slice(0, dot) : t.name;
          const taken = new Set(
            cur.filter((x) => x.id !== t.id).map((x) => x.name),
          );
          let candidate = `${base}.${extFor(next)}`;
          if (taken.has(candidate)) {
            for (let i = 2; i < 1000; i++) {
              const c = `${base}(${i}).${extFor(next)}`;
              if (!taken.has(c)) {
                candidate = c;
                break;
              }
            }
          }
          return {
            ...t,
            language: next,
            name: candidate,
            code: lang.starter,
          };
        }),
      );
      setOutput(null);
      setOutputOpen(false);
    },
    [activeId],
  );

  const handleRenameTab = useCallback((id: string, name: string) => {
    setTabs((cur) =>
      cur.map((t) => (t.id === id ? { ...t, name } : t)),
    );
  }, []);

  const handleActivate = useCallback((id: string) => {
    setActiveId(id);
    setOutput(null);
    setOutputOpen(false);
  }, []);

  const handleCodeChange = useCallback(
    (code: string) => {
      setTabs((cur) =>
        cur.map((t) => (t.id === activeId ? { ...t, code } : t)),
      );
    },
    [activeId],
  );

  const handleStdinChange = useCallback(
    (stdin: string) => {
      setTabs((cur) =>
        cur.map((t) => (t.id === activeId ? { ...t, stdin } : t)),
      );
    },
    [activeId],
  );

  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setOutputOpen(true);
    setOutput(null);

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: activeTab.language,
          code: activeTab.code,
          stdin: activeTab.stdin,
        }),
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
        setOutput({ stdout: "", stderr: msg, exitCode: -1, durationMs: 0 });
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
  }, [activeTab, isRunning]);

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
          code: activeTab.code,
          language: activeTab.language,
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
    [activeTab],
  );

  return (
    <div className="bg-base text-fg flex h-screen min-h-0 flex-col">
      <Header
        onRun={handleRun}
        isRunning={isRunning}
        language={activeTab.language}
        onLanguageChange={handleLanguageChange}
        onToggleInput={() => setOutputOpen((v) => !v)}
        hasInput={activeTab.stdin.length > 0}
      />

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <TabStrip
            tabs={tabs}
            activeId={activeTab.id}
            onActivate={handleActivate}
            onClose={handleCloseTab}
            onNew={handleNewTab}
            onRename={handleRenameTab}
            rightSlot={<ZoomControl />}
          />
          <EditorPanel
            tab={activeTab}
            onChange={handleCodeChange}
            onRun={handleRun}
          />
          <OutputDrawer
            open={outputOpen}
            result={output}
            isRunning={isRunning}
            stdin={activeTab.stdin}
            onStdinChange={handleStdinChange}
            onClose={() => setOutputOpen(false)}
          />
        </main>

        <div className="hidden w-[400px] shrink-0 md:flex lg:w-[440px]">
          <DuckPanel
            mode={mode}
            onModeChange={setMode}
            onSend={handleDuckSend}
            activeFileName={activeTab.name}
          />
        </div>
      </div>
    </div>
  );
}
