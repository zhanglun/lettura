/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", '[data-color-scheme="dark"]'],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      borderWidth: {
        DEFAULT: "0.5px",
        1: "1px",
        2: "2px",
        3: "3px",
        4: "4px",
      },
      borderColor: {
        DEFAULT: "var(--color-border)",
      },
      animation: {},
    },
  },
  plugins: [],
};
