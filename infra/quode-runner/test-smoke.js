// Smoke test: open WS, run a Python program that prompts via input(),
// pipe a reply, confirm exit code.
import { WebSocket } from "ws";

const ws = new WebSocket("ws://localhost:2001/ws/run");
let out = "";

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "start",
      language: "python",
      code: 'name = input("Name? ")\nprint("Hi", name)\n',
      cols: 80,
      rows: 24,
    }),
  );
});

ws.on("message", (raw) => {
  const f = JSON.parse(raw.toString());
  if (f.type === "stdout") {
    out += f.data;
    process.stdout.write(`[stdout] ${JSON.stringify(f.data)}\n`);
    if (out.includes("Name? ")) {
      ws.send(JSON.stringify({ type: "stdin", data: "Quode\r" }));
    }
  } else {
    console.log("[frame]", f);
  }
  if (f.type === "exit") ws.close();
});

ws.on("close", () => {
  console.log("[done]", out.includes("Hi Quode") ? "PASS" : "FAIL");
  process.exit(0);
});
ws.on("error", (e) => {
  console.error("[error]", e.message);
  process.exit(1);
});
