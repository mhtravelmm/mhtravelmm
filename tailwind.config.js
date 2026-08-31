/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base surfaces (dark theme, per approved mockups)
        bg: {
          DEFAULT: '#0b0d11',
          card: '#14171d',
          cardAlt: '#1b1e26',
        },
        border: {
          DEFAULT: '#262a33',
        },
        text: {
          primary: '#ffffff',
          secondary: '#c7cad1',
          muted: '#9aa0ab',
          faint: '#6d7280',
        },
        brand: {
          // Primary accent (links, active nav, icons)
          blue: '#4d8dff',
          blueDark: '#2a5fd6',
          // Primary CTA (Book Now, Explore Now, prices)
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
