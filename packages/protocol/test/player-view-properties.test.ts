// Propriétés de la vue d'un joueur (issue #34, NF-SEC-01), sur des parties
// générées : 2 à 4 joueurs, n'importe quelle horloge du chapitre 1, graine au
// hasard, et un nombre quelconque de poses choisies parmi celles que le
// moteur accepte, face visible ou cachée.
//
// La propriété principale ne cherche pas les valeurs dans la vue : une valeur
// de 1 à 12 se retrouve partout (sections, bougies, rangs), la chercher ne
// prouverait rien. Elle vérifie à la place que la vue ne dépend pas des
// valeurs cachées : en les changeant toutes dans l'état complet, la vue reste
// identique. Une vue qui laisserait passer une valeur cachée, même déguisée
// ou recalculée, changerait avec elle.

import type { Game, GameSetup } from "@quarter-bells/game";
import {
  CARD_VALUES,
  MAX_SEED,
  type Card,
  type CardValue,
  type PlayerId,
  type Seat,
  type TrialPlacement,
} from "@quarter-bells/rules";
import { fc, it } from "@fast-check/vitest";
import { describe, expect } from "vitest";

import { projectPlayerView } from "../src/index.js";
import { CHAPTER_1 } from "./support/chapters.js";
import {
  placement,
  playChoices,
  type PlacementChoice,
} from "./support/games.js";

const PLAYERS = ["ana", "ben", "cleo", "dan"] as const;

/** Une partie générée, et le joueur qui la regarde. */
interface Scenario {
  readonly game: Game;
  readonly viewer: PlayerId;
}

const choiceArb: fc.Arbitrary<PlacementChoice> = fc.record({
  pick: fc.nat({ max: 100 }),
  faceUp: fc.boolean(),
});

/**
 * Une partie en Pose ou résolue : l'épreuve s'arrête après un nombre de poses
 * tiré au hasard, jusqu'à la Résolution comprise (12 poses).
 */
const scenarioArb: fc.Arbitrary<Scenario> = fc
  .record({
    playerCount: fc.integer({ min: 2, max: 4 }),
    clockIndex: fc.integer({ min: 0, max: CHAPTER_1.clocks.length - 1 }),
    seed: fc.integer({ min: 0, max: MAX_SEED }),
    choices: fc.array(choiceArb, { maxLength: 12 }),
    viewerIndex: fc.nat(),
  })
  .map(({ playerCount, clockIndex, seed, choices, viewerIndex }) => {
    const turnOrder = PLAYERS.slice(0, playerCount);
    const clock = CHAPTER_1.clocks[clockIndex];
    const setup: GameSetup = {
      chapters: [{ number: 1, clocks: clock === undefined ? [] : [clock] }],
      turnOrder,
      host: "ana",
      seed,
      candleSettings: { maxBonusCandles: 3 },
    };
    return {
      game: playChoices(placement(setup), choices),
      viewer: turnOrder[viewerIndex % playerCount] ?? "ana",
    };
  });

/** Une autre valeur que celle de la carte, toujours entre 1 et 12. */
function otherValue(value: CardValue): CardValue {
  return CARD_VALUES[value % CARD_VALUES.length] ?? 1;
}

function withOtherValue<C extends Pick<Card, "value">>(card: C): C {
  return { ...card, value: otherValue(card.value) };
}

/**
 * La même partie, où chaque carte que le joueur n'a pas le droit de connaître
 * a changé de valeur : main et réserve des autres, sa propre réserve, et les
 * cartes posées face cachée par les autres. Hors de la Pose, il n'y a aucune
 * carte cachée : la partie est rendue telle quelle.
 */
function withHiddenValuesChanged(game: Game, viewer: PlayerId): Game {
  if (game.phase !== "placement") {
    return game;
  }
  const seats = game.trial.seats.map((seat): Seat =>
    seat.player === viewer
      ? { ...seat, reserve: seat.reserve.map(withOtherValue) }
      : {
          ...seat,
          hand: seat.hand.map(withOtherValue),
          reserve: seat.reserve.map(withOtherValue),
        },
  );
  const placements = game.trial.placements.map((placed): TrialPlacement =>
    placed.faceUp || placed.player === viewer
      ? placed
      : { ...placed, card: withOtherValue(placed.card) },
  );
  return { ...game, trial: { ...game.trial, seats, placements } };
}

describe("player view properties", () => {
  it.prop([scenarioArb])(
    "does not depend on any value hidden from the viewer",
    ({ game, viewer }) => {
      expect(
        projectPlayerView(withHiddenValuesChanged(game, viewer), viewer),
      ).toEqual(projectPlayerView(game, viewer));
    },
  );

  // Garde-fou de la propriété précédente : elle ne vaut que si la vue change
  // quand une valeur connue du joueur change. Sinon, une vue vide la
  // vérifierait aussi.
  it.prop([scenarioArb])(
    "changes when a card the viewer knows changes",
    ({ game, viewer }) => {
      if (game.phase !== "placement") {
        return;
      }
      const seat = game.trial.seats.find((s) => s.player === viewer);
      if (seat === undefined || seat.hand.length === 0) {
        return;
      }
      const changed: Game = {
        ...game,
        trial: {
          ...game.trial,
          seats: game.trial.seats.map((s) =>
            s.player === viewer
              ? { ...s, hand: s.hand.map(withOtherValue) }
              : s,
          ),
        },
      };
      expect(projectPlayerView(changed, viewer)).not.toEqual(
        projectPlayerView(game, viewer),
      );
    },
  );

  // La vue passera sur le réseau au J3 : elle ne doit rien contenir que JSON
  // perde en route (undefined, Set, Map, fonction, classe).
  it.prop([scenarioArb])("survives a trip through JSON", ({ game, viewer }) => {
    const view = projectPlayerView(game, viewer);
    expect(JSON.parse(JSON.stringify(view))).toStrictEqual(view);
  });
});
