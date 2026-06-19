import { useState } from "react";

export interface ParsedProduct {
  name: string;
  price: number;
  description: string;
  category: string;
  isOrganic: boolean;
  imageUrl?: string;
  rating?: number | null;
  reviewCount?: number | null;
}

interface ProductListProps {
  products: ParsedProduct[];
}

const INITIAL_SHOW = 6;

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

function StarRating({ rating, reviewCount }: { rating?: number | null; reviewCount?: number | null }) {
  if (!rating || rating === 0) return null;
  const stars = "⭐".repeat(Math.min(5, Math.floor(rating)));  // floor — 4.7 → 4 stars
  const count = reviewCount ?? 0;
  return (
    <span className="text-[12px]" aria-label={`${rating.toFixed(1)} out of 5`}>
      {stars}{" "}
      <span className="text-[var(--text-secondary)] font-medium">{rating.toFixed(1)}</span>
      <span className="text-[var(--text-tertiary)]">
        {" "}({count} review{count !== 1 ? "s" : ""})
      </span>
    </span>
  );
}

function LeafPlaceholder() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" opacity={0.3}>
      <path
        d="M16 4C9.37 4 6 8.92 6 13.6c0 4.68 3.37 8 6.8 9.8.47.26.8.45 1.2.6v2h4v-2c.4-.15.73-.34 1.2-.6C22.63 21.6 26 18.28 26 13.6 26 8.92 22.63 4 16 4z"
        fill="#10B981"
      />
      <path d="M16 7c-2 0-3 1.5-3 4h6c0-2.5-1-4-3-4z" fill="#6EE7B7" />
    </svg>
  );
}

/** Group products by category, preserving order of first appearance. */
function groupByCategory(
  products: ParsedProduct[],
): { category: string; items: ParsedProduct[] }[] {
  const groups: { category: string; items: ParsedProduct[] }[] = [];
  const seen = new Map<string, ParsedProduct[]>();

  for (const p of products) {
    const cat = p.category || "Products";
    if (!seen.has(cat)) {
      const arr: ParsedProduct[] = [];
      seen.set(cat, arr);
      groups.push({ category: cat, items: arr });
    }
    seen.get(cat)!.push(p);
  }
  return groups;
}

export default function ProductList({ products }: ProductListProps) {
  const [expanded, setExpanded] = useState(false);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const visible = expanded ? products : products.slice(0, INITIAL_SHOW);
  const hiddenCount = products.length - INITIAL_SHOW;
  const grouped = groupByCategory(visible);

  const handleImgError = (name: string) => {
    setImgErrors((prev) => new Set(prev).add(name));
  };

  return (
    <div className="mt-2 space-y-3">
      {grouped.map(({ category, items }) => (
        <div key={category}>
          {/* Category header */}
          <div
            className="sticky top-0 z-[1] text-[11px] font-semibold uppercase tracking-wider
                       text-[var(--text-tertiary)] pb-1.5 mb-2 border-b border-[var(--border)]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {category}
          </div>

          {/* Product cards */}
          <div className="space-y-2">
            {items.map((product, idx) => (
              <div
                key={`${product.name}-${idx}`}
                className="flex items-start gap-3 p-3 -mx-1 rounded-xl
                           hover:bg-[var(--bg)]/60 transition-colors duration-150
                           border border-transparent hover:border-[var(--border)]"
              >
                {/* Thumbnail */}
                {product.imageUrl && !imgErrors.has(product.name) ? (
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--bg)] border border-[var(--border)]">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={() => handleImgError(product.name)}
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl flex-shrink-0 bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center">
                    <LeafPlaceholder />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-[14px] font-semibold text-[var(--text-primary)]"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {product.name}
                    </span>
                    {product.isOrganic && (
                      <span
                        className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: "var(--accent-soft)",
                          color: "var(--accent)",
                        }}
                      >
                        Organic
                      </span>
                    )}
                  </div>
                  {product.description && (
                    <p
                      className="text-[12px] text-[var(--text-secondary)] line-clamp-2 mt-0.5 leading-relaxed"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <StarRating rating={product.rating} reviewCount={product.reviewCount} />
                  </div>
                </div>

                {/* Price + actions */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span
                    className="text-[14px] font-bold text-[var(--accent)] tabular-nums"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {formatPrice(product.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Expand button */}
      {!expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full text-[13px] font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]
                     py-2.5 rounded-xl hover:bg-[var(--accent-soft)]/20 transition-all
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Show all {products.length} products
        </button>
      )}
    </div>
  );
}

// ── Parser — exported so MessageBubble can use it ────────────────

const DESCRIPTION_SENTINELS = /^(organic|regular|standard|premium|available|in stock|new|popular|best seller)$/i;
const CATEGORY_LINE_RE = /^\*{2}([^*]+)\*{2}$/;
const NUMBER_PREFIX_RE = /^\d+\.\s*/;

export function parseProductsFromText(text: string): ParsedProduct[] {
  const lines = text.split("\n");
  const products: ParsedProduct[] = [];
  let currentCategory = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const catMatch = line.match(CATEGORY_LINE_RE);
    if (catMatch && !line.includes("$")) {
      currentCategory = catMatch[1].trim();
      continue;
    }

    const priceMatch = line.match(/\$(\d+\.?\d{0,2})/);
    if (!priceMatch) continue;

    const price = parseFloat(priceMatch[1]);
    if (isNaN(price) || price <= 0) continue;

    const priceIdx = priceMatch.index!;

    let name = line
      .slice(0, priceIdx)
      .replace(/^[-*\s]+/, "")
      .replace(/\*{1,2}/g, "")
      .replace(/[-–:]\s*$/, "")
      .trim();

    name = name.replace(NUMBER_PREFIX_RE, "").trim();
    if (!name || name.length < 2) continue;

    let desc = line
      .slice(priceIdx + priceMatch[0].length)
      .replace(/^[-–\s(]+/, "")
      .replace(/\)\s*$/, "")
      .replace(/^[-–\s]+/, "")
      .trim();

    if (DESCRIPTION_SENTINELS.test(desc)) {
      desc = "";
    }

    products.push({
      name,
      price,
      description: desc,
      category: currentCategory,
      isOrganic: /organic/i.test(name),
      imageUrl: undefined,
    });
  }

  return products;
}

export function isCategoryHeaderLine(line: string): boolean {
  const trimmed = line.trim();
  return CATEGORY_LINE_RE.test(trimmed) && !trimmed.includes("$");
}

export const MIN_PRODUCT_THRESHOLD = 2;
