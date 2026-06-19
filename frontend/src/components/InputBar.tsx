import { useCallback, useEffect, useRef, useState } from "react";

interface InputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  prefill?: string | null;
  onPrefillApplied?: () => void;
}

const MAX_LENGTH = 500;
const CHAR_WARN_THRESHOLD = 400;

export default function InputBar({
  onSend,
  disabled,
  prefill,
  onPrefillApplied,
}: InputBarProps) {
  const [text, setText] = useState("");
  const [hovered, setHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prefillAppliedRef = useRef(false);

  useEffect(() => {
    if (prefill && !prefillAppliedRef.current) {
      setText(prefill);
      prefillAppliedRef.current = true;
      onPrefillApplied?.();
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(prefill.length, prefill.length);
      });
    }
  }, [prefill, onPrefillApplied]);

  useEffect(() => {
    if (!prefill) prefillAppliedRef.current = false;
  }, [prefill]);

  const charCount = text.length;
  const showCharCount = charCount >= CHAR_WARN_THRESHOLD;
  const overLimit = charCount > MAX_LENGTH;
  const canSend = charCount > 0 && !overLimit && !disabled;

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 22;
    const maxHeight = lineHeight * 4 + 16;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [text, resize]);

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(text.slice(0, MAX_LENGTH));
    setText("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [text, canSend, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div
      className="border-t border-[var(--border)]"
      style={{
        background: "rgba(8,12,20,0.9)",
        backdropFilter: "blur(24px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="px-3 py-2.5">
        <div
          className="chat-input flex items-center gap-2 pl-4 pr-1.5 py-1"
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about products, reviews, or place an order…"
            rows={1}
            maxLength={MAX_LENGTH + 20}
            disabled={disabled}
            className="flex-1 resize-none bg-transparent py-1 text-[16px] leading-[22px]
                       text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              fontFamily: "'Inter', sans-serif",
              minHeight: "26px",
              outline: "none",
              border: "none",
            }}
            aria-label="Type a message"
          />

          {showCharCount && (
            <span
              className={`text-[10px] flex-shrink-0 ${
                overLimit
                  ? "text-[var(--danger)] font-semibold"
                  : "text-[var(--text-tertiary)]"
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {charCount}/{MAX_LENGTH}
            </span>
          )}

          <button
            onClick={handleSend}
            disabled={!canSend}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center
                       transition-all duration-200
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
                       disabled:opacity-25 disabled:cursor-not-allowed"
            style={{
              backgroundColor: canSend ? "var(--accent)" : "transparent",
              transform: canSend && hovered ? "scale(1.08)" : "scale(1)",
            }}
            aria-label="Send message"
          >
            {/* Paper plane icon */}
            <svg
              className="w-4 h-4"
              style={{ color: canSend ? "#fff" : "var(--text-tertiary)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19V5m0 0l-7 7m7-7l7 7"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14"
                opacity={canSend ? 0 : 1}
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
