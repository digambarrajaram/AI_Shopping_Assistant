import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message, ChatProduct, ChatOrder } from "../types/chat";
import type { ShopProduct } from "../hooks/useProducts";
import ProductList, {
  parseProductsFromText,
  isCategoryHeaderLine,
  MIN_PRODUCT_THRESHOLD,
  type ParsedProduct,
} from "./ProductList";
import OrderCard from "./OrderCard";
import { findImageUrl } from "../hooks/useProducts";

/** Convert backend ChatProduct → ParsedProduct for ProductList rendering. */
function chatProductsToParsed(
  items: ChatProduct[],
  catalog: ShopProduct[],
): ParsedProduct[] {
  return items.map((p) => ({
    name: p.name,
    price: p.price,
    description: p.description || "",
    category: p.category || "",
    isOrganic: /organic/i.test(p.name),
    imageUrl: p.imageUrl || findImageUrl(catalog, p.name),
    rating: p.rating ?? null,
    reviewCount: p.reviewCount ?? null,
  }));
}

interface MessageBubbleProps {
  message: Message;
  onRetry?: (messageId: string) => void;
  /** Full product catalog for image matching (shop view). */
  products?: ShopProduct[];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Markdown cleanup ─────────────────────────────────────────────

function stripDanglingMarkdown(text: string): string {
  let cleaned = text;

  const starCount = (cleaned.match(/\*/g) || []).length;
  if (starCount % 2 !== 0) {
    cleaned = cleaned.replace(/\*{1,2}\s*…?\s*$/, "…");
  }

  const underscoreCount = (cleaned.match(/_/g) || []).length;
  if (underscoreCount % 2 !== 0) {
    cleaned = cleaned.replace(/_{1,2}\s*…?\s*$/, "…");
  }

  cleaned = cleaned.replace(/(\w+)…$/, "$1…");
  return cleaned;
}

// ── Product detection ────────────────────────────────────────────

interface ProductParseResult {
  hasProducts: boolean;
  products: ParsedProduct[];
  intro: string;
  outro: string;
}

function detectProducts(
  text: string,
  catalog: ShopProduct[],
  structured?: ChatProduct[] | null,
): ProductParseResult {
  // ── Prefer structured data from backend ─────────────────────
  // Only render ProductList when the LLM's text reply is clearly
  // a product listing (3+ dollar-sign lines).  For specific
  // questions the LLM may have called get_products internally
  // to find an answer, but the reply doesn't list products.
  if (structured && structured.length >= MIN_PRODUCT_THRESHOLD) {
    const dollarLines = text.split("\n").filter((l) => l.includes("$"));
    if (dollarLines.length >= MIN_PRODUCT_THRESHOLD) {
      const intro = text
        .split("\n")
        .filter((l) => !l.includes("$") && !isCategoryHeaderLine(l))
        .join("\n")
        .trim();
      return {
        hasProducts: true,
        products: chatProductsToParsed(structured, catalog),
        intro,
        outro: "",
      };
    }
    // Text doesn't look like a listing — fall through to text-only
  }

  // ── Fallback: regex-parse the LLM's free-text reply ──────────
  const rawProducts = parseProductsFromText(text);

  if (rawProducts.length < MIN_PRODUCT_THRESHOLD) {
    return { hasProducts: false, products: [], intro: text, outro: "" };
  }

  const enriched: ParsedProduct[] = rawProducts.map((p) => ({
    ...p,
    imageUrl: findImageUrl(catalog, p.name),
  }));

  const lines = text.split("\n");
  const productStartIdx = lines.findIndex((l) => l.includes("$"));
  const productEndIdx =
    lines.length -
    1 -
    [...lines].reverse().findIndex((l) => l.includes("$"));

  const intro = lines
    .slice(0, productStartIdx)
    .filter((l) => !isCategoryHeaderLine(l))
    .join("\n")
    .trim();

  const outro = lines
    .slice(productEndIdx + 1)
    .filter((l) => !isCategoryHeaderLine(l))
    .join("\n")
    .trim();

  return {
    hasProducts: true,
    products: enriched,
    intro: intro || "",
    outro: outro || "",
  };
}

// ── Order detection ─────────────────────────────────────────────

interface OrderParseResult {
  hasOrders: boolean;
  intro: string;
}

/** When the backend returns structured order data, extract any intro
 *  text from the LLM's reply and suppress the raw order listing so the
 *  frontend renders real cards instead of parsing prose. */
function detectOrders(
  text: string,
  structured?: ChatOrder[] | null,
): OrderParseResult {
  if (!structured || structured.length === 0) {
    return { hasOrders: false, intro: text };
  }

  // Split the text at the first line that looks like an order listing
  // (contains a product name from the structured data or a price line).
  const lines = text.split("\n");
  const cutoff = lines.findIndex((l) =>
    structured.some(
      (o) =>
        l.includes(o.productName) ||
        /\$\d+\.\d{2}/.test(l),
    ),
  );

  const intro =
    cutoff > 0
      ? lines.slice(0, cutoff).join("\n").trim()
      : cutoff === 0
        ? ""
        : text;

  return { hasOrders: true, intro };
}

// ── Motion ───────────────────────────────────────────────────────

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const userVariants = {
  hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0 },
};

const assistantVariants = {
  hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

// ── Component ────────────────────────────────────────────────────

export default function MessageBubble({
  message,
  onRetry,
  products = [],
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isError = message.status === "error";
  const [copied, setCopied] = useState(false);

  const sanitizedContent = isUser
    ? message.content
    : stripDanglingMarkdown(message.content);

  const productInfo = !isUser
    ? detectProducts(sanitizedContent, products, message.products)
    : null;

  const orderInfo = !isUser
    ? detectOrders(sanitizedContent, message.orders)
    : null;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — silently ignore
    }
  }, [message.content]);

  return (
    <motion.div
      className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}
      variants={isUser ? userVariants : assistantVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.25, ease: "easeOut" }}
      layout
    >
      <div
        className={`flex items-start gap-2.5 ${
          isUser
            ? "flex-row-reverse max-w-[85%]"
            : "max-w-[95%]"
        }`}
      >
        {/* Avatar — assistant only */}
        {!isUser && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
            style={{ backgroundColor: "var(--accent)" }}
            aria-hidden="true"
          >
            <span
              className="text-white text-[11px] font-semibold"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              S
            </span>
          </div>
        )}

        {/* Bubble */}
        <div className="flex flex-col min-w-0">
          <div
            className={`px-[18px] py-[14px] break-words ${
              isUser
                ? "rounded-[18px_18px_6px_18px]"
                : "rounded-[18px_18px_18px_6px]"
            }`}
            style={
              isUser
                ? { backgroundColor: "#1A2235" }
                : {
                    backgroundColor: "var(--surface)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }
            }
          >
            {/* Sender label */}
            <div
              className={`text-[10px] font-semibold mb-1.5 ${
                isUser ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"
              }`}
              style={{
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              {isUser ? "You" : "🛒 ShopAssist"}
            </div>

            {/* Content */}
            {isUser ? (
              <p className="text-[15px] leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">
                {sanitizedContent}
              </p>
            ) : orderInfo?.hasOrders ? (
              <>
                {orderInfo.intro && (
                  <div className="prose prose-sm max-w-none text-[15px] leading-relaxed text-[var(--text-primary)] mb-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {orderInfo.intro}
                    </ReactMarkdown>
                  </div>
                )}
                <OrderCard orders={message.orders!} />
              </>
            ) : productInfo?.hasProducts ? (
              <>
                {productInfo.intro && (
                  <div className="prose prose-sm max-w-none text-[15px] leading-relaxed text-[var(--text-primary)] mb-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {productInfo.intro}
                    </ReactMarkdown>
                  </div>
                )}

                <ProductList products={productInfo.products} />

                {productInfo.outro && (
                  <div className="prose prose-sm max-w-none text-[15px] leading-relaxed text-[var(--text-primary)] mt-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {productInfo.outro}
                    </ReactMarkdown>
                  </div>
                )}
              </>
            ) : (
              <div className="prose prose-sm max-w-none text-[15px] leading-relaxed text-[var(--text-primary)]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {sanitizedContent}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Timestamp + actions */}
          <div
            className={`flex items-center gap-2 mt-1 ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            <time
              className="text-[11px] text-[var(--text-tertiary)] select-none"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              dateTime={message.timestamp.toISOString()}
            >
              {formatTime(message.timestamp)}
            </time>

            {/* Copy — assistant only */}
            {!isUser && message.status === "sent" && (
              <button
                onClick={handleCopy}
                className="text-[11px] font-medium transition-colors
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
                style={{
                  color: copied ? "var(--accent)" : "var(--text-tertiary)",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            )}

            {isError && (
              <button
                onClick={() => onRetry?.(message.id)}
                className="text-[12px] font-medium text-[var(--danger)] hover:underline
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)] rounded"
              >
                ⚠ Failed to send · Retry
              </button>
            )}

            {isUser && message.status === "sending" && (
              <span className="text-[11px] text-[var(--text-tertiary)]">Sending…</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
