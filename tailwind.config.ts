import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d7fe",
          300: "#a5bbfc",
          400: "#8196f8",
          500: "#6271f1",
          600: "#4f52e5",
          700: "#4140ca",
          800: "#3636a3",
          900: "#303381",
          950: "#1d1d4d",
        },
        surface: {
          50: "#f8f9fc",
          100: "#f1f3f9",
          200: "#e4e8f2",
          300: "#cdd4e6",
          400: "#aab8d4",
          500: "#8d9fbe",
          600: "#6e7fa3",
          700: "#576788",
          800: "#495570",
          900: "#3e485d",
          950: "#090e1a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-cal)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      animation: {
        "slide-in": "slideIn 0.2s ease-out",
        "fade-in": "fadeIn 0.15s ease-out",
        "bounce-in": "bounceIn 0.3s cubic-bezier(0.68,-0.55,0.27,1.55)",
        "pulse-ring": "pulseRing 1.5s cubic-bezier(0.215,0.61,0.355,1) infinite",
        "typing": "typing 1.4s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        slideIn: {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        bounceIn: {
          from: { transform: "scale(0.8)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(98,113,241,0.7)" },
          "70%": { transform: "scale(1)", boxShadow: "0 0 0 10px rgba(98,113,241,0)" },
          "100%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(98,113,241,0)" },
        },
        typing: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "noise": "url('/noise.svg')",
      },
      boxShadow: {
        glow: "0 0 20px rgba(98,113,241,0.35)",
        "glow-sm": "0 0 10px rgba(98,113,241,0.25)",
        "inner-glow": "inset 0 0 20px rgba(98,113,241,0.1)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
