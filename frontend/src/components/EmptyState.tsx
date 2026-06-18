import { motion } from "framer-motion";

interface EmptyStateProps {
  onSelect?: (text: string) => void;
}

interface PrimaryAction {
  icon: string;
  title: string;
  description: string;
  query: string;
}

const PRIMARY_ACTIONS: PrimaryAction[] = [
  {
    icon: "🛒",
    title: "Find Products",
    description: "Browse our catalog",
    query: "What products do you have?",
  },
  {
    icon: "⭐",
    title: "Product Reviews",
    description: "Read customer feedback",
    query: "Show me product reviews",
  },
  {
    icon: "📦",
    title: "Place an Order",
    description: "Order products quickly",
    query: "Help me place an order",
  },
  {
    icon: "📜",
    title: "My Orders",
    description: "View order history",
    query: "What are my past orders?",
  },
];

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function EmptyState({ onSelect }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      {/* Illustration */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-7"
      >
        <div
          className="w-20 h-20 rounded-[24px] flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.03))",
            border: "1px solid rgba(16,185,129,0.15)",
          }}
        >
          {/* Shopping bag + leaf icon */}
          <svg
            className="w-10 h-10"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 14l3-6h10l3 6"
              stroke="#10B981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="8"
              y="14"
              width="24"
              height="20"
              rx="3"
              stroke="#10B981"
              strokeWidth="2"
            />
            <path
              d="M16 22v4a4 4 0 008 0v-4"
              stroke="#6EE7B7"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="20" cy="11" r="2" fill="#10B981" />
          </svg>
        </div>
      </motion.div>

      {/* Heading */}
      <motion.h2
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="text-[28px] leading-tight mb-3 text-[var(--text-primary)]"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Welcome to ShopAssist
      </motion.h2>

      <motion.p
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-[14px] text-[var(--text-secondary)] mb-10 max-w-xs leading-relaxed"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        I can help you:
      </motion.p>

      {/* Primary action cards — 2×2 grid */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
        className="grid grid-cols-2 gap-3 w-full max-w-[340px] mb-2"
      >
        {PRIMARY_ACTIONS.map((action, idx) => (
          <motion.button
            key={action.title}
            initial={
              prefersReducedMotion
                ? {}
                : { opacity: 0, y: 8 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: 0.3 + idx * 0.07,
              ease: "easeOut",
            }}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect?.(action.query)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl text-left
                       transition-all duration-200
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            style={{
              backgroundColor: "#101827",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#141E30";
              e.currentTarget.style.borderColor = "rgba(16,185,129,0.25)";
              e.currentTarget.style.boxShadow =
                "0 4px 20px rgba(16,185,129,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#101827";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span className="text-[24px]" aria-hidden="true">
              {action.icon}
            </span>
            <span
              className="text-[13px] font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {action.title}
            </span>
            <span
              className="text-[11px] text-[var(--text-tertiary)] leading-tight"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {action.description}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
