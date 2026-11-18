import {
  currentClock,
  type Game,
  type PlacementGame,
} from "@quarter-bells/game";
import {
  currentPlayer,
  type Card,
  type PlayerId,
  type Seat,
  type TrialPlacement,
} from "@quarter-bells/rules";

import type {
  CardBack,
  OtherSeat,
  OwnSeat,
  PlacedCard,
  PlacingTrialView,
  PlayerView,
} from "./player-view.js";
import { requireDefined } from "./require-defined.js";

/**
 * Construit la vue d'un joueur à partir de l'état complet d'une partie
 * (ADR 0017). Le serveur l'appellera pour chaque joueur après chaque action,
 * l'adaptateur local du J2 aussi.
 *
 * Chaque objet de la vue est construit champ par champ, jamais recopié de
 * l'état : une carte de l'état porte sa valeur, et un `...card` oublié
 * suffirait à la faire fuiter. Le test de propriétés vérifie qu'aucune valeur
 * cachée n'influence la vue.
 *
 * Ne modifie jamais la partie reçue.
 *
 * @throws {RangeError} si le joueur ne fait pas partie de la partie : c'est
 * une erreur de l'appelant, qui ne doit projeter que pour ses joueurs
 */
export function projectPlayerView(game: Game, viewer: PlayerId): PlayerView {
  const { setup, position } = game;
  if (!setup.turnOrder.includes(viewer)) {
    throw new RangeError(`${viewer} is not a player of this game`);
  }

  const clock = currentClock(game);
  const common = {
    viewer,
    turnOrder: setup.turnOrder,
    host: setup.host,
    chapterNumber: clock.chapter,
    clockIndex: position.clockIndex,
    clockCount: clockCountOf(game),
    clock,
  };

  switch (game.phase) {
    case "announcing":
      return { ...common, phase: game.phase, bonusCandles: game.bonusCandles };
    case "discussion":
      return {
        ...common,
        phase: game.phase,
        bonusCandles: game.bonusCandles,
        readyPlayers: game.readyPlayers,
      };
    case "placement":
      return {
        ...common,
        phase: game.phase,
        trial: projectPlacingTrial(game, viewer),
      };
    case "succeeded":
    case "failed":
    case "runLost": {
      // Tout est révélé à la Résolution : le rapport est public tel quel.
      const { trial } = game;
      return {
        ...common,
        phase: game.phase,
        trial: {
          startSection: trial.startSection,
          candles: trial.candles,
          maxBonusCandles: trial.maxBonusCandles,
          resolution: trial.resolution,
          bonusCandlesAfter: trial.bonusCandlesAfter,
        },
      };
    }
    case "chapterCompleted":
      return { ...common, phase: game.phase, readyPlayers: game.readyPlayers };
    case "completed":
    case "ended":
      return { ...common, phase: game.phase };
  }
}

/**
 * Nombre d'horloges du chapitre en cours. currentClock a déjà vérifié que la
 * position existe : le chapitre est forcément là.
 */
function clockCountOf(game: Game): number {
  const { chapterIndex } = game.position;
  return requireDefined(
    game.setup.chapters[chapterIndex],
    `chapter at index ${String(chapterIndex)}`,
  ).clocks.length;
}

function projectPlacingTrial(
  game: PlacementGame,
  viewer: PlayerId,
): PlacingTrialView {
  const { trial } = game;
  // L'épreuve est en Pose : il y a toujours un joueur dont c'est le tour.
  const player = requireDefined(currentPlayer(trial), "player of the turn");
  // createTrial donne un siège à chaque joueur de l'ordre de passage.
  const ownSeat = requireDefined(
    trial.seats.find((seat) => seat.player === viewer),
    `seat of ${viewer}`,
  );

  return {
    startSection: trial.startSection,
    placements: trial.placements.map((placement) =>
      projectPlacement(placement, viewer),
    ),
    candles: trial.candles,
    maxBonusCandles: trial.maxBonusCandles,
    currentPlayer: player,
    ownSeat: projectOwnSeat(ownSeat),
    otherSeats: trial.seats
      .filter((seat) => seat.player !== viewer)
      .map(projectOtherSeat),
  };
}

/**
 * Une carte posée : sa valeur n'apparaît que si elle est face visible ou si
 * le joueur l'a posée lui-même.
 */
function projectPlacement(
  placement: TrialPlacement,
  viewer: PlayerId,
): PlacedCard {
  const { sectionIndex, player, faceUp, card } = placement;
  if (faceUp || player === viewer) {
    return {
      sectionIndex,
      player,
      faceUp,
      card: { family: card.family, value: card.value },
    };
  }
  return { sectionIndex, player, faceUp: false, card: backOf(card) };
}

/**
 * Le siège du joueur : sa main en entier. Sa réserve n'est pas encore
 * jouable, il n'en connaît que les familles (protocol.md, CardsDealt).
 */
function projectOwnSeat(seat: Seat): OwnSeat {
  return {
    player: seat.player,
    hand: seat.hand.map((card): Card => ({
      id: card.id,
      family: card.family,
      value: card.value,
    })),
    reserve: seat.reserve.map((card) => ({ id: card.id, family: card.family })),
  };
}

/** Le siège d'un autre joueur : le dos de ses cartes, sans identifiant. */
function projectOtherSeat(seat: Seat): OtherSeat {
  return {
    player: seat.player,
    hand: seat.hand.map(backOf),
    reserve: seat.reserve.map(backOf),
  };
}

function backOf(card: Pick<Card, "family">): CardBack {
  return { family: card.family };
}
