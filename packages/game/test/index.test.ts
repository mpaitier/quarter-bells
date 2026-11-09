import { describe, expect, it } from "vitest";

import * as game from "../src/index.js";
import { CHAPTER_1 } from "./support/chapters.js";

describe("public API", () => {
  // Parcours tel que le serveur ou l'adaptateur local le feront : créer la
  // partie, puis lire l'horloge annoncée, à travers le point d'entrée.
  it("creates a game through the package entry point", () => {
    const created = game.createGame({
      chapters: [CHAPTER_1],
      turnOrder: ["ana", "ben"],
      host: "ana",
      seed: 7,
      candleSettings: { maxBonusCandles: 3 },
    });
    expect(game.currentClock(created).uid).toBe(CHAPTER_1.clocks[0]?.uid);
  });

  it("applies an action through the package entry point", () => {
    const created = game.createGame({
      chapters: [CHAPTER_1],
      turnOrder: ["ana", "ben"],
      host: "ana",
      seed: 7,
      candleSettings: { maxBonusCandles: 3 },
    });
    const result = game.applyGameAction(created, {
      type: "endAnnouncement",
      player: "ana",
    });
    expect(result.accepted && result.game.phase).toBe("discussion");
  });

  // Les détails internes ne font pas partie du contrat. La dérivation de la
  // graine reste interne : seul le moteur crée les épreuves.
  it.each([
    "checkSetup",
    "deriveTrialSeed",
    "dealTrial",
    "applyHostDecision",
    "announce",
    "currentChapter",
    "accept",
    "reject",
  ])("does not expose %s", (name) => {
    expect(game).not.toHaveProperty(name);
  });
});
