import type { Static } from "typebox";
import type { FirstPlacementsSchema } from "../clocks/rule-schemas.js";
import type { Placement } from "../placements/placement.js";
import type { FirstPlacementsViolation } from "./violation.js";

/** Paramètres de firstPlacements, déduits du schéma de la règle. */
export type FirstPlacementsParams = Static<
  typeof FirstPlacementsSchema
>["params"];

/**
 * Contrainte de pose : les poses dont le rang figure dans
 * `params.placementIndexes` doivent se faire devant `section`.
 *
 * Évaluée pendant la Pose, avant d'accepter `candidate`. Une pose refusée
 * n'entre jamais dans la pose : à la Résolution, la règle est donc déjà
 * respectée et n'a pas à être vérifiée une seconde fois.
 *
 * Les rangs non listés sont libres, sur n'importe quelle section, y compris
 * celle-ci. La règle ne lit ni la valeur, ni la famille, ni la face de la
 * carte : seulement son rang et la section visée, deux informations
 * publiques. Le client peut donc signaler les sections interdites avant
 * même que le joueur choisisse sa carte (F-JEU-08).
 *
 * @param section section qui porte la règle
 * @param placements pose déjà faite, dans l'ordre des poses
 * @param candidate pose proposée, pas encore acceptée
 * @returns la violation, ou undefined si la pose est permise
 */
export function checkFirstPlacements(
  section: number,
  placements: readonly Placement[],
  candidate: Placement,
  params: FirstPlacementsParams,
): FirstPlacementsViolation | undefined {
  // Le tableau des placements est rangé dans l'ordre des poses (rang 0 en
  // premier) : la pose proposée prend donc le rang suivant, sa longueur.
  const placementIndex = placements.length;

  // Clause de garde : rang non concerné, la pose est libre.
  if (!params.placementIndexes.includes(placementIndex)) {
    return undefined;
  }
  // Clause de garde : rang concerné, et la carte va au bon endroit.
  if (candidate.sectionIndex === section) {
    return undefined;
  }
  return {
    kind: "firstPlacements",
    params,
    section,
    placementIndex,
    attemptedSection: candidate.sectionIndex,
  };
}
