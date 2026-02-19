import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          DEFAULT: "#2EE6A6",
          50:  "#edfdf6",
          100: "#d0f9eb",
          200: "#a1f3d4",
          400: "#5aedb9",
          500: "#2EE6A6",
          600: "#20c98d",
          700: "#178f65",
        },
        "soft-black": "#121212",
        "off-white":  "#F7F9F8",
        "muted-gray": "#EAEAEA",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body:    ["var(--font-body)",    "system-ui", "sans-serif"],
        sans:    ["var(--font-body)",    "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
