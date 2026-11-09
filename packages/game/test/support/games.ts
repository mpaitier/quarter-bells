// Parties prêtes à l'emploi pour les tests d'actions : une configuration de
// base, une fonction qui joue une action acceptée, et de quoi amener une
// partie dans chaque phase.

import { currentPlayer } from "@quarter-bells/rules";

import {
  applyGameAction,
  type GameAction,
} from "../../src/apply-game-action.js";
import { createGame } from "../../src/create-game.js";
import type {
  Chapter,
  DiscussionGame,
  Game,
  GameSetup,
  PlacementGame,
  ResolvedGame,
} from "../../src/game.js";
import { CHAPTER_1 } from "./chapters.js";
import { deepFreeze } from "./deep-freeze.js";

/**
 * Chapitre 2 fictif, qui reprend les horloges du chapitre 1 : il sert
 * seulement à tester le passage d'un chapitre au suivant.
 */
export const CHAPTER_2: Chapter = { number: 2, clocks: CHAPTER_1.clocks };

/** Configuration de base : 3 joueurs, ana est l'hôte, chapitre 1 seul. */
export const SETUP: GameSetup = {
  chapters: [CHAPTER_1],
  turnOrder: ["ana", "ben", "cleo"],
  host: "ana",
  seed: 42,
  candleSettings: { maxBonusCandles: 3 },
};

/**
 * Applique une action qui doit être acceptée. La partie est gelée avant :
 * si l'action la modifiait, le test échouerait sur une TypeError (ADR 0010).
 */
export function play(game: Game, action: GameAction): Game {
  const result = applyGameAction(deepFreeze(game), action);
  if (!result.accepted) {
    throw new Error(`Rejected: ${JSON.stringify(result.rejection)}`);
  }
  return result.game;
}

/** Une partie en Discussion, sur la première horloge. */
export function discussion(setup: GameSetup = SETUP): DiscussionGame {
  const game = play(createGame(setup), {
    type: "endAnnouncement",
    player: setup.host,
  });
  if (game.phase !== "discussion") {
    throw new Error("Not in discussion");
  }
  return game;
}

/** Une partie en Pose : tous les joueurs se sont déclarés prêts. */
export function placement(from: DiscussionGame = discussion()): PlacementGame {
  let game: Game = from;
  for (const player of from.setup.turnOrder) {
    game = play(game, { type: "setReady", player, ready: true });
  }
  if (game.phase !== "placement") {
    throw new Error("Not in placement");
  }
  return game;
}

/** Le joueur du tour pose sa première carte, face cachée, en section 0. */
export function placeFirstInSection0(game: PlacementGame): Game {
  const player = currentPlayer(game.trial);
  const card = game.trial.seats.find((seat) => seat.player === player)?.hand[0];
  if (player === undefined || card === undefined) {
    throw new Error("No card to place");
  }
  return play(game, {
    type: "placeCard",
    player,
    cardId: card.id,
    sectionIndex: 0,
    faceUp: false,
  });
}

/**
 * Une épreuve ratée : les 12 cartes en section 0 laissent les autres
 * sections vides. Sur ch01-clk0, aucune règle de pose ne le refuse.
 *
 * @returns une partie en échec, ou en run perdue si le groupe avait déjà le
 * maximum de bougies bonus
 */
export function lose(from: DiscussionGame = discussion()): ResolvedGame {
  let game: Game = placement(from);
  while (game.phase === "placement") {
    game = placeFirstInSection0(game);
  }
  if (game.phase !== "failed" && game.phase !== "runLost") {
    throw new Error(`Unexpected phase ${game.phase}`);
  }
  return game;
}

/**
 * Une réussite fabriquée à partir d'un échec : seules la phase et les
 * bougies bonus changent. Les décisions de l'hôte ne lisent rien d'autre ;
 * une vraie réussite est jouée par le test de la run complète.
 */
export function succeedAt(
  position: Game["position"],
  setup: GameSetup = SETUP,
): ResolvedGame {
  const failed = lose(discussion(setup));
  return {
    ...failed,
    position,
    phase: "succeeded",
    trial: { ...failed.trial, phase: "succeeded", bonusCandlesAfter: 0 },
  };
}
