// Critère de l'issue #33 : une run complète du chapitre 1 se joue à partir
// d'une graine. Le test passe uniquement par l'API publique, comme le feront
// le serveur et l'adaptateur local : créer la partie, puis envoyer des
// actions. Il vérifie l'enchaînement complet : annonce, Discussion,
// distribution, poses, Résolution, décision de l'hôte, horloge suivante,
// fin du jeu.

import { currentPlayer } from "@quarter-bells/rules";
import { describe, expect, it } from "vitest";

import {
  applyGameAction,
  createGame,
  currentClock,
  type Game,
  type GameAction,
  type PlacementGame,
  type ResolvedGame,
} from "../src/index.js";
import { CHAPTER_1_RUN, type RunStep } from "./runs/chapter-01.js";
import { CHAPTER_1 } from "./support/chapters.js";

const { seed, turnOrder, trials } = CHAPTER_1_RUN;
const host = turnOrder[0] ?? "";

/** Applique une action qui doit être acceptée. */
function play(game: Game, action: GameAction): Game {
  const result = applyGameAction(game, action);
  if (!result.accepted) {
    throw new Error(
      `${action.type} rejected: ${JSON.stringify(result.rejection)}`,
    );
  }
  return result.game;
}

/**
 * Le joueur du tour pose la carte de l'étape. Si elle n'est pas dans sa
 * main, c'est la fixture qui ne correspond plus à la distribution.
 */
function placeStep(game: PlacementGame, step: RunStep, rank: number): Game {
  const player = currentPlayer(game.trial);
  const card = game.trial.seats
    .find((seat) => seat.player === player)
    ?.hand.find(
      ({ family, value }) => family === step.family && value === step.value,
    );
  if (player === undefined || card === undefined) {
    throw new Error(
      `Step ${String(rank)}: ${String(player)} does not hold ${step.family} ${String(step.value)}; the fixture no longer matches the deal`,
    );
  }
  return play(game, {
    type: "placeCard",
    player,
    cardId: card.id,
    sectionIndex: step.section,
    faceUp: false,
  });
}

/**
 * La partie, qui doit être résolue. Passer par une fonction rend à
 * TypeScript le type complet de la partie, qu'il avait restreint à la Pose
 * dans la boucle des poses.
 */
function expectResolved(game: Game, label: string): ResolvedGame {
  if (
    game.phase !== "succeeded" &&
    game.phase !== "failed" &&
    game.phase !== "runLost"
  ) {
    throw new Error(`${label}: not resolved (${game.phase})`);
  }
  return game;
}

describe("a full run of chapter 1", () => {
  it("is played from a single seed, through the public API", () => {
    let game: Game = createGame({
      chapters: [CHAPTER_1],
      turnOrder,
      host,
      seed,
      candleSettings: { maxBonusCandles: 3 },
    });

    trials.forEach((trial, index) => {
      const label = `trial ${String(index)} (${trial.clock})`;

      // Annonce : la bonne horloge, et les bougies bonus héritées de
      // l'épreuve précédente.
      expect(game.phase, label).toBe("announcing");
      expect(currentClock(game).uid, label).toBe(trial.clock);
      expect(game.phase === "announcing" && game.bonusCandles, label).toBe(
        trial.bonusCandles,
      );

      // Discussion, puis tous prêts : la distribution suit.
      game = play(game, { type: "endAnnouncement", player: host });
      for (const player of turnOrder) {
        game = play(game, { type: "setReady", player, ready: true });
      }
      if (game.phase !== "placement") {
        throw new Error(`${label}: not dealt`);
      }
      expect(game.trial.candles.bonus, label).toBe(trial.bonusCandles);

      // Les poses, chacune par le joueur du tour.
      trial.steps.forEach((step, rank) => {
        if (game.phase !== "placement") {
          throw new Error(`${label}: resolved before step ${String(rank)}`);
        }
        game = placeStep(game, step, rank);
      });

      // Résolution, puis décision de l'hôte.
      const resolved = expectResolved(game, label);
      if (trial.expected.phase === "succeeded") {
        // Les violations plutôt que la seule phase : si la fixture ne gagne
        // plus, Vitest montre la règle et la section fautives.
        expect(resolved.trial.resolution.violations, label).toEqual([]);
      }
      expect(
        {
          phase: resolved.phase,
          bonusCandlesAfter: resolved.trial.bonusCandlesAfter,
        },
        label,
      ).toEqual(trial.expected);
      game = play(game, { type: trial.decision, player: host });
    });

    // Dernière horloge du dernier chapitre réussie : fin du jeu.
    expect(game.phase).toBe("completed");
    // Une épreuve par tentative : l'échec et sa reprise comptent deux fois.
    expect(game.trialCount).toBe(trials.length);
  });
});
