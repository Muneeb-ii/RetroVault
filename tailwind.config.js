/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'retro-blue': '#4A90E2',
        'retro-gray': '#C0C0C0',
        'retro-dark': '#404040',
        'crt-green': '#00FF00',
        'crt-blue': '#0080FF',
      },
      fontFamily: {
        'retro': ['Courier New', 'monospace'],
      },
      boxShadow: {
        'retro': '2px 2px 0px #000000',
        'retro-inset': 'inset 2px 2px 0px #000000',
      }
    },
  },
  plugins: [],
}
