# quode-runner

Interactive code-execution backend for Quode. WebSocket + node-pty. One PTY per
session. Replaces the old request/response `/api/run` route so `input()` /
`Console.ReadLine()` work in real time.

## Protocol

See `src/protocol.js`. Frames are JSON.

- **client → server:** `start`, `stdin`, `resize`, `signal`
- **server → client:** `ready`, `started`, `stdout`, `exit`, `error`

`stdout` is the PTY master — stderr is merged in, ANSI passes through.

## Languages (phase 1)

- `python` — `python3 -u main.py`
- `csharp` — `dotnet script main.csx` (needs `dotnet-script` installed)

Add new entries in `src/languages.js`.

## Local dev

```bash
cd infra/quode-runner
npm install
npm run dev
```

Health: `http://localhost:2001/health`. WS: `ws://localhost:2001/ws/run`.

## Environment

| var               | default      | purpose                                |
| ----------------- | ------------ | -------------------------------------- |
| `PORT`            | `2001`       | TCP port                               |
| `HOST`            | `0.0.0.0`    | bind addr                              |
| `MAX_PER_IP`      | `2`          | concurrent sessions per client IP      |
| `ALLOWED_ORIGINS` | _(empty=all)_ | comma-list of allowed `Origin` headers |

## VPS deploy (Contabo, Ubuntu 24.04)

See `deploy.md` in this folder.
