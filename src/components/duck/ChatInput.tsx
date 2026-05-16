"use client";

import { useRef, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { Send } from "lucide-react";
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
        "border-border bg-surface-2/70 rounded-xl border",
        "focus-within:border-[var(--color-duck)]/60 focus-within:bg-surface-2",
        "focus-within:shadow-[0_0_0_3px_var(--color-duck)_/0.12]",
        "flex items-end gap-2 p-2 transition-all",
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
        className={cn(
          "text-fg placeholder:text-fg-subtle min-h-[1.5rem] flex-1 resize-none bg-transparent px-1.5",
          "text-sm leading-6 outline-none disabled:opacity-50",
        )}
      />
      <motion.button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        aria-label="Send to Duck"
        whileTap={canSubmit ? { scale: 0.92 } : undefined}
        transition={{ type: "spring", stiffness: 600, damping: 28 }}
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
          canSubmit
            ? "bg-[var(--color-duck)] text-[#1a1300] shadow-[0_1px_0_rgba(255,255,255,0.25)_inset]"
            : "bg-surface-3 text-fg-subtle",
          "disabled:cursor-not-allowed",
          "transition-colors",
        )}
      >
        <Send className="size-3.5" />
      </motion.button>
    </div>
  );
}
