"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("quode:share"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 600, damping: 30 }}
      aria-label="Share current tab as link"
      title="Share current tab as link"
      className={cn(
        "neu-raised-sm neu-press text-fg-muted hover:text-fg relative inline-flex size-9 items-center justify-center rounded-xl transition-all duration-150",
        copied && "text-[var(--color-success)]",
      )}
    >
      {copied ? (
        <Check className="size-4" />
      ) : (
        <Share2 className="size-4" />
      )}
    </motion.button>
  );
}
