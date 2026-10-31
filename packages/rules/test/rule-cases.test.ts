// Exécute chaque cas de test/cases/**/*.json (voir docs/testing.md).
// Ajouter un cas ne demande aucun code : il suffit d'ajouter un fichier.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { Value } from "typebox/value";
import { checkAscendingOrder } from "../src/rule-checks/ascending-order.js";
import { checkExactCardCount } from "../src/rule-checks/exact-card-count.js";
import { checkFirstPlacements } from "../src/rule-checks/first-placements.js";
import { checkMaxSum } from "../src/rule-checks/max-sum.js";
import { checkMinCardCount } from "../src/rule-checks/min-card-count.js";
import { checkSumInRange } from "../src/rule-checks/sum-in-range.js";
import type { Violation } from "../src/rule-checks/violation.js";
import { placementsBySection } from "../src/placements/by-section.js";
import type { Placement } from "../src/placements/placement.js";
import {
  RuleCaseSchema,
  type RuleCase,
  type SectionRuleCase,
} from "./support/rule-case.js";

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

/** Appelle la fonction de vérification qui correspond au kind de la règle. */
function checkSectionRule(
  section: number,
  placements: readonly Placement[],
  rule: SectionRuleCase["rule"],
): Violation | undefined {
  // Dans chaque case, TypeScript sait quelle règle on manipule : rule.params
  // a le bon type pour la fonction appelée. Pas de default : si une règle est
  // ajoutée au schéma de cas sans être traitée ici, le lint échoue
  // (switch-exhaustiveness-check). TypeScript seul ne dirait rien, car la
  // fonction a le droit de renvoyer undefined.
  switch (rule.kind) {
    case "minCardCount":
      return checkMinCardCount(section, placements, rule.params);
    case "maxSum":
      return checkMaxSum(section, placements, rule.params);
    case "exactCardCount":
      return checkExactCardCount(section, placements, rule.params);
    case "sumInRange":
      return checkSumInRange(section, placements, rule.params);
  }
}

/** Exécute la règle d'un cas et renvoie les violations obtenues. */
function evaluate(testCase: RuleCase): Violation[] {
  // Contrainte de pose : seul ce type de cas a candidate. Une seule
  // contrainte pour l'instant, donc un appel direct.
  if ("candidate" in testCase) {
    const violation = checkFirstPlacements(
      testCase.section,
      testCase.placements,
      testCase.candidate,
      testCase.rule.params,
    );
    return violation === undefined ? [] : [violation];
  }

  // Règle d'horloge : seul ce type de cas a startSection, et `in` suffit à
  // TypeScript pour savoir de quel cas il s'agit dans chaque branche.
  // Une seule règle d'horloge pour l'instant, donc un appel direct.
  if ("startSection" in testCase) {
    return checkAscendingOrder(
      testCase.startSection,
      testCase.placements,
      testCase.rule.params,
    );
  }

  // Règle de section : elle ne reçoit que les cartes de la section vérifiée.
  const placements =
    placementsBySection(testCase.placements)[testCase.section] ?? [];
  const violation = checkSectionRule(
    testCase.section,
    placements,
    testCase.rule,
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
