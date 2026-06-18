export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status: "sending" | "sent" | "error";
  /** Structured product data from the backend — used directly, never regex-parsed from text. */
  products?: ChatProduct[];
}

export interface ChatProduct {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  rating?: number | null;
  reviewCount?: number | null;
}

export type ConnectionStatus = "connected" | "error" | "reconnecting";

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  sessionId: string;
  connectionStatus: ConnectionStatus;
}

export interface ChatRequest {
  message: string;
  session_id: string;
}

export interface ChatResponse {
  reply: string;
  session_id: string;
  products?: ChatProduct[] | null;
}
