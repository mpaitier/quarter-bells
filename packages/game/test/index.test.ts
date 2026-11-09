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

  // Les vérifications internes ne font pas partie du contrat.
  it.each(["checkSetup"])("does not expose %s", (name) => {
    expect(game).not.toHaveProperty(name);
  });
});
