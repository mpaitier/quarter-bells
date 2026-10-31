import type { Static } from "typebox";
import type { SumInRangeSchema } from "../clocks/rule-schemas.js";
import { sectionValue } from "../placements/by-section.js";
import { knownValueAfter } from "../placements/known-value.js";
import type { Placement } from "../placements/placement.js";
import type { SumInRangeViolation } from "./violation.js";

/** Paramètres de sumInRange, déduits du schéma de la règle. */
export type SumInRangeParams = Static<typeof SumInRangeSchema>["params"];

/**
 * Vérifie que la valeur d'une section est comprise entre `params.min` et
 * `params.max`, bornes incluses. Avec min = max, la section doit valoir
 * exactement cette valeur.
 *
 * Une section vide vaut 0 : elle échoue dès que min est positif (les règles
 * sont indépendantes, voir violation.ts).
 *
 * Suppose min <= max : parseClock refuse une horloge qui ne le respecte pas.
 * Évaluation à la Résolution, sur toutes les cartes. Pendant la Pose, voir
 * checkSumInRangeAtPlacement.
 *
 * @returns la violation, ou undefined si la règle est respectée
 */
export function checkSumInRange(
  section: number,
  placements: readonly Placement[],
  params: SumInRangeParams,
): SumInRangeViolation | undefined {
  const value = sectionValue(placements);
  // Clause de garde : dans l'intervalle, bornes comprises, rien à signaler.
  if (value >= params.min && value <= params.max) {
    return undefined;
  }
  // Une seule forme de violation pour les deux bornes : comparer value à
  // params suffit au client pour savoir laquelle est franchie.
  return { kind: "sumInRange", params, section, value };
}

/**
 * Borne haute connue pendant la Pose (F-JEU-21) : refuse `candidate` si la
 * section dépasserait `params.max` et que sa valeur est connue (toutes ses
 * cartes face visible, voir knownValueAfter).
 *
 * Le minimum n'est jamais vérifié pendant la Pose : d'autres cartes peuvent
 * encore être ajoutées à la section.
 *
 * Même violation qu'à la Résolution ; `value` y est la valeur qu'aurait la
 * section avec la carte proposée, forcément au-dessus du maximum.
 *
 * @param placements pose déjà faite, toutes sections confondues
 * @returns la violation, ou undefined si la pose est permise
 */
export function checkSumInRangeAtPlacement(
  section: number,
  placements: readonly Placement[],
  candidate: Placement,
  params: SumInRangeParams,
): SumInRangeViolation | undefined {
  const value = knownValueAfter(section, placements, candidate);
  // Clause de garde : valeur inconnue ou maximum respecté. Une valeur sous
  // le minimum passe : la section n'est peut-être pas terminée.
  if (value === undefined || value <= params.max) {
    return undefined;
  }
  return { kind: "sumInRange", params, section, value };
}
