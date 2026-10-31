/**
 * Yeux par joueur dans le calcul des yeux de base. Valeur provisoire, à
 * ajuster en partie de test (game-rules.md, « Mise en place d'une épreuve »).
 */
export const EYES_PER_PLAYER = 1;

/** Plus grand nombre d'yeux bonus possible, quelles que soient les options. */
export const MAX_BONUS_EYES = 3;

/** Options de la salle qui portent sur les yeux (F-LOB-11). */
export interface EyeSettings {
  /** Les yeux de base ne dépassent pas cette valeur. Absent : pas de plafond. */
  readonly baseEyesCap?: number;
  /**
   * Nombre maximum d'yeux bonus, de 0 (désactivés) à MAX_BONUS_EYES. Un
   * échec alors que ce maximum est atteint fait perdre la run.
   */
  readonly maxBonusEyes: number;
}

/** Les yeux d'une épreuve. Seul `spent` change pendant la Pose. */
export interface Eyes {
  /** Yeux de base, fixés à la création de l'épreuve. */
  readonly base: number;
  /** Yeux bonus du groupe au début de l'épreuve. */
  readonly bonus: number;
  /** Yeux dépensés pour poser face visible. */
  readonly spent: number;
}

/**
 * Yeux de base d'une épreuve : nombre de joueurs × EYES_PER_PLAYER, sans
 * dépasser le plafond de la salle s'il y en a un.
 */
export function computeBaseEyes(
  playerCount: number,
  baseEyesCap?: number,
): number {
  const base = playerCount * EYES_PER_PLAYER;
  return baseEyesCap === undefined ? base : Math.min(base, baseEyesCap);
}

/** Yeux encore disponibles : de base et bonus, moins ceux déjà dépensés. */
export function availableEyes(eyes: Eyes): number {
  return eyes.base + eyes.bonus - eyes.spent;
}
