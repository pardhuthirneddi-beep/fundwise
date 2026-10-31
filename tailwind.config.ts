import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07090B",
        graphite: "#101419",
        panel: "#141A20",
        lime: "#B9F36B",
        electric: "#8EB8FF",
        muted: "#929BA5",
      },
      fontFamily: {
        sans: ["Inter", "Avenir Next", "Segoe UI", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
