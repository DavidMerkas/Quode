"use client";

import { motion } from "motion/react";
import { DuckMascot } from "@/components/duck/DuckMascot";
import { DUCK_MODES, type ChatMessage as ChatMsg } from "@/types/duck";
import { DuckMarkdown } from "@/lib/duck/markdown";

interface ChatMessageProps {
  message: ChatMsg;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";
  const modeLabel = message.mode
    ? DUCK_MODES.find((m) => m.id === message.mode)?.label
    : null;

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="flex justify-end"
      >
        <div className="bg-surface-2 border-border/60 text-fg max-w-[85%] rounded-2xl rounded-br-md border px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </motion.div>
    );
  }

  const empty = !message.content;
  const showThinkingState = isStreaming && empty;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex items-start gap-2.5"
    >
      <DuckMascot
        size={30}
        state={
          showThinkingState ? "thinking" : isStreaming ? "speaking" : "idle"
        }
      />
      <div className="min-w-0 flex-1 pt-0.5">
        {modeLabel && (
          <div className="text-fg-subtle mb-1 flex items-center gap-1.5 text-[10px] font-medium tracking-wide uppercase">
            <span className="bg-[var(--color-duck)] inline-block size-1 rounded-full" />
            Duck · {modeLabel}
          </div>
        )}
        <div className={isStreaming ? "opacity-95" : undefined}>
          {message.content ? (
            <DuckMarkdown>{message.content}</DuckMarkdown>
          ) : (
            <span className="text-fg-subtle text-sm italic">thinking…</span>
          )}
          {isStreaming && message.content && (
            <span className="streaming-caret" aria-hidden>
              &nbsp;
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
