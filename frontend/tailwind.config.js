/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff3f0', 100: '#ffe4de', 200: '#ffccc2',
          300: '#ffa899', 400: '#ff7b67', 500: '#f55a3e',
          600: '#e8391c', 700: '#c22c13', 800: '#a12711',
          900: '#861f0e',
        },
        viet: {
          red: '#DA251D',
          gold: '#FFCD00',
        },
        emerald: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0',
          300: '#6ee7b7', 400: '#34d399', 500: '#10b981',
          600: '#059669', 700: '#047857', 800: '#065f46',
          900: '#064e3b',
        },
        amber: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a',
          300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b',
          600: '#d97706', 700: '#b45309', 800: '#92400e',
          900: '#78350f',
        },
        slate: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#475569', 700: '#334155', 800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
