/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        green: { 50: '#f0f5eb', 100: '#e4edd9', 200: '#cfddbf', 300: '#adc495', 400: '#8fac6f', 500: '#668948', 600: '#375e3a', 700: '#234c31', 800: '#1b3d29', 900: '#153223' },
        gray: { 50: '#f5f6f1', 100: '#eff1e9', 200: '#dfe4d8', 300: '#c8d0c0', 400: '#7e8a76', 500: '#68765f', 600: '#54644c', 700: '#3e5139', 800: '#2c402b', 900: '#1c3224' },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
