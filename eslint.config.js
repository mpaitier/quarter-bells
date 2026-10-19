import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const PURE_RULES_MESSAGE =
  "packages/rules est un paquet pur (NF-QUA-04) : aucun import hors du paquet.";
const DETERMINISM_MESSAGE =
  "packages/rules ne lit ni l'heure système ni un hasard non maîtrisé : injecter une horloge ou une graine.";

export default defineConfig([
  globalIgnores(["**/node_modules/", "**/dist/", "**/coverage/", ".vitest/"]),

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Les fichiers JavaScript (cette config) n'appartiennent à aucun projet TypeScript.
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // packages/rules, code de production : uniquement des imports relatifs.
  {
    files: ["packages/rules/src/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ regex: "^[^.]", message: PURE_RULES_MESSAGE }] },
      ],
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random", message: DETERMINISM_MESSAGE },
        { object: "Date", property: "now", message: DETERMINISM_MESSAGE },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date']",
          message: DETERMINISM_MESSAGE,
        },
      ],
    },
  },

  // packages/rules, tests : imports relatifs et vitest uniquement.
  {
    files: ["packages/rules/src/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { regex: "^(?!\\.|vitest$)", message: PURE_RULES_MESSAGE },
          ],
        },
      ],
    },
  },

  // Toujours en dernier : désactive les règles qui feraient doublon avec Prettier.
  prettier,
]);
