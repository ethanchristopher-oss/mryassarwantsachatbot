import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { listNotes, readNote, writeNote, getFolderStructure } from "./memory.js";
import { getHistory, clearHistory, loadSessions, createSession } from "./chat.js";
import { chatWithRag } from "./rag.js";
import { getSystemPrompt } from "./prompt.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: ["http://localhost:8000", "http://127.0.0.1:8000"] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "static")));

interface ChatRequest {
  session_id: string;
  message: string;
}

interface NoteRequest {
  path: string;
  content: string;
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "static", "index.html"));
});

app.post("/api/chat", async (req, res) => {
  try {
    const { session_id, message } = req.body as ChatRequest;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not set" });
    }
    const reply = await chatWithRag(session_id, message, apiKey);
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get("/api/history/:sessionId", (req, res) => {
  const messages = getHistory(req.params.sessionId);
  res.json({ messages });
});

app.delete("/api/history/:sessionId", (req, res) => {
  clearHistory(req.params.sessionId);
  res.json({ ok: true });
});

app.get("/api/sessions", (req, res) => {
  const sessions = loadSessions();
  res.json({
    sessions: Object.values(sessions).map((s) => ({
      id: s.id,
      preview: s.preview,
      updated: s.updated,
    })),
  });
});

app.get("/api/memory", (req, res) => {
  const notes = listNotes();
  const tree = getFolderStructure();
  res.json({ notes, tree });
});

app.get("/api/memory/note", (req, res) => {
  const notePath = req.query.path as string;
  if (!notePath) {
    return res.status(400).json({ error: "path required" });
  }
  const absMemoryDir = path.resolve(__dirname, "..", "memory");
  const absPath = path.resolve(notePath);
  if (!absPath.startsWith(absMemoryDir)) {
    return res.status(400).json({ error: "Path traversal rejected" });
  }
  const note = readNote(notePath);
  res.json(note);
});

app.put("/api/memory/note", (req, res) => {
  const { path: notePath, content } = req.body as NoteRequest;
  const absMemoryDir = path.resolve(__dirname, "..", "memory");
  const absPath = path.resolve(notePath);
  if (!absPath.startsWith(absMemoryDir)) {
    return res.status(400).json({ error: "Path traversal rejected" });
  }
  writeNote(notePath, content);
  res.json({ ok: true });
});

app.post("/api/memory/note", (req, res) => {
  const { path: notePath, content } = req.body as NoteRequest;
  const absMemoryDir = path.resolve(__dirname, "..", "memory");
  const absPath = path.resolve(notePath);
  if (!absPath.startsWith(absMemoryDir)) {
    return res.status(400).json({ error: "Path traversal rejected" });
  }
  writeNote(notePath, content);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});