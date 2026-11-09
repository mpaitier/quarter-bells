import { MAX_SEED } from "@quarter-bells/rules";
import { describe, expect, it } from "vitest";

import { deriveTrialSeed } from "../src/trial-seed.js";

describe("deriveTrialSeed", () => {
  it("always derives the same seed for the same game and rank", () => {
    expect(deriveTrialSeed(42, 3)).toBe(deriveTrialSeed(42, 3));
  });

  // Une nouvelle tentative de la même horloge a un autre rang : elle doit
  // distribuer d'autres mains, sinon retenter deviendrait trop facile.
  it("derives a different seed for each rank", () => {
    const seeds = Array.from({ length: 50 }, (_, rank) =>
      deriveTrialSeed(42, rank),
    );
    expect(new Set(seeds).size).toBe(seeds.length);
  });

  it("derives different seeds for different games", () => {
    expect(deriveTrialSeed(1, 0)).not.toBe(deriveTrialSeed(2, 0));
  });

  // Bornes de la graine de partie : la graine dérivée doit rester acceptée
  // par createSeededRng, donc un entier entre 0 et MAX_SEED.
  it.each([0, MAX_SEED])("stays a valid seed for the game seed %i", (seed) => {
    for (let rank = 0; rank < 20; rank += 1) {
      const derived = deriveTrialSeed(seed, rank);
      expect(Number.isInteger(derived)).toBe(true);
      expect(derived).toBeGreaterThanOrEqual(0);
      expect(derived).toBeLessThanOrEqual(MAX_SEED);
    }
  });
});
