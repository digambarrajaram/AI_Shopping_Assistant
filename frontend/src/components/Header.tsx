interface HeaderProps {
  productCount?: number;
}

export default function Header({ productCount }: HeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
        flexShrink: 0,
        borderBottom: "1px solid var(--border)",
        padding: "0 clamp(1rem, 4vw, 2rem)",
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M16 4C9.37 4 6 8.92 6 13.6c0 4.68 3.37 8 6.8 9.8.47.26.8.45 1.2.6v2h4v-2c.4-.15.73-.34 1.2-.6C22.63 21.6 26 18.28 26 13.6 26 8.92 22.63 4 16 4z"
              fill="#A8E6B8"
            />
            <path d="M16 7c-2 0-3 1.5-3 4h6c0-2.5-1-4-3-4z" fill="#6EE7B7" />
          </svg>
        </div>

        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20,
            fontWeight: 600,
            color: "#FFFFFF",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          ShopAssist
        </span>
      </div>

      {/* Right side — .header-meta hides below 480px via index.css */}
      <div className="header-meta">
        {productCount !== undefined && productCount > 0 && (
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {productCount} products
          </span>
        )}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            fontWeight: 500,
            color: "#A8E6B8",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#A8E6B8",
              flexShrink: 0,
            }}
          />
          Online
        </span>
      </div>
    </header>
  );
}
