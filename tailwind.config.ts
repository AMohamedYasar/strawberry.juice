import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "luxury-black": "#050505",
        "brand-red": "#ff1744",
        "brand-coral": "#ff6b9d",
      },
      fontFamily: {
        sans: ["var(--font-outfit)"],
      },
    },
  },
  plugins: [],
};
export default config;
