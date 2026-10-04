/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#F3F5FB', 100: '#E6EAF5', 200: '#C9D1E6', 300: '#9AA7C7', 400: '#6D7BA3',
          500: '#4B5A82', 600: '#35426A', 700: '#243055', 800: '#16204A', 900: '#0D1536',
        },
        brand: {
          50: '#EEF3FF', 100: '#DCE6FF', 200: '#BACDFF', 300: '#8AAAFF', 400: '#5A82FF',
          500: '#2F5BFF', 600: '#1E43E0', 700: '#1835B4',
        },
        cyan2: {
          50: '#ECFEFF', 100: '#CFFAFE', 200: '#A5F3FC', 300: '#67E8F9', 400: '#22D3EE', 500: '#06B6D4', 600: '#0891B2',
        },
        coral: {
          50: '#FFF1EF', 100: '#FFE0DC', 200: '#FFC2BA', 300: '#FF9C90', 400: '#FF7A6B',
          500: '#FF5A4D', 600: '#EB3F32', 700: '#C42E23',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 1px rgba(13,21,54,.04), 0 2px 4px rgba(13,21,54,.04), 0 12px 24px -8px rgba(60,60,200,.16), 0 28px 48px -24px rgba(124,77,255,.18)',
        lift: '0 2px 2px rgba(13,21,54,.05), 0 8px 16px rgba(13,21,54,.06), 0 24px 44px -12px rgba(60,60,200,.28), 0 44px 70px -30px rgba(124,77,255,.3)',
        tile: 'inset 0 1px 0 rgba(255,255,255,.45), inset 0 -3px 6px rgba(13,21,54,.18), 0 10px 18px -6px rgba(47,91,255,.5)',
      },
    },
  },
  plugins: [],
};
