import {
  createGame,
  type ChapterCompletedGame,
  type CompletedGame,
} from "@quarter-bells/game";
import { listPlacementOptions } from "@quarter-bells/rules";
import { describe, expect, it } from "vitest";

import { projectPlayerView, type PlayerView } from "../src/index.js";
import { CHAPTER_1 } from "./support/chapters.js";
import { deepFreeze } from "./support/deep-freeze.js";
import {
  SETUP,
  TWO_PLAYER_SETUP,
  asPlacement,
  discussion,
  placement,
  play,
  playChoices,
  resolved,
} from "./support/games.js";

// Les exemples fixent la forme de la vue dans chaque phase. La garantie
// « aucune valeur cachée » est vérifiée sur des parties générées, dans
// player-view-properties.test.ts.

/** Les champs d'une vue sans rien de propre à sa phase, triés. */
const COMMON_KEYS = [
  "chapterNumber",
  "clock",
  "clockCount",
  "clockIndex",
  "host",
  "phase",
  "turnOrder",
  "viewer",
];

/** La vue dans la phase attendue, sinon le test échoue tout de suite. */
function viewIn<P extends PlayerView["phase"]>(
  view: PlayerView,
  phase: P,
): Extract<PlayerView, { phase: P }> {
  if (view.phase !== phase) {
    throw new Error(`Expected ${phase}, got ${view.phase}`);
  }
  return view as Extract<PlayerView, { phase: P }>;
}

describe("projectPlayerView", () => {
  describe("common fields", () => {
    it("describes the announced clock and its place in the chapter", () => {
      const game = deepFreeze(discussion());
      const view = projectPlayerView(game, "ben");

      expect(view).toMatchObject({
        viewer: "ben",
        turnOrder: ["ana", "ben", "cleo"],
        host: "ana",
        chapterNumber: 1,
        clockIndex: 0,
        clockCount: 4,
      });
      expect(view.clock).toBe(CHAPTER_1.clocks[0]);
    });

    it("refuses a viewer who does not play the game", () => {
      expect(() => projectPlayerView(discussion(), "zoe")).toThrow(RangeError);
    });
  });

  describe("before the deal", () => {
    it("gives the bonus candles during the announcement", () => {
      const game = deepFreeze(createGame(SETUP));
      const view = viewIn(projectPlayerView(game, "ana"), "announcing");
      expect(view.bonusCandles).toBe(0);
    });

    it("lists the players who are ready during the discussion", () => {
      const game = play(discussion(), {
        type: "setReady",
        player: "cleo",
        ready: true,
      });
      const view = viewIn(projectPlayerView(game, "ana"), "discussion");
      expect(view.readyPlayers).toEqual(["cleo"]);
      expect(view.bonusCandles).toBe(0);
    });
  });

  describe("during the placement", () => {
    it("shows the whole hand of the viewer", () => {
      const game = placement();
      const view = viewIn(projectPlayerView(game, "ben"), "placement");
      const seat = game.trial.seats.find(
        (candidate) => candidate.player === "ben",
      );

      expect(view.trial.ownSeat.player).toBe("ben");
      expect(view.trial.ownSeat.hand).toEqual(seat?.hand);
    });

    it("shows only the family of the cards of the other players", () => {
      const game = placement();
      const view = viewIn(projectPlayerView(game, "ben"), "placement");

      expect(view.trial.otherSeats.map((seat) => seat.player)).toEqual([
        "ana",
        "cleo",
      ]);
      for (const seat of view.trial.otherSeats) {
        const full = game.trial.seats.find(
          (candidate) => candidate.player === seat.player,
        );
        expect(seat.hand).toEqual(
          full?.hand.map((card) => ({ family: card.family })),
        );
      }
    });

    it("gives the player of the turn, the candles and the start section", () => {
      const game = placement();
      const view = viewIn(projectPlayerView(game, "cleo"), "placement");

      expect(view.trial).toMatchObject({
        currentPlayer: "ana",
        startSection: game.trial.startSection,
        candles: game.trial.candles,
        maxBonusCandles: game.trial.maxBonusCandles,
        placements: [],
      });
    });

    it("keeps the value of a face-down card for its author only", () => {
      const game = asPlacement(
        playChoices(placement(), [{ pick: 0, faceUp: false }]),
      );
      const placed = game.trial.placements[0];

      const forAuthor = viewIn(projectPlayerView(game, "ana"), "placement");
      const forOther = viewIn(projectPlayerView(game, "ben"), "placement");

      expect(forAuthor.trial.placements).toEqual([
        {
          sectionIndex: placed?.sectionIndex,
          player: "ana",
          faceUp: false,
          card: { family: placed?.card.family, value: placed?.card.value },
        },
      ]);
      expect(forOther.trial.placements).toEqual([
        {
          sectionIndex: placed?.sectionIndex,
          player: "ana",
          faceUp: false,
          card: { family: placed?.card.family },
        },
      ]);
    });

    it("shows the value of a face-up card to everyone", () => {
      const game = asPlacement(
        playChoices(placement(), [{ pick: 0, faceUp: true }]),
      );
      const placed = game.trial.placements[0];
      const view = viewIn(projectPlayerView(game, "cleo"), "placement");

      expect(view.trial.placements[0]).toEqual({
        sectionIndex: placed?.sectionIndex,
        player: "ana",
        faceUp: true,
        card: { family: placed?.card.family, value: placed?.card.value },
      });
    });

    it("shows the reserve of the viewer without its values", () => {
      const game = placement(TWO_PLAYER_SETUP);
      const seat = game.trial.seats.find(
        (candidate) => candidate.player === "ana",
      );
      const view = viewIn(projectPlayerView(game, "ana"), "placement");

      expect(seat?.reserve.length).toBeGreaterThan(0);
      expect(view.trial.ownSeat.reserve).toEqual(
        seat?.reserve.map((card) => ({ id: card.id, family: card.family })),
      );
    });

    it("shows only the families of the reserve of the other player", () => {
      const game = placement(TWO_PLAYER_SETUP);
      const seat = game.trial.seats.find(
        (candidate) => candidate.player === "ben",
      );
      const view = viewIn(projectPlayerView(game, "ana"), "placement");

      expect(view.trial.otherSeats[0]?.reserve).toEqual(
        seat?.reserve.map((card) => ({ family: card.family })),
      );
    });

    // Critère de l'issue #34 : l'écran guide le joueur en appelant le moteur
    // sur sa vue. Le résultat doit être celui que l'épreuve appliquera.
    it("lets the screen list the same options as the engine", () => {
      const game = asPlacement(
        playChoices(placement(), [
          { pick: 3, faceUp: false },
          { pick: 1, faceUp: false },
          { pick: 5, faceUp: true },
          { pick: 2, faceUp: false },
        ]),
      );
      const player = game.trial.seats[game.trial.placements.length % 3];
      const view = viewIn(
        projectPlayerView(game, player?.player ?? ""),
        "placement",
      );

      expect(
        listPlacementOptions(
          view.clock,
          view.trial.placements,
          view.trial.ownSeat.hand,
        ),
      ).toEqual(
        listPlacementOptions(
          game.trial.clock,
          game.trial.placements,
          player?.hand ?? [],
        ),
      );
    });
  });

  describe("after the resolution", () => {
    // Les trois issues se projettent de la même façon. La réussite et la run
    // perdue sont obtenues en changeant la phase d'une épreuve jouée : la
    // projection ne dépend pas du chemin pour y arriver.
    it.each(["succeeded", "failed", "runLost"] as const)(
      "gives the full resolution report after %s",
      (phase) => {
        const played = resolved();
        if (!("trial" in played) || played.phase === "placement") {
          throw new Error("The trial did not end");
        }
        const game = deepFreeze({
          ...played,
          phase,
          trial: { ...played.trial, phase },
        });
        const view = viewIn(projectPlayerView(game, "ben"), phase);

        expect(view.trial).toEqual({
          startSection: game.trial.startSection,
          candles: game.trial.candles,
          maxBonusCandles: game.trial.maxBonusCandles,
          resolution: game.trial.resolution,
          bonusCandlesAfter: game.trial.bonusCandlesAfter,
        });
      },
    );

    it("gives only the common fields once the host has stopped", () => {
      const game = resolved();
      const ended = play(game, { type: "stop", player: "ana" });

      const view = projectPlayerView(ended, "cleo");

      expect(view.phase).toBe("ended");
      expect(Object.keys(view).sort()).toEqual(COMMON_KEYS);
    });
  });

  // Ces phases demandent de réussir les quatre horloges : les parties sont
  // écrites à la main, la projection ne dépend pas du chemin pour y arriver.
  describe("at the end of a chapter", () => {
    const base = {
      setup: SETUP,
      position: { chapterIndex: 0, clockIndex: 3 },
      trialCount: 4,
    };

    it("lists the players ready for the next chapter", () => {
      const game: ChapterCompletedGame = deepFreeze({
        ...base,
        phase: "chapterCompleted",
        readyPlayers: ["ben"],
      });
      const view = viewIn(projectPlayerView(game, "ana"), "chapterCompleted");

      expect(view.readyPlayers).toEqual(["ben"]);
      expect(view.clockIndex).toBe(3);
    });

    it("gives only the common fields once the game is completed", () => {
      const game: CompletedGame = deepFreeze({ ...base, phase: "completed" });
      const view = projectPlayerView(game, "ana");

      expect(view.phase).toBe("completed");
      expect(Object.keys(view).sort()).toEqual(COMMON_KEYS);
    });
  });
});
