// Joue chaque épreuve de test/trials/*.json, de la distribution à la
// Résolution (docs/testing.md). Ajouter une épreuve ne demande aucun code.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Value } from "typebox/value";
import { describe, expect, it } from "vitest";
import type { Card } from "../src/cards/card.js";
import { parseClock } from "../src/clocks/parse-clock.js";
import { applyTrialAction } from "../src/trial/apply-trial-action.js";
import { createTrial } from "../src/trial/create-trial.js";
import type { Trial } from "../src/trial/trial.js";
import {
  TrialCaseSchema,
  type TrialCase,
  type TrialStep,
} from "./support/trial-case.js";

const TRIALS_DIR = fileURLToPath(new URL("./trials", import.meta.url));
const CLOCKS_DIR = fileURLToPath(new URL("./fixtures/clocks", import.meta.url));

/** Lit un cas et le valide ; un fichier mal écrit fait échouer le test. */
function loadCase(file: string): TrialCase {
  const data: unknown = JSON.parse(
    readFileSync(join(TRIALS_DIR, file), "utf8"),
  );
  if (!Value.Check(TrialCaseSchema, data)) {
    const details = [...Value.Errors(TrialCaseSchema, data)]
      .map((error) => `  ${error.instancePath || "/"} : ${error.message}`)
      .join("\n");
    throw new Error(`Cas d'épreuve invalide : ${file}\n${details}`);
  }
  return data;
}

/**
 * Retrouve la carte d'une étape dans la main ou la réserve du joueur. Une
 * carte de réserve est rendue elle aussi : c'est au moteur de la refuser
 * tant qu'elle n'a pas rejoint la main.
 */
function findCard(trial: Trial, step: TrialStep): Card {
  const seat = trial.seats.find(
    (candidate) => candidate.player === step.player,
  );
  const card = [...(seat?.hand ?? []), ...(seat?.reserve ?? [])].find(
    (candidate) =>
      candidate.family === step.card.family &&
      candidate.value === step.card.value,
  );
  if (card === undefined) {
    // Erreur du cas, pas du moteur : la carte n'a pas été distribuée à ce
    // joueur avec cette graine.
    throw new Error(
      `${step.player} does not hold ${step.card.family} ${String(step.card.value)}`,
    );
  }
  return card;
}

/** Joue toutes les étapes et renvoie l'épreuve finale. */
function play(testCase: TrialCase): Trial {
  const clockData: unknown = JSON.parse(
    readFileSync(join(CLOCKS_DIR, testCase.clock), "utf8"),
  );
  let trial: Trial = createTrial({
    clock: parseClock(clockData, testCase.clock),
    turnOrder: testCase.turnOrder,
    startSection: testCase.startSection,
    seed: testCase.seed,
    bonusEyes: testCase.bonusEyes,
    eyeSettings: testCase.eyeSettings,
  });

  testCase.steps.forEach((step, index) => {
    const result = applyTrialAction(trial, {
      type: "placeCard",
      player: step.player,
      cardId: findCard(trial, step).id,
      sectionIndex: step.section,
      faceUp: step.faceUp,
    });
    // Le numéro d'étape dans le message : en cas d'échec, on sait laquelle
    // regarder dans le fichier.
    const label = `step ${String(index)}`;
    if (step.rejected === undefined) {
      expect(result.accepted, label).toBe(true);
      if (result.accepted) {
        trial = result.trial;
      }
    } else {
      expect(
        result.accepted ? "accepted" : result.rejection.reason,
        label,
      ).toBe(step.rejected);
    }
  });

  return trial;
}

const files = readdirSync(TRIALS_DIR).filter((file) => file.endsWith(".json"));

describe("trial cases", () => {
  it("finds at least one case", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s", (file) => {
    const testCase = loadCase(file);
    const trial = play(testCase);

    // Toutes les étapes jouées, l'épreuve doit être résolue.
    if (trial.phase === "placement") {
      throw new Error("The trial is not resolved after the last step");
    }
    expect(trial.phase).toBe(testCase.expected.phase);
    expect(trial.bonusEyesAfter).toBe(testCase.expected.bonusEyesAfter);
    expect(
      trial.resolution.sections.map(({ section, value, ascending }) => ({
        section,
        value,
        ascending,
      })),
    ).toEqual(testCase.expected.sections);
    expect(trial.resolution.violations).toEqual(testCase.expected.violations);
  });
});
