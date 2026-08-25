/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060d1a',
          900: '#0f172a',
          800: '#1e293b',
          700: '#243044',
          600: '#2d3f55',
        },
        accent: {
          blue: '#3b82f6',
          'blue-dark': '#1d4ed8',
          gold: '#f59e0b',
          orange: '#f97316',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
