import react from "@vitejs/plugin-react";
// defineConfig de vitest/config est celui de Vite, avec en plus le type de la
// section « test ». Une seule configuration sert au build et aux tests : les
// composants sont compilés de la même façon dans les deux cas.
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  build: {
    // Deux dernières versions de Chrome, Firefox, Safari et Edge (NF-CMP-01).
    // Valeur par défaut de Vite, écrite ici pour que le lien avec l'exigence
    // reste visible si quelqu'un la change.
    target: "baseline-widely-available",
  },
  // Lue par Vitest uniquement, ignorée par le build.
  test: {
    // Un DOM simulé dans Node, pour rendre les composants sans navigateur.
    // Les vrais navigateurs sont réservés à Playwright (dossier e2e/).
    environment: "jsdom",

    // Uniquement test/ : les tests Playwright de e2e/ ne passent pas par Vitest.
    include: ["test/**/*.test.{ts,tsx}"],

    setupFiles: ["./test/setup.ts"],
  },
});
