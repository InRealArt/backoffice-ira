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
    },
  },
  plugins: [],
};

export default config;

