import { describe, expect, it } from "vitest";
import { toCardId, type CardValue } from "../../src/cards/card.js";
import { parseClock } from "../../src/clocks/parse-clock.js";
import {
  applyTrialAction,
  type TrialResult,
} from "../../src/trial/apply-trial-action.js";
import { createTrial, type TrialSetup } from "../../src/trial/create-trial.js";
import {
  resolveTrial,
  trialOutcome,
  type TrialOutcome,
} from "../../src/trial/resolve-trial.js";
import {
  currentPlayer,
  currentSeat,
  type PlacingTrial,
  type Trial,
  type TrialPlacement,
} from "../../src/trial/trial.js";
import exampleClock from "../fixtures/clocks/example-clock.json" with { type: "json" };

const clock = parseClock(exampleClock, "example-clock.json");

const setup: TrialSetup = {
  clock,
  turnOrder: ["ana", "ben", "cleo"],
  startSection: 4,
  seed: 42,
  bonusEyes: 1,
  eyeSettings: { maxBonusEyes: 3 },
};

/** Le joueur du tour pose sa première carte, face cachée, en section 0. */
function placeFirst(trial: PlacingTrial): TrialResult {
  const seat = currentSeat(trial);
  const card = seat.hand[0];
  if (card === undefined) {
    throw new Error("No card left");
  }
  return applyTrialAction(trial, {
    type: "placeCard",
    player: seat.player,
    cardId: card.id,
    sectionIndex: 0,
    faceUp: false,
  });
}

/** Pose toutes les cartes en section 0, et renvoie l'épreuve finale. */
function playAllInSection0(start: PlacingTrial): Trial {
  let trial: Trial = start;
  while (trial.phase === "placement") {
    const result = placeFirst(trial);
    if (!result.accepted) {
      throw new Error(`Rejected: ${result.rejection.reason}`);
    }
    trial = result.trial;
  }
  return trial;
}

describe("trialOutcome", () => {
  // Chaque ligne : réussite, yeux bonus avant, maximum, issue attendue.
  it.each<[boolean, number, number, TrialOutcome]>([
    // Réussite : remise à zéro, quel que soit le nombre d'yeux bonus.
    [true, 2, 3, { phase: "succeeded", bonusEyesAfter: 0 }],
    // Échec sous le maximum : un œil bonus gagné.
    [false, 0, 3, { phase: "failed", bonusEyesAfter: 1 }],
    [false, 2, 3, { phase: "failed", bonusEyesAfter: 3 }],
    // Échec au maximum : run perdue, yeux bonus inchangés.
    [false, 3, 3, { phase: "runLost", bonusEyesAfter: 3 }],
    // Maximum réduit par la salle : la run est perdue plus tôt.
    [false, 1, 1, { phase: "runLost", bonusEyesAfter: 1 }],
    // Yeux bonus désactivés : tout échec fait perdre la run.
    [false, 0, 0, { phase: "runLost", bonusEyesAfter: 0 }],
  ])(
    "succeeded %s with %i bonus eyes out of %i",
    (succeeded, bonusEyes, maxBonusEyes, expected) => {
      expect(trialOutcome(succeeded, bonusEyes, maxBonusEyes)).toEqual(
        expected,
      );
    },
  );
});

describe("resolution at the last placement", () => {
  it("stays in placement until the last card", () => {
    // 3 joueurs, 12 cartes : après 11 poses, il en reste une.
    let trial: Trial = createTrial(setup);
    for (let i = 0; i < 11; i += 1) {
      if (trial.phase !== "placement") {
        throw new Error("Resolved too early");
      }
      const result = placeFirst(trial);
      if (!result.accepted) {
        throw new Error("Rejected");
      }
      trial = result.trial;
    }
    expect(trial.phase).toBe("placement");
    expect(currentPlayer(trial)).toBe("cleo");
  });

  it("resolves the trial with the last placement", () => {
    // Les 12 cartes en section 0 : les autres sections sont vides, la pose
    // échoue. 1 œil bonus sur 3 : un de plus.
    const trial = playAllInSection0(createTrial(setup));
    expect(trial.phase).toBe("failed");
    if (trial.phase === "placement") {
      return;
    }
    expect(trial.bonusEyesAfter).toBe(2);
    expect(trial.resolution.succeeded).toBe(false);
    expect(trial.placements).toHaveLength(12);
    // Rapport dans l'ordre de révélation, depuis la section de départ 4.
    expect(trial.resolution.sections.map((reveal) => reveal.section)).toEqual([
      4, 5, 0, 1, 2, 3,
    ]);
    // Les cartes du rapport sont des placements d'épreuve : le joueur y est.
    const section0 = trial.resolution.sections[2];
    expect(section0?.placements).toHaveLength(12);
    expect(section0?.placements[0]?.player).toBe("ana");
  });

  it("loses the run when the failure happens at the maximum", () => {
    const trial = playAllInSection0(createTrial({ ...setup, bonusEyes: 3 }));
    expect(trial.phase).toBe("runLost");
  });

  it("has no current player and rejects any placement once resolved", () => {
    const trial = playAllInSection0(createTrial(setup));
    expect(currentPlayer(trial)).toBeUndefined();
    const result = applyTrialAction(trial, {
      type: "placeCard",
      player: "ana",
      // Identifiant quelconque : trialOver est vérifié avant la carte.
      cardId: toCardId("any"),
      sectionIndex: 0,
      faceUp: false,
    });
    expect(result).toEqual({
      accepted: false,
      rejection: { reason: "trialOver" },
    });
  });
});

describe("resolveTrial", () => {
  it("resets the bonus eyes after a success", () => {
    // Pose valide pour example-clock depuis la section 4 (voir
    // evaluate-resolution.test.ts), mise directement dans l'épreuve : ce
    // test vérifie les conséquences, pas le déroulement des tours.
    const start = createTrial(setup);
    const card = start.seats[0]?.hand[0];
    if (card === undefined) {
      throw new Error("No card");
    }
    const valuesBySection: [number, CardValue][] = [
      [4, 1],
      [4, 1],
      [5, 1],
      [5, 1],
      [5, 1],
      [0, 4],
      [1, 6],
      [2, 7],
      [3, 8],
    ];
    const placements: TrialPlacement[] = valuesBySection.map(
      ([sectionIndex, value]) => ({
        sectionIndex,
        // Seule la valeur compte pour l'évaluation ; l'identifiant est repris.
        card: { ...card, value },
        faceUp: false,
        player: "ana",
      }),
    );
    const resolved = resolveTrial({ ...start, placements });
    expect(resolved.phase).toBe("succeeded");
    expect(resolved.bonusEyesAfter).toBe(0);
    expect(resolved.resolution.violations).toEqual([]);
  });
});
