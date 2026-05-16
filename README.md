# Quode

A web-based coding playground with an AI duck mentor.

Write code in the browser, run it on real interpreters/compilers, and chat with **Duck** — an AI mentor with four modes designed to help you learn rather than just hand over the answer.

## Features

- **Monaco-powered editor** (the same engine VS Code uses) with a custom dark theme.
- **Real code execution** in 7 languages via the [Wandbox](https://wandbox.org/) public API. No key, no signup. Swappable for self-hosted Piston or Judge0 via a single env var.
- **Duck AI mentor** powered by Google Gemini 2.5 Flash, with four modes:
  - **Explain** — walks through what code does, line by line
  - **Hint** — nudges you toward the answer without giving it away
  - **Debug** — helps you find and fix issues
  - **Review** — critiques style, structure, and trade-offs
- **`⌘/Ctrl + Enter`** to run from anywhere on the page.
- Streaming Duck replies, animated mascot, dark-first warm theme.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript + Turbopack
- [Tailwind CSS v4](https://tailwindcss.com) with `@theme` tokens
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for editing
- [Wandbox](https://wandbox.org/) for code execution (with optional [Piston](https://github.com/engineer-man/piston) self-host or [Judge0](https://judge0.com/) on RapidAPI)
- [Google Gemini](https://ai.google.dev/) (`@google/genai`) for Duck — fully free tier
- Designed to deploy to [Vercel](https://vercel.com)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Then open .env.local and paste in:
#   - GEMINI_API_KEY  (free, no card: https://aistudio.google.com/apikey)
# That's the only required key. Code execution uses Wandbox by default — no key.

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | yes | — | [Free key here](https://aistudio.google.com/apikey). No card needed. |
| `GEMINI_MODEL` | no | `gemini-2.5-flash` | Override the Gemini model. |
| `PISTON_URL` | no | — | URL of a self-hosted Piston instance. Takes priority over everything when set. |
| `RAPIDAPI_KEY` | no | — | Judge0 CE on RapidAPI. Used only if `PISTON_URL` is unset. |

If neither `PISTON_URL` nor `RAPIDAPI_KEY` is set, the runner falls back to Wandbox's public API — no key, no signup.

### Code runner — what's actually running your code

The runner is pluggable. Resolution order at request time:

1. **`PISTON_URL` set** → self-hosted [Piston](https://github.com/engineer-man/piston). Best privacy and control. Requires a host that allows privileged Docker (a real VPS / Oracle Cloud / Fly.io machines — **not** Render free / Vercel / Heroku, which have read-only filesystems).
2. **`RAPIDAPI_KEY` set** → [Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce) BASIC plan. ~50 runs/day. Note: RapidAPI may ask for a card during signup.
3. **Neither set** → [Wandbox](https://wandbox.org/) public API. Truly free, no key. Community-maintained, used by tutorial sites everywhere. Reliable for personal use, please don't hammer it.

To upgrade later, just set the env var in Vercel. **No code changes required.**

## Deploying to Vercel

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Add **one** environment variable in Vercel project settings:
   - `GEMINI_API_KEY` — from Google AI Studio
4. Deploy. Total cost: **$0/month**.

> Free-tier notes:
> - **Gemini 2.5 Flash:** generous daily quota per key, no card needed.
> - **Wandbox:** free public API, no daily cap documented, but please don't abuse — it's community-maintained.

## Project structure

```
src/
  app/
    api/
      run/       POST — runs user code via Wandbox / Judge0 / Piston
      duck/      POST — streams Duck replies from Gemini
    page.tsx     Workspace shell
    layout.tsx   Root layout, fonts, theme
  components/
    layout/      Header, Workspace
    editor/      Monaco wrapper, OutputDrawer
    duck/        Mascot, ModePills, ChatMessage, ChatInput, DuckPanel
    ui/          (reserved — shadcn/ui primitives go here)
  lib/
    duck/        prompts + Gemini client
    runner/      index router + wandbox.ts + judge0.ts + piston.ts
    supabase/    (reserved — for future auth + snippet storage)
    utils/       cn()
  types/         DuckMode, Language, ChatMessage
```

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `⌘/Ctrl + Enter` | Run the current code |
| `Enter` (in chat) | Send to Duck |
| `Shift + Enter` (in chat) | Newline |

## Status

Early but functional. See [`CONTEXT.md`](./CONTEXT.md) for architecture decisions and rationale.
