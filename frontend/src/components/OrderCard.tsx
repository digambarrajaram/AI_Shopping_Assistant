import type { ChatOrder } from "../types/chat";

interface OrderCardProps {
  orders: ChatOrder[];
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function deliveryStatus(endDate?: string | null): {
  label: string;
  color: string;
  bg: string;
} {
  if (!endDate) {
    return { label: "Processing", color: "var(--text-secondary)", bg: "var(--bg)" };
  }
  try {
    const end = new Date(endDate);
    const now = new Date();
    if (now > end) {
      return { label: "Delivered", color: "var(--accent)", bg: "var(--accent-soft)" };
    }
    return { label: "In transit", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" };
  } catch {
    return { label: "Processing", color: "var(--text-secondary)", bg: "var(--bg)" };
  }
}

export default function OrderCard({ orders }: OrderCardProps) {
  return (
    <div className="mt-2 space-y-2.5">
      {orders.map((order, idx) => {
        const status = deliveryStatus(order.estimatedDeliveryEnd);
        return (
          <div
            key={order.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/40
                       overflow-hidden transition-all hover:border-[var(--border-visible)]"
          >
            {/* Top row: product + quantity + price */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Order number badge */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                style={{
                  backgroundColor: "var(--accent-soft)",
                  color: "var(--accent)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                #{idx + 1}
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[14px] font-semibold text-[var(--text-primary)]"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {order.productName}
                  </span>
                  <span
                    className="text-[12px] font-medium text-[var(--text-secondary)]"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    ×{order.quantity}
                  </span>
                </div>
                <span
                  className="text-[12px] text-[var(--text-tertiary)]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Ordered {formatDate(order.orderedAt)}
                </span>
              </div>

              {/* Price + status */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className="text-[14px] font-bold text-[var(--accent)] tabular-nums"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {formatPrice(order.totalPrice)}
                </span>
                <span
                  className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    color: status.color,
                    backgroundColor: status.bg,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {status.label}
                </span>
              </div>
            </div>

            {/* Bottom row: delivery estimate */}
            {order.estimatedDeliveryStart && order.estimatedDeliveryEnd && (
              <div
                className="px-4 py-2 border-t border-[var(--border)]
                           flex items-center gap-2 text-[12px]"
                style={{
                  backgroundColor: "rgba(0,0,0,0.1)",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <svg
                  className="w-3.5 h-3.5 text-[var(--text-tertiary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-[var(--text-tertiary)]">
                  Est. delivery:{" "}
                </span>
                <span className="font-medium text-[var(--text-secondary)]">
                  {order.estimatedDeliveryStart} – {order.estimatedDeliveryEnd}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
