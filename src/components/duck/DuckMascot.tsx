"use client";

import { useEffect, useRef, useState } from "react";
import { motion, type Transition } from "motion/react";
import { useDuckEyeTracking } from "@/lib/duck-prefs";
import { cn } from "@/lib/utils/cn";

export type DuckState = "idle" | "thinking" | "speaking" | "error";

interface DuckMascotProps {
  size?: number;
  /** Overall mood/state. Defaults to "idle". */
  state?: DuckState;
  /** Back-compat: equivalent to state="speaking". */
  speaking?: boolean;
  /** When true, ignore `size` and fill the parent container. */
  fill?: boolean;
  className?: string;
}

const spring: Transition = { type: "spring", stiffness: 220, damping: 18 };

export function DuckMascot({
  size = 48,
  state,
  speaking,
  fill,
  className,
}: DuckMascotProps) {
  const resolved: DuckState = state ?? (speaking ? "speaking" : "idle");

  // --- Cursor-tracking eyes (idle + speaking only, user-toggleable) -----
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [eyeTrack, setEyeTrack] = useState({ x: 0, y: 0 });
  const { eyeTracking } = useDuckEyeTracking();

  useEffect(() => {
    const tracks =
      eyeTracking && (resolved === "idle" || resolved === "speaking");
    if (!tracks) {
      setEyeTrack({ x: 0, y: 0 });
      return;
    }
    let raf: number | null = null;
    let pending: { x: number; y: number } | null = null;
    const apply = () => {
      raf = null;
      if (!pending || !wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const RANGE = 240; // px from duck before max offset
      const MAX = 2.2; // SVG units
      const nx = Math.max(-1, Math.min(1, (pending.x - cx) / RANGE));
      const ny = Math.max(-1, Math.min(1, (pending.y - cy) / RANGE));
      // The SVG is mirrored (scaleX(-1)) so screen-right is SVG-left.
      setEyeTrack({ x: -nx * MAX, y: ny * MAX });
    };
    const onMove = (e: MouseEvent) => {
      pending = { x: e.clientX, y: e.clientY };
      if (raf == null) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [resolved, eyeTracking]);

  // Body bob — different rhythm per state. Error slumps and stays still.
  const bodyAnim =
    resolved === "speaking"
      ? { y: [0, -2.2, 0, -1.2, 0], x: 0 }
      : resolved === "thinking"
        ? { y: [0, -1.5, 0], x: 0 }
        : resolved === "error"
          ? { y: 2.5, x: 0 }
          : { y: [0, -2, 0], x: 0 };

  const bodyTransition: Transition =
    resolved === "speaking"
      ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
      : resolved === "thinking"
        ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
        : resolved === "error"
          ? { duration: 0.7, ease: "easeOut" }
          : { duration: 4, repeat: Infinity, ease: "easeInOut" };

  // Head — speaking nods, thinking looks around, error droops heavily.
  const headAnim =
    resolved === "speaking"
      ? { rotate: [0, -2, 0, 1.5, 0] }
      : resolved === "thinking"
        ? { rotate: [-5, -8, -5] }
        : resolved === "error"
          ? { rotate: 16 }
          : { rotate: 0 };
  const headTransition: Transition =
    resolved === "speaking"
      ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
      : resolved === "thinking"
        ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
        : resolved === "error"
          ? { duration: 0.9, ease: "easeOut" }
          : spring;

  // Eye — thinking sweeps up-left, error closes with slow sad blink.
  const eyeAnim =
    resolved === "thinking"
      ? { x: [-0.4, -1.1, -0.4], y: [-0.9, -1.5, -0.9], scaleY: 1 }
      : resolved === "error"
        ? { x: 0, y: 0.6, scaleY: [0.06, 0.14, 0.06] }
        : resolved === "idle"
          ? { x: 0, y: 0, scaleY: [1, 1, 1, 0.05, 1] }
          : { x: 0, y: 0, scaleY: 1 };
  const eyeTransition: Transition =
    resolved === "thinking"
      ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
      : resolved === "error"
        ? { duration: 3.6, repeat: Infinity, ease: "easeInOut" }
        : resolved === "idle"
          ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.3 };

  // Beak — quick chatter on speaking, droops slightly open on error.
  const beakAnim =
    resolved === "speaking"
      ? { scaleY: [1, 0.7, 1, 0.8, 1] }
      : resolved === "error"
        ? { scaleY: 1.15 }
        : { scaleY: 1 };
  const beakTransition: Transition =
    resolved === "speaking"
      ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
      : { duration: 0.25 };

  // Wing — subtle flap on speaking (around the rotated −90° rest).
  const wingAnim =
    resolved === "speaking" ? { rotate: [-90, -85, -90] } : { rotate: -90 };
  const wingTransition: Transition =
    resolved === "speaking"
      ? { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
      : spring;

  // Overall hue dim on error
  const dim = resolved === "error" ? 0.55 : 1;

  return (
    <span
      ref={wrapRef}
      role="img"
      aria-label="Duck"
      className={cn(
        "inline-flex shrink-0 items-end justify-center",
        className,
      )}
      style={
        fill
          ? { width: "100%", height: "100%", transform: "scaleX(-1)" }
          : { width: size, height: size, transform: "scaleX(-1)" }
      }
    >
      <motion.svg
        viewBox="0 0 64 64"
        width={fill ? "100%" : size}
        height={fill ? "100%" : size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        animate={{ opacity: dim }}
        transition={{ duration: 0.25 }}
      >
        {/* soft shadow */}
        <ellipse cx="32" cy="58" rx="18" ry="2.5" fill="#2b1f02" opacity="0.32" />

        {/* whole body group with bob */}
        <motion.g animate={bodyAnim} transition={bodyTransition}>
          {/* body */}
          <path
            d="M14 38c0-10 8-18 18-18s18 8 18 18c0 7-4 12-10 14-2 .8-5 1-8 1s-6-.2-8-1c-6-2-10-7-10-14z"
            fill="#FFD43B"
          />
          {/* belly highlight — narrow vertical patch on the right edge */}
          <path
            d="M43 33
               c 3 0 5 3 5 8
               c 0 5 -2 9 -5 9
               c -3 0 -4 -4 -4 -9
               c 0 -5 1 -8 4 -8 z"
            fill="#FFE580"
            opacity="0.7"
          />

          {/* wing — rotated 90° counter-clockwise, shifted down-left and
              scaled up. Gentle flap on speaking. */}
          <g
            style={{
              transform: "translate(2px, 5px) scale(1.5, 1.3)",
              transformOrigin: "23px 36px",
            }}
          >
            <motion.g
              style={{ transformOrigin: "23px 36px" }}
              animate={wingAnim}
              transition={wingTransition}
            >
              <path
                d="M20 36c0-4 3-7 7-7 1 0 2 .2 3 .6-1 2-1.5 4-1.5 6 0 2 .5 4 1.5 6-1 .4-2 .6-3 .6-4 0-7-3-7-6.2z"
                fill="#F5C400"
              />
            </motion.g>
          </g>

          {/* head tracking wrapper — small tilt toward cursor, pivots at neck */}
          <motion.g
            style={{ transformOrigin: "32px 30px" }}
            animate={{
              rotate: eyeTrack.y * 1.6,
              x: eyeTrack.x * 0.35,
              y: eyeTrack.y * 0.4,
            }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
          >
          {/* head group — tilts/nods per state */}
          <motion.g
            style={{ transformOrigin: "32px 20px" }}
            animate={headAnim}
            transition={headTransition}
          >
            {/* head */}
            <circle cx="32" cy="18" r="14" fill="#FFD43B" />
            {/* head highlight — soft halo around the eye */}
            <circle cx="30" cy="16" r="5.5" fill="#FFE580" opacity="0.65" />

            {/* tuft */}
            <path d="M30 5c1-3 3-4 5-3-1 2-1 4 0 6-2 1-4 0-5-3z" fill="#FFB300" />

            {/* beak — single rounded scoop with a thin mouth line */}
            <motion.g
              style={{ transformOrigin: "42px 21px" }}
              animate={beakAnim}
              transition={beakTransition}
            >
              {/* main bill — soft scoop shape */}
              <path
                d="M36 17
                   C 41 16, 47 16.5, 50 19
                   C 51 20, 51 22, 50 23
                   C 47 24.8, 41 25.2, 37 24.3
                   C 35 23.4, 35 18, 36 17 Z"
                fill="#FF8C42"
              />
              {/* mouth line — soft curve through middle */}
              <path
                d="M 37 21 Q 43.5 21.8, 49.5 21"
                stroke="#C95818"
                strokeWidth="0.8"
                strokeLinecap="round"
                fill="none"
                opacity="0.6"
              />
            </motion.g>

            {/* eye — outer group tracks the cursor (idle/speaking),
                inner group handles blink/look/squint per state. */}
            <motion.g
              animate={{ x: eyeTrack.x, y: eyeTrack.y }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
            >
              <motion.g
                animate={eyeAnim}
                transition={eyeTransition}
                style={{ transformOrigin: "30px 16px" }}
              >
                <circle cx="30" cy="16" r="2.6" fill="#1a1300" />
                <circle cx="30.8" cy="15.2" r="0.9" fill="#fff9dc" />
              </motion.g>
            </motion.g>

            {/* tear — only on error. Falls from below the eye on loop. */}
            {resolved === "error" && (
              <motion.g
                initial={{ opacity: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: [0, 3, 8, 12],
                  scale: [0.6, 1, 1, 0.85],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeIn",
                  repeatDelay: 0.5,
                  times: [0, 0.2, 0.75, 1],
                }}
                style={{ transformOrigin: "30px 19px" }}
              >
                <ellipse cx="29.5" cy="19" rx="1.1" ry="1.5" fill="#6BB6FF" />
                <ellipse cx="29.1" cy="18.6" rx="0.35" ry="0.55" fill="#D9ECFF" />
              </motion.g>
            )}
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
