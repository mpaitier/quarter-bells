// Propriétés du déroulement d'une épreuve (issue #14), sur des épreuves
// générées : horloge quelconque acceptée par parseClock, 2 à 4 joueurs,
// graine et yeux au hasard. Les tests d'exemple (apply-trial-action.test.ts)
// fixent chaque règle sur un cas ; ces propriétés vérifient qu'elle tient
// partout.

import { fc, it } from "@fast-check/vitest";
import { describe, expect } from "vitest";
import { requireAt } from "../../src/arrays/require-at.js";
import { SECTION_COUNT } from "../../src/clocks/clock.js";
import {
  applyTrialAction,
  type PlaceCardAction,
} from "../../src/trial/apply-trial-action.js";
import { createTrial } from "../../src/trial/create-trial.js";
import {
  currentSeat,
  type PlacingTrial,
  type Trial,
} from "../../src/trial/trial.js";
import { trialSetupArb } from "../support/arbitraries.js";
import { deepFreeze } from "../support/deep-freeze.js";

/** Nombre de cartes posées dans une épreuve, quel que soit le nombre de joueurs. */
const CARDS_PER_TRIAL = 12;

/**
 * Délai de la propriété « always ends in success or failure », qui joue
 * 1000 épreuves complètes. Mesurée seule : environ 1,4 s, 2,7 s avec la
 * couverture. Pendant pnpm check, les fichiers de tests tournent en
 * parallèle et elle a dépassé le délai par défaut de Vitest (5 s).
 * 30 s laissent une marge d'environ dix fois la mesure avec couverture.
 * Le délai global n'est pas relevé : il continue de détecter les tests
 * bloqués partout ailleurs.
 */
const FULL_TRIAL_PROPERTY_TIMEOUT_MS = 30_000;

/** Un coup accepté : l'action et l'épreuve qui en résulte. */
interface Move {
  readonly action: PlaceCardAction;
  readonly next: Trial;
}

/**
 * Tous les coups acceptés pour le joueur dont c'est le tour : chaque carte
 * de sa main, sur chaque section, face visible et face cachée. Le moteur
 * décide lui-même de ce qui est permis : le test ne réécrit aucune règle.
 */
function legalMoves(trial: PlacingTrial): Move[] {
  const { player, hand } = currentSeat(trial);
  const moves: Move[] = [];
  for (const card of hand) {
    for (let sectionIndex = 0; sectionIndex < SECTION_COUNT; sectionIndex++) {
      for (const faceUp of [false, true]) {
        const action: PlaceCardAction = {
          type: "placeCard",
          player,
          cardId: card.id,
          sectionIndex,
          faceUp,
        };
        const result = applyTrialAction(trial, action);
        if (result.accepted) {
          moves.push({ action, next: result.trial });
        }
      }
    }
  }
  return moves;
}

/**
 * Joue des coups acceptés, choisis par `choices`, jusqu'à épuiser les choix
 * ou la Pose. Un choix est un entier quelconque, ramené au nombre de coups
 * possibles : fast-check peut ainsi le réduire sans jamais le rendre invalide.
 */
function play(trial: Trial, choices: readonly number[]): Trial {
  let current = trial;
  for (const choice of choices) {
    if (current.phase !== "placement") {
      return current;
    }
    const moves = legalMoves(current);
    // Aucun coup permis alors qu'il reste des cartes : l'épreuve est bloquée,
    // les joueurs ne pourraient ni la réussir ni l'échouer. Le message donne
    // le rang de la pose impossible.
    expect(
      moves.length,
      `no legal placement at rank ${String(current.placements.length)}`,
    ).toBeGreaterThan(0);
    current = requireAt(moves, choice % moves.length).next;
  }
  return current;
}

/**
 * De quoi construire une action quelconque sur une épreuve dont on ne
 * connaît pas encore l'état. Les poids visent surtout le joueur dont c'est
 * le tour et une carte de sa main : sans eux, presque toutes les actions
 * seraient refusées dès la première vérification (mauvais tour), et les
 * refus plus profonds (yeux, règles) ne seraient jamais essayés.
 */
const actionPickArb = fc.record({
  player: fc.oneof(
    { weight: 4, arbitrary: fc.constant("current" as const) },
    // Un joueur de la table, index ramené au nombre de joueurs.
    { weight: 1, arbitrary: fc.nat() },
    { weight: 1, arbitrary: fc.constant("stranger") },
  ),
  card: fc.oneof(
    {
      weight: 4,
      arbitrary: fc.record({ inHand: fc.constant(true), index: fc.nat() }),
    },
    // Une des 12 cartes distribuées : réserve, autre main ou déjà posée.
    {
      weight: 1,
      arbitrary: fc.record({ inHand: fc.constant(false), index: fc.nat() }),
    },
  ),
  // Une section de part et d'autre du cadran : -1 et 6 sont refusées.
  sectionIndex: fc.integer({ min: -1, max: SECTION_COUNT }),
  faceUp: fc.boolean(),
});

/** Valeur produite par actionPickArb. */
type ActionPick =
  typeof actionPickArb extends fc.Arbitrary<infer T> ? T : never;

/** Construit l'action décrite par `pick` sur cette épreuve. */
function pickAction(trial: Trial, pick: ActionPick): PlaceCardAction {
  // Une épreuve résolue n'a plus de joueur courant ni de main jouable : on
  // se rabat sur le premier joueur et sur toutes les cartes. Le refus sera
  // trialOver.
  const seat = trial.phase === "placement" ? currentSeat(trial) : undefined;
  const players = trial.seats.map((candidate) => candidate.player);
  const allCards = [
    ...trial.seats.flatMap((candidate) => [
      ...candidate.hand,
      ...candidate.reserve,
    ]),
    ...trial.placements.map((placement) => placement.card),
  ];
  const cards =
    pick.card.inHand && seat !== undefined && seat.hand.length > 0
      ? seat.hand
      : allCards;

  return {
    type: "placeCard",
    player:
      pick.player === "current"
        ? (seat?.player ?? requireAt(players, 0))
        : typeof pick.player === "number"
          ? requireAt(players, pick.player % players.length)
          : pick.player,
    cardId: requireAt(cards, pick.card.index % cards.length).id,
    sectionIndex: pick.sectionIndex,
    faceUp: pick.faceUp,
  };
}

describe("trial properties", () => {
  // Critère : une épreuve jouée jusqu'au bout se termine toujours par une
  // réussite ou un échec. « Jusqu'au bout » : autant de poses acceptées que
  // de cartes distribuées, choisies au hasard parmi les poses permises.
  //
  // 1000 essais au lieu de 100 : sur des horloges jouables, un blocage
  // demande une suite de coups précise (plusieurs cartes fortes face visible
  // sur une section, puis la pose imposée sur cette section). Avec 100
  // essais, la propriété ne le trouvait pas sans l'exception de l'ADR 0011 ;
  // avec 1000, elle le trouve à chaque exécution. Ce nombre d'essais rend
  // le test lent : voir FULL_TRIAL_PROPERTY_TIMEOUT_MS.
  it.prop(
    [
      trialSetupArb,
      fc.array(fc.nat(), {
        minLength: CARDS_PER_TRIAL,
        maxLength: CARDS_PER_TRIAL,
      }),
    ],
    { numRuns: 1000 },
  )(
    "always ends in success or failure",
    (setup, choices) => {
      const trial = play(createTrial(setup), choices);

      if (trial.phase === "placement") {
        throw new Error(
          `Trial still in placement after ${String(trial.placements.length)} placements`,
        );
      }
      // runLost est un échec : celui qui fait perdre la run.
      expect(["succeeded", "failed", "runLost"]).toContain(trial.phase);
      expect(trial.placements).toHaveLength(CARDS_PER_TRIAL);
      // L'issue doit correspondre au rapport : réussite si et seulement si
      // aucune violation.
      expect(trial.phase === "succeeded").toBe(
        trial.resolution.violations.length === 0,
      );
    },
    FULL_TRIAL_PROPERTY_TIMEOUT_MS,
  );

  // Critère : une pose refusée ne modifie jamais l'état. Un refus ne renvoie
  // pas d'épreuve : la seule façon de modifier l'état serait de changer
  // celle reçue. Elle est gelée (toute écriture lève une TypeError), puis
  // comparée à une copie prise avant l'action.
  it.prop([
    trialSetupArb,
    // Nombre de coups joués avant l'action, uniforme de 0 à 12 : début,
    // milieu ou fin de Pose, et épreuve déjà résolue (refus trialOver).
    // fc.array seul privilégie les listes courtes : l'épreuve résolue
    // n'apparaîtrait presque jamais.
    fc
      .integer({ min: 0, max: CARDS_PER_TRIAL })
      .chain((length) =>
        fc.array(fc.nat(), { minLength: length, maxLength: length }),
      ),
    actionPickArb,
  ])(
    "leaves the trial untouched when it rejects a placement",
    (setup, choices, pick) => {
      const trial = deepFreeze(play(createTrial(setup), choices));
      const before = structuredClone(trial);

      applyTrialAction(trial, pickAction(trial, pick));

      // Vérifié sans condition : une pose acceptée ne doit pas non plus
      // modifier l'épreuve reçue. Le générateur produit surtout des refus,
      // de toutes les raisons, que vise ce critère.
      expect(trial).toEqual(before);
    },
  );
});
