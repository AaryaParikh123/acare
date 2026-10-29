/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          50:  '#f0f7ff',
          100: '#e0efff',
          200: '#b9ddff',
          300: '#7cc2ff',
          400: '#36a3f8',
          500: '#0c87e8',
          600: '#006bc6',
          700: '#0056a0',
          800: '#054984',
          900: '#0a3d6d',
        }
      }
    },
  },
  plugins: [],
}
