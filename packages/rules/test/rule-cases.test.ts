// Exécute chaque cas de test/cases/**/*.json (voir docs/testing.md).
// Ajouter un cas ne demande aucun code : il suffit d'ajouter un fichier.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { Value } from "typebox/value"; // aligne sur l'import de tes autres tests
import { checkMinCardCount } from "../src/general-rules/min-card-count.js";
import type { Violation } from "../src/general-rules/violation.js";
import { placementsBySection } from "../src/placements/by-section.js";
import { RuleCaseSchema, type RuleCase } from "./support/rule-case.js";

// Chemin du dossier des cas, calculé à partir de ce fichier et non du dossier
// courant : le lanceur marche quel que soit l'endroit d'où on lance Vitest.
const CASES_DIR = fileURLToPath(new URL("./cases", import.meta.url));

/** Lit un fichier de cas et le valide. */
function loadCase(file: string): RuleCase {
  // unknown plutôt que le any de JSON.parse : rien n'est utilisable avant
  // d'avoir été validé.
  const data: unknown = JSON.parse(readFileSync(join(CASES_DIR, file), "utf8"));

  if (!Value.Check(RuleCaseSchema, data)) {
    // Chaque erreur indique où elle se trouve dans le fichier et pourquoi.
    const details = [...Value.Errors(RuleCaseSchema, data)]
      .map((error) => `  ${error.instancePath || "/"} : ${error.message}`)
      .join("\n");
    throw new Error(`Cas de test invalide : ${file}\n${details}`);
  }

  return data;
}

/** Exécute la règle d'un cas et renvoie les violations obtenues. */
function evaluate(testCase: RuleCase): Violation[] {
  // La règle ne reçoit que les cartes de la section vérifiée.
  const placements =
    placementsBySection(testCase.placements)[testCase.section] ?? [];

  // Une seule règle connue pour l'instant, donc un appel direct. Ajouter une
  // règle au schéma de cas change le type de rule.params : cet appel ne
  // compile plus, ce qui oblige à introduire un switch sur rule.kind.
  const violation = checkMinCardCount(
    testCase.section,
    placements,
    testCase.rule.params,
  );
  // Une règle de section renvoie une violation ou rien ; le cas attend une liste.
  return violation === undefined ? [] : [violation];
}

// readdirSync en mode récursif renvoie aussi les sous-dossiers : on ne garde
// que les fichiers JSON. encoding: "utf8" garantit des noms en texte (sans
// cette option, le type annonce aussi des Buffer).
const files = readdirSync(CASES_DIR, {
  encoding: "utf8",
  recursive: true,
}).filter((file) => file.endsWith(".json"));

describe("rule cases", () => {
  // Sans ce test, un dossier vide ou mal nommé donnerait 0 cas exécuté,
  // et donc une suite verte qui ne vérifie rien.
  it("finds at least one case", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  // Le nom du test est le chemin du fichier : en cas d'échec, on sait
  // directement lequel ouvrir.
  it.each(files)("%s", (file) => {
    const testCase = loadCase(file);
    expect(evaluate(testCase)).toEqual(testCase.expected);
  });
});
