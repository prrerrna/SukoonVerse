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
        background: '#e8ecd7', // soft green background
        surface: '#f0f2e6',    // card/box background
        accent: '#a3c167',     // accent/gradient end
        accentDark: '#263a1e', // accent/gradient start
        textMain: '#263a1e',   // main text color
        textSubtle: '#7a9562', // subtle text
        border: '#dbe5c2',     // border color
        button: '#a3c167',     // button color
        buttontext: '#263a1e', // button text color
        error: '#e57373',      // error color
      },
    },
  },
  plugins: [],
}
