/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: ['class', '[data-mode="dark"]'],
  theme: {
    colors: ({colors}) => ({
      ...colors,
      primary: 'var(--color-primary)',
      secondary: 'var(--color-secondary)',
      tertiary: 'var(--color-tertiary)',
      headline: 'var(--headline-color)',
      paragraph: 'var(--paragraph-color)',
      button: 'var(--button-bg-color)',
      'button-text': 'var(--button-text-color)',
      stroke: 'var(--color-stroke)',

      'feed-list-bg': 'var(--feed-list-bg-color)',
      'feed-headline': 'var(--feed-headline-color)',
      'feed-active-bg': 'var(--feed-active-bg-color)',
      'feed-active-headline': 'var(--feed-active-headline-color)',

      'article-list-bg': 'var(--article-list-bg-color)',
      'article-headline': 'var(--article-headline-color)',
      'article-paragraph': 'var(--article-paragraph-color)',
      'article-active-bg': 'var(--article-active-bg-color)',
      'article-active-headline':'var(--article-active-headline-color)',
      'article-active-paragraph': 'var(--article-active-paragraph-color)',

      'detail-bg': 'var(--detail-bg-color)',

    }),
    extend: {
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
