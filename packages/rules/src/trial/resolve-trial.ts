import { evaluateResolution } from "../evaluation/evaluate-resolution.js";
import type { PlacingTrial, ResolvedTrial } from "./trial.js";

/** Issue d'une épreuve et yeux bonus du groupe après celle-ci. */
export interface TrialOutcome {
  readonly phase: ResolvedTrial["phase"];
  readonly bonusEyesAfter: number;
}

/**
 * Conséquences d'une épreuve sur les yeux bonus (F-JEU-14, F-JEU-16) :
 * - réussite : yeux bonus remis à zéro ;
 * - échec sous le maximum : un œil bonus gagné ;
 * - échec au maximum : run perdue, yeux bonus inchangés. Avec un maximum à 0
 *   (yeux bonus désactivés), tout échec fait perdre la run.
 */
export function trialOutcome(
  succeeded: boolean,
  bonusEyes: number,
  maxBonusEyes: number,
): TrialOutcome {
  if (succeeded) {
    return { phase: "succeeded", bonusEyesAfter: 0 };
  }
  if (bonusEyes < maxBonusEyes) {
    return { phase: "failed", bonusEyesAfter: bonusEyes + 1 };
  }
  return { phase: "runLost", bonusEyesAfter: bonusEyes };
}

/** Toutes les cartes ont été posées : plus rien en main ni en réserve. */
export function isPlacementComplete(trial: PlacingTrial): boolean {
  return trial.seats.every(
    (seat) => seat.hand.length === 0 && seat.reserve.length === 0,
  );
}

/**
 * Résout une épreuve dont toutes les cartes sont posées : évalue la pose
 * complète, puis fixe la phase finale et les yeux bonus. Côté moteur, la
 * Résolution est instantanée ; la révélation section par section est une
 * animation du client (game-state.md).
 */
export function resolveTrial(trial: PlacingTrial): ResolvedTrial {
  const resolution = evaluateResolution(
    trial.clock,
    trial.startSection,
    trial.placements,
  );
  return {
    ...trial,
    ...trialOutcome(resolution.succeeded, trial.eyes.bonus, trial.maxBonusEyes),
    resolution,
  };
}
