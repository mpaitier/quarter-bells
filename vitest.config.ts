import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Chaque dossier de packages/ est un projet Vitest distinct,
    // nommé d'après le champ "name" de son package.json.
    // apps/* sera ajouté au J2, quand apps/web contiendra du code.
    projects: ["packages/*"],

    coverage: {
      provider: "v8",
      // Tout le code source est mesuré, même un fichier qu'aucun test n'importe.
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/*.test.ts"],
      reporter: ["text", "html", "lcov"],
      // Seuils de docs/testing.md, par paquet.
      // packages/protocol (90 %) sera ajouté à sa création.
      thresholds: {
        "packages/rules/src/**": { lines: 95 },
      },
    },
  },
});
