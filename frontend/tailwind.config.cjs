/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'twitch': '#9146FF',
        'spotify': '#1DB954',
      },
    },
  },
  plugins: [],
} 