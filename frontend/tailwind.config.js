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
        appbgFrom: "#FBFAFF",
        appbgTo: "#F2F8FF",
        textMain: "#1C2233",
        textMuted: "#6D7590",
        borderSoft: "#E7E1FF",
        success: "#12A36A",
        danger: "#E43F5A",
      },
      boxShadow: {
        card: "0 10px 24px rgba(58, 43, 130, 0.08)",
        soft: "0 8px 20px rgba(89, 70, 191, 0.08)",
      },
      borderRadius: {
        screen: "32px",
        card: "24px",
        input: "14px",
        cta: "20px",
      },
      fontFamily: {
        sans: ["SF Pro Display", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "app-gradient": "linear-gradient(160deg, #FBFAFF 0%, #F2F8FF 100%)",
        "hero-tint": "linear-gradient(150deg, rgba(109,74,255,0.10) 0%, rgba(143,109,255,0.06) 50%, rgba(66,133,244,0.05) 100%)",
      },
    },
  },
  plugins: [],
}
