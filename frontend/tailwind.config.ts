import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAF8",
        surface: "#FFFFFF",
        border: "#EBEBE8",
        "text-primary": "#1A1A18",
        "text-secondary": "#6B6B67",
        "text-muted": "#A8A8A3",
        accent: "#2D6A4F",
        "accent-light": "#D8F3DC",
        "accent-hover": "#1B4332",
        danger: "#C0392B",
        "warning-bg": "#FFF9E6",
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        body: ["Inter", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      fontSize: {
        "13": ["13px", "1.4"],
        "14": ["14px", "1.6"],
        "16": ["16px", "1.6"],
        "22": ["22px", "1.2"],
        "28": ["28px", "1.3"],
      },
    },
  },
  plugins: [],
} satisfies Config;
