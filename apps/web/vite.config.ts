import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    // Deux dernières versions de Chrome, Firefox, Safari et Edge (NF-CMP-01).
    // Valeur par défaut de Vite, écrite ici pour que le lien avec l'exigence
    // reste visible si quelqu'un la change.
    target: "baseline-widely-available",
  },
});
