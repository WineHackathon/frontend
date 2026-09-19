/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        svoe: {
          wine: {
            50: '#fdf6f6',
            100: '#f9f1f1',
            200: '#edd4d6',
            300: '#e0b8ba',
            400: '#c6747b',
            500: '#ab494f',
            600: '#8f3d42', // Exact primary button and accent from vino-svoe.ru
            700: '#7b3528', // Exact active/nav link color from vino-svoe.ru
            800: '#723135',
            900: '#4f1f23',
            950: '#2c1012',
          },
          cream: {
            50: '#fefdfa', // Core footer & light page bg from vino-svoe.ru
            100: '#fdf9ed', // Regional card & chips bg from vino-svoe.ru
            200: '#f8ecc9', // Hover chip state
            300: '#efdbc6', // Floating header backdrop from vino-svoe.ru
            400: '#f3e0a5',
          },
          charcoal: {
            DEFAULT: '#2c2a28', // Core text color from vino-svoe.ru
            muted: '#857e79',   // Secondary text from vino-svoe.ru
            subtle: '#9a948f',  // Captions & copyright from vino-svoe.ru
            border: '#ebe9e9',  // Subtle dividers from vino-svoe.ru
            borderDark: '#d7d4d2',
          },
          gold: {
            400: '#f3c760',
            500: '#dfa838',
            600: '#bf8624',
          }
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['system-ui', '-apple-system', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'svoe-header': '0 4px 25px rgba(0, 0, 0, 0.07)',
        'svoe-pill': '0 1px 2px rgba(108, 85, 15, 0.1), 0 4px 4px rgba(108, 85, 15, 0.05), 0 0 20px rgba(108, 85, 15, 0.1)',
        'svoe-card': '0 6px 12px rgba(44, 42, 40, 0.07), 0 0 6px rgba(44, 42, 40, 0.06)',
        'svoe-elevated': '0 24px 48px -12px rgba(44, 42, 40, 0.12)',
      }
    },
  },
  plugins: [],
}
