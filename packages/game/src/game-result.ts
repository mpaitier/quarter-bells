import type { TrialRejection } from "@quarter-bells/rules";

import type { Game } from "./game.js";

/**
 * Raison structurée d'un refus : celles de l'épreuve, transmises telles
 * quelles, et celles de la partie. Elles deviendront la `reason` de
 * `CommandRejected` (ADR 0015).
 */
export type GameRejection =
  | TrialRejection
  /** Le joueur ne fait pas partie de la partie. */
  | { readonly reason: "unknownPlayer" }
  /** L'action n'a pas de sens dans la phase actuelle. */
  | { readonly reason: "wrongPhase" }
  /** Action réservée à l'hôte. */
  | { readonly reason: "notHost" };

/**
 * Résultat d'une action. Un refus ne contient pas de partie : l'appelant
 * garde celle qu'il avait, qui n'a pas changé.
 */
export type GameResult =
  | { readonly accepted: true; readonly game: Game }
  | { readonly accepted: false; readonly rejection: GameRejection };

export function accept(game: Game): GameResult {
  return { accepted: true, game };
}

export function reject(rejection: GameRejection): GameResult {
  return { accepted: false, rejection };
}
