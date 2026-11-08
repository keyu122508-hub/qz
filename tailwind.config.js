/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0f0f0f',
          surface: '#1a1a1a',
          elevated: '#242424',
        },
        border: { DEFAULT: '#2a2a2a', subtle: '#1f1f1f' },
        primary: {
          DEFAULT: '#c084fc',
          dark: '#a855f7',
          light: '#d8b4fe',
        },
        muted: '#6b7280',
        text: { DEFAULT: '#e5e7eb', dim: '#9ca3af' },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-in-out',
        blink: 'blink 1s step-start infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
      },
    },
  },
  plugins: [],
}
