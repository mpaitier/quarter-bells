import { isIntegerBetween } from "../numbers/is-integer-between.js";

/**
 * Bougies par joueur dans le calcul des bougies de base. Valeur provisoire, à
 * ajuster en partie de test (game-rules.md, « Mise en place d'une épreuve »).
 */
export const CANDLES_PER_PLAYER = 1;

/** Plus grand nombre de bougies bonus possible, quelles que soient les options. */
export const MAX_BONUS_CANDLES = 3;

/** Options de la salle qui portent sur les bougies (F-LOB-11). */
export interface CandleSettings {
  /** Les bougies de base ne dépassent pas cette valeur. Absent : pas de plafond. */
  readonly baseCandlesCap?: number;
  /**
   * Nombre maximum de bougies bonus, de 0 (désactivées) à MAX_BONUS_CANDLES. Un
   * échec alors que ce maximum est atteint fait perdre la run.
   */
  readonly maxBonusCandles: number;
}

/** Les bougies d'une épreuve. Seul `spent` change pendant la Pose. */
export interface Candles {
  /** Bougies de base, fixées à la création de l'épreuve. */
  readonly base: number;
  /** Bougies bonus du groupe au début de l'épreuve. */
  readonly bonus: number;
  /** Bougies dépensées pour poser face visible. */
  readonly spent: number;
}

/**
 * Bougies de base d'une épreuve : nombre de joueurs × CANDLES_PER_PLAYER, sans
 * dépasser le plafond de la salle s'il y en a un.
 */
export function computeBaseCandles(
  playerCount: number,
  baseCandlesCap?: number,
): number {
  const base = playerCount * CANDLES_PER_PLAYER;
  return baseCandlesCap === undefined ? base : Math.min(base, baseCandlesCap);
}

/** Bougies encore disponibles : de base et bonus, moins celles déjà dépensées. */
export function availableCandles(candles: Candles): number {
  return candles.base + candles.bonus - candles.spent;
}

/**
 * Vérifie les options de bougies d'une salle (F-LOB-11). Partagée par
 * createTrial et par le moteur de partie, qui les contrôle dès la création de
 * la partie plutôt qu'à la première distribution.
 *
 * @throws {RangeError} si le maximum de bougies bonus n'est pas un entier
 * entre 0 et MAX_BONUS_CANDLES, ou si le plafond n'est pas un entier positif
 * ou nul
 */
export function checkCandleSettings(settings: CandleSettings): void {
  const { maxBonusCandles, baseCandlesCap } = settings;
  if (!isIntegerBetween(maxBonusCandles, 0, MAX_BONUS_CANDLES)) {
    throw new RangeError(
      `maxBonusCandles must be an integer between 0 and ${String(MAX_BONUS_CANDLES)}, received ${String(maxBonusCandles)}`,
    );
  }
  if (
    baseCandlesCap !== undefined &&
    !isIntegerBetween(baseCandlesCap, 0, Number.MAX_SAFE_INTEGER)
  ) {
    throw new RangeError(
      `baseCandlesCap must be a non-negative integer, received ${String(baseCandlesCap)}`,
    );
  }
}
