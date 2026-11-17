// Horloges réduites à ce que lisent les fonctions de la Pose
// (evaluatePlacement, listPlacementOptions) : sections, règles d'horloge et
// noMaxSum. Un test n'a pas à écrire une horloge entière.

import type { Clock, ClockRule, SectionRule } from "../../src/clocks/clock.js";

/** Ce que lisent les fonctions de la Pose dans une horloge. */
export type PlacementClock = Pick<
  Clock,
  "sections" | "clockRules" | "noMaxSum"
>;

/**
 * Horloge où chaque section reçoit les règles indiquées pour son index,
 * aucune sinon.
 */
export function clockWith(
  rulesBySection: Partial<Record<number, SectionRule[]>>,
  clockRules: ClockRule[] = [],
  noMaxSum = false,
): PlacementClock {
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
