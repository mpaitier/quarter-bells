import { toCardId } from "@quarter-bells/rules";
import { describe, expect, it } from "vitest";

import { applyGameAction, type GameAction } from "../src/apply-game-action.js";
import { createGame } from "../src/create-game.js";
import type { Game } from "../src/game.js";
import { CHAPTER_1 } from "./support/chapters.js";
import {
  CHAPTER_2,
  SETUP as setup,
  discussion,
  lose,
  placeFirstInSection0,
  placement,
  play,
  succeedAt,
} from "./support/games.js";

describe("applyGameAction", () => {
  it("rejects a player who is not in the game, whatever the action", () => {
    const result = applyGameAction(createGame(setup), {
      type: "endAnnouncement",
      player: "zoe",
    });
    expect(result).toEqual({
      accepted: false,
      rejection: { reason: "unknownPlayer" },
    });
  });

  // Chaque ligne : une action envoyée dans une phase où elle n'a pas de sens.
  it.each<[string, () => Game, GameAction]>([
    [
      "a ready status during the announcement",
      () => createGame(setup),
      { type: "setReady", player: "ana", ready: true },
    ],
    [
      "a placement during the discussion",
      discussion,
      {
        type: "placeCard",
        player: "ana",
        cardId: toCardId("any"),
        sectionIndex: 0,
        faceUp: false,
      },
    ],
    [
      "the end of the announcement during the placement",
      () => placement(),
      { type: "endAnnouncement", player: "ana" },
    ],
  ])("rejects %s", (_label, game, action) => {
    expect(applyGameAction(game(), action)).toEqual({
      accepted: false,
      rejection: { reason: "wrongPhase" },
    });
  });
});

describe("announcement", () => {
  it("opens the discussion when the host ends it", () => {
    const game = discussion();
    expect(game.readyPlayers).toEqual([]);
    expect(game.bonusCandles).toBe(0);
    expect(game.position).toEqual({ chapterIndex: 0, clockIndex: 0 });
  });

  it("can only be ended by the host", () => {
    const result = applyGameAction(createGame(setup), {
      type: "endAnnouncement",
      player: "ben",
    });
    expect(result).toEqual({
      accepted: false,
      rejection: { reason: "notHost" },
    });
  });
});

describe("discussion", () => {
  it("records the players who are ready", () => {
    const game = play(discussion(), {
      type: "setReady",
      player: "ben",
      ready: true,
    });
    expect(game.phase).toBe("discussion");
    expect(game.phase === "discussion" && game.readyPlayers).toEqual(["ben"]);
  });

  it("lets a player take back their ready status", () => {
    const ready = play(discussion(), {
      type: "setReady",
      player: "ben",
      ready: true,
    });
    const back = play(ready, { type: "setReady", player: "ben", ready: false });
    expect(back.phase === "discussion" && back.readyPlayers).toEqual([]);
  });

  // Un double clic sur « Prêt » ne doit pas compter deux fois le joueur, et
  // donc ne pas lancer la distribution avant que les autres soient prêts.
  it.each([true, false])(
    "ignores a ready status of %s that changes nothing",
    (ready) => {
      const start = ready
        ? play(discussion(), { type: "setReady", player: "ben", ready: true })
        : discussion();
      const game = play(start, { type: "setReady", player: "ben", ready });
      expect(game).toEqual(start);
    },
  );
});

describe("dealing", () => {
  it("deals the current clock once every player is ready", () => {
    const game = placement();
    expect(game.trial.clock).toBe(CHAPTER_1.clocks[0]);
    expect(game.trial.startSection).toBe(
      CHAPTER_1.clocks[0]?.defaultStartSection,
    );
    // 3 joueurs : 4 cartes chacun.
    expect(game.trial.seats.map((seat) => seat.hand.length)).toEqual([4, 4, 4]);
    expect(game.trialCount).toBe(1);
  });

  it("drops the discussion fields once the trial starts", () => {
    const game = placement();
    expect(game).not.toHaveProperty("readyPlayers");
    expect(game).not.toHaveProperty("bonusCandles");
  });

  it("passes the bonus candles of the group to the trial", () => {
    const game = placement({ ...discussion(), bonusCandles: 2 });
    expect(game.trial.candles.bonus).toBe(2);
  });

  it("deals the same hands for the same game", () => {
    expect(placement().trial.seats).toEqual(placement().trial.seats);
  });

  // La graine de l'épreuve dépend de son rang dans la partie : une
  // nouvelle tentative reçoit d'autres mains.
  it("deals other hands for a later trial of the same clock", () => {
    const later = placement({ ...discussion(), trialCount: 1 });
    expect(later.trial.seats).not.toEqual(placement().trial.seats);
  });
});

describe("placement", () => {
  it("passes an accepted placement to the trial", () => {
    const game = placeFirstInSection0(placement());
    expect(game.phase).toBe("placement");
    expect(game.phase === "placement" && game.trial.placements).toHaveLength(1);
  });

  it("forwards the rejection of the trial", () => {
    // C'est à ana de jouer : le refus vient du reducer de l'épreuve.
    const result = applyGameAction(placement(), {
      type: "placeCard",
      player: "ben",
      cardId: toCardId("any"),
      sectionIndex: 0,
      faceUp: false,
    });
    expect(result).toEqual({
      accepted: false,
      rejection: { reason: "notYourTurn", currentPlayer: "ana" },
    });
  });

  it("takes the phase of the trial when the last card resolves it", () => {
    // Les 12 cartes en section 0 : les autres sections restent vides, la
    // pose échoue. Aucune bougie bonus sur 3 : le groupe en gagne une.
    const game = lose();
    expect(game.phase).toBe("failed");
    expect(game.trial.bonusCandlesAfter).toBe(1);
  });
});

describe("end of a chapter", () => {
  /** Fin du chapitre 1 d'une partie qui en compte deux. */
  function chapterCompleted(): Game {
    const twoChapters = { ...setup, chapters: [CHAPTER_1, CHAPTER_2] };
    return play(succeedAt({ chapterIndex: 0, clockIndex: 3 }, twoChapters), {
      type: "continue",
      player: "ana",
    });
  }

  it("waits until every player is ready", () => {
    const game = play(chapterCompleted(), {
      type: "setReady",
      player: "ben",
      ready: true,
    });
    expect(game.phase).toBe("chapterCompleted");
    expect(game.phase === "chapterCompleted" && game.readyPlayers).toEqual([
      "ben",
    ]);
  });

  it("announces the first clock of the next chapter once all are ready", () => {
    let game = chapterCompleted();
    for (const player of setup.turnOrder) {
      game = play(game, { type: "setReady", player, ready: true });
    }
    expect(game).toMatchObject({
      phase: "announcing",
      position: { chapterIndex: 1, clockIndex: 0 },
      bonusCandles: 0,
    });
  });
});
