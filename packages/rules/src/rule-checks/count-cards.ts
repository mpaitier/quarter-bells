import type { CardFamily } from "../cards/card.js";
import type { Placement } from "../placements/placement.js";

/**
 * Compte les cartes d'une section, toutes familles confondues ou d'une seule
 * famille.
 *
 * Partagé par minCardCount et exactCardCount : les deux règles doivent
 * compter exactement de la même façon. Un seul endroit garantit qu'elles ne
 * divergeront pas si la notion de « carte qui compte » évolue.
 *
 * La face (visible ou cachée) n'entre pas en compte : à la Résolution,
 * toutes les cartes sont révélées.
 *
 * @param placements cartes de la section, déjà filtrées par l'appelant
 * @param family famille à compter ; absente, toutes les cartes comptent
 */
export function countCards(
  placements: readonly Placement[],
  family?: CardFamily,
): number {
  // Sans famille, inutile de parcourir le tableau.
  if (family === undefined) {
    return placements.length;
  }
  return placements.filter((placement) => placement.card.family === family)
    .length;
}
