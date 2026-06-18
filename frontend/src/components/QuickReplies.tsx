import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickRepliesProps {
  onSelect: (text: string) => void;
}

interface SuggestionGroup {
  label: string;
  icon: string;
  items: string[];
}

const SUGGESTION_GROUPS: SuggestionGroup[] = [
  {
    label: "Shopping",
    icon: "🛒",
    items: [
      "Healthy products",
      "Organic products",
      "Compare products",
      "Budget-friendly products",
    ],
  },
  {
    label: "Orders",
    icon: "📦",
    items: [
      "Track my order",
      "Cancel order",
    ],
  },
  {
    label: "Reviews",
    icon: "⭐",
    items: [
      "Highest rated",
      "Product reviews",
    ],
  },
  {
    label: "Help",
    icon: "💡",
    items: [
      "Shipping",
      "Returns",
      "Payment methods",
    ],
  },
];

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function QuickReplies({ onSelect }: QuickRepliesProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full max-w-[340px] mx-auto">
      {/* Toggle button — centered */}
      <motion.button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-2.5
                   text-[13px] font-medium text-[var(--text-tertiary)]
                   hover:text-[var(--text-secondary)] transition-colors
                   rounded-xl hover:bg-[var(--surface)]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[10px]"
        >
          ▼
        </motion.span>
        <span>Explore more</span>
      </motion.button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, height: 0 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, height: "auto" }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, height: 0 }
            }
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 pt-3 pb-1">
              {SUGGESTION_GROUPS.map((group) => (
                <div key={group.label} className="text-center">
                  {/* Category heading — centered, sentence case, muted */}
                  <div
                    className="text-[12px] font-semibold text-[var(--text-tertiary)] mb-3"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {group.icon} {group.label}
                  </div>
                  {/* Chips — centered, wrapped */}
                  <div className="flex justify-center flex-wrap gap-2">
                    {group.items.map((suggestion) => (
                      <motion.button
                        key={suggestion}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onSelect(suggestion)}
                        className="px-3 py-1.5 text-[13px] font-medium rounded-lg
                                   border border-[var(--border)] text-[var(--text-secondary)]
                                   bg-[var(--surface)] hover:border-[var(--accent)]/30
                                   hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]/20
                                   transition-all duration-150
                                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
