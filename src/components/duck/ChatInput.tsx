"use client";

import { useRef, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "Ask the duck…",
}: ChatInputProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = !disabled && value.trim().length > 0;

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) onSubmit();
    }
  };

  return (
    <div
      className={cn(
        "neu-inset rounded-2xl transition-shadow",
        "flex items-end gap-2 p-2.5",
      )}
    >
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = Math.min(el.scrollHeight, 160) + "px";
        }}
        onKeyDown={handleKey}
        rows={1}
        disabled={disabled}
        placeholder={placeholder}
        style={{ outline: "none", boxShadow: "none" }}
        className={cn(
          "text-fg placeholder:text-fg-subtle min-h-[1.75rem] flex-1 resize-none bg-transparent px-2 pt-0.5",
          "text-sm leading-6 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50",
        )}
      />
      <motion.button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        aria-label="Send to Duck"
        whileTap={canSubmit ? { scale: 0.9 } : undefined}
        transition={{ type: "spring", stiffness: 600, damping: 28 }}
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-xl transition-all duration-150",
          canSubmit
            ? "bg-[var(--color-quack)] text-[#1a0d00] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_2px_6px_-3px_rgba(255,140,66,0.32)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_5px_-3px_rgba(0,0,0,0.45)] hover:brightness-[1.05] active:brightness-95"
            : "neu-raised-sm text-fg-subtle",
          "disabled:cursor-not-allowed",
        )}
      >
        <ArrowUp className="size-4" />
      </motion.button>
    </div>
  );
}
