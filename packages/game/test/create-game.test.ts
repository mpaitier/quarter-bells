import {
  InvalidPlayerCountError,
  InvalidSeedError,
  MAX_SEED,
} from "@quarter-bells/rules";
import { describe, expect, it } from "vitest";

import { createGame } from "../src/create-game.js";
import { currentClock, type GameSetup } from "../src/game.js";
import { CHAPTER_1 } from "./support/chapters.js";

// Configuration valide de base. Chaque test d'échec n'en change qu'un champ,
// pour que l'erreur ne puisse venir que de ce champ.
const setup: GameSetup = {
  chapters: [CHAPTER_1],
  turnOrder: ["ana", "ben", "cleo"],
  host: "ana",
  seed: 42,
  candleSettings: { maxBonusCandles: 3 },
};

describe("createGame", () => {
  it("announces the first clock of the first chapter", () => {
    const game = createGame(setup);
    expect(game.phase).toBe("announcing");
    expect(game.position).toEqual({ chapterIndex: 0, clockIndex: 0 });
    expect(currentClock(game).uid).toBe(CHAPTER_1.clocks[0]?.uid);
  });

  it("starts without bonus candles nor trial", () => {
    const game = createGame(setup);
    expect(game.bonusCandles).toBe(0);
    expect(game.trialCount).toBe(0);
  });

  it("keeps the setup as received", () => {
    // Même référence : rien n'est copié, l'état partage la configuration.
    expect(createGame(setup).setup).toBe(setup);
  });

  describe("invalid setups", () => {
    // Chaque ligne : ce qui change dans la configuration, et l'erreur
    // attendue. RangeError pour une valeur incohérente, les erreurs dédiées
    // de rules quand elles existent (le serveur sait les reconnaître).
    it.each<[string, Partial<GameSetup>, new (...args: never[]) => Error]>([
      ["no chapter", { chapters: [] }, RangeError],
      [
        "a chapter without clock",
        { chapters: [CHAPTER_1, { number: 2, clocks: [] }] },
        RangeError,
      ],
      ["a single player", { turnOrder: ["ana"] }, InvalidPlayerCountError],
      [
        "five players",
        { turnOrder: ["ana", "ben", "cleo", "dan", "eve"] },
        InvalidPlayerCountError,
      ],
      [
        "a player listed twice",
        { turnOrder: ["ana", "ben", "ana"] },
        RangeError,
      ],
      ["a host who does not play", { host: "zoe" }, RangeError],
      ["a negative seed", { seed: -1 }, InvalidSeedError],
      ["a fractional seed", { seed: 1.5 }, InvalidSeedError],
      ["a seed above 32 bits", { seed: MAX_SEED + 1 }, InvalidSeedError],
      [
        "too many bonus candles",
        { candleSettings: { maxBonusCandles: 4 } },
        RangeError,
      ],
    ])("rejects %s", (_label, change, error) => {
      expect(() => createGame({ ...setup, ...change })).toThrow(error);
    });
  });
});

describe("currentClock", () => {
  it("follows the position", () => {
    const game = {
      ...createGame(setup),
      position: { chapterIndex: 0, clockIndex: 3 },
    };
    expect(currentClock(game).uid).toBe(CHAPTER_1.clocks[3]?.uid);
  });

  // createGame et les actions ne produisent que des positions valides : ce
  // cas ne peut venir que d'une erreur de programmation.
  it.each([
    { chapterIndex: 0, clockIndex: 4 },
    { chapterIndex: 1, clockIndex: 0 },
  ])("rejects the position %j", (position) => {
    const game = { ...createGame(setup), position };
    expect(() => currentClock(game)).toThrow(RangeError);
  });
});
