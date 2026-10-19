import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Chaque dossier de packages/ est un projet Vitest distinct,
    // nommé d'après le champ "name" de son package.json.
    // apps/* sera ajouté au J2, quand apps/web contiendra du code.
    projects: ["packages/*"],
  },
});
