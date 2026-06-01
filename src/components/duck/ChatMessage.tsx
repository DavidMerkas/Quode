"use client";

import { motion } from "motion/react";
import type { ChatMessage as ChatMsg } from "@/types/duck";
import type { LanguageId } from "@/types/language";
import { DuckMarkdown } from "@/lib/duck/markdown";
import { DuckMascot } from "@/components/duck/DuckMascot";
import { useDuckInspecting } from "@/lib/duck-prefs";

interface ChatMessageProps {
  message: ChatMsg;
  isStreaming?: boolean;
  /** First Duck message in the thread — drives the empty-state → message
   *  shared layout animation via layoutId. */
  isFirstDuck?: boolean;
  /** The user's active tab code — passed through so snippet code blocks
   *  can diff against it. */
  currentCode?: string;
  currentLanguage?: LanguageId;
}

export function ChatMessage({
  message,
  isStreaming,
  isFirstDuck,
  currentCode,
  currentLanguage,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const { inspecting } = useDuckInspecting();

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 32 }}
        className="flex justify-end"
      >
        <div className="neu-raised-sm text-fg max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex min-w-0 gap-3"
    >
      <motion.div
        layoutId={isFirstDuck ? "duck-hero" : undefined}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="mt-0.5 shrink-0"
        style={{ width: 36, height: 36 }}
        aria-hidden
      >
        {isStreaming && inspecting ? (
          <motion.div
            animate={{ opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="size-full rounded-full border-[1.5px] border-dashed border-[var(--color-fg-subtle)]/60"
          />
        ) : (
          <DuckMascot fill state={isStreaming ? "speaking" : "idle"} />
        )}
      </motion.div>
      <div className={isStreaming ? "min-w-0 flex-1 opacity-95" : "min-w-0 flex-1"}>
        {message.content ? (
          <DuckMarkdown
            currentCode={currentCode}
            currentLanguage={currentLanguage}
          >
            {message.content}
          </DuckMarkdown>
        ) : (
          <span className="text-fg-subtle text-sm italic">thinking…</span>
        )}
        {isStreaming && message.content && (
          <span className="streaming-caret" aria-hidden>
            &nbsp;
          </span>
        )}
      </div>
    </motion.div>
  );
}
