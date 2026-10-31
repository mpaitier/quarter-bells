import { describe, expect, it } from "vitest";
import type { CardValue } from "../../src/cards/card.js";
import type { Clock, ClockRule, SectionRule } from "../../src/clocks/clock.js";
import { parseClock } from "../../src/clocks/parse-clock.js";
import { evaluateResolution } from "../../src/evaluation/evaluate-resolution.js";
import type { Placement } from "../../src/placements/placement.js";
import exampleClock from "../fixtures/clocks/example-clock.json" with { type: "json" };

// Le détail de chaque règle est couvert par test/cases/. Ce fichier teste ce
// que fait le point d'entrée en plus : rassembler les règles générales et
// celles de l'horloge, construire le rapport section par section dans
// l'ordre de révélation, et trier les violations.

// Fabrique un placement en ne précisant que la section et la valeur.
function place(sectionIndex: number, value: CardValue): Placement {
  return { sectionIndex, card: { family: "instant", value }, faceUp: false };
}

// Horloge réduite à ce que lit evaluateResolution (même helper que dans
// evaluate-placement.test.ts : sections est un tuple d'index littéraux).
function clockWith(
  rulesBySection: Partial<Record<number, SectionRule[]>>,
  clockRules: ClockRule[] = [],
): Pick<Clock, "sections" | "clockRules" | "noMaxSum"> {
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
    noMaxSum: false,
  };
}

// Pose croissante depuis la section 0 : une carte par section, de 1 à 6.
const ascendingFrom0 = ([1, 2, 3, 4, 5, 6] as const).map((value, section) =>
  place(section, value),
);

describe("evaluateResolution", () => {
  it("succeeds when every condition holds", () => {
    const report = evaluateResolution(clockWith({}), 0, ascendingFrom0);
    expect(report.succeeded).toBe(true);
    expect(report.violations).toEqual([]);
  });

  it("reveals the sections clockwise from the start section", () => {
    // Départ en section 4 : révélation 4, 5, 0, 1, 2, 3.
    const report = evaluateResolution(clockWith({}), 4, ascendingFrom0);
    expect(report.sections.map((reveal) => reveal.section)).toEqual([
      4, 5, 0, 1, 2, 3,
    ]);
  });

  it("gives the cards and the sum of each section", () => {
    const pose = [place(2, 3), place(0, 1), place(2, 9)];
    const report = evaluateResolution(clockWith({}), 0, pose);
    const section2 = report.sections.find((reveal) => reveal.section === 2);
    // Les cartes gardent l'ordre des poses ; la somme est celle des valeurs.
    expect(section2).toEqual({
      section: 2,
      placements: [place(2, 3), place(2, 9)],
      value: 12,
      ascending: true,
    });
  });

  it("flags the sections that break the ascending order", () => {
    // Depuis la section 0 : 6, 1, 2, 3, 4, 5. Seule la section 1 descend.
    const pose = ([6, 1, 2, 3, 4, 5] as const).map((value, section) =>
      place(section, value),
    );
    const report = evaluateResolution(clockWith({}), 0, pose);
    expect(report.sections.map((reveal) => reveal.ascending)).toEqual([
      true,
      false,
      true,
      true,
      true,
      true,
    ]);
    expect(report.succeeded).toBe(false);
  });

  it("applies the section rules of a real clock", () => {
    // example-clock, départ en section 4 : s4 >= 2 cartes, s5 = 3 cartes,
    // s1 entre 6 et 10. Révélation 4, 5, 0, 1, 2, 3, valeurs croissantes.
    const clock = parseClock(exampleClock, "example-clock.json");
    const valid = [
      place(4, 1),
      place(4, 1),
      place(5, 1),
      place(5, 1),
      place(5, 1),
      place(0, 4),
      place(1, 6),
      place(2, 7),
      place(3, 8),
    ];
    expect(evaluateResolution(clock, 4, valid).succeeded).toBe(true);

    // Une carte de moins en section 5 : exactCardCount échoue, et la section
    // 5 (valeur 2) reste au niveau de la section 4 (valeur 2), donc
    // l'ordre tient toujours.
    const missingCard = valid.toSpliced(4, 1);
    expect(evaluateResolution(clock, 4, missingCard).violations).toEqual([
      {
        kind: "exactCardCount",
        params: { count: 3 },
        section: 5,
        cardCount: 2,
      },
    ]);
  });

  it("applies a section maxSum", () => {
    // Plafond de section à 4 en section 5, qui vaut 6.
    const clock = clockWith({ 5: [{ kind: "maxSum", params: { max: 4 } }] });
    expect(evaluateResolution(clock, 0, ascendingFrom0).violations).toEqual([
      { kind: "maxSum", params: { max: 4 }, section: 5, value: 6 },
    ]);
  });

  it("ignores firstPlacements, already enforced during placement", () => {
    // La première carte n'est pas en section 3 : à la Pose elle aurait été
    // refusée ; à la Résolution, la règle n'a plus rien à dire.
    const clock = clockWith({
      3: [{ kind: "firstPlacements", params: { placementIndexes: [0] } }],
    });
    expect(evaluateResolution(clock, 0, ascendingFrom0).succeeded).toBe(true);
  });

  it("applies a clock maxSum to every section", () => {
    // Plafond d'horloge à 4 : les sections 4 (valeur 5) et 5 (valeur 6)
    // le dépassent.
    const clock = clockWith({}, [{ kind: "maxSum", params: { max: 4 } }]);
    const report = evaluateResolution(clock, 0, ascendingFrom0);
    expect(report.violations).toEqual([
      { kind: "maxSum", params: { max: 4 }, section: 4, value: 5 },
      { kind: "maxSum", params: { max: 4 }, section: 5, value: 6 },
    ]);
  });

  it("does not report ascendingOrder twice when the clock writes it", () => {
    const clock = clockWith({}, [{ kind: "ascendingOrder", params: {} }]);
    const pose = ([6, 1, 2, 3, 4, 5] as const).map((value, section) =>
      place(section, value),
    );
    const kinds = evaluateResolution(clock, 0, pose).violations.map(
      (violation) => violation.kind,
    );
    expect(kinds).toEqual(["ascendingOrder"]);
  });

  it("sorts violations by rule, then by section", () => {
    // Section 2 au-dessus de son maximum de 2 (sumInRange, règle de
    // section) et section 5 au-dessus du plafond d'horloge de 5 (maxSum,
    // règle d'horloge). Calcul : sumInRange d'abord ; tri : maxSum d'abord,
    // dans l'ordre du catalogue, même si sa section vient après.
    const clock = clockWith(
      { 2: [{ kind: "sumInRange", params: { min: 0, max: 2 } }] },
      [{ kind: "maxSum", params: { max: 5 } }],
    );
    const kinds = evaluateResolution(clock, 0, ascendingFrom0).violations.map(
      (violation) => [violation.kind, violation.section],
    );
    expect(kinds).toEqual([
      ["maxSum", 5],
      ["sumInRange", 2],
    ]);
  });

  it("keeps the extra fields of the placements it receives", () => {
    // Un placement d'épreuve porte le joueur : le rapport doit le rendre
    // tel quel (paramètre générique P), sans copie appauvrie.
    const pose = ascendingFrom0.map((placement) => ({
      ...placement,
      player: "p1",
    }));
    const report = evaluateResolution(clockWith({}), 0, pose);
    expect(report.sections[0]?.placements[0]?.player).toBe("p1");
  });

  it("rejects a start section outside the clock", () => {
    expect(() => evaluateResolution(clockWith({}), 6, [])).toThrow(RangeError);
  });
});
