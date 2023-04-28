/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: ['class', '[data-mode="dark"]'],
  theme: {
    colors: ({colors}) => ({
      ...colors,
      "royal-blue": {
        50: "#eff4ff",
        100: "#dbe6fe",
        200: "#bfd3fe",
        300: "#93b4fd",
        400: "#6090fa",
        500: "#3b76f6",
        // 600: "#2563eb",
        600: "#078080",
        700: "#1d58d8",
        800: "#1e4baf",
        900: "#1e408a",
      },
    }),
    extend: {
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
