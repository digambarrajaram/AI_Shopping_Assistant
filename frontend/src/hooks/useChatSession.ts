import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatState, ConnectionStatus, Message } from "../types/chat";
import { sendChatMessage } from "../api/chatApi";

const SESSION_KEY = "shopassist_session_id";

function generateId(): string {
  return crypto.randomUUID();
}

function getOrCreateSessionId(): string {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const id = generateId();
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

/**
 * Custom hook managing the full chat session lifecycle:
 * - Session-id persistence in sessionStorage
 * - Message list with sending/sent/error status
 * - sendMessage with API call, error handling, and retry
 */
export function useChatSession() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    sessionId: getOrCreateSessionId(),
    connectionStatus: "connected",
  });

  // Ref to the last failed user message for retry
  const lastFailedRef = useRef<{ text: string } | null>(null);

  // ── Send ────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || state.isLoading) return;

      // Clear any previous error state
      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
        status: "sending",
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMsg],
        isLoading: true,
        connectionStatus: "connected",
      }));

      try {
        const response = await sendChatMessage({
          message: trimmed,
          session_id: state.sessionId,
        });

        // BUG 1 fix — never render an empty assistant bubble
        const replyText =
          response.reply && response.reply.trim()
            ? response.reply
            : "I didn't quite catch that — could you rephrase, or tell me what you're looking for?";

        const assistantMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: replyText,
          timestamp: new Date(),
          status: "sent",
          ...(response.products && response.products.length > 0
            ? { products: response.products }
            : {}),
          ...(response.orders && response.orders.length > 0
            ? { orders: response.orders }
            : {}),
        };

        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === userMsg.id ? { ...m, status: "sent" as const } : m,
          ),
          isLoading: false,
        }));

        // Small delay so the typing indicator registers before appending
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, assistantMsg],
          }));
        }, 300);
      } catch {
        // Mark user message as error, show error state
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === userMsg.id ? { ...m, status: "error" as const } : m,
          ),
          isLoading: false,
          connectionStatus: "error" as ConnectionStatus,
        }));
        lastFailedRef.current = { text: trimmed };
      }
    },
    [state.sessionId, state.isLoading],
  );

  // ── Retry ───────────────────────────────────────────────────────

  const retryLastMessage = useCallback(() => {
    if (lastFailedRef.current) {
      const { text } = lastFailedRef.current;
      lastFailedRef.current = null;
      sendMessage(text);
    }
  }, [sendMessage]);

  // ── Status reconciliation ──────────────────────────────────────

  const setConnectionStatus = useCallback((status: ConnectionStatus) => {
    setState((prev) => ({ ...prev, connectionStatus: status }));
  }, []);

  // ── Session-id persistence ─────────────────────────────────────

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, state.sessionId);
  }, [state.sessionId]);

  return {
    ...state,
    sendMessage,
    retryLastMessage,
    setConnectionStatus,
  };
}
