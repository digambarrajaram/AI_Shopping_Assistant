export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Large leaf SVG */}
      <svg
        className="w-20 h-20 mb-6 opacity-80"
        viewBox="0 0 80 80"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M40 8C22 8 14 22 14 34c0 12 8 20 16 24v4h20v-4c8-4 16-12 16-24 0-12-8-26-26-26z"
          fill="#10B981"
          opacity=".12"
        />
        <path
          d="M40 12C26.74 12 20 21.84 20 31.2c0 9.36 6.74 16 13.6 19.6.94.52 1.6.9 2.4 1.2v4h8v-4c.8-.3 1.46-.68 2.4-1.2C53.26 47.2 60 40.56 60 31.2 60 21.84 53.26 12 40 12z"
          fill="#10B981"
        />
        <path
          d="M40 18c-4 0-6 3-6 8h12c0-5-2-8-6-8z"
          fill="#6EE7B7"
        />
        <path
          d="M28 40c0 4 3.58 8 8 8s8-4 8-8"
          stroke="#10B981"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity=".5"
        />
      </svg>

      {/* Greeting */}
      <h2
        className="text-[28px] leading-tight mb-3 text-[var(--text-primary)]"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        How can I help you today?
      </h2>

      <p className="text-[14px] text-[var(--text-secondary)] mb-8 max-w-sm">
        I&apos;m your AI shopping assistant — here to help you find products,
        check reviews, and place orders.
      </p>

      {/* Capability chips */}
      <div className="flex flex-wrap gap-2.5 justify-center">
        {[
          { icon: "🛍️", label: "Browse products" },
          { icon: "⭐", label: "Check reviews" },
          { icon: "📦", label: "Place orders" },
        ].map(({ icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full
                       text-[13px] font-medium border border-[var(--border)]
                       text-[var(--text-secondary)] bg-[var(--surface)]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
