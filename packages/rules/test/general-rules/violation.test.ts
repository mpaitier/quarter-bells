// Vérifie que les schémas de violation acceptent les violations bien formées
// et rejettent les autres. Ces schémas valident les violations attendues dans
// test/cases/ : s'ils étaient trop permissifs, une fixture fausse passerait.

import { describe, expect, it } from "vitest";
import { Value } from "typebox/value"; // aligne sur ton import existant
import { ViolationSchema } from "../../src/general-rules/violation.js";

// Violation valide servant de base : chaque test d'échec la modifie sur un
// seul point, pour que l'échec ait une seule cause possible.
const validMinCardCount = {
  kind: "minCardCount",
  params: { min: 1 },
  section: 2,
  cardCount: 0,
};

// Violation ascendingOrder valide : la section 3 vaut 7 alors que la
// section 2, qui la précède dans le sens horaire, vaut 9.
const validAscendingOrder = {
  kind: "ascendingOrder",
  params: {},
  section: 3,
  value: 7,
  previousSection: 2,
  previousValue: 9,
};

// Violation maxSum valide : la section 4 vaut 26 pour un plafond de 24.
const validMaxSum = {
  kind: "maxSum",
  params: { max: 24 },
  section: 4,
  value: 26,
};

describe("ViolationSchema", () => {
  describe("minCardCount", () => {
    it("accepte une violation bien formée", () => {
      expect(Value.Check(ViolationSchema, validMinCardCount)).toBe(true);
    });

    it("refuse une section hors de l'horloge", () => {
      // SECTION_COUNT vaut 6 : la dernière section valide est 5.
      expect(
        Value.Check(ViolationSchema, { ...validMinCardCount, section: 6 }),
      ).toBe(false);
    });

    it("refuse un champ inconnu", () => {
      // Une faute de frappe dans une fixture doit faire échouer la validation.
      expect(
        Value.Check(ViolationSchema, { ...validMinCardCount, sectoin: 2 }),
      ).toBe(false);
    });

    it("refuse un paramètre d'une autre règle", () => {
      // max appartient à maxSum : l'union ne doit pas mélanger les variantes.
      expect(
        Value.Check(ViolationSchema, {
          ...validMinCardCount,
          params: { max: 24 },
        }),
      ).toBe(false);
    });
  });
});

describe("ascendingOrder", () => {
  it("accepte une violation bien formée", () => {
    expect(Value.Check(ViolationSchema, validAscendingOrder)).toBe(true);
  });

  it("refuse une violation sans previousValue", () => {
    // Copie typée comme un objet quelconque pour pouvoir retirer un champ :
    // on part de la violation valide et on ne change qu'une chose.
    const withoutPreviousValue: Record<string, unknown> = {
      ...validAscendingOrder,
    };
    delete withoutPreviousValue.previousValue;

    // Sans la valeur précédente, l'interface ne peut pas expliquer l'échec :
    // le champ est obligatoire.
    expect(Value.Check(ViolationSchema, withoutPreviousValue)).toBe(false);
  });
});

describe("maxSum", () => {
  it("accepte une violation bien formée", () => {
    expect(Value.Check(ViolationSchema, validMaxSum)).toBe(true);
  });

  it("refuse un plafond à 0", () => {
    // Le schéma de la règle maxSum impose max >= 1. La violation réutilise
    // ce schéma : si elle acceptait 0, la réutilisation serait cassée.
    expect(
      Value.Check(ViolationSchema, { ...validMaxSum, params: { max: 0 } }),
    ).toBe(false);
  });
});
