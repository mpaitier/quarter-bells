import { describe, expect, it } from "vitest";
import type { CardValue } from "../../src/cards/card.js";
import type { Clock, ClockRule, SectionRule } from "../../src/clocks/clock.js";
import { parseClock } from "../../src/clocks/parse-clock.js";
import { evaluatePlacement } from "../../src/evaluation/evaluate-placement.js";
import type { Placement } from "../../src/placements/placement.js";
import playersChoiceClock from "../fixtures/clocks/players-choice-clock.json" with { type: "json" };

// Le détail de firstPlacements est couvert par test/cases/firstPlacements/.
// Ce fichier teste ce que fait le point d'entrée en plus : parcourir toutes
// les sections et l'horloge, ignorer les conditions de réussite, trier le
// résultat et refuser une pose hors du cadran.

// Fabrique un placement en ne précisant que la section (et la valeur si
// elle compte pour le test).
function place(sectionIndex: number, value: CardValue = 5): Placement {
  return { sectionIndex, card: { family: "instant", value }, faceUp: false };
}

// Horloge réduite à ce que lit evaluatePlacement. Chaque section reçoit les
// règles indiquées pour son index, aucune sinon.
function clockWith(
  rulesBySection: Partial<Record<number, SectionRule[]>>,
  clockRules: ClockRule[] = [],
): Pick<Clock, "sections" | "clockRules"> {
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
  };
}

// Règle « la première pose doit se faire devant cette section ».
const firstPlacementHere: SectionRule = {
  kind: "firstPlacements",
  params: { placementIndexes: [0] },
};

describe("evaluatePlacement", () => {
  // Horloge chargée de toutes les conditions de réussite connues, en section
  // comme au niveau de l'horloge, mais sans contrainte de pose.
  const resolutionOnly = clockWith(
    {
      0: [{ kind: "minCardCount", params: { min: 3 } }],
      1: [{ kind: "exactCardCount", params: { count: 0 } }],
      2: [{ kind: "sumInRange", params: { min: 20, max: 22 } }],
      3: [{ kind: "maxSum", params: { max: 1 } }],
    },
    [
      { kind: "ascendingOrder", params: {} },
      { kind: "maxSum", params: { max: 1 } },
    ],
  );

  // Chaque section est essayée : la pose est acceptée partout, même là où
  // une condition de réussite serait déjà enfreinte (un 12 sur une section
  // plafonnée à 1, une carte sur une section qui doit rester vide).
  it.each([0, 1, 2, 3, 4, 5])(
    "ignores resolution conditions when placing on section %i",
    (section) => {
      expect(evaluatePlacement(resolutionOnly, [], place(section, 12))).toEqual(
        [],
      );
    },
  );

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
