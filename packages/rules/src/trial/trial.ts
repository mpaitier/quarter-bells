// État d'une épreuve (ADR 0010). Uniquement des données : pas de classe, pas
// de fonction, pas de générateur. L'état se sérialise en JSON tel quel, ce
// qui permettra au serveur de le sauvegarder et de le renvoyer à un joueur
// qui se reconnecte.
//
// Tout ce qui peut se déduire n'est pas stocké : le joueur dont c'est le
// tour vient du nombre de poses, les yeux disponibles des yeux dépensés.
// Une seule source de vérité, donc pas d'incohérence possible.

import type { Card } from "../cards/card.js";
import type { Clock } from "../clocks/clock.js";
import type { ResolutionReport } from "../evaluation/evaluate-resolution.js";
import type { Placement } from "../placements/placement.js";
import type { Eyes } from "./eyes.js";

/**
 * Identifiant d'un joueur, attribué hors du moteur (serveur). Le moteur ne
 * fait que le comparer.
 */
export type PlayerId = string;

/**
 * Une carte posée pendant une épreuve : un Placement, avec la carte complète
 * (identifiant compris) et le joueur qui l'a posée. Compatible avec
 * Placement : les règles l'acceptent sans conversion.
 */
export interface TrialPlacement extends Placement {
  readonly card: Card;
  readonly player: PlayerId;
}

/** Un joueur et ses cartes, à sa place dans l'ordre de passage. */
export interface Seat {
  readonly player: PlayerId;
  /** Cartes jouables. */
  readonly hand: readonly Card[];
  /** Cartes de réserve, pas encore jouables. Vide sauf en partie à 2. */
  readonly reserve: readonly Card[];
}

/** Champs communs à toutes les phases d'une épreuve. */
interface TrialCommon {
  readonly clock: Clock;
  readonly startSection: number;
  /** Les joueurs dans l'ordre de passage. */
  readonly seats: readonly Seat[];
  /** Les poses acceptées, dans l'ordre : la position est le rang de pose. */
  readonly placements: readonly TrialPlacement[];
  readonly eyes: Eyes;
  /** Option de la salle, nécessaire pour décider entre échec et run perdue. */
  readonly maxBonusEyes: number;
}

/** Épreuve en cours de Pose. */
export interface PlacingTrial extends TrialCommon {
  readonly phase: "placement";
}

/** Épreuve terminée, après la Résolution. */
export interface ResolvedTrial extends TrialCommon {
  readonly phase: "succeeded" | "failed" | "runLost";
  readonly resolution: ResolutionReport<TrialPlacement>;
  /** Yeux bonus du groupe après l'épreuve, à reporter dans sa progression. */
  readonly bonusEyesAfter: number;
}

/** Une épreuve, quelle que soit sa phase. Union discriminée sur phase. */
export type Trial = PlacingTrial | ResolvedTrial;

/**
 * Le joueur dont c'est le tour : les joueurs posent chacun leur tour, dans
 * l'ordre de passage, donc le rang de la prochaine pose suffit.
 *
 * @returns undefined si l'épreuve est terminée
 */
export function currentPlayer(trial: Trial): PlayerId | undefined {
  if (trial.phase !== "placement") {
    return undefined;
  }
  return trial.seats[trial.placements.length % trial.seats.length]?.player;
}
