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

  // Les détails d'implémentation ne doivent pas fuiter : s'ils étaient
  // exportés, d'autres packages pourraient en dépendre, et on ne pourrait
  // plus les modifier librement.
  it.each([
    "shuffle",
    "nextInt",
    "generateOpaqueIds",
    "createDeck",
    "dealCards",
    // Schémas TypeBox : les exporter ferait de TypeBox une partie du
    // contrat public, alors que l'ADR 0008 le garde interne.
    "ClockSchema",
    "ClockEnvelopeSchema",
    "SECTION_RULE_SCHEMAS",
    "CLOCK_RULE_SCHEMAS",
  ])("does not expose %s", (name) => {
    expect(rules).not.toHaveProperty(name);
  });
});
