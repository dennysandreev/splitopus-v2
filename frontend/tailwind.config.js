/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6D4AFF",
        secondary: "#8F6DFF",
        "bg-soft": "#FBFAFF",
        "border-soft": "#E7E1FF",
      }
    },
  },
  plugins: [],
}
