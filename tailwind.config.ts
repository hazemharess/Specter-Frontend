import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        line: "var(--border)",
        "line-strong": "var(--border-strong)",
        ink: "var(--text-primary)",
        "ink-2": "var(--text-secondary)",
        "ink-3": "var(--text-tertiary)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-soft": "var(--accent-soft)",
        "accent-contrast": "var(--accent-contrast)",
        gold: "var(--gold)",
        danger: "var(--danger)",
        "status-done": "var(--status-done)",
        "status-review": "var(--status-review)",
        "status-pending": "var(--status-pending)",
        "pill-bg": "var(--pill-bg)",
        "pill-text": "var(--pill-text)",
      },
      borderRadius: {
        card: "14px",
        input: "10px",
        panel: "20px",
        pill: "999px",
      },
      boxShadow: {
        raised: "0 1px 2px rgba(16,14,10,.04), 0 1px 3px rgba(16,14,10,.05)",
        floating:
          "0 4px 16px rgba(16,14,10,.06), 0 12px 40px rgba(16,14,10,.10)",
      },
      fontSize: {
        label: ["13px", { lineHeight: "1.5" }],
        body: ["15px", { lineHeight: "1.7" }],
        title: ["17px", { lineHeight: "1.6" }],
        page: ["28px", { lineHeight: "1.4" }],
      },
      fontFamily: {
        sans: [
          "var(--font-arabic)",
          "IBM Plex Sans Arabic",
          "IBM Plex Sans",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
