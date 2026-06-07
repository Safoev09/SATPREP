/ @type {import('tailwindcss').Config} */
module.exports = {
  safelist: ['ml-64'],
  content: [
    "./src/app//*.{js,ts,jsx,tsx,mdx}",
    "./src/components//*.{js,ts,jsx,tsx,mdx}",
    "./src/pages//*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: { 50: "#FBF7F1", 100: "#F5EFE4", 200: "#ECE2CD" },
        beige: { 300: "#D9C7A6", 400: "#C3AC83" },
        coffee: {
          500: "#8B6B4A",
          600: "#6E5036",
          700: "#503826",
          800: "#3A2818",
          900: "#241710",
        },
        accent: "#B5895D",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      keyframes: {
        drift1: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(60px, 80px) scale(1.08)" },
        },
        drift2: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-70px, 50px) scale(0.95)" },
        },
        drift3: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(40px, -60px) scale(1.05)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        softpulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.08)", opacity: "0.9" },
        },
        flicker: {
          "0%, 100%": { transform: "scale(1) rotate(-2deg)", opacity: "1" },
          "50%": { transform: "scale(1.12) rotate(2deg)", opacity: "0.92" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeup: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        countup: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        drift1: "drift1 22s ease-in-out infinite",
        drift2: "drift2 28s ease-in-out infinite",
        drift3: "drift3 32s ease-in-out infinite",
        floaty: "floaty 4s ease-in-out infinite",
        softpulse: "softpulse 3s ease-in-out infinite",
        flicker: "flicker 2.5s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        fadeup: "fadeup 0.5s ease-out both",
        countup: "countup 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};