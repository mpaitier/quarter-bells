import type { Static } from "typebox";
import type { MaxSumSchema } from "../clocks/rule-schemas.js";
import { sectionValue } from "../placements/by-section.js";
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
