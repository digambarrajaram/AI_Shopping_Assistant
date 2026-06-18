import { motion } from "framer-motion";

interface QuickRepliesProps {
  onSelect: (text: string) => void;
}

const SUGGESTIONS = [
  "Browse all products",
  "What is your return policy?",
  "I need help with my order",
  "Show me your best sellers",
];

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function QuickReplies({ onSelect }: QuickRepliesProps) {
  return (
    <motion.div
      className="flex flex-wrap gap-2 justify-center my-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {SUGGESTIONS.map((suggestion) => (
        <motion.button
          key={suggestion}
          variants={itemVariants}
          onClick={() => onSelect(suggestion)}
          className="px-4 py-2 text-[14px] font-medium rounded-full border
                     border-[var(--border)] text-[var(--text-secondary)]
                     bg-[var(--surface)] hover:border-[var(--accent)]/40
                     hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]/50
                     active:scale-[0.97]
                     transition-all duration-150
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {suggestion}
        </motion.button>
      ))}
    </motion.div>
  );
}
