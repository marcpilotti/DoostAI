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
      // ── Fonts (Satoshi from DESIGN_REFERENCE) ─────────────
      fontFamily: {
        sans: ["Satoshi", "system-ui", "sans-serif"],
        display: ["Satoshi", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },

      // ── Typography scale (DESIGN_REFERENCE) ──────────────
      fontSize: {
        "text-hero": ["40px", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "900" }],
        "text-h1": ["28px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "text-h2": ["22px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "700" }],
        "text-h3": ["18px", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "600" }],
        "text-body": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "text-body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "text-caption": ["12px", { lineHeight: "1.4", letterSpacing: "0.02em", fontWeight: "500" }],
        "text-overline": ["11px", { lineHeight: "1.2", letterSpacing: "0.08em", fontWeight: "700" }],
      },

      // ── Colors ────────────────────────────────────────────
      colors: {
        // Wizard surfaces
        "wz-base": "var(--color-bg-base)",
        "wz-elevated": "var(--color-bg-elevated)",
        "wz-raised": "var(--color-bg-raised)",
        "wz-input": "var(--color-bg-input)",
        "wz-hover": "var(--color-bg-hover)",

        // Wizard primary
        "wz-primary": {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          light: "var(--color-primary-light)",
          subtle: "var(--color-primary-subtle)",
          glow: "var(--color-primary-glow)",
        },

        // Wizard text
        "wz-text": {
          DEFAULT: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          inverse: "var(--color-text-inverse)",
        },

        // Wizard borders
        "wz-border": {
          DEFAULT: "var(--color-border-default)",
          subtle: "var(--color-border-subtle)",
          focus: "var(--color-border-focus)",
        },

        // Semantic
        "wz-success": { DEFAULT: "var(--color-success)", bg: "var(--color-success-bg)" },
        "wz-warning": { DEFAULT: "var(--color-warning)", bg: "var(--color-warning-bg)" },
        "wz-error": { DEFAULT: "var(--color-error)", bg: "var(--color-error-bg)" },

        // Platform brands
        "platform-meta": "var(--color-meta)",
        "platform-google": "var(--color-google)",
        "platform-linkedin": "var(--color-linkedin)",
        "platform-tiktok": "var(--color-tiktok)",
        "platform-snapchat": "var(--color-snapchat)",

        // shadcn CSS variable colors (component compat)
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
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },

      // ── Border radius ─────────────────────────────────────
      borderRadius: {
        "wz-sm": "var(--radius-sm)",
        "wz-md": "var(--radius-md)",
        "wz-lg": "var(--radius-lg)",
        "wz-xl": "var(--radius-xl)",
        "wz-full": "var(--radius-full)",
        // shadcn defaults
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // ── Spacing tokens ────────────────────────────────────
      spacing: {
        "wz-1": "var(--space-1)",
        "wz-2": "var(--space-2)",
        "wz-3": "var(--space-3)",
        "wz-4": "var(--space-4)",
        "wz-5": "var(--space-5)",
        "wz-6": "var(--space-6)",
        "wz-8": "var(--space-8)",
        "wz-10": "var(--space-10)",
        "wz-12": "var(--space-12)",
      },

      // ── Shadows ───────────────────────────────────────────
      boxShadow: {
        "wz-sm": "var(--shadow-sm)",
        "wz-md": "var(--shadow-md)",
        "wz-lg": "var(--shadow-lg)",
        "wz-xl": "var(--shadow-xl)",
        "wz-glow": "var(--shadow-glow)",
        "wz-glow-sm": "var(--shadow-glow-sm)",
      },

      // ── Keyframes ─────────────────────────────────────────
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "ai-breathe": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(99, 102, 241, 0.1)" },
          "50%": { boxShadow: "0 0 35px rgba(99, 102, 241, 0.2)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "ai-breathe": "ai-breathe 3s ease-in-out infinite",
        shimmer: "shimmer 1.5s ease-in-out infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindAnimate, tailwindTypography],
};

export default config;
