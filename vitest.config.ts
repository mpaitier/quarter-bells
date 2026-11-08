import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Chaque dossier de packages/ est un projet Vitest distinct,
    // nommé d'après le champ "name" de son package.json.
    // apps/web déclare ses tests dans vite.config.ts : DOM simulé et
    // plugin React. apps/server sera ajouté au J3.
    projects: ["packages/*", "apps/web"],

    coverage: {
      provider: "v8",
      // Tout le code source est mesuré, même un fichier qu'aucun test n'importe.
      include: ["packages/*/src/**/*.ts", "apps/web/src/**/*.{ts,tsx}"],
      // index.ts ne fait que réexporter : aucune instruction à mesurer, et le
      // rapport l'afficherait à « 0 % » (0 sur 0). L'API publique est vérifiée
      // par test/index.test.ts.
      // apps/web/src/main.tsx ne fait que monter l'application dans la page :
      // c'est le test de fumée Playwright qui le vérifie.
      exclude: [
        "**/*.test.{ts,tsx}",
        "packages/*/src/index.ts",
        "apps/web/src/main.tsx",
      ],
      reporter: ["text", "html", "lcov"],
      // Seuils de docs/testing.md, par paquet. apps/web n'en a pas : sa
      // couverture est mesurée pour être visible, sans bloquer.
      // packages/protocol (90 %) sera ajouté à sa création.
      thresholds: {
        "packages/rules/src/**": { lines: 95 },
      },
    },
  },
});
