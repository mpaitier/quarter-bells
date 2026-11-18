// Chapitre 1 du jeu pour les tests, comme dans packages/game/test/support :
// les vraies horloges, passées par parseClock. Importer un fichier de données
// de rules depuis les tests reste permis : seul le code de src/ est tenu à
// l'API publique.

import type { Chapter } from "@quarter-bells/game";
import { parseClock } from "@quarter-bells/rules";

import clk0 from "../../../rules/clocks/ch01/ch01-clk0.json" with { type: "json" };
import clk1 from "../../../rules/clocks/ch01/ch01-clk1.json" with { type: "json" };
import clk2 from "../../../rules/clocks/ch01/ch01-clk2.json" with { type: "json" };
import clk3 from "../../../rules/clocks/ch01/ch01-clk3.json" with { type: "json" };

/** Le chapitre 1, ses quatre horloges dans l'ordre. */
export const CHAPTER_1: Chapter = {
  number: 1,
  clocks: [
    parseClock(clk0, "ch01-clk0.json"),
    parseClock(clk1, "ch01-clk1.json"),
    parseClock(clk2, "ch01-clk2.json"),
    parseClock(clk3, "ch01-clk3.json"),
  ],
};
