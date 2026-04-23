let currentSessionId = null;
let currentNotePath = null;
let viewMode = "chat";

const elements = {
  newChatBtn: document.getElementById("new-chat-btn"),
  memoryTree: document.getElementById("memory-tree"),
  chatList: document.getElementById("chat-list"),
  messages: document.getElementById("messages"),
  messageInput: document.getElementById("message-input"),
  sendBtn: document.getElementById("send-btn"),
  chatView: document.getElementById("chat-view"),
  editorView: document.getElementById("editor-view"),
  backToChatBtn: document.getElementById("back-to-chat-btn"),
  editorFilename: document.getElementById("editor-filename"),
  saveNoteBtn: document.getElementById("save-note-btn"),
  noteEditor: document.getElementById("note-editor"),
  toast: document.getElementById("toast"),
};

function showToast(message, isSuccess = false) {
  elements.toast.textContent = message;
  elements.toast.style.display = "block";
  elements.toast.className = "toast" + (isSuccess ? " success" : "");
  setTimeout(() => {
    elements.toast.style.display = "none";
  }, 3000);
}

async function loadSessions() {
  try {
    const res = await fetch("/api/sessions");
    const data = await res.json();
    renderChatList(data.sessions);
  } catch {
    showToast("Failed to load chats");
  }
}

function renderChatList(sessions) {
  elements.chatList.innerHTML = "";
  sessions.forEach((session) => {
    const div = document.createElement("div");
    div.className = "chat-item" + (session.id === currentSessionId ? " active" : "");
    div.textContent = session.preview || "New chat";
    div.onclick = () => loadChat(session.id);
    elements.chatList.appendChild(div);
  });
}

async function loadMemory() {
  try {
    const res = await fetch("/api/memory");
    const data = await res.json();
    renderMemoryTree(data.tree);
  } catch {
    showToast("Failed to load memory");
  }
}

function renderMemoryTree(tree) {
  elements.memoryTree.innerHTML = "";
  if (!tree || !tree.children) return;

  tree.children.forEach((item) => {
    renderMemoryItem(item, elements.memoryTree, 0);
  });
}

function renderMemoryItem(item, container, depth) {
  const div = document.createElement("div");
  div.style.paddingLeft = depth * 12 + "px";

  if (item.type === "folder") {
    div.className = "memory-item memory-folder";
    div.textContent = "📁 " + item.name;
    if (item.children) {
      item.children.forEach((child) => {
        renderMemoryItem(child, container, depth + 1);
      });
    }
  } else {
    div.className = "memory-item";
    div.textContent = "📄 " + item.name.replace(".md", "");
    div.onclick = () => openNote(item.path);
  }
  container.appendChild(div);
}

async function openNote(notePath) {
  try {
    const res = await fetch(`/api/memory/note?path=${encodeURIComponent(notePath)}`);
    if (!res.ok) {
      showToast("Note not found");
      return;
    }
    const note = await res.json();
    currentNotePath = notePath;
    viewMode = "editor";
    elements.editorFilename.textContent = notePath.split(/[/\\]/).pop();
    elements.noteEditor.value = note.content;
    showEditor();
  } catch {
    showToast("Failed to open note");
  }
}

async function saveNote() {
  if (!currentNotePath) return;
  try {
    const res = await fetch("/api/memory/note", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: currentNotePath, content: elements.noteEditor.value }),
    });
    if (res.ok) {
      showToast("Saved!", true);
    } else {
      showToast("Failed to save");
    }
  } catch {
    showToast("Failed to save");
  }
}

function showEditor() {
  elements.chatView.style.display = "none";
  elements.editorView.style.display = "flex";
}

function showChat() {
  elements.editorView.style.display = "none";
  elements.chatView.style.display = "flex";
  viewMode = "chat";
}

function newChat() {
  currentSessionId = Date.now().toString();
  elements.messages.innerHTML = "";
  loadSessions();
  showChat();
}

async function loadChat(sessionId) {
  currentSessionId = sessionId;
  try {
    const res = await fetch(`/api/history/${sessionId}`);
    const data = await res.json();
    renderMessages(data.messages);
    loadSessions();
  } catch {
    showToast("Failed to load chat");
  }
}

function renderMessages(messages) {
  elements.messages.innerHTML = "";
  messages.forEach((msg) => {
    addMessage(msg.role, msg.content);
  });
  scrollToBottom();
}

function addMessage(role, content) {
  const div = document.createElement("div");
  div.className = `message ${role}`;

  if (role === "assistant") {
    div.innerHTML = renderMarkdown(content);
  } else {
    div.textContent = content;
  }
  elements.messages.appendChild(div);
  scrollToBottom();
}

function renderMarkdown(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function scrollToBottom() {
  elements.messages.scrollTop = elements.messages.scrollHeight;
}

async function sendMessage() {
  const message = elements.messageInput.value.trim();
  if (!message) return;

  if (!currentSessionId) {
    currentSessionId = Date.now().toString();
  }

  elements.messageInput.value = "";
  elements.sendBtn.disabled = true;
  addMessage("user", message);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: currentSessionId, message }),
    });

    if (!res.ok) {
      throw new Error("Request failed");
    }

    const data = await res.json();
    addMessage("assistant", data.reply);
    loadSessions();
  } catch (e) {
    showToast("Failed to send: " + e.message);
  } finally {
    elements.sendBtn.disabled = false;
  }
}

elements.newChatBtn.onclick = newChat;
elements.sendBtn.onclick = sendMessage;
elements.backToChatBtn.onclick = showChat;
elements.saveNoteBtn.onclick = saveNote;
elements.messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

newChat();
loadMemory();
loadSessions();