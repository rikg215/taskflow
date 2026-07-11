/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0F1117', // app background
        surface: '#1A1D27', // cards
        'surface-2': '#232838', // hover / raised
        trackbg: '#1E2130', // health-bar track
        accent: {
          DEFAULT: '#3B82F6', // electric blue
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.45)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(3px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 0.42s ease-in-out 3',
        'fade-in': 'fadeIn 0.25s ease-out both',
      },
      boxShadow: {
        card: '0 2px 10px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
};
