import { motion } from "framer-motion";

interface ChatToggleProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnread?: boolean;
}

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ChatToggle({
  isOpen,
  onClick,
  hasUnread,
}: ChatToggleProps) {
  if (isOpen) return null; // hidden when chat is open

  return (
    <motion.button
      onClick={onClick}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-2xl
                 flex items-center justify-center shadow-lg
                 hover:shadow-xl active:scale-95 transition-all duration-150
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
                 focus-visible:ring-offset-2"
      style={{ backgroundColor: "var(--accent)" }}
      aria-label="Open chat"
    >
      {/* Chat bubble icon */}
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>

      {/* Unread dot */}
      {hasUnread && (
        <span
          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white"
          style={{ backgroundColor: "var(--danger)" }}
        />
      )}
    </motion.button>
  );
}
