# Quode — Context & Decisions

This document captures the architectural decisions made during development and the reasoning behind them. Update it as decisions evolve.

## Product

Quode is a web-based coding playground where users can write code, execute it, and talk to **Duck** — an AI mentor that teaches rather than auto-solves. Duck has four modes:

| Mode    | Purpose                                                 |
| ------- | ------------------------------------------------------- |
| Explain | Walk through what a snippet does, line by line          |
| Hint    | Nudge the user toward the answer without revealing it   |
| Debug   | Help locate and fix errors                              |
| Review  | Critique style, structure, and trade-offs               |

The mentor framing (vs. a generic chatbot) is the product's differentiator and shapes both prompt design and UI tone.

## Stack decisions

### Framework: Next.js 16 (App Router) + TypeScript + Turbopack
- App Router for streaming, server actions, and route handlers in one place.
- Server-side API routes keep the Gemini API key off the client.
- TypeScript everywhere.
- **Note:** Original spec said Next.js 15. We're on **16.2.6** because that's what `create-next-app@latest` installed and it works fine for our needs. Resolved — staying on 16.

### Styling: Tailwind CSS v4 + custom theme tokens
- Tailwind v4 with the `@theme` directive in `globals.css` for tokens: `--color-base`, `--color-surface`, `--color-duck` (`#FFD43B`), `--color-quack` (`#FF8C42`), etc.
- shadcn/ui is reserved (`src/components/ui/`) but not yet installed — we'll pull in primitives as needed rather than installing the whole kit upfront.
- Geist Sans for UI, Geist Mono for code (both via `next/font`).

### Code editor: Monaco
- `@monaco-editor/react`, dynamically imported with `ssr: false` because Monaco is large and browser-only.
- Custom `quode-dark` theme defined on mount to match our palette (Duck Yellow cursor, warm-dark background `#0b0b0f`).
- `⌘/Ctrl+Enter` is bound *inside* Monaco via `editor.addCommand` and *globally* via a `keydown` listener — both routes call the same `handleRun`.

### Code execution: Wandbox (default) → Judge0 → self-hosted Piston

Three attempts, three providers, in this order chronologically:

1. **Public Piston at `emkc.org`** — initial choice. Went **whitelist-only on 2026-02-15** (returns HTTP 401). Dead for our purposes.
2. **Judge0 CE on RapidAPI** — fallback. The "free" BASIC plan turned out to **require a payment method** on RapidAPI (even though it doesn't charge), which the user didn't want.
3. **Self-hosting Piston on Render** — tried. **Failed.** Piston needs to create an `isolate/` directory at startup, Render's free tier has a read-only root filesystem, container exits with `mkdir: cannot create directory 'isolate/': Read-only file system`. The same will be true on Vercel, Fly.io free apps, Heroku, and other PaaS that don't expose a writable root. Self-hosting Piston for real requires a privileged container on a real VPS (Oracle Cloud Always Free, Fly.io machines with a card, DigitalOcean droplet, etc.).
4. **Wandbox public API** — current default. Community-run free service that's been live since ~2014, no key, no signup. Used by tutorial sites and online compilers across the web. We hit it without an account.

**Why Wandbox works for us:**
- Truly free, no card anywhere in the loop
- Covers all 7 languages we ship (Python, JS, TS, Go, Rust, Java, C++)
- Used in production by other tools — reliable enough for personal demo
- Trade-off: community-maintained, so we should be courteous (no hammering)

**Migration path remains open.** If/when the user gets a real VPS (or accepts the RapidAPI card prompt), setting `PISTON_URL` or `RAPIDAPI_KEY` in Vercel env vars automatically switches the runner — no code change.

**Runner abstraction** lives in `src/lib/runner/index.ts`:
1. `PISTON_URL` set → self-hosted Piston
2. else `RAPIDAPI_KEY` set → Judge0
3. else → Wandbox (default)

Shared `RunResult` type in `src/lib/runner/types.ts`; per-provider clients in `judge0.ts`, `piston.ts`, `wandbox.ts`.

Route: `POST /api/run` with `{ language, code }` → `{ stdout, stderr, exitCode, durationMs }`. Input validated (language whitelist, 100KB code cap).

### AI: Google Gemini 2.5 Flash
- **Chosen over Anthropic Claude** for the public demo. Reasons:
  - Generous free tier on AI Studio — no credit card needed.
  - Public deployment can't be drained by abuse since the free quota is per-key, not pay-as-you-go.
  - Quality is more than sufficient for Duck's mentor-style task.
- The architecture is provider-agnostic on purpose: prompts live in `src/lib/duck/prompts.ts`, the Gemini-specific code is isolated in `src/lib/duck/gemini.ts`. Swapping in Anthropic later means changing one file and adding an `ANTHROPIC_API_KEY`.
- Streaming: `POST /api/duck` returns a `text/plain` stream of token deltas. Client reads with `ReadableStream` and appends to the in-flight message.
- Each mode = a distinct system prompt built from a shared core preamble + mode-specific instructions. The core preamble encodes the "mentor, not auto-solver" stance.

### Auth & persistence: deferred
- The playground is fully usable anonymously. No login, no DB.
- Supabase folder reserved (`src/lib/supabase/`) for a future "save & share snippets" feature. Not built yet.
- Reason: shipping a free public demo doesn't need user accounts. We'll add them when we have a reason to.

### Hosting: Vercel
- First-class Next.js support, free hobby tier covers the demo.
- The one env var needed is `GEMINI_API_KEY`.

## Folder structure

```
src/
  app/
    api/
      run/       POST — runs user code via Piston
      duck/      POST — streams Duck replies from Gemini
  components/
    layout/      Header, Workspace
    editor/      EditorPanel (Monaco), OutputDrawer
    duck/        DuckMascot, ModePills, ChatMessage, ChatInput, DuckPanel
    ui/          reserved for shadcn primitives
  lib/
    duck/        prompts.ts, gemini.ts
    runner/      index.ts (router) + wandbox.ts + judge0.ts + piston.ts + types.ts
    supabase/    reserved
    utils/       cn()
  types/         duck.ts, language.ts
```

`lib/` mirrors the external services so each integration has a single home. Component folders are feature-oriented (editor / duck / layout).

## Package policy

- Dependencies added so far, feature-by-feature: `next`, `react`, `react-dom`, `@monaco-editor/react`, `@google/genai`, Tailwind + types.
- Intentionally not yet installed: `@supabase/supabase-js`, `zod`, `lucide-react`, shadcn/ui CLI. Add as features require them.

## Streaming contract (Duck)

- Server route returns `text/plain` chunks. No SSE framing — just raw token deltas.
- Client (`Workspace.handleDuckSend`) reads with `getReader().read()` and calls `onDelta(text)` per chunk.
- `DuckPanel` appends each delta to the placeholder message identified by `streamingId`.
- Errors mid-stream are surfaced as `[Duck error: ...]` appended to the message; the request itself returns 200 once streaming begins (so we can't cleanly fail-with-status mid-response — the inline error string is the contract).

## Security posture

- All third-party keys are server-only (`GEMINI_API_KEY` has no `NEXT_PUBLIC_` prefix).
- User-submitted code is sent to Piston, never executed in our process.
- API routes validate language (whitelist) and bound input size (100KB code, 4KB Duck messages).
- No HTML rendering of model output — `whitespace-pre-wrap` text only. Markdown rendering will need a sanitizer when we add it.
- Rate limiting: not yet implemented. Acceptable for a personal demo on a free Gemini key (per-key quotas cap abuse). Revisit before any public sharing.

## Open questions

- **Markdown rendering for Duck.** Plain pre-wrapped text works for now. For code-block highlighting in replies, we'll need a markdown renderer + sanitizer.
- **Rate limiting.** Add per-IP limits (Upstash Redis or Vercel KV) before promoting the URL anywhere public.
- **Snippet sharing.** URL-encoded snippet payload (short-link via simple hash) vs. Supabase row. Decide when the feature is requested.
- **Provider abstraction.** Currently Gemini-only. If we want Claude/Groq as fallbacks, define a `DuckProvider` interface and pick at runtime via env.
- **Wandbox courtesy / rate limits.** No documented hard cap, but it's community-maintained. If Quode ever gets meaningful traffic, move to a paid VPS + Piston or accept the RapidAPI card.
