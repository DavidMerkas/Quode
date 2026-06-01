// Per-language spawn recipe. Each entry returns:
//   { file: "main.py", argv: ["python3","-u","main.py"] }
// `cwd` is a fresh per-session temp dir created by the server.
//
// Phase 1: Python. Phase 2: C# (dotnet-script). Add more as needed.

import path from "node:path";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const isWin = process.platform === "win32";

// node-pty on Windows doesn't search PATH like child_process.spawn does — it
// hands the literal string to ConPTY and gets `File not found`. We resolve to
// an absolute path once at boot and cache it.
const cache = new Map();
function resolveBin(name) {
  if (cache.has(name)) return cache.get(name);
  if (path.isAbsolute(name) && existsSync(name)) {
    cache.set(name, name);
    return name;
  }
  const finder = isWin ? `where ${name}` : `command -v ${name}`;
  try {
    const out = execSync(finder, { encoding: "utf8" }).trim();
    const first = out.split(/\r?\n/).find(Boolean);
    if (first) {
      cache.set(name, first);
      return first;
    }
  } catch {
    /* not on PATH */
  }
  cache.set(name, name); // fallback: let spawn fail loudly with the name
  return name;
}

const PYTHON_BIN = process.env.PYTHON_BIN ?? (isWin ? "python" : "python3");
const DOTNET_BIN = process.env.DOTNET_BIN ?? "dotnet";

export const LANGUAGES = {
  python: {
    file: "main.py",
    // -u: unbuffered stdout/stderr so input()/print() round-trip without delay
    argv: (cwd) => [resolveBin(PYTHON_BIN), "-u", path.join(cwd, "main.py")],
  },
  csharp: {
    // dotnet-script reads a .csx file. Must be installed: `dotnet tool install -g dotnet-script`
    file: "main.csx",
    argv: (cwd) => [resolveBin(DOTNET_BIN), "script", path.join(cwd, "main.csx")],
  },
};

export function isSupported(lang) {
  return Object.prototype.hasOwnProperty.call(LANGUAGES, lang);
}
