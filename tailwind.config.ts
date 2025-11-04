import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Map your CSS variables to Tailwind colors
        primary: {
          DEFAULT: "var(--color-primary)",
          dark: "var(--color-primary-dark)",
          light: "var(--color-primary-light)",
        },
        purple: {
          DEFAULT: "var(--color-purple)",
        },
        secondary: {
          DEFAULT: "#6b7280",
          dark: "#4b5563",
          light: "#9ca3af",
        },
        error: {
          DEFAULT: "var(--color-error)",
          dark: "var(--color-error-dark)",
          light: "var(--color-error-light)",
        },
        background: {
          main: "var(--color-background-main)",
          white: "var(--color-background-white)",
          light: "var(--color-background-light)",
          hover: "var(--color-background-hover)",
          disabled: "var(--color-background-disabled)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
          muted: "var(--color-text-muted)",
          light: "var(--color-text-light)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          input: "var(--color-border-input)",
          light: "var(--color-border-light)",
        },
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        xxl: "24px",
        "3xl": "32px",
        "4xl": "40px",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
      },
      fontSize: {
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.5" }],
        lg: ["18px", { lineHeight: "1.5" }],
        xl: ["24px", { lineHeight: "1.3" }],
      },
      keyframes: {
        titleLanding: {
          "0%": {
            transform: "scale(0.5) translateY(-20px)",
            opacity: "0",
            letterSpacing: "0.5em",
            textShadow: "0 0 0 rgba(0,0,0,0)",
          },
          "40%": {
            opacity: "1",
          },
          "70%": {
            transform: "scale(1.05) translateY(0)",
            letterSpacing: "normal",
            textShadow: "0 10px 20px rgba(0,0,0,0.15)",
          },
          "85%": {
            transform: "scale(0.95)",
          },
          "100%": {
            transform: "scale(1)",
            textShadow: "0 5px 10px rgba(0,0,0,0.1)",
          },
        },
      },
      animation: {
        titleLanding: "titleLanding 1.8s ease-out forwards",
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark'],
    darkTheme: 'dark',
    base: false, // Ne pas modifier les styles de base pour préserver les polices
    styled: true,
    utils: true,
    logs: false, // Désactiver les logs en production
  },
};

export default config;

