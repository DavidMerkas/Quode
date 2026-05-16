export type DuckMode = "explain" | "hint" | "debug" | "review";

export interface DuckModeMeta {
  id: DuckMode;
  label: string;
  blurb: string;
}

export const DUCK_MODES: readonly DuckModeMeta[] = [
  {
    id: "explain",
    label: "Explain",
    blurb: "Walk through what this code does, line by line.",
  },
  {
    id: "hint",
    label: "Hint",
    blurb: "Nudge me toward the answer — don't give it away.",
  },
  {
    id: "debug",
    label: "Debug",
    blurb: "Help me find and fix what's broken.",
  },
  {
    id: "review",
    label: "Review",
    blurb: "Critique style, structure, and trade-offs.",
  },
] as const;

export interface ChatMessage {
  id: string;
  role: "user" | "duck";
  content: string;
  mode?: DuckMode;
  createdAt: number;
}
