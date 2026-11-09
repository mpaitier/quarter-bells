import { describe, expect, it } from "vitest";

import { applyGameAction } from "../src/apply-game-action.js";
import type { Game } from "../src/game.js";
import type { HostDecision } from "../src/host-decisions.js";
import { CHAPTER_1 } from "./support/chapters.js";
import {
  CHAPTER_2,
  SETUP,
  discussion,
  lose,
  placement,
  play,
  succeedAt,
} from "./support/games.js";

/** Une décision de ce type, envoyée par l'hôte. */
function byHost(type: HostDecision["type"]): HostDecision {
  return { type, player: "ana" };
}

/** Échec avec le maximum de bougies bonus déjà atteint : la run est perdue. */
function runLost(): Game {
  return lose({ ...discussion(), bonusCandles: 3 });
}

describe("host decisions", () => {
  it.each<HostDecision["type"]>([
    "continue",
    "retry",
    "restartChapter",
    "stop",
  ])("rejects %s from another player than the host", (type) => {
    expect(applyGameAction(lose(), { type, player: "ben" })).toEqual({
      accepted: false,
      rejection: { reason: "notHost" },
    });
  });

  // Chaque ligne : une décision prise dans une phase qui ne la propose pas.
  it.each<[string, () => Game, HostDecision["type"]]>([
    ["continue after a failure", lose, "continue"],
    [
      "retry after a success",
      () => succeedAt({ chapterIndex: 0, clockIndex: 0 }),
      "retry",
    ],
    ["restart the chapter after a simple failure", lose, "restartChapter"],
    ["stop during the placement", () => placement(), "stop"],
    ["stop during the discussion", discussion, "stop"],
  ])("rejects: %s", (_label, game, type) => {
    expect(applyGameAction(game(), byHost(type))).toEqual({
      accepted: false,
      rejection: { reason: "wrongPhase" },
    });
  });
});

describe("continue", () => {
  it("announces the next clock of the chapter", () => {
    const game = play(
      succeedAt({ chapterIndex: 0, clockIndex: 1 }),
      byHost("continue"),
    );
    expect(game).toMatchObject({
      phase: "announcing",
      position: { chapterIndex: 0, clockIndex: 2 },
      bonusCandles: 0,
    });
    // L'épreuve terminée ne suit pas dans l'annonce.
    expect(game).not.toHaveProperty("trial");
  });

  it("completes the chapter after its last clock when another one follows", () => {
    const setup = { ...SETUP, chapters: [CHAPTER_1, CHAPTER_2] };
    const game = play(
      succeedAt({ chapterIndex: 0, clockIndex: 3 }, setup),
      byHost("continue"),
    );
    expect(game).toMatchObject({ phase: "chapterCompleted", readyPlayers: [] });
  });

  // Choix de l'issue #33 : sans chapitre suivant, pas d'écran de fin de
  // chapitre qui annoncerait un chapitre inexistant.
  it("completes the game after the last clock of the last chapter", () => {
    const game = play(
      succeedAt({ chapterIndex: 0, clockIndex: 3 }),
      byHost("continue"),
    );
    expect(game.phase).toBe("completed");
  });
});

describe("retry", () => {
  it("announces the same clock again and keeps the bonus candles after a failure", () => {
    const game = play(lose(), byHost("retry"));
    expect(game).toMatchObject({
      phase: "announcing",
      position: { chapterIndex: 0, clockIndex: 0 },
      bonusCandles: 1,
    });
  });

  it("resets the bonus candles after a lost run", () => {
    const game = play(runLost(), byHost("retry"));
    expect(game).toMatchObject({ phase: "announcing", bonusCandles: 0 });
  });

  it("deals other hands to the new attempt", () => {
    const first = placement();
    const retried = play(lose(), byHost("retry"));
    let again = play(retried, { type: "endAnnouncement", player: "ana" });
    for (const player of SETUP.turnOrder) {
      again = play(again, { type: "setReady", player, ready: true });
    }
    expect(again.phase === "placement" && again.trial.seats).not.toEqual(
      first.trial.seats,
    );
  });
});

describe("restartChapter", () => {
  it("announces the first clock of the chapter without bonus candles after a lost run", () => {
    const lost = { ...runLost(), position: { chapterIndex: 0, clockIndex: 2 } };
    const game = play(lost, byHost("restartChapter"));
    expect(game).toMatchObject({
      phase: "announcing",
      position: { chapterIndex: 0, clockIndex: 0 },
      bonusCandles: 0,
    });
  });
});

describe("stop", () => {
  it.each<[string, () => Game]>([
    ["a success", () => succeedAt({ chapterIndex: 0, clockIndex: 0 })],
    ["a failure", lose],
    ["a lost run", runLost],
  ])("ends the game after %s", (_label, game) => {
    expect(play(game(), byHost("stop")).phase).toBe("ended");
  });

  it("ends the game at the end of a chapter", () => {
    const setup = { ...SETUP, chapters: [CHAPTER_1, CHAPTER_2] };
    const completed = play(
      succeedAt({ chapterIndex: 0, clockIndex: 3 }, setup),
      byHost("continue"),
    );
    expect(play(completed, byHost("stop")).phase).toBe("ended");
  });
});
