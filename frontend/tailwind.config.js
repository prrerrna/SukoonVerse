/** @type {import('tailwindcss').Config} */
// tailwind.config.js: Configuration file for Tailwind CSS.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pastel-blue': '#A7C7E7',
        'pastel-green': '#C1E1C1',
      }
    },
  },
  plugins: [],
}
