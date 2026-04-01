import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";
import tailwindTypography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // ── Fonts ──────────────────────────────────────────
      fontFamily: {
        sans: ["DM Sans", "var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        sketch: ["var(--font-marker)", "cursive"],
      },
      fontSize: {
        // Design system typography scale
        "page-title": ["28px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "card-title": ["20px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "700" }],
        "section-label": ["11px", { lineHeight: "1.4", letterSpacing: "0.06em", fontWeight: "600" }],
        "body": ["14px", { lineHeight: "1.6" }],
        "body-lg": ["15px", { lineHeight: "1.6" }],
        "small": ["13px", { lineHeight: "1.5", fontWeight: "500" }],
        "xs": ["12px", { lineHeight: "1.5", fontWeight: "500" }],
        "pill": ["11px", { lineHeight: "1.3", letterSpacing: "0.01em", fontWeight: "600" }],
        "metric": ["24px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        "metric-lg": ["26px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        // Legacy sizes kept for backward compat
        display: ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        title: ["22px", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        secondary: ["12px", { lineHeight: "1.5" }],
        caption: ["11px", { lineHeight: "1.4" }],
        micro: ["10px", { lineHeight: "1.3" }],
      },

      // ── Colors (Doost design tokens) ───────────────────
      colors: {
        // Page & surfaces
        page: "#FAFAF9",
        surface: "#F4F3F0",

        // shadcn CSS variable colors (keep for component compat)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#2563EB",
          light: "#EFF6FF",
          border: "#BFDBFE",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "hsl(var(--card-foreground))",
        },

        // Doost semantic tokens
        "d-border": { DEFAULT: "#E8E6E1", light: "#F0EEE9" },
        "d-text": { primary: "#1A1A18", secondary: "#6B6A66", hint: "#9C9A92" },
        "d-success": { DEFAULT: "#059669", light: "#ECFDF5", border: "#A7F3D0" },
        "d-warning": { DEFAULT: "#D97706", light: "#FFFBEB", border: "#FDE68A" },
        "d-danger": { DEFAULT: "#DC2626", light: "#FEF2F2" },
      },

      // ── Border radius (design system) ──────────────────
      borderRadius: {
        card: "14px",
        cell: "10px",
        btn: "10px",
        pill: "20px",
        // shadcn defaults
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // ── Spacing tokens ─────────────────────────────────
      spacing: {
        "card-p": "20px",
        "card-p-lg": "24px",
        "cell-p": "16px",
        "grid-gap": "10px",
        "section": "28px",
      },

      // ── Shadows ────────────────────────────────────────
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        "card-active": "0 0 0 3px var(--accent-light, #EFF6FF)",
      },

      // ── Keyframes ──────────────────────────────────────
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s ease-in-out infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindAnimate, tailwindTypography],
};

export default config;
