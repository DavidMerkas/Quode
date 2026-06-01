"use client";

import { useEffect, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { motion } from "motion/react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SettingsButton } from "@/components/layout/SettingsButton";
import { ShareButton } from "@/components/layout/ShareButton";
import { LanguagePicker } from "@/components/editor/LanguagePicker";
import type { LanguageId } from "@/types/language";
import { cn } from "@/lib/utils/cn";

interface HeaderProps {
  onRun: () => void;
  isRunning: boolean;
  language: LanguageId;
  onLanguageChange: (next: LanguageId) => void;
}

export function Header({
  onRun,
  isRunning,
  language,
  onLanguageChange,
}: HeaderProps) {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    const plat =
      (navigator as Navigator & { userAgentData?: { platform?: string } })
        .userAgentData?.platform ?? "";
    setIsMac(/Mac|iPhone|iPad/i.test(plat) || /Mac|iPhone|iPad/i.test(ua));
  }, []);

  return (
    <header
      className={cn(
        "bg-base/85 supports-[backdrop-filter]:bg-base/60 sticky top-0 z-20 grid h-14 shrink-0 grid-cols-3 items-center gap-4 px-4 backdrop-blur-md",
        "shadow-[0_8px_18px_-16px_rgba(60,40,0,0.22)]",
      )}
    >
      {/* Left: brand */}
      <div className="flex items-center">
        <span className="text-fg text-[15px] font-semibold tracking-tight">
          Quode
        </span>
      </div>

      {/* Center: language · run */}
      <div className="flex items-center justify-center gap-2">
        <LanguagePicker value={language} onChange={onLanguageChange} />
        <motion.button
          type="button"
          onClick={() => onRun()}
          disabled={isRunning}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
          className={cn(
            "group relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-xl pl-3 pr-2 text-[13px] font-semibold",
            "bg-[var(--color-quack)] text-[#1a0d00]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(120,40,0,0.12),2px_3px_8px_-3px_rgba(255,140,66,0.32),-2px_-2px_6px_rgba(255,220,180,0.22)]",
            "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.25),2px_3px_6px_-3px_rgba(0,0,0,0.45)]",
            "hover:brightness-[1.04] active:brightness-95 active:shadow-[inset_0_2px_3px_rgba(120,40,0,0.22)]",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "transition-[filter,box-shadow] duration-150",
          )}
          aria-label={isRunning ? "Running code" : "Run code"}
        >
          {isRunning ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Running</span>
            </>
          ) : (
            <>
              <Play className="size-3 fill-current" />
              <span>Run</span>
              <kbd className="ml-0.5 hidden rounded bg-black/15 px-1.5 py-px font-sans text-[10px] font-semibold tracking-tight sm:inline">
                {isMac ? "⌘ ↵" : "Ctrl ↵"}
              </kbd>
            </>
          )}
        </motion.button>
      </div>

      {/* Right: share + theme + settings */}
      <div className="flex items-center justify-end gap-2">
        <ShareButton />
        <ThemeToggle />
        <SettingsButton />
      </div>
    </header>
  );
}
