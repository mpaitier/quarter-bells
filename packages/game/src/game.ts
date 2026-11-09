// État d'une partie (ADR 0015), sur le modèle de l'épreuve (ADR 0010) :
// uniquement des données sérialisables en JSON, une union discriminée sur
// `phase`, et rien de ce qui peut se déduire.

import type {
  CandleSettings,
  Clock,
  PlacingTrial,
  PlayerId,
  ResolvedTrial,
} from "@quarter-bells/rules";

/** Un chapitre et ses horloges, dans l'ordre où elles se jouent. */
export interface Chapter {
  /** Numéro du chapitre dans le jeu, à partir de 1. */
  readonly number: number;
  readonly clocks: readonly Clock[];
}

/** Ce qu'il faut pour lancer une partie. */
export interface GameSetup {
  /**
   * Chapitres joués pendant la partie, dans l'ordre. Le moteur ne lit aucun
   * fichier : les horloges arrivent déjà validées par parseClock.
   */
  readonly chapters: readonly Chapter[];
  /** Les joueurs dans l'ordre de passage, le même pour toutes les épreuves. */
  readonly turnOrder: readonly PlayerId[];
  /**
   * Joueur autorisé à prendre les décisions après une épreuve. Au J2, le
   * premier de l'ordre de passage ; au J3, l'hôte de la salle.
   */
  readonly host: PlayerId;
  /** Graine de la partie : celle de chaque épreuve en est dérivée. */
  readonly seed: number;
  readonly candleSettings: CandleSettings;
}

/** Horloge en cours : index dans `setup.chapters`, puis dans `clocks`. */
export interface ClockPosition {
  readonly chapterIndex: number;
  readonly clockIndex: number;
}

/** Champs communs à toutes les phases d'une partie. */
interface GameCommon {
  readonly setup: GameSetup;
  readonly position: ClockPosition;
  /**
   * Nombre d'épreuves déjà créées dans la partie, tentatives comprises. Sert
   * à dériver la graine de la prochaine épreuve (ADR 0015).
   */
  readonly trialCount: number;
}

/** L'horloge est annoncée au groupe. */
export interface AnnouncingGame extends GameCommon {
  readonly phase: "announcing";
  /** Bougies bonus du groupe pour la prochaine épreuve. */
  readonly bonusCandles: number;
}

/** Le groupe discute avant la distribution. */
export interface DiscussionGame extends GameCommon {
  readonly phase: "discussion";
  readonly bonusCandles: number;
  /**
   * Joueurs qui se sont déclarés prêts. Un tableau et non un Set : un Set ne
   * passe pas en JSON.
   */
  readonly readyPlayers: readonly PlayerId[];
}

/** Une épreuve est en cours de Pose. */
export interface PlacementGame extends GameCommon {
  readonly phase: "placement";
  readonly trial: PlacingTrial;
}

/**
 * L'épreuve est résolue et attend la décision de l'hôte. Les bougies bonus
 * se lisent dans `trial.bonusCandlesAfter`, sans être recopiées.
 */
export interface ResolvedGame extends GameCommon {
  readonly phase: ResolvedTrial["phase"];
  readonly trial: ResolvedTrial;
}

/** La dernière horloge du chapitre est réussie : chaque joueur se déclare prêt. */
export interface ChapterCompletedGame extends GameCommon {
  readonly phase: "chapterCompleted";
  readonly readyPlayers: readonly PlayerId[];
}

/** La dernière horloge du dernier chapitre est réussie. */
export interface CompletedGame extends GameCommon {
  readonly phase: "completed";
}

/** L'hôte a arrêté la partie. */
export interface EndedGame extends GameCommon {
  readonly phase: "ended";
}

/** Une partie, quelle que soit sa phase. Union discriminée sur phase. */
export type Game =
  | AnnouncingGame
  | DiscussionGame
  | PlacementGame
  | ResolvedGame
  | ChapterCompletedGame
  | CompletedGame
  | EndedGame;

/**
 * L'horloge en cours.
 *
 * @throws {RangeError} si la position ne désigne aucune horloge : createGame
 * et les actions ne produisent que des positions valides, c'est donc une
 * erreur de programmation
 */
export function currentClock(game: Game): Clock {
  const { chapterIndex, clockIndex } = game.position;
  const clock = game.setup.chapters[chapterIndex]?.clocks[clockIndex];
  if (clock === undefined) {
    throw new RangeError(
      `No clock at chapter ${String(chapterIndex)}, clock ${String(clockIndex)}`,
    );
  }
  return clock;
}
