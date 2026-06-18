import { useState } from "react";

export interface ParsedProduct {
  name: string;
  price: number;
  description: string;
  category: string;
  isOrganic: boolean;
  imageUrl?: string;
}

interface ProductListProps {
  products: ParsedProduct[];
}

const INITIAL_SHOW = 12;

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
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

  const visible = expanded ? products : products.slice(0, INITIAL_SHOW);
  const hiddenCount = products.length - INITIAL_SHOW;
  const grouped = groupByCategory(visible);

  return (
    <div className="mt-2 space-y-3">
      {grouped.map(({ category, items }) => (
        <div key={category}>
          {/* Category header */}
          <div
            className="sticky top-0 z-[1] text-[12px] font-semibold uppercase tracking-wider
                       text-[var(--text-tertiary)] pb-1 mb-2 border-b border-[var(--border)]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {category}
          </div>

          {/* Product rows */}
          <div className="space-y-1">
            {items.map((product, idx) => (
              <div
                key={`${product.name}-${idx}`}
                className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl
                           hover:bg-[var(--bg)] transition-colors duration-100"
              >
                {/* Thumbnail */}
                {product.imageUrl ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg)] border border-[var(--border)]">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--border)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Name + description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
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
                      className="text-[12px] text-[var(--text-secondary)] line-clamp-1 mt-0.5"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      title={product.description}
                    >
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Price */}
                <span
                  className="text-[13px] font-semibold text-[var(--accent)] tabular-nums whitespace-nowrap flex-shrink-0"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {formatPrice(product.price)}
                </span>
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
                     py-2 rounded-lg hover:bg-[var(--accent-soft)]/30 transition-colors
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
      imageUrl: undefined, // filled in by MessageBubble
    });
  }

  return products;
}

export function isCategoryHeaderLine(line: string): boolean {
  const trimmed = line.trim();
  return CATEGORY_LINE_RE.test(trimmed) && !trimmed.includes("$");
}

export const MIN_PRODUCT_THRESHOLD = 2;
