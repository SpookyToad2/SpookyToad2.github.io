import { WebSocketServer } from "ws";

const port = Number(process.env.REALTIME_PORT || 8787);
const wss = new WebSocketServer({ port });

function send(ws, payload) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
}

function broadcastToBoard(boardId, payload, excludeSessionId = null) {
  for (const client of wss.clients) {
    if (client.readyState !== client.OPEN) continue;
    if (client.boardId !== boardId) continue;
    if (excludeSessionId && client.sessionId === excludeSessionId) continue;
    send(client, payload);
  }
}

wss.on("connection", (ws) => {
  ws.boardId = null;
  ws.user = null;
  ws.sessionId = null;

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "join_board") {
      ws.boardId = msg.boardId || null;
      ws.user = msg.user || null;
      ws.sessionId = msg.sessionId || null;
      return;
    }

    if (msg.type === "shape_create" || msg.type === "shape_rotation") {
      if (!msg.boardId) return;
      broadcastToBoard(msg.boardId, msg, msg.sessionId || null);
    }
  });

  ws.on("error", () => {
    // Keep server alive on per-socket errors.
  });
});

console.log(`Realtime server listening on ws://localhost:${port}`);
