import type { Static } from "typebox";
import type { MinCardCountSchema } from "../clocks/rule-schemas.js";
import type { Placement } from "../placements/placement.js";
import type { MinCardCountViolation } from "./violation.js";

/** Paramètres de minCardCount, déduits du schéma de la règle. */
export type MinCardCountParams = Static<typeof MinCardCountSchema>["params"];

/**
 * Vérifie qu'une section contient au moins `params.min` cartes.
 * Sert à la règle générale (min 1 sur chaque section) comme aux règles de
 * section des horloges.
 *
 * @returns la violation, ou undefined si la règle est respectée
 */
export function checkMinCardCount(
  section: number,
  placements: readonly Placement[],
  params: MinCardCountParams,
): MinCardCountViolation | undefined {
  const cardCount = placements.length;
  // Clause de garde : assez de cartes, rien à signaler.
  if (cardCount >= params.min) {
    return undefined;
  }
  return { kind: "minCardCount", params, section, cardCount };
}
