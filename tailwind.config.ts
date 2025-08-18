import type { Config } from "tailwindcss";

export default {
  content: ["./index.html","./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
  future: { hoverOnlyWhenSupported: true }
} satisfies Config;