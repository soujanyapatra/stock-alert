/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f4f6fe',
          100: '#e9edfd',
          200: '#d7dffc',
          300: '#b8c6f9',
          400: '#91a5f4',
          500: '#637bed',
          600: '#485ee2',
          700: '#384ac9',
          800: '#323fa4',
          900: '#2b3684',
          950: '#1b2053',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.1), 0 1px 1px 0 rgba(0, 0, 0, 0.05)',
        'premium-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 1px 1px 0 rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}
