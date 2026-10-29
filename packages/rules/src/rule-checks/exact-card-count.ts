import type { Static } from "typebox";
import type { ExactCardCountSchema } from "../clocks/rule-schemas.js";
import type { Placement } from "../placements/placement.js";
import type { ExactCardCountViolation } from "./violation.js";

/** Paramètres d'exactCardCount, déduits du schéma de la règle. */
export type ExactCardCountParams = Static<
  typeof ExactCardCountSchema
>["params"];

/**
 * Vérifie qu'une section contient exactement `params.count` cartes.
 *
 * Sans `params.family`, toutes les cartes de la section comptent. Avec
 * `params.family`, seules les cartes de cette famille comptent : les autres
 * peuvent être présentes sans faire échouer la règle. Pour imposer une
 * composition exacte (2 instant et aucune eternity), l'horloge combine deux
 * règles, l'une avec count 0.
 *
 * La face (visible ou cachée) n'entre pas en compte : à la Résolution,
 * toutes les cartes sont révélées.
 *
 * @returns la violation, ou undefined si la règle est respectée
 */
export function checkExactCardCount(
  section: number,
  placements: readonly Placement[],
  params: ExactCardCountParams,
): ExactCardCountViolation | undefined {
  const cardCount = placements.filter(
    (placement) =>
      params.family === undefined || placement.card.family === params.family,
  ).length;
  // Clause de garde : le compte est bon, rien à signaler.
  if (cardCount === params.count) {
    return undefined;
  }
  return { kind: "exactCardCount", params, section, cardCount };
}
