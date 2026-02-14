/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      animation: {
        "swipe-right": "swipeRight 0.3s ease-out forwards",
        "swipe-left": "swipeLeft 0.3s ease-out forwards",
      },
      keyframes: {
        swipeRight: {
          "0%": { transform: "translateX(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateX(120%) rotate(15deg)", opacity: "0" },
        },
        swipeLeft: {
          "0%": { transform: "translateX(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateX(-120%) rotate(-15deg)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
