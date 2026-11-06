import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const PURE_RULES_MESSAGE =
  "packages/rules est un paquet pur (NF-QUA-04) : aucun import hors du paquet.";
const DETERMINISM_MESSAGE =
  "packages/rules ne lit ni l'heure système ni un hasard non maîtrisé : injecter une horloge ou une graine.";
const PUBLIC_API_MESSAGE =
  "apps/web n'importe que l'API publique d'un paquet (son index.ts) : @quarter-bells/<paquet>, sans sous-chemin.";
const WEB_DEPENDENCIES_MESSAGE =
  "apps/web ne dépend que de packages/rules et packages/protocol (voir apps/web/README.md).";

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

  // Un switch sur une union (le kind d'une règle, par exemple) doit traiter
  // chaque cas. Sans cette règle, TypeScript accepte qu'un case manque dès que
  // la fonction peut renvoyer undefined : le kind oublié passerait en silence.
  // Réservée aux fichiers TypeScript : elle a besoin des types.
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/switch-exhaustiveness-check": "error",
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
        {
          patterns: [
            { regex: "^(?!typebox(/|$))[^.]", message: PURE_RULES_MESSAGE },
          ],
        },
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

  // apps/web : règles de React.
  // - react-hooks vérifie l'ordre des appels de hooks et les dépendances des
  //   effets, la principale source d'erreurs en React (ADR 0012).
  // - react-refresh vérifie qu'un fichier de composants n'exporte que des
  //   composants (ou des constantes), sans quoi le rechargement à chaud de Vite
  //   recharge toute la page au lieu du seul composant modifié.
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
  },

  // apps/web : uniquement l'API publique des paquets autorisés.
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            // @quarter-bells/rules/src/cards/card : contourne index.ts.
            { regex: "^@quarter-bells/[^/]+/", message: PUBLIC_API_MESSAGE },
            // ../../../packages/rules/src/... : même contournement, en relatif.
            {
              regex: "^\\.\\.?/(.*/)?(packages|apps)/",
              message: PUBLIC_API_MESSAGE,
            },
            // Les autres applications ne sont pas des dépendances.
            {
              regex: "^@quarter-bells/(server|mobile|web)$",
              message: WEB_DEPENDENCIES_MESSAGE,
            },
          ],
        },
      ],
    },
  },

  // Toujours en dernier : désactive les règles qui feraient doublon avec Prettier.
  prettier,
]);
