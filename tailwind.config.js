/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base surfaces — wired to CSS variables in index.css so the
        // `.light` class (toggled on <html>) flips every one of these
        // automatically, app-wide, without touching component code.
        bg: {
          DEFAULT: 'rgb(var(--color-bg) / <alpha-value>)',
          card: 'rgb(var(--color-bg-card) / <alpha-value>)',
          cardAlt: 'rgb(var(--color-bg-cardAlt) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          faint: 'rgb(var(--color-text-faint) / <alpha-value>)',
        },
        review: {
          bg: 'rgb(var(--color-review-bg) / <alpha-value>)',
          text: 'rgb(var(--color-review-text) / <alpha-value>)',
          muted: 'rgb(var(--color-review-text-muted) / <alpha-value>)',
        },
        // Brand and status colors are intentionally the same in both
        // themes (they're accent colors, not surfaces).
        brand: {
          blue: '#4d8dff',
          blueDark: '#2a5fd6',
          red: '#c0392b',
          redLight: '#e78a8a',
        },
        status: {
          success: '#3fae5c',
          successBg: '#1e3a2a',
          warning: '#e0a94d',
          warningBg: '#3a2e1e',
          rating: '#ffcf5c',
        },
        ad: {
          bg: '#1e1416',
          border: '#4a2224',
          text: '#e78a8a',
        },
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
};
