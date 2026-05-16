"use client";

import { motion, type Transition } from "motion/react";
import { cn } from "@/lib/utils/cn";

export type DuckState = "idle" | "thinking" | "speaking" | "error";

interface DuckMascotProps {
  size?: number;
  /** Overall mood/state. Defaults to "idle". */
  state?: DuckState;
  /** Back-compat: equivalent to state="speaking". */
  speaking?: boolean;
  className?: string;
}

const spring: Transition = { type: "spring", stiffness: 220, damping: 18 };

export function DuckMascot({
  size = 48,
  state,
  speaking,
  className,
}: DuckMascotProps) {
  const resolved: DuckState = state ?? (speaking ? "speaking" : "idle");

  // Body bob — different rhythm per state
  const bodyAnim =
    resolved === "speaking"
      ? { y: [0, -2, 0, -1, 0] }
      : resolved === "thinking"
        ? { y: [0, -1.5, 0] }
        : resolved === "error"
          ? { y: 0 }
          : { y: [0, -2, 0] };

  const bodyTransition: Transition =
    resolved === "speaking"
      ? { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
      : resolved === "thinking"
        ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
        : resolved === "error"
          ? { duration: 0 }
          : { duration: 4, repeat: Infinity, ease: "easeInOut" };

  // Head tilt — thinking looks up, error droops
  const headRotate =
    resolved === "thinking" ? -6 : resolved === "error" ? 4 : 0;

  // Eye position — pupil shifts up for thinking
  const pupilY = resolved === "thinking" ? -1.2 : 0;
  const pupilX = resolved === "thinking" ? -0.6 : 0;

  // Beak — small open/close on speaking
  const beakAnim =
    resolved === "speaking" ? { scaleY: [1, 0.8, 1, 0.85, 1] } : { scaleY: 1 };
  const beakTransition: Transition =
    resolved === "speaking"
      ? { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
      : { duration: 0.2 };

  // Overall hue dim on error
  const dim = resolved === "error" ? 0.55 : 1;

  return (
    <span
      role="img"
      aria-label="Duck"
      className={cn(
        "inline-flex shrink-0 items-end justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <motion.svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        animate={{ opacity: dim }}
        transition={{ duration: 0.25 }}
      >
        {/* soft shadow */}
        <ellipse cx="32" cy="58" rx="18" ry="2.5" fill="#000" opacity="0.32" />

        {/* whole body group with bob */}
        <motion.g animate={bodyAnim} transition={bodyTransition}>
          {/* body */}
          <path
            d="M14 38c0-10 8-18 18-18s18 8 18 18c0 7-4 12-10 14-2 .8-5 1-8 1s-6-.2-8-1c-6-2-10-7-10-14z"
            fill="#FFD43B"
          />
          {/* belly highlight */}
          <path
            d="M22 42c0-5 4.5-9 10-9s10 4 10 9c0 4-3 7-7 8-1 .3-2 .4-3 .4s-2-.1-3-.4c-4-1-7-4-7-8z"
            fill="#FFE580"
            opacity="0.7"
          />

          {/* wing — gentle flap on speaking */}
          <motion.g
            style={{ transformOrigin: "23px 36px" }}
            animate={
              resolved === "speaking"
                ? { rotate: [-2, 6, -2] }
                : { rotate: 0 }
            }
            transition={
              resolved === "speaking"
                ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
                : spring
            }
          >
            <path
              d="M20 36c0-4 3-7 7-7 1 0 2 .2 3 .6-1 2-1.5 4-1.5 6 0 2 .5 4 1.5 6-1 .4-2 .6-3 .6-4 0-7-3-7-6.2z"
              fill="#F5C400"
            />
          </motion.g>

          {/* head group — slight tilt by state */}
          <motion.g
            style={{ transformOrigin: "32px 24px" }}
            animate={{ rotate: headRotate }}
            transition={spring}
          >
            {/* head */}
            <circle cx="32" cy="22" r="14" fill="#FFD43B" />
            {/* head highlight */}
            <circle cx="27" cy="18" r="5" fill="#FFE580" opacity="0.65" />

            {/* tuft */}
            <path d="M30 8c1-3 3-4 5-3-1 2-1 4 0 6-2 1-4 0-5-3z" fill="#FFB300" />

            {/* beak */}
            <motion.g
              style={{ transformOrigin: "41px 26px" }}
              animate={beakAnim}
              transition={beakTransition}
            >
              <path
                d="M40 22c4 0 7 2 7 4s-3 4-7 4c-2 0-4-.5-5-1.5C36 27.5 36 24.5 35 23c1-.6 3-1 5-1z"
                fill="#FF8C42"
              />
              <path
                d="M40 26c2.5 0 5 .3 6.5.8-1.5.7-3.8 1.2-6.5 1.2-2 0-4-.4-5-1 1-.7 3-1 5-1z"
                fill="#E96A1F"
                opacity="0.55"
              />
            </motion.g>

            {/* eye */}
            <motion.g
              animate={{
                x: pupilX,
                y: pupilY,
                // blink: scaleY pulses periodically when idle
                scaleY:
                  resolved === "error"
                    ? 0.1
                    : resolved === "idle"
                      ? [1, 1, 1, 0.05, 1]
                      : 1,
              }}
              transition={
                resolved === "idle"
                  ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.3 }
              }
              style={{ transformOrigin: "30px 20px" }}
            >
              <circle cx="30" cy="20" r="2.6" fill="#1a1300" />
              <circle cx="30.8" cy="19.2" r="0.9" fill="#fff" />
            </motion.g>
          </motion.g>
        </motion.g>

        {/* Thinking bubble — three dots above head */}
        {resolved === "thinking" && (
          <motion.g
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.circle
                key={i}
                cx={48 + i * 4}
                cy={10}
                r={1.4}
                fill="#a1a1aa"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.g>
        )}
      </motion.svg>
    </span>
  );
}
