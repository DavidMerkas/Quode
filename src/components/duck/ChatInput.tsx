"use client";

import { useRef, type KeyboardEvent } from "react";
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

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSubmit();
    }
  };

  return (
    <div
      className={cn(
        "border-border bg-surface-2 focus-within:border-border-strong rounded-lg border",
        "flex items-end gap-2 p-2 transition-colors",
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
          "text-fg placeholder:text-fg-subtle min-h-[1.5rem] flex-1 resize-none bg-transparent",
          "text-sm leading-6 outline-none",
        )}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        aria-label="Send"
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-md",
          "bg-[var(--color-duck)] text-[#1a1300] hover:brightness-110",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "transition-all",
        )}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M2 8l12-5-4 13-2.5-5L2 8z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.2"
          />
        </svg>
      </button>
    </div>
  );
}
