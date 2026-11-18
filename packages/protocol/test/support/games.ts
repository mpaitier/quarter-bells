// Parties prêtes à l'emploi pour les tests de la vue. Elles passent
// uniquement par l'API publique du moteur, comme l'adaptateur local et le
// serveur.

import {
  applyGameAction,
  createGame,
  type Game,
  type GameAction,
  type GameSetup,
  type PlacementGame,
} from "@quarter-bells/game";
import {
  availableCandles,
  currentPlayer,
  listPlacementOptions,
} from "@quarter-bells/rules";

import { CHAPTER_1 } from "./chapters.js";
import { deepFreeze } from "./deep-freeze.js";

/** 3 joueurs, ana est l'hôte, chapitre 1. */
export const SETUP: GameSetup = {
  chapters: [CHAPTER_1],
  turnOrder: ["ana", "ben", "cleo"],
  host: "ana",
  seed: 42,
  candleSettings: { maxBonusCandles: 3 },
};

/** Partie à 2 : chaque joueur a une réserve au début de l'épreuve. */
export const TWO_PLAYER_SETUP: GameSetup = {
  ...SETUP,
  turnOrder: ["ana", "ben"],
};

/**
 * Applique une action qui doit être acceptée. La partie est gelée avant :
 * le moteur ne doit pas la modifier, la projection non plus.
 */
export function play(game: Game, action: GameAction): Game {
  const result = applyGameAction(deepFreeze(game), action);
  if (!result.accepted) {
    throw new Error(`Rejected: ${JSON.stringify(result.rejection)}`);
  }
  return deepFreeze(result.game);
}

/** Une partie en Discussion sur la première horloge. */
export function discussion(setup: GameSetup = SETUP): Game {
  return play(deepFreeze(createGame(setup)), {
    type: "endAnnouncement",
    player: setup.host,
  });
}

/** Une partie en Pose : tous les joueurs se sont déclarés prêts. */
export function placement(setup: GameSetup = SETUP): PlacementGame {
  let game = discussion(setup);
  for (const player of setup.turnOrder) {
    game = play(game, { type: "setReady", player, ready: true });
  }
  return asPlacement(game);
}

export function asPlacement(game: Game): PlacementGame {
  if (game.phase !== "placement") {
    throw new Error(`Expected placement, got ${game.phase}`);
  }
  return game;
}

/** Un choix de pose : quelle option permise prendre, et sur quelle face. */
export interface PlacementChoice {
  readonly pick: number;
  readonly faceUp: boolean;
}

/**
 * Le joueur du tour pose une carte parmi ses poses permises : l'option
 * `pick` (modulo leur nombre), face visible si demandé et s'il reste une
 * bougie.
 *
 * @returns la partie après la pose, ou undefined si le joueur n'a aucune pose
 * permise
 */
export function placeChoice(
  game: PlacementGame,
  choice: PlacementChoice,
): Game | undefined {
  const { trial } = game;
  const player = currentPlayer(trial);
  const seat = trial.seats.find((candidate) => candidate.player === player);
  if (seat === undefined) {
    throw new Error("No seat for the player of the turn");
  }
  const options = listPlacementOptions(
    trial.clock,
    trial.placements,
    seat.hand,
  ).filter((option) => option.permitted);
  const option = options[choice.pick % Math.max(options.length, 1)];
  if (option === undefined) {
    return undefined;
  }
  return play(game, {
    type: "placeCard",
    player: seat.player,
    cardId: option.cardId,
    sectionIndex: option.sectionIndex,
    faceUp: choice.faceUp && availableCandles(trial.candles) > 0,
  });
}

/** Joue des poses tant que la partie est en Pose et que les choix durent. */
export function playChoices(
  game: Game,
  choices: readonly PlacementChoice[],
): Game {
  let current = game;
  for (const choice of choices) {
    if (current.phase !== "placement") {
      break;
    }
    const next = placeChoice(current, choice);
    if (next === undefined) {
      break;
    }
    current = next;
  }
  return current;
}

/** Une épreuve jouée jusqu'à la Résolution, en prenant toujours la première pose permise. */
export function resolved(setup: GameSetup = SETUP): Game {
  return playChoices(
    placement(setup),
    Array.from({ length: 12 }, () => ({ pick: 0, faceUp: false })),
  );
}
