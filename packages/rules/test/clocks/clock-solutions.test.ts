// Rejoue la pose gagnante de chaque horloge du jeu (critère de l'issue #13) :
// protège d'une horloge impossible à réussir par erreur de conception, et
// d'une modification du moteur qui en rendrait une impossible.
//
// La pose est rejouée comme pendant une épreuve : chaque carte doit être
// acceptée pendant la Pose (evaluatePlacement), puis la pose complète doit
// réussir à la Résolution (evaluateResolution).

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Value } from "typebox/value";
import { describe, expect, it } from "vitest";
import { PLAYER_COUNTS, dealTrialCards } from "../../src/cards/deal.js";
import type { Clock } from "../../src/clocks/clock.js";
import { parseClock } from "../../src/clocks/parse-clock.js";
import { evaluatePlacement } from "../../src/evaluation/evaluate-placement.js";
import { evaluateResolution } from "../../src/evaluation/evaluate-resolution.js";
import type { Placement } from "../../src/placements/placement.js";
import { createSeededRng } from "../../src/random/rng.js";
import {
  ClockSolutionSchema,
  type ClockSolution,
} from "../support/clock-solution.js";
import { expectedPath, readGameClockFiles } from "../support/game-clocks.js";

const SOLUTIONS_DIR = fileURLToPath(
  new URL("../clock-solutions", import.meta.url),
);

/** Lit une pose gagnante et la valide ; un fichier mal écrit fait échouer le test. */
function loadSolution(path: string): ClockSolution {
  const data: unknown = JSON.parse(
    readFileSync(join(SOLUTIONS_DIR, path), "utf8"),
  );
  if (!Value.Check(ClockSolutionSchema, data)) {
    const details = [...Value.Errors(ClockSolutionSchema, data)]
      .map((error) => `  ${error.instancePath || "/"} : ${error.message}`)
      .join("\n");
    throw new Error(`Pose gagnante invalide : ${path}\n${details}`);
  }
  return data;
}

/** Les étapes d'une solution sous forme de placements, toutes face cachée. */
function toPlacements(solution: ClockSolution): Placement[] {
  return solution.steps.map((step) => ({
    sectionIndex: step.section,
    card: step.card,
    faceUp: false,
  }));
}

/**
 * Nombre de cartes posées dans une épreuve à playerCount joueurs : toutes
 * les cartes distribuées, mains et réserves. Lu dans le moteur plutôt
 * qu'écrit en dur, pour suivre un changement des règles de distribution.
 */
function cardsPerTrial(playerCount: number): number {
  // La graine n'a pas d'importance : seul le nombre de cartes est lu.
  return dealTrialCards(playerCount, createSeededRng(0)).reduce(
    (total, dealt) => total + dealt.hand.length + dealt.reserve.length,
    0,
  );
}

// Horloges du jeu, chacune avec le chemin de sa solution : même chemin que
// l'horloge, dans test/clock-solutions/.
const clocks: (readonly [string, Clock])[] = readGameClockFiles().map(
  (file) => [file.path, parseClock(file.data, file.path)],
);

// Fichiers de solution présents, avec des « / » même sous Windows.
const solutionFiles = readdirSync(SOLUTIONS_DIR, {
  encoding: "utf8",
  recursive: true,
})
  .map((file) => file.replaceAll("\\", "/"))
  .filter((file) => file.endsWith(".json"))
  .toSorted();

describe("clock solutions", () => {
  // Une horloge sans solution passerait tous les tests sans rien prouver.
  it("has a solution for every game clock", () => {
    expect(solutionFiles).toEqual(clocks.map(([path]) => path).toSorted());
  });

  describe.each(clocks)("%s", (path, clock) => {
    // Chargée dans chaque test plutôt qu'une fois : un fichier manquant fait
    // échouer les tests de cette horloge, pas le chargement de toute la suite.
    const solution = (): ClockSolution => loadSolution(path);

    it("names its clock", () => {
      expect(solution().clock).toBe(clock.uid);
      // Garde-fou : le chemin partagé suppose la convention de nommage.
      expect(path).toBe(expectedPath(clock.chapter, clock.indexInChapter));
    });

    // Le jeu n'a qu'un exemplaire de chaque carte : une solution qui en pose
    // deux fois une serait impossible à jouer.
    it("uses each card only once", () => {
      const faces = solution().steps.map(
        ({ card }) => `${card.family}-${String(card.value)}`,
      );
      expect(new Set(faces).size).toBe(faces.length);
    });

    // Une épreuve se termine quand toutes les cartes distribuées sont
    // posées : la solution doit les poser toutes, à chaque nombre de joueurs.
    it.each(PLAYER_COUNTS)("places every card dealt to %i players", (count) => {
      expect(solution().steps).toHaveLength(cardsPerTrial(count));
    });

    // Chaque carte doit être acceptée au moment où elle est posée : une
    // contrainte de pose (firstPlacements, borne haute connue) pourrait
    // refuser une pose qui réussirait pourtant à la Résolution.
    it("is accepted at every placement", () => {
      const placements = toPlacements(solution());
      placements.forEach((candidate, rank) => {
        expect(
          evaluatePlacement(clock, placements.slice(0, rank), candidate),
          `placement ${String(rank)}`,
        ).toEqual([]);
      });
    });

    // La section de départ par défaut : celle de l'horloge en mode fixed,
    // une proposition valable en mode chosenByPlayers.
    it("succeeds at resolution", () => {
      const report = evaluateResolution(
        clock,
        clock.defaultStartSection,
        toPlacements(solution()),
      );
      // Les violations plutôt que succeeded : en cas d'échec, Vitest montre
      // la règle et la section fautives.
      expect(report.violations).toEqual([]);
    });
  });
});
