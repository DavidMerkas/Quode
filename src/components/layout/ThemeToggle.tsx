"use client";

import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 600, damping: 30 }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      className="bg-surface/80 border-border hover:border-border-strong hover:bg-surface text-fg-muted hover:text-fg relative inline-flex size-8 items-center justify-center overflow-hidden rounded-md border transition-colors"
    >
      <AnimatePresence mode="wait" initial={false}>
        {dark ? (
          <motion.span
            key="moon"
            initial={{ opacity: 0, y: 8, rotate: -30 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -8, rotate: 30 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="size-4" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ opacity: 0, y: 8, rotate: -30 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -8, rotate: 30 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="size-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
