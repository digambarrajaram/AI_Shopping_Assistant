import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, y: -16 }
        }
        animate={{ opacity: 1, y: 0 }}
        exit={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, y: -16 }
        }
        transition={{ duration: 0.25 }}
        className="flex-shrink-0"
        role="alert"
      >
        <div
          className="flex items-center gap-3 px-4 py-2.5
                     border-b border-amber-200/60"
          style={{ backgroundColor: "var(--warning-bg)" }}
        >
          {/* Warning icon */}
          <svg
            className="w-4 h-4 flex-shrink-0 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M12 3l9.66 16.5H2.34L12 3z"
            />
          </svg>

          <span className="text-[13px] text-[var(--text-primary)] flex-1">
            {message}
          </span>

          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[13px] font-medium text-[var(--accent)] hover:underline
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
            >
              Retry
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
            aria-label="Dismiss error"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
