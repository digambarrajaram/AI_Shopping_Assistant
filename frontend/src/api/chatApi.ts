import type { ChatRequest, ChatResponse } from "../types/chat";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export async function sendChatMessage(
  request: ChatRequest,
): Promise<ChatResponse> {
  const url = `${API_BASE}/chat`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Server responded with ${res.status}${text ? `: ${text}` : ""}`,
    );
  }

  const data: ChatResponse = await res.json();
  return data;
}
