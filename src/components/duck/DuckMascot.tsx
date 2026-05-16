import { cn } from "@/lib/utils/cn";

interface DuckMascotProps {
  size?: number;
  speaking?: boolean;
  className?: string;
}

export function DuckMascot({
  size = 48,
  speaking = false,
  className,
}: DuckMascotProps) {
  return (
    <span
      role="img"
      aria-label="Duck"
      className={cn(
        "inline-flex shrink-0 items-end justify-center",
        speaking ? "duck-speaking" : "duck-idle",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* soft shadow */}
        <ellipse cx="32" cy="58" rx="18" ry="2.5" fill="#000" opacity="0.35" />

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

        {/* head */}
        <circle cx="32" cy="22" r="14" fill="#FFD43B" />
        {/* head highlight */}
        <circle cx="27" cy="18" r="5" fill="#FFE580" opacity="0.65" />

        {/* tuft */}
        <path
          d="M30 8c1-3 3-4 5-3-1 2-1 4 0 6-2 1-4 0-5-3z"
          fill="#FFB300"
        />

        {/* beak */}
        <path
          d="M40 22c4 0 7 2 7 4s-3 4-7 4c-2 0-4-.5-5-1.5C36 27.5 36 24.5 35 23c1-.6 3-1 5-1z"
          fill="#FF8C42"
        />
        <path
          d="M40 26c2.5 0 5 .3 6.5.8-1.5.7-3.8 1.2-6.5 1.2-2 0-4-.4-5-1 1-.7 3-1 5-1z"
          fill="#E96A1F"
          opacity="0.55"
        />

        {/* eye */}
        <g className="duck-eye">
          <circle cx="30" cy="20" r="2.6" fill="#1a1300" />
          <circle cx="30.8" cy="19.2" r="0.9" fill="#fff" />
        </g>

        {/* wing */}
        <path
          d="M20 36c0-4 3-7 7-7 1 0 2 .2 3 .6-1 2-1.5 4-1.5 6 0 2 .5 4 1.5 6-1 .4-2 .6-3 .6-4 0-7-3-7-6.2z"
          fill="#F5C400"
        />
      </svg>
    </span>
  );
}
