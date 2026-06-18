import { useCallback, useEffect, useRef, useState } from "react";

interface InputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  /** Pre-fill the input with text (not auto-sent). Cleared after applied. */
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prefillAppliedRef = useRef(false);

  // Apply prefill when it arrives
  useEffect(() => {
    if (prefill && !prefillAppliedRef.current) {
      setText(prefill);
      prefillAppliedRef.current = true;
      onPrefillApplied?.();
      // Focus the textarea so user can review/edit
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(prefill.length, prefill.length);
      });
    }
  }, [prefill, onPrefillApplied]);

  // Reset prefill tracking when prefill clears
  useEffect(() => {
    if (!prefill) {
      prefillAppliedRef.current = false;
    }
  }, [prefill]);

  const charCount = text.length;
  const showCharCount = charCount >= CHAR_WARN_THRESHOLD;
  const overLimit = charCount > MAX_LENGTH;
  const canSend = charCount > 0 && !overLimit && !disabled;

  // Auto-resize textarea up to 4 lines
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

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div
      className="border-t border-[var(--border)] bg-white/80 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about products, orders, or our store…"
              rows={1}
              maxLength={MAX_LENGTH + 20}
              disabled={disabled}
              className="chat-input w-full resize-none rounded-xl border border-[var(--border)]
                         bg-[var(--surface)] px-4 py-2.5 text-[15px] leading-[22px]
                         text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                         focus:outline-none
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-shadow"
              style={{ fontFamily: "'Inter', sans-serif", minHeight: "44px" }}
              aria-label="Type a message"
            />

            {showCharCount && (
              <span
                className={`absolute bottom-1.5 right-3 text-[11px] ${
                  overLimit
                    ? "text-[var(--danger)] font-semibold"
                    : "text-[var(--text-tertiary)]"
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {charCount}/{MAX_LENGTH}
              </span>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                       transition-all duration-150
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: canSend ? "var(--accent)" : "var(--border)",
            }}
            aria-label="Send message"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
