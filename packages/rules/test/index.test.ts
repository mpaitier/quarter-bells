import { describe, expect, it } from "vitest";

import * as rules from "../src/index.js";

describe("public API", () => {
  // Parcours complet tel que le serveur le fera : un générateur par
  // épreuve, puis la distribution. Vérifie que tout est bien branché
  // à travers le point d'entrée du package.
  it("deals a trial through the package entry point", () => {
    const lots = rules.dealTrialCards(3, rules.createSeededRng(42));

    expect(lots).toHaveLength(3);
    for (const lot of lots) {
      expect(lot.hand).toHaveLength(4);
    }
  });

  // Même principe pour l'évaluation : une pose sans carte échoue sur
  // minCardCount dans chaque section. Le détail des règles est testé
  // ailleurs ; ici, on vérifie seulement que l'export fonctionne.
  it("evaluates the general rules through the package entry point", () => {
    const violations = rules.evaluateGeneralRules({ noMaxSum: false }, 0, []);

    expect(violations).not.toHaveLength(0);
    expect(rules.DEFAULT_MAX_SUM).toBe(24);
  });

  // Sur une horloge sans règle, toute pose est acceptée : on vérifie
  // seulement que l'export fonctionne.
  it("evaluates a placement through the package entry point", () => {
    // Écrite en entier : sections est un tuple de 6, chaque index littéral.
    // Le type du paramètre suffit à TypeScript pour le vérifier, sans
    // exporter les types internes des sections.
    const clock: Parameters<typeof rules.evaluatePlacement>[0] = {
      sections: [
        { index: 0, rules: [] },
        { index: 1, rules: [] },
        { index: 2, rules: [] },
        { index: 3, rules: [] },
        { index: 4, rules: [] },
        { index: 5, rules: [] },
      ],
      clockRules: [],
      noMaxSum: false,
    };
    const candidate = {
      sectionIndex: 0,
      card: { family: "instant", value: 3 },
      faceUp: false,
    } as const;

    expect(rules.evaluatePlacement(clock, [], candidate)).toEqual([]);
  });

  // Les détails d'implémentation ne doivent pas fuiter : s'ils étaient
  // exportés, d'autres packages pourraient en dépendre, et on ne pourrait
  // plus les modifier librement.
  it.each([
    "shuffle",
    "nextInt",
    "generateOpaqueIds",
    "createDeck",
    "dealCards",
    // Règles unitaires : elles servent aux points d'entrée, à l'intérieur du
    // package. Seuls evaluateGeneralRules et evaluatePlacement sont publics.
    "checkMinCardCount",
    "checkMaxSum",
    "checkAscendingOrder",
    "checkExactCardCount",
    "checkSumInRange",
    "checkFirstPlacements",
    "compareViolations",
    // Outils de calcul sur la pose et le cadran.
    "clockwiseOrder",
    "placementsBySection",
    "sectionValue",
    // Schémas TypeBox : les exporter ferait de TypeBox une partie du
    // contrat public, alors que l'ADR 0008 le garde interne.
    "ClockSchema",
    "ClockEnvelopeSchema",
    "SECTION_RULE_SCHEMAS",
    "CLOCK_RULE_SCHEMAS",
    "ViolationSchema",
    "PlacementSchema",
    "CardFaceSchema",
    "SectionIndexSchema",
  ])("does not expose %s", (name) => {
    expect(rules).not.toHaveProperty(name);
  });
});
