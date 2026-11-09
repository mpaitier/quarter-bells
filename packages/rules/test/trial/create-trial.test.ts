import { describe, expect, it } from "vitest";
import { parseClock } from "../../src/clocks/parse-clock.js";
import { InvalidPlayerCountError, InvalidSeedError } from "../../src/errors.js";
import { createTrial, type TrialSetup } from "../../src/trial/create-trial.js";
import {
  CANDLES_PER_PLAYER,
  availableCandles,
  computeBaseCandles,
} from "../../src/trial/candles.js";
import { currentPlayer } from "../../src/trial/trial.js";
import exampleClock from "../fixtures/clocks/example-clock.json" with { type: "json" };
import playersChoiceClock from "../fixtures/clocks/players-choice-clock.json" with { type: "json" };

// example-clock est en mode fixed, section de départ 4.
const fixedClock = parseClock(exampleClock, "example-clock.json");
// players-choice-clock laisse les joueurs choisir la section de départ.
const choiceClock = parseClock(playersChoiceClock, "players-choice-clock.json");

// Configuration valide de base : chaque test d'échec la modifie sur un seul
// point, pour que l'échec n'ait qu'une cause possible.
const validSetup: TrialSetup = {
  clock: fixedClock,
  turnOrder: ["ana", "ben", "cleo"],
  startSection: 4,
  seed: 42,
  bonusCandles: 1,
  candleSettings: { maxBonusCandles: 3 },
};

describe("computeBaseCandles", () => {
  // Chaque ligne : joueurs, plafond de la salle, bougies de base attendues.
  it.each<[number, number | undefined, number]>([
    [2, undefined, 2 * CANDLES_PER_PLAYER],
    [4, undefined, 4 * CANDLES_PER_PLAYER],
    // Plafond en dessous du calcul : il l'emporte.
    [4, 2, 2],
    // Plafond au-dessus du calcul : sans effet.
    [3, 5, 3 * CANDLES_PER_PLAYER],
    // Plafond à 0 : aucune bougie de base, seules les bougies bonus restent.
    [3, 0, 0],
  ])(
    "gives %i players with cap %s %i base candles",
    (players, cap, expected) => {
      expect(computeBaseCandles(players, cap)).toBe(expected);
    },
  );
});

describe("createTrial", () => {
  it("is reproducible from the seed", () => {
    // Même graine, même distribution, identifiants compris.
    expect(createTrial(validSetup)).toEqual(createTrial(validSetup));
    // Autre graine : autres mains (le premier joueur suffit à le voir).
    const other = createTrial({ ...validSetup, seed: 43 });
    expect(other.seats[0]?.hand).not.toEqual(
      createTrial(validSetup).seats[0]?.hand,
    );
  });

  it("seats the players in turn order and deals 12 cards", () => {
    const trial = createTrial(validSetup);
    expect(trial.seats.map((seat) => seat.player)).toEqual([
      "ana",
      "ben",
      "cleo",
    ]);
    // À 3 joueurs : 4 cartes chacun, pas de réserve.
    expect(trial.seats.map((seat) => seat.hand.length)).toEqual([4, 4, 4]);
    expect(trial.seats.every((seat) => seat.reserve.length === 0)).toBe(true);
  });

  it("gives each player a hand and a reserve at 2 players", () => {
    const trial = createTrial({ ...validSetup, turnOrder: ["ana", "ben"] });
    expect(
      trial.seats.map((seat) => [seat.hand.length, seat.reserve.length]),
    ).toEqual([
      [4, 2],
      [4, 2],
    ]);
  });

  it("opens the placement phase on the first player's turn", () => {
    const trial = createTrial(validSetup);
    expect(trial.phase).toBe("placement");
    expect(trial.placements).toEqual([]);
    expect(currentPlayer(trial)).toBe("ana");
  });

  it("makes base and bonus candles available", () => {
    // 3 joueurs : 3 bougies de base, plus 1 bougie bonus.
    const trial = createTrial(validSetup);
    expect(trial.candles).toEqual({ base: 3, bonus: 1, spent: 0 });
    expect(availableCandles(trial.candles)).toBe(4);
  });

  it("applies the base candles cap of the room", () => {
    const trial = createTrial({
      ...validSetup,
      candleSettings: { maxBonusCandles: 3, baseCandlesCap: 1 },
    });
    expect(trial.candles.base).toBe(1);
  });

  it("accepts a start section chosen by the players", () => {
    // Mode chosenByPlayers : toute section est acceptée, pas seulement la
    // valeur par défaut (0 pour cette horloge).
    const trial = createTrial({
      ...validSetup,
      clock: choiceClock,
      startSection: 3,
    });
    expect(trial.startSection).toBe(3);
  });

  describe("invalid setups", () => {
    it.each([[["ana"]], [["a", "b", "c", "d", "e"]]])(
      "rejects a turn order of %j",
      (turnOrder) => {
        expect(() => createTrial({ ...validSetup, turnOrder })).toThrow(
          InvalidPlayerCountError,
        );
      },
    );

    it("rejects a player listed twice", () => {
      expect(() =>
        createTrial({ ...validSetup, turnOrder: ["ana", "ben", "ana"] }),
      ).toThrow(RangeError);
    });

    it("rejects an invalid seed", () => {
      expect(() => createTrial({ ...validSetup, seed: -1 })).toThrow(
        InvalidSeedError,
      );
    });

    it.each([-1, 6, 2.5])("rejects the start section %s", (startSection) => {
      expect(() =>
        createTrial({ ...validSetup, clock: choiceClock, startSection }),
      ).toThrow(RangeError);
    });

    it("rejects a start section that differs from a fixed clock", () => {
      // example-clock impose la section 4.
      expect(() => createTrial({ ...validSetup, startSection: 0 })).toThrow(
        /fixed start section/,
      );
    });

    // Chaque ligne : réglages et bougies bonus qui doivent être refusés.
    it.each<[string, Partial<TrialSetup>]>([
      ["more bonus candles than the maximum", { bonusCandles: 4 }],
      ["negative bonus candles", { bonusCandles: -1 }],
      ["a maximum above 3", { candleSettings: { maxBonusCandles: 4 } }],
      [
        "bonus candles above a reduced maximum",
        { bonusCandles: 2, candleSettings: { maxBonusCandles: 1 } },
      ],
      [
        "a negative cap",
        { candleSettings: { maxBonusCandles: 3, baseCandlesCap: -1 } },
      ],
      [
        "a fractional cap",
        { candleSettings: { maxBonusCandles: 3, baseCandlesCap: 1.5 } },
      ],
    ])("rejects %s", (_label, change) => {
      expect(() => createTrial({ ...validSetup, ...change })).toThrow(
        RangeError,
      );
    });
  });
});
