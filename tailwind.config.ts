import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: "var(--color-forest)",
        leaf: "var(--color-leaf)",
        lime: "var(--color-lime)",
        cream: "var(--color-cream)",
        ink: "var(--color-ink)",
        amber: "var(--color-amber)",
        red: "var(--color-red)",
        surface: "var(--color-surface)",
        muted: "var(--color-muted)",
        line: "var(--color-line)",
        "forest-soft": "var(--color-forest-soft)",
        "amber-soft": "var(--color-amber-soft)",
        "red-soft": "var(--color-red-soft)",
        "success-soft": "var(--color-success-soft)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      maxWidth: {
        content: "1280px",
        mobile: "720px",
      },
    },
  },
  plugins: [],
};

export default config;
