import { describe, expect, it } from "vitest";
import type { CardValue } from "../../src/cards/card.js";
import { SECTION_COUNT } from "../../src/clocks/clock.js";
import {
  DEFAULT_MAX_SUM,
  evaluateGeneralRules,
} from "../../src/general-rules/evaluate-general-rules.js";
import type { Placement } from "../../src/placements/placement.js";

// Le détail de chaque règle est couvert par test/cases/. Ce fichier teste ce
// que fait le point d'entrée en plus : appliquer les trois règles à tout le
// cadran, tenir compte de noMaxSum et trier le résultat.

// Fabrique un placement en ne précisant que la section et la valeur.
function place(sectionIndex: number, value: CardValue): Placement {
  return { sectionIndex, card: { family: "instant", value }, faceUp: false };
}

// Horloges réduites à ce que lit evaluateGeneralRules.
const withMaxSum = { noMaxSum: false };
const withoutMaxSum = { noMaxSum: true };

// Pose valide depuis la section 0 : une carte par section, de 1 à 6.
const validPose = ([1, 2, 3, 4, 5, 6] as const).map((value, section) =>
  place(section, value),
);

// Pose qui enfreint les trois règles depuis la section 0.
// Valeurs par section : 5, vide, 3, 26, vide, 7.
const brokenPose = [
  place(0, 5),
  place(2, 3),
  place(3, 12),
  place(3, 12),
  place(3, 2),
  place(5, 7),
];

describe("evaluateGeneralRules", () => {
  it("returns no violation for a valid pose", () => {
    expect(evaluateGeneralRules(withMaxSum, 0, validPose)).toEqual([]);
  });

  it("checks every section and sorts violations by rule then section", () => {
    // Ordre attendu : minCardCount, ascendingOrder, maxSum, puis par section.
    // Les sections vides 1 et 4 produisent minCardCount ET ascendingOrder :
    // les règles sont indépendantes.
    expect(evaluateGeneralRules(withMaxSum, 0, brokenPose)).toEqual([
      { kind: "minCardCount", params: { min: 1 }, section: 1, cardCount: 0 },
      { kind: "minCardCount", params: { min: 1 }, section: 4, cardCount: 0 },
      {
        kind: "ascendingOrder",
        params: {},
        section: 1,
        value: 0,
        previousSection: 0,
        previousValue: 5,
      },
      {
        kind: "ascendingOrder",
        params: {},
        section: 4,
        value: 0,
        previousSection: 3,
        previousValue: 26,
      },
      { kind: "maxSum", params: { max: 24 }, section: 3, value: 26 },
    ]);
  });

  it("applies the default maximum of 24", () => {
    // Pose croissante dont la dernière section vaut 25 : seul le plafond
    // est enfreint.
    const pose = [
      ...validPose.slice(0, 5),
      place(5, 12),
      place(5, 12),
      place(5, 1),
    ];
    expect(DEFAULT_MAX_SUM).toBe(24);
    expect(evaluateGeneralRules(withMaxSum, 0, pose)).toEqual([
      { kind: "maxSum", params: { max: 24 }, section: 5, value: 25 },
    ]);
  });

  it("skips the maximum when the clock has noMaxSum", () => {
    const violations = evaluateGeneralRules(withoutMaxSum, 0, brokenPose);
    expect(violations.map((violation) => violation.kind)).not.toContain(
      "maxSum",
    );
    // Les autres règles s'appliquent toujours.
    expect(violations).toHaveLength(4);
  });

  it("depends on the start section for the same pose", () => {
    // Valeurs par section : 8, 1, 2, 3, 4, 6. Croissant depuis la section 1,
    // pas depuis la section 0.
    const pose = ([8, 1, 2, 3, 4, 6] as const).map((value, section) =>
      place(section, value),
    );
    expect(evaluateGeneralRules(withMaxSum, 1, pose)).toEqual([]);
    expect(evaluateGeneralRules(withMaxSum, 0, pose)).toEqual([
      {
        kind: "ascendingOrder",
        params: {},
        section: 1,
        value: 1,
        previousSection: 0,
        previousValue: 8,
      },
    ]);
  });

  it("reports every empty section of an empty pose", () => {
    // Sans carte, toutes les sections valent 0 : seul minCardCount échoue,
    // l'égalité ne viole pas ascendingOrder.
    const violations = evaluateGeneralRules(withMaxSum, 0, []);
    expect(violations).toHaveLength(SECTION_COUNT);
    expect(
      violations.every((violation) => violation.kind === "minCardCount"),
    ).toBe(true);
  });

  it("does not modify the pose it receives", () => {
    const pose = [place(0, 5), place(3, 12)];
    evaluateGeneralRules(withMaxSum, 0, pose);
    expect(pose).toEqual([place(0, 5), place(3, 12)]);
  });

  it.each([-1, SECTION_COUNT, 2.5])(
    "rejects the start section %s",
    (startSection) => {
      expect(() =>
        evaluateGeneralRules(withMaxSum, startSection, validPose),
      ).toThrow(RangeError);
    },
  );
});
