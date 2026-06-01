// One PTY-backed session = one user run. The session owns:
//   - a fresh temp working directory
//   - a node-pty child process
//   - a wall-clock kill timer
// It exposes only `write`, `resize`, `signal`, `kill` to the server, plus
// `onData` / `onExit` callbacks. Anything kernel-level (uid, rlimits) is
// handled by the wrapper shell on the VPS (see infra/quode-runner/wrap.sh).

import { spawn as ptySpawn } from "node-pty";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LANGUAGES, isSupported } from "./languages.js";
import { WALL_CLOCK_MS } from "./protocol.js";

export class Session {
  constructor({ language, code, cols, rows, onData, onExit, onError }) {
    if (!isSupported(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }
    const spec = LANGUAGES[language];

    this.startedAt = Date.now();
    this.cwd = mkdtempSync(join(tmpdir(), "quode-"));
    writeFileSync(join(this.cwd, spec.file), code, "utf8");

    const argv = spec.argv(this.cwd);
    const [cmd, ...args] = argv;

    // node-pty merges stderr into the master fd; that's fine for a terminal
    // UI — colors, prompts, and ANSI all just work.
    this.pty = ptySpawn(cmd, args, {
      name: "xterm-256color",
      cols: cols ?? 80,
      rows: rows ?? 24,
      cwd: this.cwd,
      env: {
        PATH: process.env.PATH,
        HOME: this.cwd,
        TERM: "xterm-256color",
        LANG: "C.UTF-8",
        PYTHONUNBUFFERED: "1",
        PYTHONDONTWRITEBYTECODE: "1",
      },
    });

    this.pid = this.pty.pid;
    this.exited = false;
    this.onData = onData;
    this.onExit = onExit;
    this.onError = onError;

    this.pty.onData((data) => {
      if (!this.exited) this.onData(data);
    });
    this.pty.onExit(({ exitCode, signal }) => this._handleExit(exitCode, signal));

    this.killTimer = setTimeout(() => {
      this.onError?.("WALL_CLOCK", `Killed after ${WALL_CLOCK_MS}ms`);
      this.kill("SIGKILL");
    }, WALL_CLOCK_MS);
  }

  write(data) {
    if (this.exited) return;
    this.pty.write(data);
  }

  resize(cols, rows) {
    if (this.exited) return;
    try {
      this.pty.resize(cols, rows);
    } catch {
      // PTY may have exited between check and resize; ignore.
    }
  }

  signal(name) {
    if (this.exited) return;
    try {
      process.kill(this.pty.pid, name);
    } catch {
      // already gone
    }
  }

  kill(sig = "SIGTERM") {
    if (this.exited) return;
    try {
      this.pty.kill(sig);
    } catch {
      // ignore
    }
  }

  _handleExit(exitCode, signal) {
    if (this.exited) return;
    this.exited = true;
    clearTimeout(this.killTimer);
    const durationMs = Date.now() - this.startedAt;
    try {
      rmSync(this.cwd, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
    this.onExit({ code: exitCode ?? null, signal: signal ?? null, durationMs });
  }
}
