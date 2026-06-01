// Wire protocol shared between Quode frontend and the runner.
// All frames are JSON objects with a `type` discriminator.
//
// Client -> Server:
//   { type: "start",  language, code, cols?, rows? }
//   { type: "stdin",  data }            // raw text, already includes "\n" for Enter
//   { type: "resize", cols, rows }
//   { type: "signal", name }            // "SIGINT" | "SIGTERM"
//
// Server -> Client:
//   { type: "ready" }                   // socket open, awaiting "start"
//   { type: "started", pid }
//   { type: "stdout", data }            // PTY merges stderr into stdout
//   { type: "exit",   code, signal, durationMs }
//   { type: "error",  code, message }   // fatal; socket will close

export const ERR = {
  BAD_FRAME: "BAD_FRAME",
  UNSUPPORTED_LANG: "UNSUPPORTED_LANG",
  CODE_TOO_LARGE: "CODE_TOO_LARGE",
  ALREADY_STARTED: "ALREADY_STARTED",
  NOT_STARTED: "NOT_STARTED",
  WALL_CLOCK: "WALL_CLOCK",
  SPAWN_FAILED: "SPAWN_FAILED",
  INTERNAL: "INTERNAL",
};

export const MAX_CODE_BYTES = 100_000;
export const MAX_STDIN_BYTES_PER_FRAME = 4_096;
export const WALL_CLOCK_MS = 30_000;
