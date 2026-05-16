"use client";

import { useEffect, useRef, useState } from "react";
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
  /**
   * Streams a Duck reply for the given user message. `onDelta` is called for
   * each chunk of new text as it arrives.
   */
  onSend: (
    text: string,
    mode: DuckMode,
    onDelta: (delta: string) => void,
  ) => Promise<void>;
}

export function DuckPanel({ mode, onModeChange, onSend }: DuckPanelProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streamingId]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || streamingId) return;

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
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
      await onSend(text, mode, (delta) => {
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

  const empty = messages.length === 0;
  const activeMode = DUCK_MODES.find((m) => m.id === mode);

  return (
    <aside
      aria-label="Duck"
      className="border-border bg-base flex h-full min-h-0 w-full flex-col border-l"
    >
      <div className="border-border/60 flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <DuckMascot size={24} speaking={!!streamingId} />
          <span className="text-fg text-sm font-semibold">Duck</span>
        </div>
        <ModePills value={mode} onChange={onModeChange} />
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
      >
        {empty ? (
          <EmptyState modeBlurb={activeMode?.blurb ?? ""} />
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

function EmptyState({ modeBlurb }: { modeBlurb: string }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-4 text-center">
      <DuckMascot size={72} />
      <p className="text-fg mt-4 text-sm font-medium">Hey. I&apos;m Duck.</p>
      <p className="text-fg-muted mt-1 max-w-xs text-sm leading-relaxed">
        {modeBlurb} Pick a mode above and ask me anything about your code.
      </p>
    </div>
  );
}
