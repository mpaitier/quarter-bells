import { describe, expect, it } from "vitest";
import type { CardValue } from "../../src/cards/card.js";
import type { Clock, ClockRule, SectionRule } from "../../src/clocks/clock.js";
import { parseClock } from "../../src/clocks/parse-clock.js";
import { evaluatePlacement } from "../../src/evaluation/evaluate-placement.js";
import type { Placement } from "../../src/placements/placement.js";
import playersChoiceClock from "../fixtures/clocks/players-choice-clock.json" with { type: "json" };

// Le détail de chaque règle est couvert par test/cases/ (fichiers de
// firstPlacements et at-placement-*). Ce fichier teste ce que fait le point
// d'entrée en plus : parcourir toutes les sections et l'horloge, appliquer le
// plafond général selon noMaxSum, ignorer les conditions qui ne se jugent
// qu'à la Résolution, trier le résultat et refuser une pose hors du cadran.

// Fabrique un placement en ne précisant que la section, et la valeur et la
// face quand elles comptent pour le test.
function place(
  sectionIndex: number,
  value: CardValue = 5,
  faceUp = false,
): Placement {
  return { sectionIndex, card: { family: "instant", value }, faceUp };
}

// Horloge réduite à ce que lit evaluatePlacement. Chaque section reçoit les
// règles indiquées pour son index, aucune sinon.
function clockWith(
  rulesBySection: Partial<Record<number, SectionRule[]>>,
  clockRules: ClockRule[] = [],
  noMaxSum = false,
): Pick<Clock, "sections" | "clockRules" | "noMaxSum"> {
  // Clock.sections est un tuple de 6 sections dont l'index est littéral
  // (0, puis 1...). Un map produirait un simple tableau de number, refusé :
  // on écrit les six sections, et `const I` garde chaque index littéral.
  const section = <const I extends number>(index: I) => ({
    index,
    rules: rulesBySection[index] ?? [],
  });
  return {
    sections: [
      section(0),
      section(1),
      section(2),
      section(3),
      section(4),
      section(5),
    ],
    clockRules,
    noMaxSum,
  };
}

// Règle « la première pose doit se faire devant cette section ».
const firstPlacementHere: SectionRule = {
  kind: "firstPlacements",
  params: { placementIndexes: [0] },
};

describe("evaluatePlacement", () => {
  // Horloge chargée des conditions qui ne se jugent qu'à la Résolution :
  // nombres de cartes, ordre croissant, et le minimum de sumInRange.
  const resolutionOnly = clockWith(
    {
      0: [{ kind: "minCardCount", params: { min: 3 } }],
      1: [{ kind: "exactCardCount", params: { count: 0 } }],
      2: [{ kind: "sumInRange", params: { min: 20, max: 22 } }],
    },
    [{ kind: "ascendingOrder", params: {} }],
  );

  // Chaque section est essayée sur une horloge vide : la pose est acceptée
  // partout, même là où une condition serait déjà enfreinte (une carte sur
  // une section qui doit rester vide, une section à 1 alors que l'ordre
  // croissant et le minimum de 20 ne sont pas encore atteints).
  it.each([0, 1, 2, 3, 4, 5])(
    "ignores resolution-only conditions when placing on section %i",
    (section) => {
      expect(evaluatePlacement(resolutionOnly, [], place(section, 1))).toEqual(
        [],
      );
    },
  );

  describe("known upper bounds", () => {
    // Section 3 déjà à 22, toutes cartes visibles : un 3 la porterait à 25.
    const visible22 = [place(3, 12, true), place(3, 10, true)];

    it("applies the general maximum of 24", () => {
      expect(evaluatePlacement(clockWith({}), visible22, place(3, 3))).toEqual([
        { kind: "maxSum", params: { max: 24 }, section: 3, value: 25 },
      ]);
    });

    it("skips the general maximum when the clock has noMaxSum", () => {
      const clock = clockWith({}, [], true);
      expect(evaluatePlacement(clock, visible22, place(3, 3))).toEqual([]);
    });

    it("applies a clock maxSum to the target section", () => {
      // Règle d'horloge à 20 : elle vaut pour chaque section, ici la 3.
      // noMaxSum isole la règle d'horloge du plafond général.
      const clock = clockWith(
        {},
        [{ kind: "maxSum", params: { max: 20 } }],
        true,
      );
      expect(evaluatePlacement(clock, visible22, place(3, 1))).toEqual([
        { kind: "maxSum", params: { max: 20 }, section: 3, value: 23 },
      ]);
    });

    it("applies the section rules of the target section only", () => {
      // La règle à 6 est en section 0 : une pose en section 3 ne la regarde
      // pas, même si la valeur obtenue la dépasserait.
      const clock = clockWith({ 0: [{ kind: "maxSum", params: { max: 6 } }] });
      expect(evaluatePlacement(clock, [], place(3, 9))).toEqual([]);
    });

    it("reports a section maximum and the general maximum together", () => {
      // Section plafonnée à 20 par sa règle, et à 24 par le plafond général :
      // 25 dépasse les deux. Même kind, même section : l'ordre de calcul est
      // conservé, règle de section d'abord.
      const clock = clockWith({ 3: [{ kind: "maxSum", params: { max: 20 } }] });
      expect(evaluatePlacement(clock, visible22, place(3, 3))).toEqual([
        { kind: "maxSum", params: { max: 20 }, section: 3, value: 25 },
        { kind: "maxSum", params: { max: 24 }, section: 3, value: 25 },
      ]);
    });
  });

  it("sorts violations by rule, then by section", () => {
    // Deux règles refusent la même pose : firstPlacements (section 0) et
    // sumInRange (section 4, vide, dont un 9 dépasse le maximum de 8).
    // Ordre du catalogue : sumInRange avant firstPlacements, même si sa
    // section vient après.
    const clock = clockWith({
      0: [firstPlacementHere],
      4: [{ kind: "sumInRange", params: { min: 2, max: 8 } }],
    });
    const violations = evaluatePlacement(clock, [], place(4, 9));
    expect(violations.map((violation) => violation.kind)).toEqual([
      "sumInRange",
      "firstPlacements",
    ]);
  });

  it("applies the constraint of a section other than the target", () => {
    // La règle est en section 2, la carte va en section 4 : c'est justement
    // la section NON visée qui refuse.
    const clock = clockWith({ 2: [firstPlacementHere] });
    expect(evaluatePlacement(clock, [], place(4))).toEqual([
      {
        kind: "firstPlacements",
        params: { placementIndexes: [0] },
        section: 2,
        placementIndex: 0,
        attemptedSection: 4,
      },
    ]);
  });

  it("reports every section that claims the rank, sorted by section", () => {
    // Horloge injouable (deux sections exigent la première pose), mais que
    // parseClock accepte encore : le moteur doit tout signaler, dans un
    // ordre stable.
    const clock = clockWith({
      4: [firstPlacementHere],
      1: [firstPlacementHere],
    });
    const violations = evaluatePlacement(clock, [], place(3));
    expect(violations.map((violation) => violation.section)).toEqual([1, 4]);
  });

  it("follows the rank through a real clock", () => {
    // players-choice-clock : les poses de rang 0 et 1 doivent aller en
    // section 0. On passe par parseClock, comme le fera le serveur.
    const clock = parseClock(playersChoiceClock, "players-choice-clock.json");

    // Rang 0 ailleurs : refusé.
    expect(evaluatePlacement(clock, [], place(3))).toHaveLength(1);
    // Rang 1 ailleurs, après une première pose correcte : refusé.
    expect(evaluatePlacement(clock, [place(0)], place(3))).toHaveLength(1);
    // Rang 2 ailleurs : libre.
    expect(evaluatePlacement(clock, [place(0), place(0)], place(3))).toEqual(
      [],
    );
  });

  it("does not modify the pose it receives", () => {
    const clock = clockWith({ 2: [firstPlacementHere] });
    const pose = [place(2)];
    evaluatePlacement(clock, pose, place(5));
    // La candidate n'est jamais ajoutée : c'est à l'appelant de le faire si
    // la pose est acceptée.
    expect(pose).toEqual([place(2)]);
  });

  it.each([-1, 6, 2.5])("rejects a candidate on section %s", (section) => {
    expect(() => evaluatePlacement(clockWith({}), [], place(section))).toThrow(
      RangeError,
    );
  });
});
