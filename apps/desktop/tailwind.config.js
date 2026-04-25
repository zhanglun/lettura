const { fontFamily } = require("tailwindcss/defaultTheme");
const {
  blackA,
  whiteA,
  violet,
  mauve,
  mauveDark,
  red,
  gray,
  grayA,
  green,
  indigo,
  indigoDark,
} = require("@radix-ui/colors");

console.log("%c Line:13 🍣 indigo", "color:#ed9ec7", indigo);

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
    colors: ({ colors }) => ({
      ...colors,
    }),
    extend: {
      colors: {
        ...blackA,
        ...violet,
        ...mauve,
        ...mauveDark,
        ...whiteA,
        ...red,
        ...gray,
        ...grayA,
        ...green,
        ...indigo,
        ...indigoDark,
        // border: "hsl(var(--border))",
        border: "var(--borderLine)",
        input: "var(--borderLine)",
        ring: "var(--accent)",
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
          foreground: "hsl(var(--accent-foreground))",
          DEFAULT: "var(--accent-12))",
          1: "var(--accent-1)",
          2: "var(--accent-2)",
          3: "var(--accent-3)",
          4: "var(--accent-4)",
          5: "var(--accent-5)",
          6: "var(--accent-6)",
          7: "var(--accent-7)",
          8: "var(--accent-8)",
          9: "var(--accent-9)",
          10: "var(--accent-10)",
          11: "var(--accent-11)",
          12: "var(--accent-12)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        canvas: {
          DEFAULT: "var(--gray-3)",
          foreground: "var(--gray-11)",
        },
        panel: {
          DEFAULT: "var(--gray-1)",
          foreground: "var(--gray-11)",
        },
        sidebar: {
          DEFAULT: "var(--gray-11)",
          active: "var(--gray-1)",
          hover: "var(--gray-6)",
        },
      },
      borderWidth: {
        DEFAULT: "0.5px",
        1: "1px",
        2: "2px",
        3: "3px",
        4: "4px",
      },
      borderColor: {
        DEFAULT: "var(--gray-6)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spin-slow": "spin 2s linear infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/line-clamp"), require("@tailwindcss/typography"), require("tailwindcss-animate")],
};
