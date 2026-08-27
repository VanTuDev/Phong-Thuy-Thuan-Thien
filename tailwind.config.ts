import type { Config } from "tailwindcss";

/**
 * Design tokens consolidated from the Zenith Qi / Modern Sage design system
 * (see ../Thuan-Thien-Phong-Thuy/DESIGN.md and zenith_qi_gold/DESIGN.md).
 * "gold" is the single accent color used across every screen; "on-surface"
 * carries the white body text; surfaces build the Tech-Zen Minimalism void.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#121212",
        "surface-dim": "#0A0A0A",
        "surface-bright": "#3a3939",
        "surface-container-lowest": "#000000",
        "surface-container-low": "#1a1918",
        "surface-container": "#201f1f",
        "surface-container-high": "#2a2a2a",
        "surface-container-highest": "#353434",
        "surface-variant": "#353434",
        "on-surface": "#e5e2e1",
        "on-surface-variant": "#c4c7c8",
        outline: "#8e9192",
        "outline-variant": "#444748",
        gold: {
          DEFAULT: "#D4AF37",
          light: "#F2CA50",
          dim: "#E9C349",
        },
        "on-gold": "#141313",
        error: "#ffb4ab",
        "error-container": "#93000a",
        "on-error": "#690005",
        wood: "#4CAF50",
        water: "#2196F3",
        fire: "#FF9800",
        "line-life": "#FF5252",
        "line-head": "#448AFF",
        "line-heart": "#FFC107",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      spacing: {
        unit: "8px",
        gutter: "24px",
        "margin-mobile": "16px",
        "margin-desktop": "64px",
        "section-gap": "120px",
        "container-max": "1280px",
      },
      maxWidth: {
        "container-max": "1280px",
      },
      fontFamily: {
        serif: ["var(--font-eb-garamond)", "Georgia", "serif"],
        sans: ["var(--font-hanken-grotesk)", "Helvetica", "Arial", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        "label-caps": ["var(--font-jetbrains-mono)", "monospace"],
        "data-mono": ["var(--font-jetbrains-mono)", "monospace"],
        "headline-lg-mobile": ["var(--font-eb-garamond)", "serif"],
        "headline-lg": ["var(--font-eb-garamond)", "serif"],
        "headline-md": ["var(--font-eb-garamond)", "serif"],
        "display-lg": ["var(--font-eb-garamond)", "serif"],
        "body-lg": ["var(--font-hanken-grotesk)", "sans-serif"],
        "body-md": ["var(--font-hanken-grotesk)", "sans-serif"],
      },
      fontSize: {
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.1em", fontWeight: "500" }],
        "data-mono": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "headline-lg-mobile": ["32px", { lineHeight: "40px", fontWeight: "400" }],
        "headline-lg": ["40px", { lineHeight: "48px", fontWeight: "400" }],
        "headline-md": ["28px", { lineHeight: "36px", fontWeight: "400" }],
        "display-lg": ["64px", { lineHeight: "72px", letterSpacing: "-0.02em", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
      },
      keyframes: {
        "slow-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%": { boxShadow: "0 0 0 0 rgba(212,175,55,0)" },
          "100%": { boxShadow: "0 0 40px 10px rgba(212,175,55,0.12)" },
        },
        scan: {
          "0%": { top: "0%", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { top: "100%", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          from: { opacity: "0", transform: "translateY(-12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "bg-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "dot-bounce": {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "slow-spin": "slow-spin 20s linear infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite alternate",
        scan: "scan 3s linear infinite",
        "fade-in": "fade-in 0.5s ease-out both",
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in-down": "fade-in-down 0.4s ease-out both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 1.8s infinite",
        "bg-pan": "bg-pan 8s ease infinite",
        float: "float 6s ease-in-out infinite",
        "dot-bounce": "dot-bounce 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
