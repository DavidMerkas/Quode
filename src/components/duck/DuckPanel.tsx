"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Code2, X } from "lucide-react";
import { DuckMascot } from "@/components/duck/DuckMascot";
import { ChatMessage } from "@/components/duck/ChatMessage";
import { ChatInput } from "@/components/duck/ChatInput";
import type { ChatMessage as ChatMsg } from "@/types/duck";
import type { LanguageId } from "@/types/language";
import { cn } from "@/lib/utils/cn";

interface DuckPanelProps {
  onSend: (
    text: string,
    onDelta: (delta: string) => void,
  ) => Promise<void>;
  activeFileName: string;
  activeCode: string;
  activeLanguage: LanguageId;
}

const SUGGESTIONS = [
  "Walk me through this code.",
  "I'm stuck. Nudge me without spoiling it.",
  "There's a bug in here. Help me find it.",
  "What would you change before shipping this?",
];

export function DuckPanel({
  onSend,
  activeFileName,
  activeCode,
  activeLanguage,
}: DuckPanelProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<{
    text: string;
    language?: string;
  } | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamingId]);

  useEffect(() => {
    const onAsk = (e: Event) => {
      const detail = (e as CustomEvent<{
        text: string;
        language?: string;
      }>).detail;
      if (!detail?.text) return;
      setAttachment({ text: detail.text, language: detail.language });
      requestAnimationFrame(() => {
        const ta = document.querySelector<HTMLTextAreaElement>(
          'aside[aria-label="Duck"] textarea',
        );
        ta?.focus();
        if (ta) ta.selectionStart = ta.selectionEnd = ta.value.length;
      });
    };
    window.addEventListener("quode:ask-duck", onAsk);
    return () => window.removeEventListener("quode:ask-duck", onAsk);
  }, []);

  const submit = async (text: string) => {
    if (!text.trim() || streamingId) return;
    const att = attachment;
    const fullContent = att
      ? `${text.trim()}\n\n\`\`\`${att.language ?? ""}\n${att.text}\n\`\`\``
      : text.trim();
    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: fullContent,
      createdAt: Date.now(),
    };
    const placeholder: ChatMsg = {
      id: crypto.randomUUID(),
      role: "duck",
      content: "",
      createdAt: Date.now(),
    };
    setMessages((m) => [...m, userMsg, placeholder]);
    setDraft("");
    setAttachment(null);
    setStreamingId(placeholder.id);

    try {
      await onSend(fullContent, (delta) => {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === placeholder.id
              ? { ...msg, content: msg.content + delta }
              : msg,
          ),
        );
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setMessages((m) =>
        m.map((msg) =>
          msg.id === placeholder.id
            ? { ...msg, content: `[Duck error: ${message}]` }
            : msg,
        ),
      );
    } finally {
      setStreamingId(null);
    }
  };

  const handleSend = () => submit(draft);

  const empty = messages.length === 0;

  return (
    <aside
      aria-label="Duck"
      className="bg-base/40 flex h-full min-h-0 w-full flex-col shadow-[inset_10px_0_18px_-18px_rgba(60,40,0,0.22)]"
    >
      <div className="flex h-14 shrink-0 items-center px-4">
        <div className="flex flex-col leading-tight">
          <span className="text-fg text-sm font-semibold">Duck</span>
          <span className="text-fg-subtle text-[10px]">
            {streamingId
              ? `quacking about ${activeFileName}…`
              : `swimming over ${activeFileName}`}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
      >
        {empty ? (
          <EmptyState
            onPick={(s) => submit(s)}
            disabled={!!streamingId}
          />
        ) : (
          messages.map((m, i) => (
            <ChatMessage
              key={m.id}
              message={m}
              isStreaming={streamingId === m.id}
              isFirstDuck={
                m.role === "duck" &&
                messages.findIndex((x) => x.role === "duck") === i
              }
              currentCode={activeCode}
              currentLanguage={activeLanguage}
            />
          ))
        )}
      </div>

      <div className="p-3">
        {attachment && (
          <AttachmentCard
            text={attachment.text}
            language={attachment.language}
            onRemove={() => setAttachment(null)}
          />
        )}
        <ChatInput
          value={draft}
          onChange={setDraft}
          onSubmit={handleSend}
          disabled={!!streamingId}
          placeholder={
            attachment ? "What about this snippet?" : "Ask Duck…"
          }
        />
      </div>
    </aside>
  );
}

function EmptyState({
  onPick,
  disabled,
}: {
  onPick: (text: string) => void;
  disabled: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex h-full min-h-[260px] flex-col items-center justify-center px-3 text-center"
    >
      <motion.div
        layoutId="duck-hero"
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        style={{ width: 96, height: 96 }}
      >
        <DuckMascot fill />
      </motion.div>
      <p className="text-fg mt-5 text-base font-medium">Hey. I&apos;m Duck.</p>
      <p className="text-fg-muted mt-1.5 max-w-xs text-sm leading-relaxed">
        Ask about your code. I&apos;ll explain, nudge, debug, or critique.
      </p>

      <div className="mt-6 flex w-full flex-col items-stretch gap-2">
        <p className="text-fg-subtle text-center text-[10.5px] tracking-wide uppercase">
          Try asking
        </p>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            disabled={disabled}
            className={cn(
              "group text-fg-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-50",
              "bg-surface/60 hover:bg-surface border-border/60 hover:border-[var(--color-quack)]/40",
              "inline-flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-[12.5px] leading-snug",
              "transition-all duration-150 hover:-translate-y-px",
            )}
          >
            <span>{s}</span>
            <span
              aria-hidden
              className="text-fg-subtle group-hover:text-[var(--color-quack)] shrink-0 text-[14px] transition-colors"
            >
              ›
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function AttachmentCard({
  text,
  language,
  onRemove,
}: {
  text: string;
  language?: string;
  onRemove: () => void;
}) {
  const lines = text.split("\n");
  const preview = lines.slice(0, 6);
  const truncated = lines.length > preview.length;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.6 }}
        className="neu-raised-sm mb-2 overflow-hidden rounded-2xl"
      >
        <div className="flex items-center justify-between px-3 py-1.5">
          <div className="text-fg-subtle flex items-center gap-1.5 text-[10px] font-medium tracking-wider uppercase">
            <Code2 className="size-3" aria-hidden />
            <span>Attached snippet</span>
            {language && (
              <span className="text-fg-subtle font-mono normal-case tracking-normal">
                · {language}
              </span>
            )}
            <span className="text-fg-subtle font-mono normal-case tracking-normal">
              · {lines.length} line{lines.length === 1 ? "" : "s"}
            </span>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove attachment"
            className="text-fg-subtle hover:bg-surface-2/70 hover:text-fg flex size-5 items-center justify-center rounded-md transition-colors"
          >
            <X className="size-3" />
          </button>
        </div>
        <pre className="text-fg-muted max-h-32 overflow-auto px-3 pb-2 font-mono text-[11.5px] leading-[1.55] whitespace-pre">
          {preview.join("\n")}
          {truncated && (
            <span className="text-fg-subtle">{`\n  … +${lines.length - preview.length} more`}</span>
          )}
        </pre>
      </motion.div>
    </AnimatePresence>
  );
}
