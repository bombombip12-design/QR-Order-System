/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Clash Display', 'Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#f9d7ad',
          300: '#f4b978',
          400: '#ee9243',
          500: '#ea7520',
          600: '#db5b16',
          700: '#b54414',
          800: '#903718',
          900: '#742f17',
          950: '#3f1509',
        },
        surface: {
          DEFAULT: '#1a1a1a',
          card: '#242424',
          elevated: '#2d2d2d',
        },
      },
    },
  },
  plugins: [],
}
