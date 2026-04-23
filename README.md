# Gemini Chatbot (TypeScript)

A web wrapper for Gemini 2.5 with RAG over Obsidian-style notes.

## Run

```bash
npm install
npm run dev
# open http://localhost:8000
```

## Features

- **Chat** - Gemini 2.5 with RAG
- **Memory** - Graph database in `memory/` folder (.md files with [[links]])
- **History** - Persisted in `sessions.json`

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Serve web UI |
| POST | `/api/chat` | Send message |
| GET | `/api/history/:sessionId` | Get chat history |
| DELETE | `/api/history/:sessionId` | Clear chat |
| GET | `/api/sessions` | List sessions |
| GET | `/api/memory` | List memory notes |
| GET | `/api/memory/note?path=` | Read note |
| PUT | `/api/memory/note` | Update note |
| POST | `/api/memory/note` | Create note |

## Env

Create `.env`:
```
GEMINI_API_KEY=your_key_here
```

## Project Structure

```
codebase/
├── src/
│   ├── index.ts      # Express server
│   ├── memory.ts     # Memory/RAG logic
│   ├── chat.ts       # Chat history
│   ├── rag.ts       # Gemini integration
│   └── prompt.ts    # System prompt
├── static/           # Frontend
├── memory/           # Knowledge base
├── sessions.json    # Chat history
└── package.json
```