/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#1f4f45",
          violet: "#4e8f76",
          green: "#7ab89c",
          blue: "#b7ddd0"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(31, 79, 69, 0.12)"
      }
    }
  },
  plugins: []
};
