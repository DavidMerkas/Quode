// Quode interactive runner — WebSocket entrypoint.
//
// Listens on PORT (default 2001). Accepts one PTY session per connection.
// Origins are allowlisted via ALLOWED_ORIGINS (comma-separated). Per-IP
// concurrency is capped so a single client can't fan out runs.

import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { Session } from "./session.js";
import {
  ERR,
  MAX_CODE_BYTES,
  MAX_STDIN_BYTES_PER_FRAME,
} from "./protocol.js";
import { isSupported } from "./languages.js";

const PORT = Number(process.env.PORT ?? 2001);
const HOST = process.env.HOST ?? "0.0.0.0";
const MAX_PER_IP = Number(process.env.MAX_PER_IP ?? 2);

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const activeByIp = new Map(); // ip -> count

function ipOf(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  return req.socket.remoteAddress ?? "unknown";
}

function originAllowed(origin) {
  if (ALLOWED_ORIGINS.length === 0) return true; // dev mode: allow all
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

const http = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, active: countActive() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ noServer: true });

http.on("upgrade", (req, socket, head) => {
  if (req.url !== "/ws/run") {
    socket.destroy();
    return;
  }
  if (!originAllowed(req.headers.origin)) {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }
  const ip = ipOf(req);
  const current = activeByIp.get(ip) ?? 0;
  if (current >= MAX_PER_IP) {
    socket.write("HTTP/1.1 429 Too Many Requests\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => handleConn(ws, ip));
});

function send(ws, obj) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(obj));
}

function fatal(ws, code, message) {
  send(ws, { type: "error", code, message });
  try {
    ws.close(1011, code);
  } catch {
    /* ignore */
  }
}

function handleConn(ws, ip) {
  activeByIp.set(ip, (activeByIp.get(ip) ?? 0) + 1);
  let session = null;

  const cleanup = () => {
    const next = (activeByIp.get(ip) ?? 1) - 1;
    if (next <= 0) activeByIp.delete(ip);
    else activeByIp.set(ip, next);
    if (session && !session.exited) session.kill("SIGKILL");
  };

  ws.on("close", cleanup);
  ws.on("error", cleanup);

  send(ws, { type: "ready" });

  ws.on("message", (raw) => {
    let frame;
    try {
      frame = JSON.parse(raw.toString());
    } catch {
      fatal(ws, ERR.BAD_FRAME, "frame is not valid JSON");
      return;
    }
    if (!frame || typeof frame.type !== "string") {
      fatal(ws, ERR.BAD_FRAME, "missing type");
      return;
    }

    switch (frame.type) {
      case "start": {
        if (session) return fatal(ws, ERR.ALREADY_STARTED, "session running");
        const { language, code, cols, rows } = frame;
        if (typeof language !== "string" || !isSupported(language)) {
          return fatal(ws, ERR.UNSUPPORTED_LANG, `unsupported: ${language}`);
        }
        if (typeof code !== "string") {
          return fatal(ws, ERR.BAD_FRAME, "code must be string");
        }
        if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) {
          return fatal(ws, ERR.CODE_TOO_LARGE, "code exceeds limit");
        }
        try {
          session = new Session({
            language,
            code,
            cols: Number(cols) || 80,
            rows: Number(rows) || 24,
            onData: (data) => send(ws, { type: "stdout", data }),
            onExit: (info) => {
              send(ws, { type: "exit", ...info });
              try {
                ws.close(1000, "exit");
              } catch {
                /* ignore */
              }
            },
            onError: (code, message) => send(ws, { type: "error", code, message }),
          });
          send(ws, { type: "started", pid: session.pid });
        } catch (err) {
          return fatal(ws, ERR.SPAWN_FAILED, String(err?.message ?? err));
        }
        return;
      }
      case "stdin": {
        if (!session) return fatal(ws, ERR.NOT_STARTED, "no session");
        if (typeof frame.data !== "string") {
          return fatal(ws, ERR.BAD_FRAME, "stdin.data must be string");
        }
        if (Buffer.byteLength(frame.data, "utf8") > MAX_STDIN_BYTES_PER_FRAME) {
          return fatal(ws, ERR.BAD_FRAME, "stdin frame too large");
        }
        session.write(frame.data);
        return;
      }
      case "resize": {
        if (!session) return;
        const cols = Number(frame.cols);
        const rows = Number(frame.rows);
        if (cols > 0 && rows > 0) session.resize(cols, rows);
        return;
      }
      case "signal": {
        if (!session) return;
        const name = frame.name === "SIGTERM" ? "SIGTERM" : "SIGINT";
        session.signal(name);
        return;
      }
      default:
        fatal(ws, ERR.BAD_FRAME, `unknown type: ${frame.type}`);
    }
  });
}

function countActive() {
  let n = 0;
  for (const v of activeByIp.values()) n += v;
  return n;
}

http.listen(PORT, HOST, () => {
  console.log(
    `[quode-runner] listening on ${HOST}:${PORT} (origins=${
      ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS.join(",") : "*"
    })`,
  );
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    console.log(`[quode-runner] ${sig} — closing`);
    wss.close();
    http.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  });
}
