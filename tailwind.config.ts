import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
        // Glossy Metallic palette
        "metal-900": "#0d0f17",
        "metal-800": "#131627",
        "metal-700": "#161a2e",
        "metal-600": "#1e2237",
        "metal-500": "#262b44",
        "metal-400": "#323752",
        "metal-300": "#4a506e",
        "metal-200": "#6b7194",
        "metal-100": "#9ca3c4",
        "editor-accent": "#e94560",
        "editor-accent-hover": "#f05a73",
        "editor-accent-glow": "rgba(233, 69, 96, 0.15)",
      },
      backgroundImage: {
        "metal-surface": "linear-gradient(180deg, rgba(30,34,55,1) 0%, rgba(22,26,46,1) 40%, rgba(18,21,40,1) 100%)",
        "metal-elevated": "linear-gradient(165deg, rgba(34,38,62,1) 0%, rgba(26,30,52,1) 50%, rgba(22,25,46,1) 100%)",
        "metal-btn": "linear-gradient(180deg, rgba(40,44,68,1) 0%, rgba(30,34,56,1) 100%)",
        "metal-btn-hover": "linear-gradient(180deg, rgba(50,55,82,1) 0%, rgba(38,42,66,1) 100%)",
        "metal-input": "linear-gradient(180deg, rgba(18,21,38,1) 0%, rgba(14,17,32,1) 100%)",
        "metal-sep": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.06) 80%, transparent 100%)",
        "metal-topbar": "linear-gradient(180deg, rgba(28,32,54,1) 0%, rgba(20,24,44,1) 50%, rgba(16,19,36,1) 100%)",
        "metal-toolbar": "linear-gradient(180deg, rgba(24,28,48,1) 0%, rgba(18,22,40,1) 100%)",
        "metal-panel": "linear-gradient(180deg, rgba(26,30,50,1) 0%, rgba(20,24,42,1) 100%)",
        "metal-card": "linear-gradient(165deg, rgba(34,38,62,0.95) 0%, rgba(22,26,46,0.98) 100%)",
        "accent-gradient": "linear-gradient(135deg, #e94560 0%, #ff6b6b 100%)",
        "accent-gradient-hover": "linear-gradient(135deg, #f05a73 0%, #ff8080 100%)",
      },
      boxShadow: {
        "metal-sm": "inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 6px rgba(0,0,0,0.2)",
        "metal": "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.3)",
        "metal-lg": "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.5), 0 2px 12px rgba(0,0,0,0.3)",
        "metal-xl": "inset 0 1px 0 rgba(255,255,255,0.08), 0 16px 64px rgba(0,0,0,0.6)",
        "accent-glow": "0 0 12px rgba(233,69,96,0.15), 0 0 24px rgba(233,69,96,0.08)",
        "canvas": "0 0 40px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.2)",
        "inner-dark": "inset 0 2px 4px rgba(0,0,0,0.3)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        "editor-xs": ["10px", { lineHeight: "14px" }],
        "editor-sm": ["11px", { lineHeight: "16px" }],
        "editor-base": ["12px", { lineHeight: "18px" }],
        "editor-lg": ["13px", { lineHeight: "20px" }],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
