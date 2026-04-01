import type { Config } from "tailwindcss";

// Shared Tailwind CSS configuration for Doost AI
// Import and extend in app-specific tailwind configs
const config: Partial<Config> = {
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {},
  },
};

export default config;
