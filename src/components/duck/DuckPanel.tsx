"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { DuckMascot } from "@/components/duck/DuckMascot";
import { ModePills } from "@/components/duck/ModePills";
import { ChatMessage } from "@/components/duck/ChatMessage";
import { ChatInput } from "@/components/duck/ChatInput";
import {
  DUCK_MODES,
  type ChatMessage as ChatMsg,
  type DuckMode,
} from "@/types/duck";

interface DuckPanelProps {
  mode: DuckMode;
  onModeChange: (m: DuckMode) => void;
  onSend: (
    text: string,
    mode: DuckMode,
    onDelta: (delta: string) => void,
  ) => Promise<void>;
}

const SUGGESTIONS: Record<DuckMode, string[]> = {
  explain: [
    "Walk me through this code, line by line.",
    "What does this function do, in plain English?",
    "Why does this work the way it does?",
  ],
  hint: [
    "I'm stuck — give me a nudge without spoiling it.",
    "What's the next small step I should try?",
    "Am I thinking about this the right way?",
  ],
  debug: [
    "There's a bug here. Help me find it.",
    "Why am I getting an error on the last line?",
    "What edge case am I missing?",
  ],
  review: [
    "Critique this code — style, structure, trade-offs.",
    "Is there a cleaner way to write this?",
    "What would you change before shipping this?",
  ],
};

export function DuckPanel({ mode, onModeChange, onSend }: DuckPanelProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamingId]);

  const submit = async (text: string) => {
    if (!text.trim() || streamingId) return;
    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      createdAt: Date.now(),
    };
    const placeholder: ChatMsg = {
      id: crypto.randomUUID(),
      role: "duck",
      content: "",
      mode,
      createdAt: Date.now(),
    };
    setMessages((m) => [...m, userMsg, placeholder]);
    setDraft("");
    setStreamingId(placeholder.id);

    try {
      await onSend(text.trim(), mode, (delta) => {
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
  const activeMode = DUCK_MODES.find((m) => m.id === mode);

  return (
    <aside
      aria-label="Duck"
      className="border-border bg-base flex h-full min-h-0 w-full flex-col border-l"
    >
      <div className="border-border/60 flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2.5">
          <DuckMascot
            size={26}
            state={streamingId ? "speaking" : "idle"}
          />
          <div className="flex flex-col leading-tight">
            <span className="text-fg text-sm font-semibold">Duck</span>
            <span className="text-fg-subtle text-[10px]">
              {streamingId ? "thinking out loud…" : "ready"}
            </span>
          </div>
        </div>
        <ModePills value={mode} onChange={onModeChange} />
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
      >
        {empty ? (
          <EmptyState
            mode={mode}
            blurb={activeMode?.blurb ?? ""}
            onPick={(s) => submit(s)}
            disabled={!!streamingId}
          />
        ) : (
          messages.map((m) => (
            <ChatMessage
              key={m.id}
              message={m}
              isStreaming={streamingId === m.id}
            />
          ))
        )}
      </div>

      <div className="border-border/60 border-t p-3">
        <ChatInput
          value={draft}
          onChange={setDraft}
          onSubmit={handleSend}
          disabled={!!streamingId}
          placeholder={`Ask Duck in ${activeMode?.label ?? ""} mode…`}
        />
        <p className="text-fg-subtle mt-2 px-1 text-[11px]">
          Duck teaches — it won&apos;t just hand you the answer.
        </p>
      </div>
    </aside>
  );
}

function EmptyState({
  mode,
  blurb,
  onPick,
  disabled,
}: {
  mode: DuckMode;
  blurb: string;
  onPick: (text: string) => void;
  disabled: boolean;
}) {
  const suggestions = SUGGESTIONS[mode] ?? [];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex h-full min-h-[260px] flex-col items-center justify-center px-3 text-center"
    >
      <DuckMascot size={84} />
      <p className="text-fg mt-4 text-base font-medium">Hey. I&apos;m Duck.</p>
      <p className="text-fg-muted mt-1.5 max-w-xs text-sm leading-relaxed">
        {blurb}
      </p>

      <div className="mt-5 flex w-full flex-col items-stretch gap-1.5">
        <p className="text-fg-subtle flex items-center justify-center gap-1.5 text-[10px] font-medium tracking-wider uppercase">
          <Sparkles className="size-3" aria-hidden />
          try asking
        </p>
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            disabled={disabled}
            className="border-border/70 bg-surface-2/40 hover:bg-surface-2 hover:border-border-strong text-fg-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-50 rounded-lg border px-3 py-2 text-left text-[12.5px] leading-snug transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
