import type { Static } from "typebox";
import type { SumInRangeSchema } from "../clocks/rule-schemas.js";
import { sectionValue } from "../placements/by-section.js";
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
 * Évaluation à la Résolution, sur toutes les cartes. La vérification pendant
 * la Pose (borne haute connue) est traitée à part.
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
