// Per-language spawn recipe. Each entry returns:
//   { file: "main.py", argv: ["python3","-u","main.py"] }
// `cwd` is a fresh per-session temp dir created by the server.
//
// Compiled languages (cpp, rust, java) wrap compile+run in a single
// `bash -c "compile && ./out"` so the PTY sees one process from the user's
// perspective. Compiler errors go to the terminal naturally.

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
const NODE_BIN = process.env.NODE_BIN ?? "node";
const DOTNET_BIN = process.env.DOTNET_BIN ?? "dotnet";
const BASH = isWin ? "bash" : "/bin/bash"; // bash on linux always at /bin/bash

const q = (p) => `'${p.replace(/'/g, "'\\''")}'`;

export const LANGUAGES = {
  python: {
    file: "main.py",
    // -u: unbuffered stdout/stderr so input()/print() round-trip without delay
    argv: (cwd) => [resolveBin(PYTHON_BIN), "-u", path.join(cwd, "main.py")],
  },

  javascript: {
    file: "main.js",
    argv: (cwd) => [resolveBin(NODE_BIN), path.join(cwd, "main.js")],
  },

  typescript: {
    file: "main.ts",
    // tsx: `npm i -g tsx`. Falls back to ts-node if you prefer.
    argv: (cwd) => [resolveBin("tsx"), path.join(cwd, "main.ts")],
  },

  go: {
    file: "main.go",
    argv: (cwd) => [resolveBin("go"), "run", path.join(cwd, "main.go")],
  },

  rust: {
    file: "main.rs",
    // Compile to a binary inside cwd, then run it. `-O` keeps it snappy.
    argv: (cwd) => [
      BASH,
      "-c",
      `rustc -O ${q(path.join(cwd, "main.rs"))} -o ${q(path.join(cwd, "main"))} && ${q(path.join(cwd, "main"))}`,
    ],
  },

  java: {
    // Java class name must match file name. We force `Main` so the user
    // doesn't have to know about that quirk.
    file: "Main.java",
    argv: (cwd) => [
      BASH,
      "-c",
      `cd ${q(cwd)} && javac Main.java && java Main`,
    ],
  },

  cpp: {
    file: "main.cpp",
    argv: (cwd) => [
      BASH,
      "-c",
      `g++ -O2 -std=c++17 ${q(path.join(cwd, "main.cpp"))} -o ${q(path.join(cwd, "main"))} && ${q(path.join(cwd, "main"))}`,
    ],
  },

  csharp: {
    file: "main.csx",
    // dotnet-script reads a .csx file. Must be installed:
    //   sudo -u quode-runner -H bash -c 'dotnet tool install -g dotnet-script'
    argv: (cwd) => [resolveBin(DOTNET_BIN), "script", path.join(cwd, "main.csx")],
  },
};

export function isSupported(lang) {
  return Object.prototype.hasOwnProperty.call(LANGUAGES, lang);
}
