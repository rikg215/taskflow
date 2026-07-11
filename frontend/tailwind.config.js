/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0A0D0C', // void — near-black with a faint warm-green cast
        surface: '#101412', // panels / cards
        'surface-2': '#161B18', // hover / raised
        trackbg: '#151A17', // bar tracks / lane fill
        line: 'rgba(170, 240, 205, 0.07)', // hairline grid
        ink: {
          DEFAULT: '#E8F2EC', // primary text
          dim: '#9BA8A0', // secondary
          faint: '#5E6A63', // tertiary / labels
        },
        accent: {
          DEFAULT: '#3FE0A8', // phosphor — nominal
          ink: '#06231A', // text on phosphor
        },
        amber: { DEFAULT: '#FFB454' }, // caution
        alert: { DEFAULT: '#FF5C5C' }, // overdue / behind
        ice: { DEFAULT: '#6BC7E8' }, // in-progress
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['"Chakra Petch"', '"JetBrains Mono"', 'monospace'],
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
        scanShimmer: {
          '0%, 100%': { opacity: '0.85' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 0.42s ease-in-out 3',
        'fade-in': 'fadeIn 0.25s ease-out both',
        scan: 'scanShimmer 2.4s ease-in-out infinite',
      },
      boxShadow: {
        card: '0 2px 10px rgba(0, 0, 0, 0.45)',
        phosphor: '0 0 10px rgba(63, 224, 168, 0.35)',
      },
    },
  },
  plugins: [],
};
