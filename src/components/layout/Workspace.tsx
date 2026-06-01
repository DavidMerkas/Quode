"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Header } from "@/components/layout/Header";
import { EditorPanel } from "@/components/editor/EditorPanel";
import { TabStrip } from "@/components/editor/TabStrip";
import { ZoomControl } from "@/components/editor/ZoomControl";
import { OutputDrawer, type RunResult } from "@/components/editor/OutputDrawer";
import { ResizeHandle } from "@/components/editor/ResizeHandle";
import { DuckPanel } from "@/components/duck/DuckPanel";
import { SelectionToolbar } from "@/components/ui/SelectionToolbar";
import { CommandPalette, type Command } from "@/components/ui/CommandPalette";
import { LanguageLogo } from "@/components/editor/LanguageLogo";
import { useTheme } from "@/lib/theme";
import {
  Copy,
  MessageSquare,
  Moon,
  Play,
  Settings as SettingsIcon,
  Share2,
  Sun,
  Trash2,
  Wand2,
} from "lucide-react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  getLanguage,
  type LanguageId,
} from "@/types/language";
import { extFor, newTab, type EditorTab } from "@/types/tab";

export function Workspace() {
  const [tabs, setTabs] = useState<EditorTab[]>(() => [newTab(DEFAULT_LANGUAGE, [])]);
  const [activeId, setActiveId] = useState<string>(() => tabs[0].id);

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<RunResult | null>(null);
  const [pendingLang, setPendingLang] = useState<LanguageId | null>(null);
  const [terminalHeight, setTerminalHeight] = useState<number>(240);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("quode-terminal-height");
      if (raw) {
        const n = parseInt(raw, 10);
        if (Number.isFinite(n)) setTerminalHeight(n);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Hydrate tabs from localStorage on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("quode-workspace");
      if (raw) {
        const parsed = JSON.parse(raw) as {
          tabs?: EditorTab[];
          activeId?: string;
        };
        if (Array.isArray(parsed.tabs) && parsed.tabs.length > 0) {
          setTabs(parsed.tabs);
          if (
            parsed.activeId &&
            parsed.tabs.some((t) => t.id === parsed.activeId)
          ) {
            setActiveId(parsed.activeId);
          } else {
            setActiveId(parsed.tabs[0].id);
          }
        }
      }
    } catch {
      /* ignore */
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist tabs + activeId — only after hydration so we don't clobber
  // saved data with the default render's empty state.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        "quode-workspace",
        JSON.stringify({ tabs, activeId }),
      );
    } catch {
      /* ignore */
    }
  }, [hydrated, tabs, activeId]);

  const updateTerminalHeight = useCallback((next: number) => {
    setTerminalHeight(next);
    try {
      window.localStorage.setItem("quode-terminal-height", String(next));
    } catch {
      /* ignore */
    }
  }, []);

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

  const applyLanguageChange = useCallback(
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
              const c = `${base}${i}.${extFor(next)}`;
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
    },
    [activeId],
  );

  const handleLanguageChange = useCallback(
    (next: LanguageId) => {
      const tab = tabs.find((t) => t.id === activeId);
      if (!tab || tab.language === next) return;
      const starter = getLanguage(tab.language).starter;
      const isDirty = tab.code !== starter && tab.code.trim().length > 0;
      if (isDirty) {
        setPendingLang(next);
        return;
      }
      applyLanguageChange(next);
    },
    [activeId, tabs, applyLanguageChange],
  );

  const handleReorderTabs = useCallback((fromId: string, toId: string) => {
    setTabs((cur) => {
      const from = cur.findIndex((t) => t.id === fromId);
      const to = cur.findIndex((t) => t.id === toId);
      if (from < 0 || to < 0 || from === to) return cur;
      const next = cur.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const handleRenameTab = useCallback((id: string, name: string) => {
    setTabs((cur) =>
      cur.map((t) => (t.id === id ? { ...t, name } : t)),
    );
  }, []);

  const handleActivate = useCallback((id: string) => {
    setActiveId(id);
    setOutput(null);
  }, []);

  const handleCodeChange = useCallback(
    (code: string) => {
      setTabs((cur) =>
        cur.map((t) => (t.id === activeId ? { ...t, code } : t)),
      );
    },
    [activeId],
  );

  const handleRun = useCallback(async (codeOverride?: string) => {
    if (isRunning) return;
    const code =
      typeof codeOverride === "string" ? codeOverride : activeTab.code;
    setIsRunning(true);
    setOutput(null);

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: activeTab.language,
          code,
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

  // Run-selection from the editor toolbar
  useEffect(() => {
    const onRunSel = (e: Event) => {
      const detail = (e as CustomEvent<{ text: string }>).detail;
      if (!detail?.text) return;
      handleRun(detail.text);
    };
    window.addEventListener("quode:run-selection", onRunSel);
    return () => window.removeEventListener("quode:run-selection", onRunSel);
  }, [handleRun]);

  // Theme + small toast for share / copy success
  const { theme, toggle: toggleTheme } = useTheme();
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  const shareCurrentTab = useCallback(async () => {
    try {
      const payload = JSON.stringify({
        n: activeTab.name,
        l: activeTab.language,
        c: activeTab.code,
      });
      const b64 = btoa(unescape(encodeURIComponent(payload)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      const url = `${window.location.origin}${window.location.pathname}#s=${b64}`;
      await navigator.clipboard.writeText(url);
      showToast("Share link copied");
    } catch {
      showToast("Could not copy share link");
    }
  }, [activeTab, showToast]);

  const copyCurrentCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeTab.code);
      showToast("Code copied");
    } catch {
      showToast("Could not copy");
    }
  }, [activeTab.code, showToast]);

  // Header Share button → run shareCurrentTab.
  useEffect(() => {
    const onShare = () => {
      void shareCurrentTab();
    };
    window.addEventListener("quode:share", onShare);
    return () => window.removeEventListener("quode:share", onShare);
  }, [shareCurrentTab]);

  // Open shared snippet from URL hash on load.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.startsWith("#s=")) return;
    try {
      const b64 = hash.slice(3).replace(/-/g, "+").replace(/_/g, "/");
      const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
      const json = decodeURIComponent(escape(atob(b64 + pad)));
      const parsed = JSON.parse(json) as {
        n?: string;
        l?: LanguageId;
        c?: string;
      };
      if (parsed.l && parsed.c) {
        const lang = getLanguage(parsed.l);
        setTabs((cur) => {
          const t: EditorTab = {
            id: crypto.randomUUID(),
            name: parsed.n || `shared.${extFor(lang.id)}`,
            language: lang.id,
            code: parsed.c!,
            stdin: "",
          };
          setActiveId(t.id);
          return [...cur, t];
        });
        showToast("Shared snippet opened");
      }
    } catch {
      /* ignore */
    } finally {
      history.replaceState(null, "", window.location.pathname);
    }
  }, [showToast]);

  const handleDuckSend = useCallback(
    async (text: string, onDelta: (delta: string) => void) => {
      const res = await fetch("/api/duck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
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

  const focusDuck = useCallback(() => {
    const ta = document.querySelector<HTMLTextAreaElement>(
      'aside[aria-label="Duck"] textarea',
    );
    ta?.focus();
  }, []);

  const commands: Command[] = useMemo(() => {
    const cmds: Command[] = [
      {
        id: "run",
        label: "Run code",
        group: "Editor",
        shortcut: "Ctrl+↵",
        icon: <Play className="size-3.5 fill-current" />,
        run: () => handleRun(),
      },
      {
        id: "format",
        label: "Format file",
        group: "Editor",
        shortcut: "Shift+Alt+F",
        icon: <Wand2 className="size-3.5" />,
        run: () => window.dispatchEvent(new CustomEvent("quode:format")),
      },
      {
        id: "copy-code",
        label: "Copy current code",
        group: "Editor",
        icon: <Copy className="size-3.5" />,
        run: copyCurrentCode,
      },
      {
        id: "share",
        label: "Share current tab as link",
        group: "Editor",
        keywords: "link url copy share",
        icon: <Share2 className="size-3.5" />,
        run: shareCurrentTab,
      },
      {
        id: "close-tab",
        label: "Close current tab",
        group: "Editor",
        shortcut: "Ctrl+W",
        icon: <Trash2 className="size-3.5" />,
        run: () => handleCloseTab(activeTab.id),
      },
      {
        id: "focus-duck",
        label: "Focus Duck chat",
        group: "Duck",
        keywords: "chat ask mentor",
        icon: <MessageSquare className="size-3.5" />,
        run: focusDuck,
      },
      {
        id: "send-to-duck",
        label: "Send current code to Duck",
        group: "Duck",
        keywords: "ask review explain",
        icon: <MessageSquare className="size-3.5" />,
        run: () =>
          window.dispatchEvent(
            new CustomEvent("quode:ask-duck", {
              detail: {
                text: activeTab.code,
                language: activeTab.language,
              },
            }),
          ),
      },
      {
        id: "toggle-theme",
        label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        group: "App",
        keywords: "dark light mode color",
        icon:
          theme === "dark" ? (
            <Sun className="size-3.5" />
          ) : (
            <Moon className="size-3.5" />
          ),
        run: toggleTheme,
      },
      {
        id: "open-settings",
        label: "Open settings",
        group: "App",
        keywords: "preferences config",
        icon: <SettingsIcon className="size-3.5" />,
        run: () => window.dispatchEvent(new CustomEvent("quode:open-settings")),
      },
    ];

    for (const l of LANGUAGES) {
      cmds.push({
        id: `new-${l.id}`,
        label: `New tab: ${l.label}`,
        group: "New tab",
        keywords: `new tab file ${l.id}`,
        icon: <LanguageLogo lang={l.id} size={14} />,
        run: () => handleNewTab(l.id),
      });
      cmds.push({
        id: `switch-${l.id}`,
        label: `Switch language: ${l.label}`,
        group: "Switch language",
        keywords: `change language ${l.id}`,
        icon: <LanguageLogo lang={l.id} size={14} />,
        run: () => handleLanguageChange(l.id),
      });
    }
    return cmds;
  }, [
    activeTab.code,
    activeTab.id,
    activeTab.language,
    copyCurrentCode,
    focusDuck,
    handleCloseTab,
    handleLanguageChange,
    handleNewTab,
    handleRun,
    shareCurrentTab,
    theme,
    toggleTheme,
  ]);

  return (
    <div className="bg-base text-fg flex h-screen min-h-0 flex-col">
      <Header
        onRun={handleRun}
        isRunning={isRunning}
        language={activeTab.language}
        onLanguageChange={handleLanguageChange}
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
            onReorder={handleReorderTabs}
            rightSlot={<ZoomControl />}
          />
          <EditorPanel
            tab={activeTab}
            onChange={handleCodeChange}
            onRun={handleRun}
          />
          <ResizeHandle
            height={terminalHeight}
            onChange={updateTerminalHeight}
          />
          <OutputDrawer
            open
            result={output}
            isRunning={isRunning}
            height={terminalHeight}
          />
        </main>

        <div className="hidden w-[400px] shrink-0 md:flex lg:w-[440px]">
          <DuckPanel
            onSend={handleDuckSend}
            activeFileName={activeTab.name}
            activeCode={activeTab.code}
            activeLanguage={activeTab.language}
          />
        </div>
      </div>
      <SelectionToolbar />
      <CommandPalette commands={commands} />
      <Toast message={toast} />
      <LanguageSwitchDialog
        pendingLang={pendingLang}
        currentCode={activeTab.code}
        onCancel={() => setPendingLang(null)}
        onConfirm={() => {
          if (pendingLang) applyLanguageChange(pendingLang);
          setPendingLang(null);
        }}
      />
    </div>
  );
}

function LanguageSwitchDialog({
  pendingLang,
  currentCode,
  onCancel,
  onConfirm,
}: {
  pendingLang: LanguageId | null;
  currentCode: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pendingLang) setCopied(false);
  }, [pendingLang]);

  useEffect(() => {
    if (!pendingLang) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      else if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pendingLang, onCancel, onConfirm]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence>
      {pendingLang && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-base/40 fixed inset-0 z-40 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="lang-switch-title"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.6 }}
            className="neu-raised fixed left-1/2 top-1/2 z-50 w-[min(28rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-5"
          >
            <h2
              id="lang-switch-title"
              className="text-fg text-[15px] font-semibold"
            >
              Switch language?
            </h2>
            <p className="text-fg-muted mt-2 text-[13px] leading-relaxed">
              Your code will be replaced with the new language&apos;s starter
              template. Copy it first if you want to keep it.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={copyCode}
                className="neu-raised-sm neu-press text-fg-muted hover:text-fg rounded-xl px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150"
              >
                {copied ? "Copied ✓" : "Copy code"}
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={onCancel}
                className="neu-raised-sm neu-press text-fg-muted hover:text-fg rounded-xl px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-xl bg-[var(--color-quack)] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#1a0d00] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_2px_6px_-3px_rgba(255,140,66,0.32)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_5px_-3px_rgba(0,0,0,0.45)] transition hover:brightness-[1.05] active:brightness-95"
              >
                Switch
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 520, damping: 32 }}
          className="neu-raised text-fg fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2 text-[12.5px] font-medium"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
