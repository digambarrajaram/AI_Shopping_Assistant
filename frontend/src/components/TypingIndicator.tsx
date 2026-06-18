import { motion } from "framer-motion";

const dotVariants = {
  initial: { scale: 0.6, opacity: 0.4 },
  animate: { scale: 1, opacity: 1 },
};

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function TypingIndicator() {
  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-start gap-3 mb-4"
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: "var(--accent)" }}
        aria-hidden="true"
      >
        <span
          className="text-white text-[12px] font-semibold"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          S
        </span>
      </div>

      {/* Bubble */}
      <div
        className="px-4 py-3 rounded-[12px_12px_12px_4px]"
        style={{
          backgroundColor: "var(--surface)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ backgroundColor: "var(--accent)" }}
                variants={dotVariants}
                initial="initial"
                animate="animate"
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 0.6,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
          <span
            className="text-[12px] text-[var(--text-tertiary)]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Thinking…
          </span>
        </div>
      </div>
    </motion.div>
  );
}
