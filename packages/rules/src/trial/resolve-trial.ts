import { evaluateResolution } from "../evaluation/evaluate-resolution.js";
import type { PlacingTrial, ResolvedTrial } from "./trial.js";

/** Issue d'une épreuve et bougies bonus du groupe après celle-ci. */
export interface TrialOutcome {
  readonly phase: ResolvedTrial["phase"];
  readonly bonusCandlesAfter: number;
}

/**
 * Conséquences d'une épreuve sur les bougies bonus (F-JEU-14, F-JEU-16) :
 * - réussite : bougies bonus remises à zéro ;
 * - échec sous le maximum : une bougie bonus gagnée ;
 * - échec au maximum : run perdue, bougies bonus inchangées. Avec un maximum à 0
 *   (bougies bonus désactivées), tout échec fait perdre la run.
 */
export function trialOutcome(
  succeeded: boolean,
  bonusCandles: number,
  maxBonusCandles: number,
): TrialOutcome {
  if (succeeded) {
    return { phase: "succeeded", bonusCandlesAfter: 0 };
  }
  if (bonusCandles < maxBonusCandles) {
    return { phase: "failed", bonusCandlesAfter: bonusCandles + 1 };
  }
  return { phase: "runLost", bonusCandlesAfter: bonusCandles };
}

/** Toutes les cartes ont été posées : plus rien en main ni en réserve. */
export function isPlacementComplete(trial: PlacingTrial): boolean {
  return trial.seats.every(
    (seat) => seat.hand.length === 0 && seat.reserve.length === 0,
  );
}

/**
 * Résout une épreuve dont toutes les cartes sont posées : évalue la pose
 * complète, puis fixe la phase finale et les bougies bonus. Côté moteur, la
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
    ...trialOutcome(
      resolution.succeeded,
      trial.candles.bonus,
      trial.maxBonusCandles,
    ),
    resolution,
  };
}
