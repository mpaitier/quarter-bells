import { describe, expect, it } from "vitest";
import { parseClock } from "../../src/clocks/parse-clock.js";
import { InvalidPlayerCountError, InvalidSeedError } from "../../src/errors.js";
import { createTrial, type TrialSetup } from "../../src/trial/create-trial.js";
import {
  EYES_PER_PLAYER,
  availableEyes,
  computeBaseEyes,
} from "../../src/trial/eyes.js";
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
  bonusEyes: 1,
  eyeSettings: { maxBonusEyes: 3 },
};

describe("computeBaseEyes", () => {
  // Chaque ligne : joueurs, plafond de la salle, yeux de base attendus.
  it.each<[number, number | undefined, number]>([
    [2, undefined, 2 * EYES_PER_PLAYER],
    [4, undefined, 4 * EYES_PER_PLAYER],
    // Plafond en dessous du calcul : il l'emporte.
    [4, 2, 2],
    // Plafond au-dessus du calcul : sans effet.
    [3, 5, 3 * EYES_PER_PLAYER],
    // Plafond à 0 : aucun œil de base, seuls les yeux bonus restent.
    [3, 0, 0],
  ])("gives %i players with cap %s %i base eyes", (players, cap, expected) => {
    expect(computeBaseEyes(players, cap)).toBe(expected);
  });
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

  it("makes base and bonus eyes available", () => {
    // 3 joueurs : 3 yeux de base, plus 1 œil bonus.
    const trial = createTrial(validSetup);
    expect(trial.eyes).toEqual({ base: 3, bonus: 1, spent: 0 });
    expect(availableEyes(trial.eyes)).toBe(4);
  });

  it("applies the base eyes cap of the room", () => {
    const trial = createTrial({
      ...validSetup,
      eyeSettings: { maxBonusEyes: 3, baseEyesCap: 1 },
    });
    expect(trial.eyes.base).toBe(1);
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

    // Chaque ligne : réglages et yeux bonus qui doivent être refusés.
    it.each<[string, Partial<TrialSetup>]>([
      ["more bonus eyes than the maximum", { bonusEyes: 4 }],
      ["negative bonus eyes", { bonusEyes: -1 }],
      ["a maximum above 3", { eyeSettings: { maxBonusEyes: 4 } }],
      [
        "bonus eyes above a reduced maximum",
        { bonusEyes: 2, eyeSettings: { maxBonusEyes: 1 } },
      ],
      ["a negative cap", { eyeSettings: { maxBonusEyes: 3, baseEyesCap: -1 } }],
      [
        "a fractional cap",
        { eyeSettings: { maxBonusEyes: 3, baseEyesCap: 1.5 } },
      ],
    ])("rejects %s", (_label, change) => {
      expect(() => createTrial({ ...validSetup, ...change })).toThrow(
        RangeError,
      );
    });
  });
});
