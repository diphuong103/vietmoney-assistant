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
        }
      },
      fontFamily: {
        sans: ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
