import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#080b11",
        surface: {
          50: "#182030",
          100: "#141b29",
          200: "#0f1522",
          300: "#0b0f19",
          DEFAULT: "#0d121f",
        },
        navy: {
          950: "#05080e",
          900: "#090d16",
          850: "#0d1320",
          800: "#121a2c",
          700: "#1a253e",
          600: "#243253",
        },
        cyber: {
          green: "#00ff88",
          emerald: "#10b981",
          cyan: "#06b6d4",
          blue: "#3b82f6",
          purple: "#8b5cf6",
          amber: "#f59e0b",
          red: "#ef4444",
        },
        status: {
          critical: "#ef4444",
          high: "#f97316",
          medium: "#eab308",
          low: "#3b82f6",
          safe: "#10b981",
          info: "#64748b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        "neon-green": "0 0 20px -5px rgba(0, 255, 136, 0.3)",
        "neon-cyan": "0 0 20px -5px rgba(6, 182, 212, 0.3)",
        "neon-blue": "0 0 20px -5px rgba(59, 130, 246, 0.3)",
        "neon-red": "0 0 20px -5px rgba(239, 68, 68, 0.3)",
        "card": "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { opacity: "0.4" },
          "100%": { opacity: "0.8" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

