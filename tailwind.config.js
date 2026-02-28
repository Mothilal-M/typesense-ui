/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        heading: ["Cabinet Grotesk", "sans-serif"],
        display: ["Clash Display", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        neon: {
          cyan: "#0cdcf7",
          mint: "#4ff0b7",
          pink: "#ff4fba",
          purple: "#8d30ff",
        },
        landing: {
          base: "#0a0a1a",
          surface: "#0f1025",
          card: "#12141f",
          "card-border": "#1e2035",
        },
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-in",
        "slide-in-right": "slideInRight 0.3s ease-out",
        float: "float 3s ease-in-out infinite",
        "blob-1": "blobMorph1 20s ease-in-out infinite",
        "blob-2": "blobMorph2 25s ease-in-out infinite",
        "blob-3": "blobMorph3 18s ease-in-out infinite",
        "blob-4": "blobMorph1 22s ease-in-out infinite reverse",
        "blob-5": "blobMorph2 30s ease-in-out infinite reverse",
        "orb-drift-1": "orbDrift1 20s ease-in-out infinite",
        "orb-drift-2": "orbDrift2 25s ease-in-out infinite",
        "orb-drift-3": "orbDrift3 22s ease-in-out infinite",
        "orb-drift-4": "orbDrift4 18s ease-in-out infinite",
        twinkle: "twinkle 2s ease-in-out infinite",
        "cloud-drift": "cloudDrift 6s ease-in-out infinite",
        "slide-in-top": "slideInTop 0.2s ease-out",
      },
      keyframes: {
        slideInTop: {
          "0%": { opacity: "0", transform: "translateY(-20px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.2", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.4)" },
        },
        cloudDrift: {
          "0%, 100%": { transform: "translateX(0px)" },
          "50%": { transform: "translateX(6px)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        blobMorph1: {
          "0%, 100%": {
            transform: "translate(0, 0) scale(1)",
            borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
          },
          "25%": {
            transform: "translate(30%, -15%) scale(1.1)",
            borderRadius: "50% 60% 30% 70% / 60% 40% 60% 40%",
          },
          "50%": {
            transform: "translate(-15%, 30%) scale(0.9)",
            borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%",
          },
          "75%": {
            transform: "translate(15%, 15%) scale(1.05)",
            borderRadius: "60% 40% 30% 70% / 40% 70% 50% 50%",
          },
        },
        blobMorph2: {
          "0%, 100%": {
            transform: "translate(0, 0) scale(1)",
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
          },
          "33%": {
            transform: "translate(-20%, 20%) scale(1.15)",
            borderRadius: "40% 60% 50% 50% / 50% 50% 40% 60%",
          },
          "66%": {
            transform: "translate(20%, -10%) scale(0.85)",
            borderRadius: "50% 50% 60% 40% / 40% 60% 50% 50%",
          },
        },
        blobMorph3: {
          "0%, 100%": {
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            borderRadius: "50% 50% 50% 50%",
          },
          "50%": {
            transform: "translate(10%, 20%) scale(1.2) rotate(180deg)",
            borderRadius: "30% 70% 50% 50% / 50% 50% 70% 30%",
          },
        },
        orbDrift1: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -20px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 15px) scale(0.95)" },
        },
        orbDrift2: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-25px, 25px) scale(1.05)" },
        },
        orbDrift3: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "25%": { transform: "translate(20px, 10px) scale(1.08)" },
          "75%": { transform: "translate(-15px, -20px) scale(0.92)" },
        },
        orbDrift4: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(15px, -15px) scale(1.1)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
