// Décisions de l'hôte après une épreuve (game-state.md). Elles ne font que
// déplacer la partie : la nouvelle épreuve sera distribuée après la
// prochaine Discussion.

import type { PlayerId } from "@quarter-bells/rules";

import {
  currentChapter,
  type AnnouncingGame,
  type ChapterCompletedGame,
  type ClockPosition,
  type CompletedGame,
  type EndedGame,
  type Game,
  type ResolvedGame,
} from "./game.js";
import { accept, reject, type GameResult } from "./game-result.js";

/** Après une réussite : horloge suivante, fin de chapitre ou fin du jeu. */
export interface ContinueAction {
  readonly type: "continue";
  readonly player: PlayerId;
}

/**
 * Après un échec ou une run perdue : la même horloge est annoncée de
 * nouveau (F-JEU-15, F-JEU-16).
 */
export interface RetryAction {
  readonly type: "retry";
  readonly player: PlayerId;
}

/** Après une run perdue : retour à la première horloge du chapitre (F-JEU-16). */
export interface RestartChapterAction {
  readonly type: "restartChapter";
  readonly player: PlayerId;
}

/**
 * Arrêter la partie. Au J4, l'arrêt sauvegardera la progression, et « mettre
 * fin à la progression » après une run perdue deviendra une décision à part.
 */
export interface StopAction {
  readonly type: "stop";
  readonly player: PlayerId;
}

export type HostDecision =
  ContinueAction | RetryAction | RestartChapterAction | StopAction;

/**
 * Applique une décision de l'hôte. Le joueur fait partie de la partie :
 * applyGameAction l'a vérifié.
 */
export function applyHostDecision(
  game: Game,
  decision: HostDecision,
): GameResult {
  if (decision.player !== game.setup.host) {
    return reject({ reason: "notHost" });
  }

  switch (decision.type) {
    case "continue":
      return game.phase === "succeeded"
        ? accept(continueAfterSuccess(game))
        : reject({ reason: "wrongPhase" });
    case "retry":
      // Échec : les bougies bonus gagnées sont gardées. Run perdue : elles
      // sont remises à zéro (F-JEU-16).
      if (game.phase === "failed") {
        return accept(
          announce(game, game.position, game.trial.bonusCandlesAfter),
        );
      }
      return game.phase === "runLost"
        ? accept(announce(game, game.position, 0))
        : reject({ reason: "wrongPhase" });
    case "restartChapter":
      // Hors du mode hors sauvegarde (J4), seule une run perdue le propose.
      return game.phase === "runLost"
        ? accept(
            announce(
              game,
              { chapterIndex: game.position.chapterIndex, clockIndex: 0 },
              0,
            ),
          )
        : reject({ reason: "wrongPhase" });
    case "stop":
      return canStop(game)
        ? accept(end(game))
        : reject({ reason: "wrongPhase" });
  }
}

/**
 * Après une réussite, l'horloge suivante du chapitre est annoncée. Après la
 * dernière, le chapitre s'achève, ou le jeu s'il ne reste aucun chapitre.
 */
function continueAfterSuccess(
  game: ResolvedGame,
): AnnouncingGame | ChapterCompletedGame | CompletedGame {
  const { setup, position, trialCount } = game;
  const { chapterIndex, clockIndex } = position;
  if (clockIndex + 1 < currentChapter(game).clocks.length) {
    // Une réussite remet les bougies bonus à zéro : rules l'a déjà fait.
    return announce(
      game,
      { chapterIndex, clockIndex: clockIndex + 1 },
      game.trial.bonusCandlesAfter,
    );
  }
  if (chapterIndex + 1 < setup.chapters.length) {
    return {
      phase: "chapterCompleted",
      setup,
      position,
      trialCount,
      readyPlayers: [],
    };
  }
  return { phase: "completed", setup, position, trialCount };
}

/**
 * Annonce l'horloge à cette position. L'objet est reconstruit plutôt
 * qu'étalé : l'épreuve terminée n'a rien à faire dans une annonce.
 */
export function announce(
  game: Game,
  position: ClockPosition,
  bonusCandles: number,
): AnnouncingGame {
  return {
    phase: "announcing",
    setup: game.setup,
    position,
    trialCount: game.trialCount,
    bonusCandles,
  };
}

/** L'hôte peut arrêter entre deux épreuves, pas pendant l'une d'elles. */
function canStop(game: Game): boolean {
  return (
    game.phase === "succeeded" ||
    game.phase === "failed" ||
    game.phase === "runLost" ||
    game.phase === "chapterCompleted"
  );
}

function end(game: Game): EndedGame {
  return {
    phase: "ended",
    setup: game.setup,
    position: game.position,
    trialCount: game.trialCount,
  };
}
