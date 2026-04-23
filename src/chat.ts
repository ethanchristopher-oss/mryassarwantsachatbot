import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHAT_FILE = path.join(__dirname, "..", "sessions.json");

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  preview: string;
  updated: string;
}

function loadChats(): Record<string, Message[]> {
  if (!fs.existsSync(CHAT_FILE)) return {};
  return JSON.parse(fs.readFileSync(CHAT_FILE, "utf-8"));
}

function saveChats(chats: Record<string, Message[]>): void {
  fs.writeFileSync(CHAT_FILE, JSON.stringify(chats, null, 2), "utf-8");
}

export function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): void {
  const chats = loadChats();
  if (!chats[sessionId]) chats[sessionId] = [];
  chats[sessionId].push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });
  saveChats(chats);
}

export function getHistory(sessionId: string, limit = 20): Message[] {
  const chats = loadChats();
  const messages = chats[sessionId] || [];
  return messages.slice(-limit);
}

export function clearHistory(sessionId: string): void {
  const chats = loadChats();
  if (chats[sessionId]) {
    delete chats[sessionId];
    saveChats(chats);
  }
}

export function loadSessions(): Record<string, Session> {
  const chats = loadChats();
  const sessions: Record<string, Session> = {};
  for (const id of Object.keys(chats)) {
    const messages = chats[id];
    const last = messages[messages.length - 1];
    sessions[id] = {
      id,
      preview: last?.content.slice(0, 50) || "New chat",
      updated: last?.timestamp || new Date().toISOString(),
    };
  }
  return sessions;
}

export function createSession(sessionId: string): void {
  const chats = loadChats();
  if (!chats[sessionId]) {
    chats[sessionId] = [];
    saveChats(chats);
  }
}