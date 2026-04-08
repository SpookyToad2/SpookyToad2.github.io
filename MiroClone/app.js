import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { EditorState } from "https://esm.sh/@codemirror/state@6.5.2";
import { EditorView, keymap, drawSelection, highlightActiveLine, lineNumbers, highlightActiveLineGutter } from "https://esm.sh/@codemirror/view@6.38.6";
import { history, defaultKeymap, historyKeymap, indentWithTab } from "https://esm.sh/@codemirror/commands@6.8.1";
import { autocompletion, closeBrackets, closeBracketsKeymap } from "https://esm.sh/@codemirror/autocomplete@6.19.0";
import { indentOnInput, bracketMatching, foldGutter, syntaxHighlighting, defaultHighlightStyle } from "https://esm.sh/@codemirror/language@6.11.3";
import { python } from "https://esm.sh/@codemirror/lang-python@6.2.1";
import { oneDark } from "https://esm.sh/@codemirror/theme-one-dark@6.1.3";
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

const STORAGE_USERS = "miro_clone_users_v1";
const STORAGE_SESSION = "miro_clone_session_v1";
const STORAGE_SHARED_BOARDS = "miro_clone_shared_boards_v1";
const PRESENCE_CHANNEL = "miro_clone_presence_v1";
const GRID_BASE = 24;
const SVG_NS = "http://www.w3.org/2000/svg";
const IMAGE_EXTS = new Set(["gif", "png", "webp", "jpg", "jpeg"]);
const BOARD_COORD_MIN = -50000;
const BOARD_COORD_SIZE = 100000;
const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/";
const PYTHON_COMPLETIONS = [
  "print", "len", "range", "enumerate", "zip", "map", "filter", "sum", "min", "max", "sorted",
  "list", "dict", "set", "tuple", "str", "int", "float", "bool", "type", "isinstance",
  "import", "from", "as", "def", "class", "return", "for", "while", "if", "elif", "else",
  "try", "except", "finally", "with", "lambda", "pass", "break", "continue", "yield",
];
const WS_URL = (() => {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const host = location.hostname || "localhost";
  return `${protocol}://${host}:8787`;
})();

const authView = document.getElementById("authView");
const dashboardView = document.getElementById("dashboardView");
const boardView = document.getElementById("boardView");
const authMessage = document.getElementById("authMessage");
const authForm = document.getElementById("authForm");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");

const dashboardUserText = document.getElementById("dashboardUserText");
const dashboardLogoutBtn = document.getElementById("dashboardLogoutBtn");
const createBoardForm = document.getElementById("createBoardForm");
const newBoardNameInput = document.getElementById("newBoardNameInput");
const boardsList = document.getElementById("boardsList");
const dashboardMessage = document.getElementById("dashboardMessage");

const backToBoardsBtn = document.getElementById("backToBoardsBtn");
const welcomeText = document.getElementById("welcomeText");
const activeBoardTitle = document.getElementById("activeBoardTitle");
const copyBoardLinkBtn = document.getElementById("copyBoardLinkBtn");
const logoutBtn = document.getElementById("logoutBtn");
const saveBoardBtn = document.getElementById("saveBoardBtn");
const addStickyBtn = document.getElementById("addStickyBtn");
const resetViewBtn = document.getElementById("resetViewBtn");
const fileInput = document.getElementById("fileInput");
const shapeTypeSelect = document.getElementById("shapeTypeSelect");
const addShape3dBtn = document.getElementById("addShape3dBtn");
const addCodeEditorBtn = document.getElementById("addCodeEditorBtn");
const toolCursorBtn = document.getElementById("toolCursorBtn");
const toolSelectBtn = document.getElementById("toolSelectBtn");
const toolDrawBtn = document.getElementById("toolDrawBtn");
const toolEraserBtn = document.getElementById("toolEraserBtn");
const toolColorInput = document.getElementById("toolColorInput");
const toolSizeInput = document.getElementById("toolSizeInput");
const toolSelectAllBtn = document.getElementById("toolSelectAllBtn");
const toolDeleteBtn = document.getElementById("toolDeleteBtn");
const clearDrawingsBtn = document.getElementById("clearDrawingsBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

const boardViewport = document.getElementById("boardViewport");
const boardInner = document.getElementById("boardInner");
const presenceLayer = document.getElementById("presenceLayer");
const dropOverlay = document.getElementById("dropOverlay");
const statusText = document.getElementById("statusText");
const debugCoords = document.getElementById("debugCoords");

const sessionId = crypto.randomUUID();
let currentUser = null;
let boardsState = null;
let activeBoard = null;
let drawLayer = null;
let saveTimer = null;
let isPanning = false;
let isSpacePressed = false;
let panStart = { x: 0, y: 0, originX: 0, originY: 0 };
let dragDepth = 0;
let ws = null;
let wsConnected = false;
let wsReconnectTimer = null;
let wsShouldReconnect = true;
const shapeRenderers = new Map();
const codeEditorWidgets = new Map();

const viewState = { x: 200, y: 120, zoom: 1 };
const drawState = { active: false, pointerId: null, stroke: null, pathEl: null };
const toolState = { mode: "draw", drawSubtool: "pen" };
const selectionState = { itemIds: new Set(), strokeIds: new Set() };
const historyState = { byBoard: new Map(), restoring: false };
const presenceState = {
  channel: typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(PRESENCE_CHANNEL) : null,
  peers: new Map(),
  lastSentAt: 0,
};

function wsSend(message) {
  if (!wsConnected || !ws) return;
  ws.send(JSON.stringify(message));
}

function joinRealtimeBoard() {
  if (!wsConnected || !currentUser || !activeBoard) return;
  wsSend({
    type: "join_board",
    boardId: activeBoard.id,
    user: currentUser,
    sessionId,
  });
}

function connectRealtime() {
  if (ws) return;
  wsShouldReconnect = true;
  try {
    ws = new WebSocket(WS_URL);
  } catch {
    return;
  }

  ws.addEventListener("open", () => {
    wsConnected = true;
    setStatus("Realtime connected.");
    joinRealtimeBoard();
  });

  ws.addEventListener("message", (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    handleRealtimeMessage(message);
  });

  ws.addEventListener("close", () => {
    wsConnected = false;
    ws = null;
    if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
    if (wsShouldReconnect) wsReconnectTimer = setTimeout(connectRealtime, 1500);
  });
}

function getShapeGeometry(shapeType) {
  if (shapeType === "sphere") return new THREE.SphereGeometry(0.85, 40, 28);
  if (shapeType === "pyramid") return new THREE.ConeGeometry(1, 1.6, 4);
  if (shapeType === "prism") return new THREE.CylinderGeometry(0.95, 0.95, 1.6, 3);
  if (shapeType === "parallelepiped") return new THREE.BoxGeometry(1.9, 1.1, 1.4);
  if (shapeType === "cylinder") return new THREE.CylinderGeometry(0.85, 0.85, 1.8, 36);
  if (shapeType === "cone") return new THREE.ConeGeometry(0.95, 1.8, 36);
  return new THREE.BoxGeometry(1.5, 1.5, 1.5);
}

function ensureShapeRotation(item) {
  if (typeof item.rotX !== "number") item.rotX = 0;
  if (typeof item.rotY !== "number") item.rotY = 0;
  if (typeof item.rotZ !== "number") item.rotZ = 0;
}

function createShapeRenderer(container, item) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeef4ff);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 4);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.append(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  const key = new THREE.DirectionalLight(0xffffff, 0.8);
  key.position.set(3, 2.5, 4);
  const fill = new THREE.DirectionalLight(0x8fb8ff, 0.35);
  fill.position.set(-2, -1, -2);
  scene.add(ambient, key, fill);

  const geometry = getShapeGeometry(item.shapeType || "cube");
  const material = new THREE.MeshStandardMaterial({
    color: 0x2f6dff,
    metalness: 0.15,
    roughness: 0.45,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const resize = () => {
    const width = Math.max(container.clientWidth, 60);
    const height = Math.max(container.clientHeight, 60);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  };

  const applyRotation = (rx, ry, rz) => {
    mesh.rotation.set(rx, ry, rz);
    renderer.render(scene, camera);
  };

  ensureShapeRotation(item);
  applyRotation(item.rotX, item.rotY, item.rotZ);
  resize();

  const ro = new ResizeObserver(() => resize());
  ro.observe(container);

  return {
    scene,
    camera,
    renderer,
    mesh,
    resize,
    applyRotation,
    dispose: () => {
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      container.innerHTML = "";
    },
  };
}

function clearShapeRenderers() {
  for (const rendererState of shapeRenderers.values()) rendererState.dispose();
  shapeRenderers.clear();
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function clone(v) { return JSON.parse(JSON.stringify(v)); }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function sanitizeName(raw) { return raw.trim().toLowerCase(); }
function slugifyBoardName(raw) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "board";
}
function makeBoardCode(n) { return `B${String(n).padStart(4, "0")}`; }
function ensureBoardIdentity(board, fallbackNumber = 1) {
  if (typeof board.number !== "number" || !Number.isFinite(board.number) || board.number < 1) board.number = fallbackNumber;
  if (!board.shortCode) board.shortCode = makeBoardCode(board.number);
  if (!board.slug) board.slug = slugifyBoardName(board.name || "board");
}
function boardRouteSegment(board) { return `${board.shortCode}-${slugifyBoardName(board.name || board.slug || "board")}`; }
function parseBoardRouteToken(token) {
  if (!token) return { raw: "", shortCode: "", id: "" };
  const normalized = String(token).trim();
  const shortCode = normalized.match(/^(B\d{4,})/i)?.[1]?.toUpperCase() || "";
  return { raw: normalized, shortCode, id: normalized };
}
function findBoardByReference(ref) {
  if (!boardsState) return null;
  const parsed = parseBoardRouteToken(ref);
  return boardsState.boards.find((board) =>
    board.id === parsed.id ||
    board.id === parsed.raw ||
    board.shortCode === parsed.shortCode
  ) || null;
}

function setAuthMessage(msg, bad = false) {
  authMessage.textContent = msg;
  authMessage.style.color = bad ? "#b91c1c" : "#0f766e";
}
function setDashboardMessage(msg, bad = false) {
  dashboardMessage.textContent = msg;
  dashboardMessage.style.color = bad ? "#b91c1c" : "#0f766e";
}
function setStatus(msg) { statusText.textContent = msg; }
function setDebugCoordsText(msg) { if (debugCoords) debugCoords.textContent = msg; }
function updateDebugCoords(clientX, clientY) {
  if (!activeBoard) {
    setDebugCoordsText("X: -, Y: -");
    return;
  }
  const p = boardSpaceFromClient(clientX, clientY);
  const strokePoints = drawState.stroke?.points?.length || 0;
  setDebugCoordsText(`X: ${Math.round(p.x)}, Y: ${Math.round(p.y)} | Zoom: ${viewState.zoom.toFixed(2)} | Stroke: ${strokePoints}`);
}
function isDrawMode() { return toolState.mode === "draw" && toolState.drawSubtool === "pen"; }
function isEraserMode() { return toolState.mode === "draw" && toolState.drawSubtool === "eraser"; }
function isCursorMode() { return toolState.mode === "cursor"; }
function isSelectMode() { return toolState.mode === "select"; }

function setToolMode(mode, drawSubtool = null) {
  toolState.mode = mode;
  if (drawSubtool) toolState.drawSubtool = drawSubtool;

  toolCursorBtn.classList.toggle("active", mode === "cursor");
  toolSelectBtn.classList.toggle("active", mode === "select");
  toolDrawBtn.classList.toggle("active", mode === "draw" && toolState.drawSubtool === "pen");
  toolEraserBtn.classList.toggle("active", mode === "draw" && toolState.drawSubtool === "eraser");

  boardViewport.style.cursor = mode === "draw" ? (toolState.drawSubtool === "eraser" ? "cell" : "crosshair") : "default";
}

function clearSelection() {
  selectionState.itemIds.clear();
  selectionState.strokeIds.clear();
}

function selectAllOnBoard() {
  if (!activeBoard) return;
  selectionState.itemIds = new Set(activeBoard.items.map((item) => item.id));
  selectionState.strokeIds = new Set(activeBoard.drawings.map((_, idx) => idx));
  renderBoard();
}

function deleteSelection() {
  if (!activeBoard) return;
  if (selectionState.itemIds.size === 0 && selectionState.strokeIds.size === 0) return;
  pushHistory();
  activeBoard.items = activeBoard.items.filter((item) => !selectionState.itemIds.has(item.id));
  activeBoard.drawings = activeBoard.drawings.filter((_, idx) => !selectionState.strokeIds.has(idx));
  clearSelection();
  renderBoard();
  scheduleSave("Selection deleted and saved.");
}

function hitStrokeIndex(boardX, boardY) {
  if (!activeBoard) return -1;
  const threshold = 10 / viewState.zoom;
  const t2 = threshold * threshold;
  for (let i = activeBoard.drawings.length - 1; i >= 0; i -= 1) {
    const stroke = activeBoard.drawings[i];
    for (const p of stroke.points || []) {
      const dx = p.x - boardX;
      const dy = p.y - boardY;
      if (dx * dx + dy * dy <= t2) return i;
    }
  }
  return -1;
}

function getUsers() { return readJSON(STORAGE_USERS, {}); }
function setUsers(users) { writeJSON(STORAGE_USERS, users); }

function defaultBoard(name = "My First Board") {
  const now = new Date().toISOString();
  const board = { id: crypto.randomUUID(), name, createdAt: now, updatedAt: now, nextId: 1, view: { x: 200, y: 120, zoom: 1 }, items: [], drawings: [] };
  ensureBoardIdentity(board, 1);
  return board;
}

function ensureBoardsState(state) {
  if (!state || !Array.isArray(state.boards) || state.boards.length === 0) {
    const b = defaultBoard();
    return { activeBoardId: b.id, nextBoardNumber: 2, boards: [b] };
  }
  let maxBoardNumber = 0;
  for (const b of state.boards) {
    if (!Array.isArray(b.items)) b.items = [];
    if (!Array.isArray(b.drawings)) b.drawings = [];
    if (!b.view) b.view = { x: 200, y: 120, zoom: 1 };
    if (!b.createdAt) b.createdAt = new Date().toISOString();
    if (!b.updatedAt) b.updatedAt = b.createdAt;
    if (typeof b.nextId !== "number") b.nextId = 1;
    ensureBoardIdentity(b, maxBoardNumber + 1);
    if (b.number > maxBoardNumber) maxBoardNumber = b.number;
  }
  if (typeof state.nextBoardNumber !== "number" || state.nextBoardNumber <= maxBoardNumber) state.nextBoardNumber = maxBoardNumber + 1;
  if (!state.activeBoardId || !state.boards.some((b) => b.id === state.activeBoardId)) state.activeBoardId = state.boards[0].id;
  return state;
}

function loadBoardsState() {
  const s = ensureBoardsState(readJSON(STORAGE_SHARED_BOARDS, null));
  writeJSON(STORAGE_SHARED_BOARDS, s);
  return s;
}
function saveBoardsState() {
  if (!boardsState) return;
  writeJSON(STORAGE_SHARED_BOARDS, boardsState);
}

function getRouteBoardId() {
  const m = location.hash.match(/^#\/board\/([A-Za-z0-9-]+)$/);
  return m ? m[1] : null;
}
function setBoardRoute(id) {
  const board = findBoardByReference(id);
  const routeValue = board ? boardRouteSegment(board) : id;
  const h = `#/board/${routeValue}`;
  if (location.hash !== h) location.hash = h;
}
function setBoardsRoute() { if (location.hash !== "#/boards") location.hash = "#/boards"; }
function makeSharePayload(board) {
  return JSON.stringify({
    id: board.id,
    name: board.name,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    nextId: board.nextId,
    view: board.view,
    items: board.items,
    drawings: board.drawings,
  });
}
function readSharePayload() {
  const params = new URLSearchParams(location.search);
  const raw = params.get("share");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function importBoardFromShareIfNeeded(boardId) {
  if (!boardsState) return false;
  if (findBoardByReference(boardId)) return true;
  const shared = readSharePayload();
  const parsed = parseBoardRouteToken(boardId);
  if (!shared || (shared.id !== parsed.id && shared.id !== parsed.raw)) return false;

  const imported = ensureBoardsState({ activeBoardId: shared.id, nextBoardNumber: boardsState.nextBoardNumber + 1, boards: [shared] }).boards[0];
  ensureBoardIdentity(imported, boardsState.nextBoardNumber);
  boardsState.nextBoardNumber = Math.max(boardsState.nextBoardNumber, imported.number + 1);
  boardsState.boards.push(imported);
  boardsState.activeBoardId = shared.id;
  saveBoardsState();
  return true;
}
function boardLink(id) {
  const board = findBoardByReference(id);
  const routeValue = board ? boardRouteSegment(board) : id;
  return `${location.origin}${location.pathname}#/board/${routeValue}`;
}
function syncShareUrlForBoard(id) {
  if (!boardsState) return;
  const url = boardLink(id);
  history.replaceState(null, "", url);
}

function showView(view) {
  authView.classList.toggle("hidden", view !== "auth");
  dashboardView.classList.toggle("hidden", view !== "dashboard");
  boardView.classList.toggle("hidden", view !== "board");
}

function getActiveBoard() {
  if (!boardsState) return null;
  return boardsState.boards.find((b) => b.id === boardsState.activeBoardId) || null;
}

function ensureHistory(id) {
  if (!historyState.byBoard.has(id)) historyState.byBoard.set(id, { undo: [], redo: [] });
  return historyState.byBoard.get(id);
}
function boardSnapshot(board) {
  return { items: clone(board.items), drawings: clone(board.drawings), view: clone(board.view), nextId: board.nextId };
}
function pushHistory() {
  if (!activeBoard || historyState.restoring) return;
  const h = ensureHistory(activeBoard.id);
  h.undo.push(boardSnapshot(activeBoard));
  if (h.undo.length > 120) h.undo.shift();
  h.redo = [];
}

function applyBoardSnapshot(board, snap) {
  board.items = clone(snap.items);
  board.drawings = clone(snap.drawings);
  board.view = clone(snap.view);
  board.nextId = snap.nextId;
}

function scheduleSave(msg = "Saved.") {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!activeBoard) return;
    activeBoard.updatedAt = new Date().toISOString();
    activeBoard.view = { ...viewState };
    saveBoardsState();
    setStatus(msg);
    renderBoardsList();
    if (!boardView.classList.contains("hidden")) syncShareUrlForBoard(activeBoard.id);
  }, 180);
}

function renderBoardsList() {
  if (!boardsState) return;
  boardsList.innerHTML = "";
  const sorted = [...boardsState.boards].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  for (const board of sorted) {
    const row = document.createElement("div");
    row.className = "board-row";

    const meta = document.createElement("div");
    meta.className = "board-meta";
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = `${board.shortCode} ${board.name}`;
    const date = document.createElement("div");
    date.className = "muted small";
    date.textContent = `Updated: ${new Date(board.updatedAt).toLocaleString()}`;
    meta.append(name, date);

    const joinBtn = document.createElement("button");
    joinBtn.className = "btn primary";
    joinBtn.textContent = "Join";
    joinBtn.addEventListener("click", () => openBoard(board.id));

    const actions = document.createElement("div");
    actions.className = "row gap";

    const linkBtn = document.createElement("button");
    linkBtn.className = "btn";
    linkBtn.textContent = "Copy Link";
    linkBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(boardLink(board.id));
        setDashboardMessage("Board link copied.");
      } catch {
        setDashboardMessage(boardLink(board.id));
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      if (!confirm(`Delete board \"${board.name}\"?`)) return;
      boardsState.boards = boardsState.boards.filter((b) => b.id !== board.id);
      if (boardsState.boards.length === 0) boardsState.boards.push(defaultBoard());
      boardsState.activeBoardId = boardsState.boards[0].id;
      saveBoardsState();
      renderBoardsList();
      setDashboardMessage("Board deleted.");
    });

    actions.append(linkBtn, deleteBtn);
    row.append(meta, joinBtn, actions);
    boardsList.append(row);
  }
}
function showDashboard() {
  showView("dashboard");
  dashboardUserText.textContent = `User: ${currentUser}`;
  renderBoardsList();
  setBoardsRoute();
}

function loadBoardView() {
  activeBoard = getActiveBoard();
  if (!activeBoard) return;
  Object.assign(viewState, activeBoard.view || { x: 200, y: 120, zoom: 1 });
  applyView();
}

function updateGridTransform() {
  const scaled = clamp(GRID_BASE * viewState.zoom, 6, 96);
  const offsetX = ((viewState.x % scaled) + scaled) % scaled;
  const offsetY = ((viewState.y % scaled) + scaled) % scaled;
  boardViewport.style.setProperty("--grid-size", `${scaled}px`);
  boardViewport.style.setProperty("--grid-offset-x", `${offsetX}px`);
  boardViewport.style.setProperty("--grid-offset-y", `${offsetY}px`);
}

function applyView() {
  boardInner.style.transform = `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.zoom})`;
  updateGridTransform();
  renderPresence();
}

function boardSpaceFromClient(clientX, clientY) {
  const rect = boardViewport.getBoundingClientRect();
  return {
    x: (clientX - rect.left - viewState.x) / viewState.zoom,
    y: (clientY - rect.top - viewState.y) / viewState.zoom,
  };
}

function nextItemId() {
  const id = activeBoard.nextId;
  activeBoard.nextId += 1;
  return id;
}

function buildPathData(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.01} ${points[0].y + 0.01}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) d += ` L ${points[i].x} ${points[i].y}`;
  return d;
}

function createDrawLayer() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "draw-layer");
  svg.setAttribute("viewBox", `${BOARD_COORD_MIN} ${BOARD_COORD_MIN} ${BOARD_COORD_SIZE} ${BOARD_COORD_SIZE}`);
  return svg;
}

function renderDrawings() {
  if (!drawLayer || !activeBoard) return;
  drawLayer.innerHTML = "";
  for (let i = 0; i < activeBoard.drawings.length; i += 1) {
    const stroke = activeBoard.drawings[i];
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("class", "draw-path");
    const selected = selectionState.strokeIds.has(i);
    p.setAttribute("stroke", selected ? "#ff7b00" : stroke.color);
    p.setAttribute("stroke-width", String(selected ? stroke.size + 1.2 : stroke.size));
    p.setAttribute("d", buildPathData(stroke.points));
    if (selected) p.setAttribute("stroke-dasharray", "5 3");
    drawLayer.append(p);
  }
}

function beginDrawing(event) {
  if (!activeBoard || isSpacePressed) return;
  if (!isDrawMode() && !isEraserMode()) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  if (event.target.closest(".board-item")) return;

  event.preventDefault();
  event.stopPropagation();
  const pos = boardSpaceFromClient(event.clientX, event.clientY);

  if (isEraserMode()) {
    drawState.active = true;
    drawState.pointerId = event.pointerId;
    if (boardViewport.setPointerCapture) boardViewport.setPointerCapture(event.pointerId);
    const strokeIdx = hitStrokeIndex(pos.x, pos.y);
    if (strokeIdx >= 0) {
      pushHistory();
      activeBoard.drawings.splice(strokeIdx, 1);
      renderDrawings();
      scheduleSave("Stroke erased and saved.");
    }
    return;
  }

  pushHistory();
  const pressure = event.pointerType === "pen" ? clamp(event.pressure || 0.5, 0.25, 1.4) : 1;
  const stroke = {
    id: crypto.randomUUID(),
    color: toolColorInput.value,
    size: Math.round((Number(toolSizeInput.value) || 3) * pressure * 10) / 10,
    points: [pos],
  };

  activeBoard.drawings.push(stroke);
  const pathEl = document.createElementNS(SVG_NS, "path");
  pathEl.setAttribute("class", "draw-path");
  pathEl.setAttribute("stroke", stroke.color);
  pathEl.setAttribute("stroke-width", String(stroke.size));
  pathEl.setAttribute("d", buildPathData(stroke.points));
  drawLayer.append(pathEl);

  drawState.active = true;
  drawState.pointerId = event.pointerId;
  drawState.stroke = stroke;
  drawState.pathEl = pathEl;
  if (boardViewport.setPointerCapture) boardViewport.setPointerCapture(event.pointerId);
}

function continueDrawing(event) {
  if (isEraserMode()) {
    if (!drawState.active || event.pointerId !== drawState.pointerId) return;
    const pos = boardSpaceFromClient(event.clientX, event.clientY);
    const strokeIdx = hitStrokeIndex(pos.x, pos.y);
    if (strokeIdx >= 0) {
      pushHistory();
      activeBoard.drawings.splice(strokeIdx, 1);
      renderDrawings();
      scheduleSave("Stroke erased and saved.");
    }
    return;
  }

  if (!drawState.active || event.pointerId !== drawState.pointerId) return;
  event.preventDefault();
  const pos = boardSpaceFromClient(event.clientX, event.clientY);
  const prev = drawState.stroke.points[drawState.stroke.points.length - 1];
  const dx = pos.x - prev.x;
  const dy = pos.y - prev.y;
  if (dx * dx + dy * dy < 0.8) return;
  drawState.stroke.points.push(pos);
  drawState.pathEl.setAttribute("d", buildPathData(drawState.stroke.points));
}

function endDrawing(event) {
  if (isEraserMode()) {
    if (!drawState.active || event.pointerId !== drawState.pointerId) return;
    drawState.active = false;
    drawState.pointerId = null;
    if (boardViewport.releasePointerCapture && boardViewport.hasPointerCapture(event.pointerId)) {
      boardViewport.releasePointerCapture(event.pointerId);
    }
    return;
  }
  if (!drawState.active || event.pointerId !== drawState.pointerId) return;
  drawState.active = false;
  drawState.pointerId = null;
  drawState.stroke = null;
  drawState.pathEl = null;
  if (boardViewport.releasePointerCapture && boardViewport.hasPointerCapture(event.pointerId)) boardViewport.releasePointerCapture(event.pointerId);
  scheduleSave("Ink stroke saved.");
}

function beginPan(event) {
  if (!activeBoard) return;
  if (event.target.closest(".board-item")) return;
  const panGesture = isSpacePressed || (event.button === 1 && !isDrawMode()) || isCursorMode();
  if (!panGesture) return;
  event.preventDefault();
  isPanning = true;
  panStart = { x: event.clientX, y: event.clientY, originX: viewState.x, originY: viewState.y };
}

function movePan(event) {
  if (!isPanning) return;
  viewState.x = panStart.originX + (event.clientX - panStart.x);
  viewState.y = panStart.originY + (event.clientY - panStart.y);
  applyView();
}

function endPan() {
  if (!isPanning) return;
  isPanning = false;
  scheduleSave("View moved and saved.");
}

function zoomBoard(event) {
  event.preventDefault();
  const rect = boardViewport.getBoundingClientRect();
  const mx = event.clientX - rect.left;
  const my = event.clientY - rect.top;
  const old = viewState.zoom;
  const wx = (mx - viewState.x) / old;
  const wy = (my - viewState.y) / old;
  viewState.zoom = clamp(old * Math.exp(-event.deltaY * 0.0015), 0.2, 3.2);
  viewState.x = mx - wx * viewState.zoom;
  viewState.y = my - wy * viewState.zoom;
  applyView();
  scheduleSave("Zoom saved.");
}

function setDropOverlayVisible(v) { dropOverlay.classList.toggle("hidden", !v); }

function classifyFile(file) {
  const lower = file.name.toLowerCase();
  const ext = lower.includes(".") ? lower.split(".").pop() : "";
  if (file.type === "application/pdf" || ext === "pdf") return "pdf";
  if (file.type.startsWith("image/") || IMAGE_EXTS.has(ext)) return "image";
  return null;
}

async function openFilesDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("miro_clone_files_v1", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putFileRecord(record) {
  const db = await openFilesDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function getFileRecord(id) {
  const db = await openFilesDb();
  const result = await new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const req = tx.objectStore("files").get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

function pythonCompletionSource(context) {
  const word = context.matchBefore(/\w*/);
  if (!word || (!word.text && !context.explicit)) return null;
  return {
    from: word.from,
    options: PYTHON_COMPLETIONS
      .filter((label) => label.startsWith(word.text))
      .map((label) => ({ label, type: "keyword" })),
  };
}

function getCodeEditorWorkerSource() {
  return `
let pyodideReadyPromise = null;
async function ensurePyodide() {
  if (!pyodideReadyPromise) {
    importScripts("${PYODIDE_INDEX_URL}pyodide.js");
    pyodideReadyPromise = loadPyodide({ indexURL: "${PYODIDE_INDEX_URL}" });
  }
  return pyodideReadyPromise;
}
self.onmessage = async (event) => {
  const { type, code } = event.data || {};
  if (type !== "run") return;
  try {
    const pyodide = await ensurePyodide();
    if (pyodide.setStdout) pyodide.setStdout({ batched: (msg) => self.postMessage({ type: "stdout", message: msg }) });
    if (pyodide.setStderr) pyodide.setStderr({ batched: (msg) => self.postMessage({ type: "stderr", message: msg }) });
    await pyodide.runPythonAsync(code || "");
    self.postMessage({ type: "done" });
  } catch (error) {
    self.postMessage({ type: "stderr", message: error && error.message ? error.message : String(error) });
    self.postMessage({ type: "done", error: true });
  }
};
`;
}

function makeCodeEditorWorker() {
  const blob = new Blob([getCodeEditorWorkerSource()], { type: "text/javascript" });
  const objectUrl = URL.createObjectURL(blob);
  const worker = new Worker(objectUrl);
  worker._objectUrl = objectUrl;
  return worker;
}

function clearCodeEditorWidgets() {
  for (const widget of codeEditorWidgets.values()) {
    if (widget.worker) widget.worker.terminate();
    if (widget.editorView) widget.editorView.destroy();
    if (widget.worker?._objectUrl) URL.revokeObjectURL(widget.worker._objectUrl);
  }
  codeEditorWidgets.clear();
}

function appendConsoleMessage(consoleEl, text, tone = "log") {
  const line = document.createElement("div");
  line.className = tone === "error"
    ? "tw-text-rose-300 tw-whitespace-pre-wrap"
    : "tw-text-emerald-300 tw-whitespace-pre-wrap";
  line.textContent = text;
  consoleEl.append(line);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

function renderCodeEditorFallback(body, message) {
  body.className = "item-body";
  body.innerHTML = "";
  const shell = document.createElement("div");
  shell.style.height = "100%";
  shell.style.display = "flex";
  shell.style.flexDirection = "column";
  shell.style.background = "#020617";
  shell.style.color = "#e2e8f0";
  shell.style.padding = "16px";

  const heading = document.createElement("div");
  heading.style.fontWeight = "700";
  heading.style.marginBottom = "8px";
  heading.textContent = "Code Editor could not initialize";

  const pre = document.createElement("pre");
  pre.style.margin = "0";
  pre.style.whiteSpace = "pre-wrap";
  pre.style.fontFamily = "Consolas, Monaco, monospace";
  pre.style.fontSize = "12px";
  pre.style.color = "#fda4af";
  pre.textContent = message;

  shell.append(heading, pre);
  body.append(shell);
}

function createPythonExtensions() {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    history(),
    drawSelection(),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    foldGutter(),
    highlightActiveLine(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap, indentWithTab]),
    python(),
    autocompletion({ override: [pythonCompletionSource] }),
    oneDark,
    EditorView.lineWrapping,
    EditorView.theme({
      "&": { height: "100%", fontSize: "13px" },
      ".cm-scroller": { overflow: "auto", fontFamily: "Consolas, Monaco, monospace" },
      ".cm-content": { padding: "12px 0" },
      ".cm-gutters": { backgroundColor: "#111827", color: "#6b7280", border: "none" },
    }),
  ];
}

function makeItemShell(item) {
  const card = document.createElement("article");
  card.className = "board-item";
  card.dataset.itemId = String(item.id);
  if (selectionState.itemIds.has(item.id)) card.classList.add("selected");
  card.style.left = `${item.x}px`;
  card.style.top = `${item.y}px`;
  card.style.width = `${item.width}px`;
  card.style.height = `${item.height}px`;

  const header = document.createElement("div");
  header.className = "item-header";
  const title = document.createElement("span");
  title.textContent = item.name || item.type.toUpperCase();
  const remove = document.createElement("button");
  remove.className = "btn";
  remove.textContent = "X";
  remove.style.padding = "0.08rem 0.35rem";
  remove.style.fontSize = "0.75rem";
  remove.addEventListener("click", () => {
    pushHistory();
    const codeWidget = codeEditorWidgets.get(item.id);
    if (codeWidget) {
      if (codeWidget.worker) codeWidget.worker.terminate();
      if (codeWidget.worker?._objectUrl) URL.revokeObjectURL(codeWidget.worker._objectUrl);
      if (codeWidget.editorView) codeWidget.editorView.destroy();
      codeEditorWidgets.delete(item.id);
    }
    activeBoard.items = activeBoard.items.filter((it) => it.id !== item.id);
    card.remove();
    scheduleSave("Item deleted and saved.");
  });
  header.append(title, remove);

  const body = document.createElement("div");
  body.className = "item-body";
  card.append(header, body);

  card.addEventListener("pointerdown", (event) => {
    if (!isSelectMode()) return;
    event.stopPropagation();
    if (event.shiftKey) {
      if (selectionState.itemIds.has(item.id)) selectionState.itemIds.delete(item.id);
      else selectionState.itemIds.add(item.id);
    } else {
      selectionState.itemIds.clear();
      selectionState.itemIds.add(item.id);
    }
    renderBoard();
  });

  let dragging = false;
  let sx = 0;
  let sy = 0;
  let ox = 0;
  let oy = 0;
  let pushed = false;
  header.addEventListener("mousedown", (event) => {
    if ((isDrawMode() || isEraserMode()) || event.button !== 0) return;
    event.preventDefault();
    dragging = true;
    pushed = false;
    sx = event.clientX;
    sy = event.clientY;
    ox = item.x;
    oy = item.y;

    const mm = (e) => {
      if (!dragging) return;
      if (!pushed) {
        pushHistory();
        pushed = true;
      }
      const dx = (e.clientX - sx) / viewState.zoom;
      const dy = (e.clientY - sy) / viewState.zoom;
      const movingIds = isSelectMode() && selectionState.itemIds.size > 0
        ? [...selectionState.itemIds]
        : [item.id];
      const movingItems = activeBoard.items.filter((it) => movingIds.includes(it.id));
      for (const it of movingItems) {
        if (!it._dragStart) it._dragStart = { x: it.x, y: it.y };
        it.x = it._dragStart.x + dx;
        it.y = it._dragStart.y + dy;
        const node = boardInner.querySelector(`.board-item[data-item-id='${it.id}']`);
        if (node) {
          node.style.left = `${it.x}px`;
          node.style.top = `${it.y}px`;
        }
      }

      if (isSelectMode() && selectionState.strokeIds.size > 0) {
        for (const strokeIdx of selectionState.strokeIds) {
          const stroke = activeBoard.drawings[strokeIdx];
          if (!stroke) continue;
          if (!stroke._dragStart) stroke._dragStart = stroke.points.map((p) => ({ x: p.x, y: p.y }));
          stroke.points = stroke._dragStart.map((p) => ({ x: p.x + dx, y: p.y + dy }));
        }
        renderDrawings();
      }
    };
    const mu = () => {
      if (!dragging) return;
      dragging = false;
      for (const it of activeBoard.items) delete it._dragStart;
      for (const stroke of activeBoard.drawings) delete stroke._dragStart;
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      scheduleSave("Item moved and saved.");
    };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
  });

  const ro = new ResizeObserver(() => {
    item.width = Math.round(card.offsetWidth);
    item.height = Math.round(card.offsetHeight);
    scheduleSave("Item resized and saved.");
  });
  ro.observe(card);

  return { card, body };
}

async function renderImageItem(item, body) {
  const record = await getFileRecord(item.fileId);
  if (!record?.blob) return;
  const img = document.createElement("img");
  const url = URL.createObjectURL(record.blob);
  img.src = url;
  img.alt = item.name;
  img.addEventListener("load", () => URL.revokeObjectURL(url), { once: true });
  body.append(img);
}

async function renderPdfItem(item, body) {
  const record = await getFileRecord(item.fileId);
  if (!record?.blob) return;
  const wrap = document.createElement("div");
  wrap.className = "pdf-pages";
  body.append(wrap);

  const bytes = await record.blob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const un = page.getViewport({ scale: 1 });
    const scale = Math.max(180, item.width - 18) / un.width;
    const vp = page.getViewport({ scale });
    const c = document.createElement("canvas");
    c.className = "pdf-page";
    c.width = vp.width;
    c.height = vp.height;
    await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
    wrap.append(c);
  }
}

function renderStickyItem(item, body) {
  const sticky = document.createElement("div");
  sticky.className = "sticky";
  sticky.contentEditable = "true";
  sticky.textContent = item.text || "Write notes here";
  sticky.addEventListener("input", () => {
    item.text = sticky.textContent || "";
    scheduleSave("Sticky updated and saved.");
  });
  body.append(sticky);
}

function renderShapeItem(item, body) {
  ensureShapeRotation(item);

  const wrap = document.createElement("div");
  wrap.className = "shape3d-wrap";
  body.append(wrap);

  const rendererState = createShapeRenderer(wrap, item);
  shapeRenderers.set(item.id, rendererState);

  let rotating = false;
  let lastX = 0;
  let lastY = 0;
  let lastSent = 0;

  const sendRotation = (force = false) => {
    const now = Date.now();
    if (!force && now - lastSent < 40) return;
    lastSent = now;
    wsSend({
      type: "shape_rotation",
      boardId: activeBoard?.id,
      itemId: item.id,
      rotX: item.rotX,
      rotY: item.rotY,
      rotZ: item.rotZ,
      sessionId,
    });
  };

  wrap.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    rotating = true;
    wrap.classList.add("dragging");
    lastX = event.clientX;
    lastY = event.clientY;
    pushHistory();
    if (wrap.setPointerCapture) wrap.setPointerCapture(event.pointerId);
  });

  wrap.addEventListener("pointermove", (event) => {
    if (!rotating) return;
    event.preventDefault();
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;

    item.rotY += dx * 0.01;
    item.rotX += dy * 0.01;
    rendererState.applyRotation(item.rotX, item.rotY, item.rotZ);
    sendRotation(false);
  });

  const finishRotate = (event) => {
    if (!rotating) return;
    rotating = false;
    wrap.classList.remove("dragging");
    if (wrap.releasePointerCapture && wrap.hasPointerCapture(event.pointerId)) wrap.releasePointerCapture(event.pointerId);
    sendRotation(true);
    scheduleSave("3D shape rotation saved.");
  };

  wrap.addEventListener("pointerup", finishRotate);
  wrap.addEventListener("pointercancel", finishRotate);
}

function renderCodeEditorItem(item, body) {
  try {
    if (!item.code) {
      item.code = [
        "def greet(name):",
        "    print(f'Hello, {name}!')",
        "",
        "for person in ['Miro', 'BoardSpace']:",
        "    greet(person)",
      ].join("\n");
    }
    if (typeof item.consoleHeight !== "number") item.consoleHeight = 160;

    body.className = "item-body tw-bg-slate-950 tw-text-slate-100 tw-overflow-hidden";

    const shell = document.createElement("div");
    shell.className = "tw-h-full tw-flex tw-flex-col tw-bg-slate-950 tw-text-slate-100 dark";

    const toolbar = document.createElement("div");
    toolbar.className = "tw-flex tw-items-center tw-justify-between tw-gap-3 tw-border-b tw-border-slate-800 tw-bg-slate-900/95 tw-px-3 tw-py-2";

    const title = document.createElement("div");
    title.className = "tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.28em] tw-text-slate-400";
    title.textContent = "Python Code Editor";

    const controls = document.createElement("div");
    controls.className = "tw-flex tw-items-center tw-gap-2";

    const status = document.createElement("span");
    status.className = "tw-text-xs tw-text-slate-400";
    status.textContent = "Idle";

    const runBtn = document.createElement("button");
    runBtn.type = "button";
    runBtn.className = "tw-rounded-lg tw-bg-emerald-500 tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-emerald-400";
    runBtn.textContent = "Run";

    const stopBtn = document.createElement("button");
    stopBtn.type = "button";
    stopBtn.className = "tw-rounded-lg tw-bg-rose-500 tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-white hover:tw-bg-rose-400";
    stopBtn.textContent = "Stop";

    controls.append(status, runBtn, stopBtn);
    toolbar.append(title, controls);

    const editorHost = document.createElement("div");
    editorHost.className = "tw-min-h-0 tw-flex-1 tw-bg-slate-950";

    const resizeHandle = document.createElement("div");
    resizeHandle.className = "tw-h-2 tw-cursor-row-resize tw-bg-slate-800";

    const consoleWrap = document.createElement("div");
    consoleWrap.className = "tw-border-t tw-border-slate-800 tw-bg-black";
    consoleWrap.style.height = `${item.consoleHeight}px`;

    const consoleHead = document.createElement("div");
    consoleHead.className = "tw-flex tw-items-center tw-justify-between tw-border-b tw-border-slate-800 tw-bg-slate-950 tw-px-3 tw-py-2";
    consoleHead.innerHTML = '<span class="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.22em] tw-text-slate-500">Console</span>';

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "tw-text-xs tw-font-medium tw-text-slate-400 hover:tw-text-white";
    clearBtn.textContent = "Clear";
    consoleHead.append(clearBtn);

    const consoleEl = document.createElement("div");
    consoleEl.className = "tw-overflow-auto tw-p-3 tw-font-mono tw-text-xs tw-leading-6 tw-text-emerald-300";
    consoleEl.style.height = "calc(100% - 41px)";

    consoleWrap.append(consoleHead, consoleEl);
    shell.append(toolbar, editorHost, resizeHandle, consoleWrap);
    body.append(shell);

    const editorView = new EditorView({
      state: EditorState.create({
        doc: item.code,
        extensions: [
          ...createPythonExtensions(),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            item.code = update.state.doc.toString();
            scheduleSave("Code editor updated and saved.");
          }),
        ],
      }),
      parent: editorHost,
    });

    let worker = null;
    const spinWorker = () => {
      if (worker) {
        worker.terminate();
        if (worker._objectUrl) URL.revokeObjectURL(worker._objectUrl);
      }
      worker = makeCodeEditorWorker();
      worker.onmessage = (event) => {
        const data = event.data || {};
        if (data.type === "stdout") appendConsoleMessage(consoleEl, data.message, "log");
        if (data.type === "stderr") appendConsoleMessage(consoleEl, data.message, "error");
        if (data.type === "done") {
          status.textContent = data.error ? "Failed" : "Finished";
          runBtn.disabled = false;
          stopBtn.disabled = false;
        }
      };
      return worker;
    };
    spinWorker();

    runBtn.addEventListener("click", () => {
      status.textContent = "Running...";
      runBtn.disabled = true;
      stopBtn.disabled = false;
      consoleEl.innerHTML = "";
      appendConsoleMessage(consoleEl, "$ python main.py", "log");
      spinWorker().postMessage({ type: "run", code: editorView.state.doc.toString() });
    });

    stopBtn.addEventListener("click", () => {
      if (worker) worker.terminate();
      appendConsoleMessage(consoleEl, "Execution stopped.", "error");
      status.textContent = "Stopped";
      runBtn.disabled = false;
      stopBtn.disabled = false;
      spinWorker();
    });

    clearBtn.addEventListener("click", () => {
      consoleEl.innerHTML = "";
      status.textContent = "Idle";
    });

    let resizingConsole = false;
    let resizeStartY = 0;
    let resizeStartHeight = item.consoleHeight;
    resizeHandle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      resizingConsole = true;
      resizeStartY = event.clientY;
      resizeStartHeight = item.consoleHeight;
      resizeHandle.setPointerCapture?.(event.pointerId);
    });
    resizeHandle.addEventListener("pointermove", (event) => {
      if (!resizingConsole) return;
      const delta = resizeStartY - event.clientY;
      item.consoleHeight = clamp(resizeStartHeight + delta, 96, Math.max(120, item.height - 180));
      consoleWrap.style.height = `${item.consoleHeight}px`;
      editorView.requestMeasure();
    });
    const finishResize = (event) => {
      if (!resizingConsole) return;
      resizingConsole = false;
      resizeHandle.releasePointerCapture?.(event.pointerId);
      scheduleSave("Console resized and saved.");
    };
    resizeHandle.addEventListener("pointerup", finishResize);
    resizeHandle.addEventListener("pointercancel", finishResize);

    codeEditorWidgets.set(item.id, { editorView, worker });
  } catch (error) {
    console.error("Code editor render failed:", error);
    renderCodeEditorFallback(body, error?.stack || error?.message || String(error));
    setStatus("Code editor failed to initialize.");
  }
}

async function renderBoard() {
  clearShapeRenderers();
  clearCodeEditorWidgets();
  boardInner.innerHTML = "";
  drawLayer = createDrawLayer();
  if (!activeBoard) return;

  for (const item of activeBoard.items) {
    const { card, body } = makeItemShell(item);
    boardInner.append(card);
    if (item.type === "image") renderImageItem(item, body);
    if (item.type === "pdf") renderPdfItem(item, body);
    if (item.type === "sticky") renderStickyItem(item, body);
    if (item.type === "shape3d") renderShapeItem(item, body);
    if (item.type === "codeEditor") renderCodeEditorItem(item, body);
  }

  boardInner.append(drawLayer);
  renderDrawings();
  renderPresence();
  activeBoardTitle.textContent = `${activeBoard.shortCode} ${activeBoard.name}`;
  setStatus(`Loaded board: ${activeBoard.name}`);
}

async function handleFiles(files) {
  if (!activeBoard || files.length === 0) return;
  const accepted = files.map((f) => ({ f, kind: classifyFile(f) })).filter((x) => !!x.kind);
  if (accepted.length === 0) {
    setStatus("No supported files. Use gif/png/webp/jpg/jpeg/pdf.");
    return;
  }

  pushHistory();
  let x = 120;
  let y = 120;
  for (const { f, kind } of accepted) {
    const fileId = `${currentUser}_${crypto.randomUUID()}`;
    await putFileRecord({ id: fileId, owner: currentUser, name: f.name, mimeType: f.type, blob: f, kind, createdAt: new Date().toISOString() });
    activeBoard.items.push({ id: nextItemId(), type: kind, name: f.name, fileId, x, y, width: kind === "image" ? 340 : 360, height: kind === "image" ? 260 : 480 });
    x += 36;
    y += 36;
  }
  await renderBoard();
  scheduleSave(`${accepted.length} file(s) added and saved.`);
}

function addStickyAtCenter() {
  const center = boardSpaceFromClient(boardViewport.getBoundingClientRect().left + boardViewport.clientWidth / 2, boardViewport.getBoundingClientRect().top + boardViewport.clientHeight / 2);
  pushHistory();
  activeBoard.items.push({ id: nextItemId(), type: "sticky", name: "Sticky", text: "Type notes here", x: center.x, y: center.y, width: 220, height: 180 });
  renderBoard();
  scheduleSave("Sticky added and saved.");
}

function addCodeEditorAtCenter() {
  if (!activeBoard) return;
  const center = boardSpaceFromClient(
    boardViewport.getBoundingClientRect().left + boardViewport.clientWidth / 2,
    boardViewport.getBoundingClientRect().top + boardViewport.clientHeight / 2,
  );
  pushHistory();
  activeBoard.items.push({
    id: nextItemId(),
    type: "codeEditor",
    name: "Code Editor",
    code: "print('Hello from BoardSpace')\n",
    consoleHeight: 160,
    x: center.x,
    y: center.y,
    width: 560,
    height: 420,
  });
  renderBoard().catch((error) => {
    console.error("Failed to render code editor item:", error);
    setStatus("Code editor failed to render.");
  });
  scheduleSave("Code editor added and saved.");
}

function buildShapeItem(shapeType, overrides = {}) {
  const center = boardSpaceFromClient(
    boardViewport.getBoundingClientRect().left + boardViewport.clientWidth / 2,
    boardViewport.getBoundingClientRect().top + boardViewport.clientHeight / 2,
  );

  return {
    id: overrides.id ?? nextItemId(),
    type: "shape3d",
    name: `3D ${shapeType[0].toUpperCase()}${shapeType.slice(1)}`,
    shapeType,
    x: overrides.x ?? center.x,
    y: overrides.y ?? center.y,
    width: overrides.width ?? 360,
    height: overrides.height ?? 300,
    rotX: overrides.rotX ?? 0,
    rotY: overrides.rotY ?? 0,
    rotZ: overrides.rotZ ?? 0,
  };
}

function addShape3d(shapeType) {
  if (!activeBoard) return;
  pushHistory();
  const item = buildShapeItem(shapeType);
  activeBoard.items.push(item);
  renderBoard();
  scheduleSave("3D shape added and saved.");

  wsSend({
    type: "shape_create",
    boardId: activeBoard.id,
    item,
    sessionId,
  });
}

function openBoard(boardId, updateRoute = true) {
  const board = findBoardByReference(boardId);
  if (!board) {
    setDashboardMessage("Board not found.", true);
    showDashboard();
    return;
  }
  boardsState.activeBoardId = board.id;
  activeBoard = board;
  ensureHistory(board.id);
  loadBoardView();
  renderBoard();
  showView("board");
  welcomeText.textContent = `User: ${currentUser}`;
  if (updateRoute) setBoardRoute(board.id);
  syncShareUrlForBoard(board.id);
  joinRealtimeBoard();
}

function undo() {
  if (!activeBoard) return;
  const h = ensureHistory(activeBoard.id);
  const prev = h.undo.pop();
  if (!prev) return;
  h.redo.push(boardSnapshot(activeBoard));
  historyState.restoring = true;
  applyBoardSnapshot(activeBoard, prev);
  loadBoardView();
  renderBoard();
  historyState.restoring = false;
  scheduleSave("Undo saved.");
}

function redo() {
  if (!activeBoard) return;
  const h = ensureHistory(activeBoard.id);
  const next = h.redo.pop();
  if (!next) return;
  h.undo.push(boardSnapshot(activeBoard));
  historyState.restoring = true;
  applyBoardSnapshot(activeBoard, next);
  loadBoardView();
  renderBoard();
  historyState.restoring = false;
  scheduleSave("Redo saved.");
}

function eraseLastStroke() {
  if (!activeBoard || activeBoard.drawings.length === 0) return;
  pushHistory();
  activeBoard.drawings.pop();
  renderDrawings();
  scheduleSave("Last ink stroke erased and saved.");
}

function clearAllDrawings() {
  if (!activeBoard || activeBoard.drawings.length === 0) return;
  if (!confirm("Clear all drawings on this board?")) return;
  pushHistory();
  activeBoard.drawings = [];
  renderDrawings();
  scheduleSave("All ink cleared and saved.");
}

function renderPresence() {
  presenceLayer.innerHTML = "";
  if (!activeBoard) return;
  const now = Date.now();
  for (const peer of presenceState.peers.values()) {
    if (peer.boardId !== activeBoard.id || now - peer.ts > 7000) continue;
    const sx = peer.x * viewState.zoom + viewState.x;
    const sy = peer.y * viewState.zoom + viewState.y;
    const el = document.createElement("div");
    el.className = "presence-cursor";
    el.style.left = `${sx}px`;
    el.style.top = `${sy}px`;
    const dot = document.createElement("div");
    dot.className = "presence-dot";
    const name = document.createElement("div");
    name.className = "presence-name";
    name.textContent = peer.user;
    el.append(dot, name);
    presenceLayer.append(el);
  }
}

function initPresence() {
  if (!presenceState.channel) return;
  presenceState.channel.onmessage = (event) => {
    const msg = event.data;
    if (!msg || msg.sessionId === sessionId) return;
    if (msg.type === "cursor") {
      presenceState.peers.set(msg.sessionId, { sessionId: msg.sessionId, user: msg.user, boardId: msg.boardId, x: msg.x, y: msg.y, ts: Date.now() });
      renderPresence();
    }
    if (msg.type === "leave") {
      presenceState.peers.delete(msg.sessionId);
      renderPresence();
    }
  };
}

function handleRealtimeMessage(message) {
  if (!message || message.sessionId === sessionId) return;
  if (!boardsState) return;

  if (message.type === "shape_create") {
    const board = boardsState.boards.find((b) => b.id === message.boardId);
    if (!board || !message.item) return;
    if (board.items.some((it) => it.id === message.item.id)) return;
    board.items.push(message.item);
    if (activeBoard && activeBoard.id === board.id) renderBoard();
    saveBoardsState();
    return;
  }

  if (message.type === "shape_rotation") {
    const board = boardsState.boards.find((b) => b.id === message.boardId);
    if (!board) return;
    const item = board.items.find((it) => it.id === message.itemId && it.type === "shape3d");
    if (!item) return;
    item.rotX = message.rotX;
    item.rotY = message.rotY;
    item.rotZ = message.rotZ;
    if (activeBoard && activeBoard.id === board.id) {
      const rendererState = shapeRenderers.get(item.id);
      if (rendererState) rendererState.applyRotation(item.rotX, item.rotY, item.rotZ);
    }
    saveBoardsState();
  }
}

function broadcastPresence(type, payload = {}) {
  if (!presenceState.channel || !currentUser || !activeBoard) return;
  presenceState.channel.postMessage({ type, sessionId, user: currentUser, boardId: activeBoard.id, ...payload });
}

function broadcastCursor(clientX, clientY) {
  if (!activeBoard || !currentUser) return;
  const now = Date.now();
  if (now - presenceState.lastSentAt < 45) return;
  presenceState.lastSentAt = now;
  const p = boardSpaceFromClient(clientX, clientY);
  broadcastPresence("cursor", { x: p.x, y: p.y });
}
function handleViewportPointerMove(event) {
  updateDebugCoords(event.clientX, event.clientY);
  broadcastCursor(event.clientX, event.clientY);
}
function register() {
  const username = sanitizeName(usernameInput.value);
  const password = passwordInput.value;
  if (username.length < 3 || password.length < 4) {
    setAuthMessage("Username min 3 and password min 4 chars.", true);
    return;
  }

  const users = getUsers();
  if (users[username]) {
    setAuthMessage("User already exists. Use Login.", true);
    return;
  }
  users[username] = { password };
  setUsers(users);
  localStorage.setItem(STORAGE_SESSION, username);
  loadUserSession(username);
  setAuthMessage("Account registered.");
}

function login() {
  const username = sanitizeName(usernameInput.value);
  const password = passwordInput.value;
  const users = getUsers();
  if (!users[username]) {
    setAuthMessage("User not found. Register first.", true);
    return;
  }
  if (users[username].password !== password) {
    setAuthMessage("Wrong password.", true);
    return;
  }
  localStorage.setItem(STORAGE_SESSION, username);
  loadUserSession(username);
  setAuthMessage("Login successful.");
}

function logout() {
  broadcastPresence("leave");
  wsShouldReconnect = false;
  if (wsConnected && ws) {
    ws.close();
  }
  ws = null;
  wsConnected = false;
  localStorage.removeItem(STORAGE_SESSION);
  currentUser = null;
  boardsState = null;
  activeBoard = null;
  location.hash = "";
  showView("auth");
}

function loadUserSession(username) {
  currentUser = username;
  connectRealtime();
  boardsState = loadBoardsState();
  activeBoard = getActiveBoard();
  ensureHistory(activeBoard.id);

  const routeBoardId = getRouteBoardId();
  if (routeBoardId && importBoardFromShareIfNeeded(routeBoardId)) {
    openBoard(routeBoardId, false);
  } else {
    showDashboard();
  }
}

function createBoard(nameRaw) {
  const name = nameRaw.trim();
  if (!name) {
    setDashboardMessage("Board name is required.", true);
    return;
  }
  const b = defaultBoard(name);
  ensureBoardIdentity(b, boardsState.nextBoardNumber || 1);
  boardsState.nextBoardNumber = (boardsState.nextBoardNumber || 1) + 1;
  boardsState.boards.push(b);
  boardsState.activeBoardId = b.id;
  ensureHistory(b.id);
  saveBoardsState();
  renderBoardsList();
  setDashboardMessage("Board created.");
}

function copyActiveBoardLink() {
  if (!activeBoard) return;
  const link = boardLink(activeBoard.id);
  navigator.clipboard.writeText(link).then(() => setStatus("Board link copied."), () => setStatus(link));
}

function onHashChange() {
  if (!currentUser || !boardsState) return;
  const id = getRouteBoardId();
  if (id && importBoardFromShareIfNeeded(id)) {
    openBoard(id, false);
  } else {
    showDashboard();
    if (id) setDashboardMessage("Board not found locally.", true);
  }
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function onKeyDown(event) {
  if (event.code === "Space") isSpacePressed = true;
  if (isEditableTarget(event.target)) return;

  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    deleteSelection();
    return;
  }

  const cmd = event.ctrlKey || event.metaKey;
  if (!cmd) return;
  if (event.key.toLowerCase() === "a") {
    event.preventDefault();
    selectAllOnBoard();
    return;
  }
  if (event.key.toLowerCase() === "z" && !event.shiftKey) {
    event.preventDefault();
    undo();
    return;
  }
  if (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey)) {
    event.preventDefault();
    redo();
  }
}

function onKeyUp(event) {
  if (event.code === "Space") isSpacePressed = false;
}

function handleSelectOnBoard(event) {
  if (!isSelectMode()) return;
  if (event.target.closest(".board-item")) return;

  const pos = boardSpaceFromClient(event.clientX, event.clientY);
  const strokeIdx = hitStrokeIndex(pos.x, pos.y);

  if (!event.shiftKey) {
    selectionState.itemIds.clear();
    selectionState.strokeIds.clear();
  }

  if (strokeIdx >= 0) {
    if (selectionState.strokeIds.has(strokeIdx)) selectionState.strokeIds.delete(strokeIdx);
    else selectionState.strokeIds.add(strokeIdx);
  }

  renderBoard();
}

function bindEvents() {
  authForm.addEventListener("submit", (e) => { e.preventDefault(); login(); });
  registerBtn.addEventListener("click", register);
  loginBtn.addEventListener("click", login);

  dashboardLogoutBtn.addEventListener("click", logout);
  createBoardForm.addEventListener("submit", (e) => {
    e.preventDefault();
    createBoard(newBoardNameInput.value || "");
    newBoardNameInput.value = "";
  });

  backToBoardsBtn.addEventListener("click", showDashboard);
  logoutBtn.addEventListener("click", logout);
  copyBoardLinkBtn.addEventListener("click", copyActiveBoardLink);
  saveBoardBtn.addEventListener("click", () => { saveBoardsState(); setStatus("Saved manually."); });
  addStickyBtn.addEventListener("click", addStickyAtCenter);
  addCodeEditorBtn.addEventListener("click", addCodeEditorAtCenter);
  resetViewBtn.addEventListener("click", () => {
    pushHistory();
    Object.assign(viewState, { x: 200, y: 120, zoom: 1 });
    applyView();
    scheduleSave("View reset and saved.");
  });

  toolCursorBtn.addEventListener("click", () => setToolMode("cursor"));
  toolSelectBtn.addEventListener("click", () => setToolMode("select"));
  toolDrawBtn.addEventListener("click", () => setToolMode("draw", "pen"));
  toolEraserBtn.addEventListener("click", () => setToolMode("draw", "eraser"));
  toolSelectAllBtn.addEventListener("click", selectAllOnBoard);
  toolDeleteBtn.addEventListener("click", deleteSelection);

  toolColorInput.addEventListener("input", () => {
    // Color is intentionally placed in tool options for quick educational annotation changes.
  });

  addShape3dBtn.addEventListener("click", () => addShape3d(shapeTypeSelect.value || "cube"));
  clearDrawingsBtn.addEventListener("click", clearAllDrawings);
  undoBtn.addEventListener("click", undo);
  redoBtn.addEventListener("click", redo);

  fileInput.addEventListener("change", async () => {
    await handleFiles(Array.from(fileInput.files || []));
    fileInput.value = "";
  });

  boardViewport.addEventListener("mousedown", beginPan);
  window.addEventListener("mousemove", movePan);
  window.addEventListener("mouseup", endPan);
  boardViewport.addEventListener("wheel", zoomBoard, { passive: false });

  boardViewport.addEventListener("pointerdown", beginDrawing);
  boardViewport.addEventListener("pointermove", continueDrawing);
  boardViewport.addEventListener("pointerup", endDrawing);
  boardViewport.addEventListener("pointercancel", endDrawing);
  boardViewport.addEventListener("pointerdown", handleSelectOnBoard);
  boardViewport.addEventListener("pointermove", handleViewportPointerMove);
  boardViewport.addEventListener("pointerleave", () => {
    setDebugCoordsText("X: -, Y: -");
    broadcastPresence("leave");
  });
  boardViewport.style.touchAction = "none";

  boardViewport.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dragDepth += 1;
    setDropOverlayVisible(true);
  });
  boardViewport.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDropOverlayVisible(true);
  });
  boardViewport.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) setDropOverlayVisible(false);
  });
  boardViewport.addEventListener("drop", async (e) => {
    e.preventDefault();
    dragDepth = 0;
    setDropOverlayVisible(false);
    await handleFiles(Array.from(e.dataTransfer?.files || []));
  });

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", () => {
    isPanning = false;
    isSpacePressed = false;
    drawState.active = false;
    drawState.pointerId = null;
  });
  window.addEventListener("hashchange", onHashChange);
  window.addEventListener("beforeunload", () => broadcastPresence("leave"));
}

function bootstrap() {
  bindEvents();
  connectRealtime();
  initPresence();
  setToolMode("draw", "pen");
  updateGridTransform();

  const session = localStorage.getItem(STORAGE_SESSION);
  if (session && getUsers()[session]) loadUserSession(session);
  else showView("auth");
}

bootstrap();


