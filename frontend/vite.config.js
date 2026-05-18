import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // Ensure Vite pre-bundles tesseract.js with the correct browser-field substitution
    include: ["tesseract.js"],
  },
});
