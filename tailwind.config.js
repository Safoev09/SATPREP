/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: { 50: "#FBF7F1", 100: "#F5EFE4", 200: "#ECE2CD" },
        beige: { 300: "#D9C7A6", 400: "#C3AC83" },
        coffee: {
          500: "#8B6B4A", 600: "#6E5036", 700: "#503826",
          800: "#3A2818", 900: "#241710",
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
      },
      animation: {
        drift1: "drift1 22s ease-in-out infinite",
        drift2: "drift2 28s ease-in-out infinite",
        drift3: "drift3 32s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
