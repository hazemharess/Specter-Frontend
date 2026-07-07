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
        line: "var(--border)",
        ink: "var(--text-primary)",
        "ink-2": "var(--text-secondary)",
        "ink-3": "var(--text-tertiary)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        gold: "var(--gold)",
        danger: "var(--danger)",
      },
      borderRadius: {
        card: "12px",
        input: "8px",
        pill: "999px",
      },
      boxShadow: {
        raised: "0 1px 2px rgba(16,14,10,.04), 0 4px 16px rgba(16,14,10,.06)",
        floating:
          "0 4px 12px rgba(16,14,10,.08), 0 16px 48px rgba(16,14,10,.12)",
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
