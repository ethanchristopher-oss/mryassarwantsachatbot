export const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant. Use the provided context from knowledge base notes when relevant.`;

export function getSystemPrompt(): string {
  return process.env.SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT;
}