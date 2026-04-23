import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_DIR = path.join(__dirname, "..", "memory");

export interface Note {
  path: string;
  title: string;
  tags: string[];
  links: string[];
  updated: number;
}

export interface NoteDetail {
  content: string;
  frontmatter: Record<string, unknown>;
  links: string[];
  path: string;
}

export interface FolderNode {
  name: string;
  path: string;
  type: "folder" | "file";
  children?: FolderNode[];
}

export function listNotes(): Note[] {
  const notesDir = path.join(MEMORY_DIR);
  if (!fs.existsSync(notesDir)) return [];

  const notes: Note[] = [];
  const walk = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (file.endsWith(".md")) {
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const parsed = matter(content);
          const title =
            (parsed.data.title as string) || path.basename(filePath, ".md");
          const links = (content.match(/\[\[([^\]]+)\]\]/g) || []).map((m) =>
            m.slice(2, -2)
          );
          notes.push({
            path: filePath,
            title,
            tags: (parsed.data.tags as string[]) || [],
            links,
            updated: stat.mtimeMs,
          });
        } catch {
          notes.push({
            path: filePath,
            title: path.basename(filePath, ".md"),
            tags: [],
            links: [],
            updated: stat.mtimeMs,
          });
        }
      }
    }
  };
  walk(notesDir);
  return notes;
}

export function readNote(notePath: string): NoteDetail {
  if (!fs.existsSync(notePath)) {
    return { content: "", frontmatter: {}, links: [], path: notePath };
  }
  const content = fs.readFileSync(notePath, "utf-8");
  const parsed = matter(content);
  const links = (content.match(/\[\[([^\]]+)\]\]/g) || []).map((m) =>
    m.slice(2, -2)
  );
  return {
    content: parsed.content,
    frontmatter: parsed.data,
    links,
    path: notePath,
  };
}

export function writeNote(notePath: string, content: string): void {
  const dir = path.dirname(notePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(notePath, content, "utf-8");
}

export function getFolderStructure(dirPath?: string): FolderNode {
  const target = dirPath || MEMORY_DIR;
  if (!fs.existsSync(target)) {
    return { name: "memory", path: target, type: "folder", children: [] };
  }
  const stat = fs.statSync(target);
  const node: FolderNode = {
    name: path.basename(target),
    path: target,
    type: stat.isDirectory() ? "folder" : "file",
    children: [],
  };
  if (stat.isDirectory()) {
    const files = fs.readdirSync(target).sort();
    for (const file of files) {
      const filePath = path.join(target, file);
      node.children!.push(getFolderStructure(filePath));
    }
  }
  return node;
}

export function searchNotes(query: string): Note[] {
  const notes = listNotes();
  const q = query.toLowerCase();
  return notes.filter(
    (note) =>
      note.title.toLowerCase().includes(q) ||
      note.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function getNoteContext(notes: Note[], maxNotes = 3): string {
  if (!notes.length) return "";
  const parts: string[] = [];
  for (const note of notes.slice(0, maxNotes)) {
    const detail = readNote(note.path);
    parts.push(`## ${note.title}\n${detail.content}`);
  }
  return parts.join("\n\n");
}