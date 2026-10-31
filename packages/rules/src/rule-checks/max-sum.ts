import type { Static } from "typebox";
import type { MaxSumSchema } from "../clocks/rule-schemas.js";
import { sectionValue } from "../placements/by-section.js";
import { knownValueAfter } from "../placements/known-value.js";
import type { Placement } from "../placements/placement.js";
import type { MaxSumViolation } from "./violation.js";

/** Paramètres de maxSum, déduits du schéma de la règle. */
export type MaxSumParams = Static<typeof MaxSumSchema>["params"];

/**
 * Vérifie que la valeur d'une section ne dépasse pas `params.max`.
 * L'égalité est permise. Sert à la règle générale (plafond de 24) comme aux
 * règles maxSum des horloges.
 *
 * noMaxSum n'est pas géré ici : c'est une propriété de l'horloge, et c'est
 * l'appelant qui décide d'appliquer cette règle ou non.
 *
 * @returns la violation, ou undefined si la règle est respectée
 */
export function checkMaxSum(
  section: number,
  placements: readonly Placement[],
  params: MaxSumParams,
): MaxSumViolation | undefined {
  const value = sectionValue(placements);
  // Clause de garde : plafond atteint ou non, tant qu'il n'est pas dépassé,
  // rien à signaler.
  if (value <= params.max) {
    return undefined;
  }
  return { kind: "maxSum", params, section, value };
}

/**
 * Borne haute connue pendant la Pose (F-JEU-21) : refuse `candidate` si la
 * section dépasserait `params.max` et que sa valeur est connue (toutes ses
 * cartes face visible, voir knownValueAfter).
 *
 * Même violation qu'à la Résolution ; `value` y est la valeur qu'aurait la
 * section avec la carte proposée. Sert aux règles maxSum des horloges comme
 * au plafond général de 24.
 *
 * @param placements pose déjà faite, toutes sections confondues
 * @returns la violation, ou undefined si la pose est permise
 */
export function checkMaxSumAtPlacement(
  section: number,
  placements: readonly Placement[],
  candidate: Placement,
  params: MaxSumParams,
): MaxSumViolation | undefined {
  const value = knownValueAfter(section, placements, candidate);
  // Clause de garde : valeur inconnue (carte cachée, autre section) ou
  // plafond respecté, la pose est permise.
  if (value === undefined || value <= params.max) {
    return undefined;
  }
  return { kind: "maxSum", params, section, value };
}
