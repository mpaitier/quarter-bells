// Vérifie que les schémas de violation acceptent les violations bien formées
// et rejettent les autres. Ces schémas valident les violations attendues dans
// test/cases/ : s'ils étaient trop permissifs, une fixture fausse passerait.

import { describe, expect, it } from "vitest";
import { Value } from "typebox/value";
import {
  ViolationSchema,
  compareViolations,
  type Violation,
} from "../../src/rule-checks/violation.js";

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

// Violation exactCardCount valide, sans famille : 3 cartes demandées, 4 posées.
const validExactCardCount = {
  kind: "exactCardCount",
  params: { count: 3 },
  section: 1,
  cardCount: 4,
};

describe("ViolationSchema", () => {
  describe("minCardCount", () => {
    it("accepts a well-formed violation", () => {
      expect(Value.Check(ViolationSchema, validMinCardCount)).toBe(true);
    });

    it("rejects a section outside the clock", () => {
      // SECTION_COUNT vaut 6 : la dernière section valide est 5.
      expect(
        Value.Check(ViolationSchema, { ...validMinCardCount, section: 6 }),
      ).toBe(false);
    });

    it("rejects an unknown field", () => {
      // Une faute de frappe dans une fixture doit faire échouer la validation.
      expect(
        Value.Check(ViolationSchema, { ...validMinCardCount, sectoin: 2 }),
      ).toBe(false);
    });

    it("rejects a parameter from another rule", () => {
      // max appartient à maxSum : l'union ne doit pas mélanger les variantes.
      expect(
        Value.Check(ViolationSchema, {
          ...validMinCardCount,
          params: { max: 24 },
        }),
      ).toBe(false);
    });
  });

  describe("ascendingOrder", () => {
    it("accepts a well-formed violation", () => {
      expect(Value.Check(ViolationSchema, validAscendingOrder)).toBe(true);
    });

    it("rejects a violation without previousValue", () => {
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
    it("accepts a well-formed violation", () => {
      expect(Value.Check(ViolationSchema, validMaxSum)).toBe(true);
    });

    it("rejects a maximum of 0", () => {
      // Le schéma de la règle maxSum impose max >= 1. La violation réutilise
      // ce schéma : si elle acceptait 0, la réutilisation serait cassée.
      expect(
        Value.Check(ViolationSchema, { ...validMaxSum, params: { max: 0 } }),
      ).toBe(false);
    });
  });

  describe("exactCardCount", () => {
    it("accepts a well-formed violation without family", () => {
      expect(Value.Check(ViolationSchema, validExactCardCount)).toBe(true);
    });

    it("accepts a well-formed violation with a family", () => {
      // La famille est facultative dans la règle, donc dans la violation.
      expect(
        Value.Check(ViolationSchema, {
          ...validExactCardCount,
          params: { count: 3, family: "eternity" },
        }),
      ).toBe(true);
    });

    it("rejects an unknown family", () => {
      expect(
        Value.Check(ViolationSchema, {
          ...validExactCardCount,
          params: { count: 3, family: "moment" },
        }),
      ).toBe(false);
    });

    it("rejects a negative card count", () => {
      // Un compte de cartes ne peut pas être négatif : une fixture avec -1
      // trahirait une erreur de saisie.
      expect(
        Value.Check(ViolationSchema, { ...validExactCardCount, cardCount: -1 }),
      ).toBe(false);
    });
  });
});

describe("compareViolations", () => {
  // Violations typées : compareViolations n'accepte que des Violation, et les
  // objets de base plus haut sont volontairement typés de façon lâche pour
  // pouvoir être cassés dans les tests de schéma.
  const minOnSection4: Violation = {
    kind: "minCardCount",
    params: { min: 1 },
    section: 4,
    cardCount: 0,
  };
  const minOnSection1: Violation = { ...minOnSection4, section: 1 };
  const maxOnSection0: Violation = {
    kind: "maxSum",
    params: { max: 24 },
    section: 0,
    value: 30,
  };

  it("sorts by rule first, even when the section comes later", () => {
    // minCardCount passe avant maxSum, alors que sa section (4) est plus
    // grande : le kind l'emporte sur la section.
    expect([maxOnSection0, minOnSection4].toSorted(compareViolations)).toEqual([
      minOnSection4,
      maxOnSection0,
    ]);
  });

  it("sorts by section within the same rule", () => {
    expect([minOnSection4, minOnSection1].toSorted(compareViolations)).toEqual([
      minOnSection1,
      minOnSection4,
    ]);
  });
});
