import { getSystemPrompt } from "./prompt.js";
import { searchNotes, getNoteContext } from "./memory.js";
import { saveMessage } from "./chat.js";

// You'll need to install @anthropic-ai/sdk or use a different Gemini client
// For now, let's use the Google GenAI SDK via REST

interface ChatBody {
  session_id: string;
  message: string;
}

export function buildPrompt(userMessage: string): string {
  const relevantNotes = searchNotes(userMessage);
  const context = getNoteContext(relevantNotes);
  const systemPrompt = getSystemPrompt();

  if (context) {
    return `${systemPrompt}\n\n## Knowledge Base\n${context}\n\nUser: ${userMessage}\nAssistant:`;
  }
  return `${systemPrompt}\n\nUser: ${userMessage}\nAssistant:`;
}

export async function chatWithRag(
  sessionId: string,
  userMessage: string,
  apiKey: string
): Promise<string> {
  const prompt = buildPrompt(userMessage);

  // Use Google GenAI API directly
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error: No response";

  saveMessage(sessionId, "user", userMessage);
  saveMessage(sessionId, "assistant", reply);

  return reply;
}