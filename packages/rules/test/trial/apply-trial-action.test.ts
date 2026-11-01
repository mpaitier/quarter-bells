import { describe, expect, it } from "vitest";
import type { Card } from "../../src/cards/card.js";
import { parseClock } from "../../src/clocks/parse-clock.js";
import {
  applyTrialAction,
  type PlaceCardAction,
  type TrialResult,
} from "../../src/trial/apply-trial-action.js";
import { createTrial, type TrialSetup } from "../../src/trial/create-trial.js";
import { availableEyes } from "../../src/trial/eyes.js";
import {
  currentPlayer,
  currentSeat,
  type PlacingTrial,
  type Trial,
} from "../../src/trial/trial.js";
import { deepFreeze } from "../support/deep-freeze.js";
import exampleClock from "../fixtures/clocks/example-clock.json" with { type: "json" };
import playersChoiceClock from "../fixtures/clocks/players-choice-clock.json" with { type: "json" };

// La résolution déclenchée par la dernière pose est testée dans
// resolve-trial.test.ts. Ici : tours, main, yeux, contraintes, réserve, et
// l'immuabilité de l'état.

// example-clock : seules ses sections 0, 2 et 3 n'ont aucune règle. Les
// tests posent là pour ne déclencher que ce qu'ils vérifient.
const clock = parseClock(exampleClock, "example-clock.json");

const setup: TrialSetup = {
  clock,
  turnOrder: ["ana", "ben", "cleo"],
  startSection: 4,
  seed: 42,
  bonusEyes: 0,
  eyeSettings: { maxBonusEyes: 3 },
};

/** Première carte de la main du joueur dont c'est le tour. */
function firstCardInTurn(trial: PlacingTrial): Card {
  const card = currentSeat(trial).hand[0];
  if (card === undefined) {
    throw new Error("The current player has no card left");
  }
  return card;
}

/** Première carte de la main (ou de la réserve) du joueur à cette place. */
function cardOf(
  trial: Trial,
  position: number,
  from: "hand" | "reserve" = "hand",
): Card {
  const card = trial.seats[position]?.[from][0];
  if (card === undefined) {
    throw new Error(`No card in ${from} at position ${String(position)}`);
  }
  return card;
}

/** Action valide de base : le joueur du tour pose sa première carte. */
function placeFirstCard(
  trial: PlacingTrial,
  change: Partial<PlaceCardAction> = {},
): PlaceCardAction {
  return {
    type: "placeCard",
    player: currentSeat(trial).player,
    cardId: firstCardInTurn(trial).id,
    sectionIndex: 0,
    faceUp: false,
    ...change,
  };
}

/** Renvoie l'épreuve d'un résultat accepté, échoue sur un refus. */
function acceptedTrial(result: TrialResult): PlacingTrial {
  if (!result.accepted) {
    throw new Error(`Rejected: ${result.rejection.reason}`);
  }
  if (result.trial.phase !== "placement") {
    throw new Error("The trial is already resolved");
  }
  return result.trial;
}

/** Joue n poses face cachée en section 0, chacun son tour. */
function playFaceDown(trial: PlacingTrial, count: number): PlacingTrial {
  let current = trial;
  for (let i = 0; i < count; i += 1) {
    current = acceptedTrial(applyTrialAction(current, placeFirstCard(current)));
  }
  return current;
}

describe("applyTrialAction / placeCard", () => {
  describe("turns", () => {
    it("records the placement and passes the turn", () => {
      const trial = createTrial(setup);
      const card = firstCardInTurn(trial);
      const next = acceptedTrial(
        applyTrialAction(trial, placeFirstCard(trial)),
      );

      expect(next.placements).toEqual([
        { sectionIndex: 0, card, faceUp: false, player: "ana" },
      ]);
      // La carte quitte la main de son joueur.
      expect(next.seats[0]?.hand).not.toContainEqual(card);
      expect(currentPlayer(next)).toBe("ben");
    });

    it("follows the turn order and wraps around", () => {
      // Après un tour complet de 3 poses, c'est de nouveau au premier.
      expect(currentPlayer(playFaceDown(createTrial(setup), 3))).toBe("ana");
    });

    it("rejects a placement out of turn", () => {
      // ben essaie de poser une de ses cartes alors que c'est le tour d'ana.
      const trial = createTrial(setup);
      const result = applyTrialAction(
        trial,
        placeFirstCard(trial, { player: "ben", cardId: cardOf(trial, 1).id }),
      );
      expect(result).toEqual({
        accepted: false,
        rejection: { reason: "notYourTurn", currentPlayer: "ana" },
      });
    });
  });

  describe("cards", () => {
    it("rejects a card held by another player", () => {
      // ana, à son tour, désigne une carte de ben.
      const trial = createTrial(setup);
      const result = applyTrialAction(
        trial,
        placeFirstCard(trial, { cardId: cardOf(trial, 1).id }),
      );
      expect(result).toEqual({
        accepted: false,
        rejection: { reason: "cardNotInHand" },
      });
    });

    it("rejects a card that was already placed", () => {
      // ana pose sa carte, puis les deux autres jouent ; au tour suivant
      // d'ana, la même carte n'est plus dans sa main.
      const trial = createTrial(setup);
      const card = firstCardInTurn(trial);
      const later = playFaceDown(trial, 3);
      const result = applyTrialAction(
        later,
        placeFirstCard(later, { cardId: card.id }),
      );
      expect(result.accepted).toBe(false);
    });

    it.each([-1, 6, 1.5])("rejects the section %s", (sectionIndex) => {
      const trial = createTrial(setup);
      expect(
        applyTrialAction(trial, placeFirstCard(trial, { sectionIndex })),
      ).toEqual({ accepted: false, rejection: { reason: "unknownSection" } });
    });
  });

  describe("eyes", () => {
    it("spends one eye on a face-up placement", () => {
      const trial = createTrial(setup);
      const next = acceptedTrial(
        applyTrialAction(trial, placeFirstCard(trial, { faceUp: true })),
      );
      expect(next.eyes.spent).toBe(1);
      expect(availableEyes(next.eyes)).toBe(availableEyes(trial.eyes) - 1);
    });

    it("spends nothing on a face-down placement", () => {
      const trial = createTrial(setup);
      const next = acceptedTrial(
        applyTrialAction(trial, placeFirstCard(trial)),
      );
      expect(next.eyes).toBe(trial.eyes);
    });

    it("rejects a face-up placement without eye left, not a face-down one", () => {
      // Plafond à 0 et aucun œil bonus : aucun œil disponible.
      const trial = createTrial({
        ...setup,
        eyeSettings: { maxBonusEyes: 3, baseEyesCap: 0 },
      });
      expect(
        applyTrialAction(trial, placeFirstCard(trial, { faceUp: true })),
      ).toEqual({ accepted: false, rejection: { reason: "noEyeLeft" } });
      expect(applyTrialAction(trial, placeFirstCard(trial)).accepted).toBe(
        true,
      );
    });

    it("lets the group spend its bonus eyes", () => {
      // Aucun œil de base, un œil bonus : une seule pose face visible.
      const trial = createTrial({
        ...setup,
        bonusEyes: 1,
        eyeSettings: { maxBonusEyes: 3, baseEyesCap: 0 },
      });
      const next = acceptedTrial(
        applyTrialAction(trial, placeFirstCard(trial, { faceUp: true })),
      );
      expect(
        applyTrialAction(next, placeFirstCard(next, { faceUp: true })),
      ).toEqual({ accepted: false, rejection: { reason: "noEyeLeft" } });
    });
  });

  describe("rules", () => {
    it("rejects a placement that breaks a placement constraint", () => {
      // players-choice-clock : les poses de rang 0 et 1 vont en section 0.
      const trial = createTrial({
        ...setup,
        clock: parseClock(playersChoiceClock, "players-choice-clock.json"),
        startSection: 0,
      });
      const result = applyTrialAction(
        trial,
        placeFirstCard(trial, { sectionIndex: 3 }),
      );
      expect(result).toEqual({
        accepted: false,
        rejection: {
          reason: "ruleViolation",
          violations: [
            {
              kind: "firstPlacements",
              params: { placementIndexes: [0, 1] },
              section: 0,
              placementIndex: 0,
              attemptedSection: 3,
            },
          ],
        },
      });
    });
  });

  // ADR 0011 : une borne haute connue guide sans bloquer. Scénario de jeu
  // réaliste, sous le plafond général de 24 : ana et ben posent face visible
  // leurs plus fortes cartes en section 1, qui vaut alors 21 aux yeux de
  // tous. Avec la graine 6, cleo n'a que des cartes de 5 ou plus : chacune
  // ferait dépasser 24 en section 1.
  describe("known upper bounds", () => {
    /**
     * Horloge sans règle, ou avec la 3e pose (rang 2) imposée en section 1.
     * Aucune borne sur la section 1 en dehors du plafond général, comme
     * l'exigent les règles de conception (clock-format.md).
     */
    const clockWith = (rules: unknown[]) =>
      parseClock(
        {
          ...exampleClock,
          noMaxSum: false,
          defaultStartSection: 0,
          sections: exampleClock.sections.map((section) => ({
            ...section,
            rules: section.index === 1 ? rules : [],
          })),
        },
        "known-bound.json",
      );

    /** Le joueur du tour pose cette carte de sa main. */
    const place = (
      trial: PlacingTrial,
      family: Card["family"],
      value: Card["value"],
      sectionIndex: number,
      faceUp = false,
    ): PlaceCardAction => {
      const card = currentSeat(trial).hand.find(
        (candidate) => candidate.family === family && candidate.value === value,
      );
      if (card === undefined) {
        throw new Error(
          `${currentSeat(trial).player} does not hold ${family} ${String(value)}`,
        );
      }
      return {
        type: "placeCard",
        player: currentSeat(trial).player,
        cardId: card.id,
        sectionIndex,
        faceUp,
      };
    };

    /** L'épreuve après les poses d'ana (Instant 11) et de ben (Éternité 10). */
    const afterTwentyOne = (rules: unknown[]): PlacingTrial => {
      let trial = createTrial({
        ...setup,
        clock: clockWith(rules),
        startSection: 0,
        seed: 6,
      });
      trial = acceptedTrial(
        applyTrialAction(trial, place(trial, "instant", 11, 1, true)),
      );
      return acceptedTrial(
        applyTrialAction(trial, place(trial, "eternity", 10, 1, true)),
      );
    };

    const thirdPlacementOnSection1 = [
      { kind: "firstPlacements", params: { placementIndexes: [2] } },
    ];

    it("starts with 21 on section 1 and no card below 4 for cleo", () => {
      // Garde-fou : si la distribution changeait, les tests suivants ne
      // vérifieraient plus ce qu'ils annoncent.
      const trial = afterTwentyOne([]);
      expect(currentPlayer(trial)).toBe("cleo");
      for (const card of currentSeat(trial).hand) {
        expect(21 + card.value).toBeGreaterThan(24);
      }
    });

    it("rejects a placement over a known bound when another one is permitted", () => {
      // Sans pose imposée, cleo peut jouer ailleurs : le refus la guide.
      const trial = afterTwentyOne([]);
      expect(applyTrialAction(trial, place(trial, "eternity", 5, 1))).toEqual({
        accepted: false,
        rejection: {
          reason: "ruleViolation",
          violations: [
            { kind: "maxSum", params: { max: 24 }, section: 1, value: 26 },
          ],
        },
      });
    });

    describe("when the placement is required on that section", () => {
      // La 3e pose doit aller en section 1, et aucune carte de cleo n'y
      // tient sous 24 : aucune pose n'est entièrement permise.

      it("accepts a placement that only breaks a known bound", () => {
        // Sans cette exception, cleo ne pourrait rien poser et la partie
        // resterait figée. La section dépassera 24 : l'épreuve échouera à
        // la Résolution.
        const trial = afterTwentyOne(thirdPlacementOnSection1);
        expect(
          applyTrialAction(trial, place(trial, "eternity", 5, 1)).accepted,
        ).toBe(true);
      });

      it("still rejects a placement that breaks a placement constraint", () => {
        // La section 3 ne dépasse rien, mais la pose imposée ne cède jamais.
        const trial = afterTwentyOne(thirdPlacementOnSection1);
        expect(applyTrialAction(trial, place(trial, "eternity", 5, 3))).toEqual(
          {
            accepted: false,
            rejection: {
              reason: "ruleViolation",
              violations: [
                {
                  kind: "firstPlacements",
                  params: { placementIndexes: [2] },
                  section: 1,
                  placementIndex: 2,
                  attemptedSection: 3,
                },
              ],
            },
          },
        );
      });
    });
  });

  describe("reserve at 2 players", () => {
    const twoPlayers = createTrial({ ...setup, turnOrder: ["ana", "ben"] });

    it("keeps the reserve aside until each player has placed 2 cards", () => {
      // 3 poses : ana en a fait 2, ben 1. Les réserves attendent.
      const after3 = playFaceDown(twoPlayers, 3);
      expect(after3.seats.map((seat) => seat.reserve.length)).toEqual([2, 2]);
    });

    it("moves the reserve into the hand after the 4th placement", () => {
      const after4 = playFaceDown(twoPlayers, 4);
      // Main de 4, moins 2 posées, plus 2 de réserve.
      expect(
        after4.seats.map((seat) => [seat.hand.length, seat.reserve.length]),
      ).toEqual([
        [4, 0],
        [4, 0],
      ]);
      // Les cartes de réserve sont les mêmes, maintenant jouables.
      const reserve = twoPlayers.seats[0]?.reserve ?? [];
      expect(after4.seats[0]?.hand).toEqual(
        expect.arrayContaining([...reserve]),
      );
    });

    it("rejects a reserve card before it joins the hand", () => {
      const reserveCard = cardOf(twoPlayers, 0, "reserve");
      expect(
        applyTrialAction(
          twoPlayers,
          placeFirstCard(twoPlayers, { cardId: reserveCard.id }),
        ),
      ).toEqual({ accepted: false, rejection: { reason: "cardNotInHand" } });
    });
  });

  describe("immutability", () => {
    // L'épreuve est gelée en profondeur : la moindre modification en place
    // lèverait une TypeError pendant l'action.
    it("does not modify the trial when it accepts a placement", () => {
      const trial: Trial = deepFreeze(createTrial(setup));
      const before = structuredClone(trial);
      expect(() =>
        applyTrialAction(trial, placeFirstCard(createTrial(setup))),
      ).not.toThrow();
      expect(trial).toEqual(before);
    });

    it("does not modify the trial when it rejects a placement", () => {
      const trial = deepFreeze(createTrial(setup));
      const before = structuredClone(trial);
      const result = applyTrialAction(
        trial,
        placeFirstCard(trial, { player: "ben" }),
      );
      expect(result.accepted).toBe(false);
      expect(trial).toEqual(before);
    });

    it("shares the parts that did not change", () => {
      // Seul le siège du joueur change : les autres sont les mêmes objets.
      const trial = createTrial(setup);
      const next = acceptedTrial(
        applyTrialAction(trial, placeFirstCard(trial)),
      );
      expect(next.seats[1]).toBe(trial.seats[1]);
      expect(next.clock).toBe(trial.clock);
    });
  });
});
