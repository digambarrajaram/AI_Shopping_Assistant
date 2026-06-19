import { useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Message, ConnectionStatus } from "../types/chat";
import type { ShopProduct } from "../hooks/useProducts";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import DateSeparator from "./DateSeparator";
import InputBar from "./InputBar";
import ErrorBanner from "./ErrorBanner";
import EmptyState from "./EmptyState";

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  isLoading: boolean;
  connectionStatus: ConnectionStatus;
  onSend: (text: string) => void;
  onRetry: () => void;
  products: ShopProduct[];
  prefill?: string | null;
  onPrefillApplied?: () => void;
}

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const panelVariants = {
  hidden: prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
};

export default function ChatWidget({
  isOpen,
  onClose,
  messages,
  isLoading,
  connectionStatus,
  onSend,
  onRetry,
  products,
  prefill,
  onPrefillApplied,
}: ChatWidgetProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Date separators
  const messagesWithSeparators = useMemo(() => {
    const result: Array<
      | { type: "date"; date: Date; key: string }
      | { type: "message"; message: Message }
    > = [];
    let lastDate = "";
    for (const msg of messages) {
      const dateKey = new Date(msg.timestamp).toDateString();
      if (dateKey !== lastDate) {
        result.push({ type: "date", date: msg.timestamp, key: `date-${dateKey}` });
        lastDate = dateKey;
      }
      result.push({ type: "message", message: msg });
    }
    return result;
  }, [messages]);

  const hasUserMessages = messages.some((m) => m.role === "user");
  const hasError = connectionStatus === "error";

  // Pin background in place when chat is open.
  // position:fixed on body is the only reliable way to prevent
  // background scroll on mobile Safari.
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.backgroundColor = "#080C14";

    return () => {
      const frozenY = Math.abs(parseInt(document.body.style.top || "0", 10));
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.backgroundColor = "";
      window.scrollTo(0, frozenY);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — closes chat on tap, blocks interaction with background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.aside
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 right-0 bottom-0 z-40 w-full
                       sm:w-[440px] lg:w-[480px]
                       flex flex-col border-l border-[var(--border)]"
            style={{
              backgroundColor: "#080C14",
              boxShadow: "0 0 32px rgba(0,0,0,0.5)",
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingRight: "env(safe-area-inset-right, 0px)",
            }}
            role="complementary"
            aria-label="Chat with ShopAssist"
          >
            {/* Panel header */}
            <div
              className="flex items-center justify-between h-14 px-4 flex-shrink-0
                         border-b border-[var(--border)]"
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.7)",
                backdropFilter: "blur(24px)",
              }}
            >
              <div className="flex items-center gap-2.5">
                {/* Small leaf */}
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 32 32"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M16 4C9.37 4 6 8.92 6 13.6c0 4.68 3.37 8 6.8 9.8.47.26.8.45 1.2.6v2h4v-2c.4-.15.73-.34 1.2-.6C22.63 21.6 26 18.28 26 13.6 26 8.92 22.63 4 16 4z"
                    fill="#10B981"
                  />
                  <path d="M16 7c-2 0-3 1.5-3 4h6c0-2.5-1-4-3-4z" fill="#6EE7B7" />
                </svg>
                <span
                  className="text-[18px] leading-none tracking-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  ShopAssist
                </span>
                {/* Status dot — pulses when processing */}
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      connectionStatus === "connected"
                        ? "var(--accent)"
                        : "var(--text-tertiary)",
                    animation: isLoading
                      ? "pulse-dot 1s ease-in-out infinite"
                      : "none",
                  }}
                />
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center
                           text-[var(--text-tertiary)] hover:text-[var(--text-primary)]
                           hover:bg-[var(--bg)] transition-colors
                           focus:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--accent)]"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error banner */}
            {hasError && (
              <ErrorBanner
                message="Having trouble connecting — please try again."
                onRetry={onRetry}
              />
            )}

            {/* Messages */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4
                         scroll-smooth overscroll-contain"
              role="log"
              aria-live="polite"
              aria-label="Chat conversation"
              style={{
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {!hasUserMessages && !isLoading && (
                <EmptyState onSelect={onSend} />
              )}

              {messagesWithSeparators.map((item) => {
                if (item.type === "date") {
                  return <DateSeparator key={item.key} date={item.date} />;
                }
                return (
                  <MessageBubble
                    key={item.message.id}
                    message={item.message}
                    onRetry={() => onSend(item.message.content)}
                    products={products}
                  />
                );
              })}

              {isLoading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0">
              <InputBar
                onSend={onSend}
                disabled={isLoading}
                prefill={prefill}
                onPrefillApplied={onPrefillApplied}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
