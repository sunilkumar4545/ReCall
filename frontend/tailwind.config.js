/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens driven by CSS variables
        ground: 'var(--ground)',
        ink: {
          DEFAULT: 'var(--ink)',
          body: 'var(--body)',
          quiet: 'var(--quiet)',
          hairline: 'var(--hairline)',
          border: 'var(--border)',
        },
        light: 'var(--light)',
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'brutalist': '3px 3px 0px 0px var(--ink)',
        'brutalist-sm': '2px 2px 0px 0px var(--ink)',
        'brutalist-hover': '4px 4px 0px 0px var(--ink)',
      }
    },
  },
  plugins: [],
}
