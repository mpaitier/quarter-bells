import type { CardId } from "../cards/card.js";
import { isSectionIndex } from "../clocks/section.js";
import { evaluatePlacement } from "../evaluation/evaluate-placement.js";
import type { Violation } from "../rule-checks/violation.js";
import { availableEyes } from "./eyes.js";
import { isPlacementComplete, resolveTrial } from "./resolve-trial.js";
import {
  currentSeat,
  type PlacingTrial,
  type PlayerId,
  type Seat,
  type Trial,
  type TrialPlacement,
} from "./trial.js";

/**
 * En partie à 2, la réserve rejoint la main quand chaque joueur a posé ce
 * nombre de cartes (game-rules.md, « Phase de Pose »).
 */
export const RESERVE_JOINS_AFTER = 2;

/** Un joueur pose une carte de sa main devant une section. */
export interface PlaceCardAction {
  readonly type: "placeCard";
  readonly player: PlayerId;
  readonly cardId: CardId;
  readonly sectionIndex: number;
  /** Face visible : dépense un œil. */
  readonly faceUp: boolean;
}

/**
 * Les actions possibles sur une épreuve. Une seule pour l'instant : le champ
 * type permettra de les distinguer quand il y en aura d'autres.
 */
export type TrialAction = PlaceCardAction;

/** Raison structurée d'un refus. Le client choisit le texte et le guidage. */
export type TrialRejection =
  | { readonly reason: "trialOver" }
  | { readonly reason: "notYourTurn"; readonly currentPlayer: PlayerId }
  | { readonly reason: "cardNotInHand" }
  | { readonly reason: "unknownSection" }
  | { readonly reason: "noEyeLeft" }
  | {
      readonly reason: "ruleViolation";
      /** Toutes les règles qui refusent la pose (F-JEU-20). */
      readonly violations: readonly Violation[];
    };

/**
 * Résultat d'une action. Un refus ne contient pas d'épreuve : l'appelant
 * garde celle qu'il avait, qui n'a pas changé.
 */
export type TrialResult =
  | { readonly accepted: true; readonly trial: Trial }
  | { readonly accepted: false; readonly rejection: TrialRejection };

/**
 * Applique une action à une épreuve (reducer, ADR 0010).
 *
 * Fonction pure : elle ne modifie jamais `trial`, ne lit ni l'heure ni le
 * hasard, et renvoie toujours le même résultat pour les mêmes arguments.
 * Une action acceptée produit une nouvelle épreuve ; les parties qui n'ont
 * pas changé sont partagées avec l'ancienne, pas copiées.
 */
export function applyTrialAction(
  trial: Trial,
  action: TrialAction,
): TrialResult {
  // Une seule action pour l'instant : appel direct. Un switch sur une union
  // à un seul membre serait signalé comme inutile par le lint ; il viendra
  // avec la deuxième action, et switch-exhaustiveness-check l'obligera à
  // traiter chaque type.
  return placeCard(trial, action);
}

/** Pose d'une carte : toutes les vérifications, puis le nouvel état. */
function placeCard(trial: Trial, action: PlaceCardAction): TrialResult {
  // Les vérifications vont de la plus générale à la plus précise : le refus
  // renvoyé est le premier problème rencontré.
  if (trial.phase !== "placement") {
    return reject({ reason: "trialOver" });
  }

  const seat = currentSeat(trial);
  if (action.player !== seat.player) {
    return reject({ reason: "notYourTurn", currentPlayer: seat.player });
  }

  // La réserve n'est pas jouable tant qu'elle n'a pas rejoint la main.
  const card = seat.hand.find((candidate) => candidate.id === action.cardId);
  if (card === undefined) {
    return reject({ reason: "cardNotInHand" });
  }

  if (!isSectionIndex(action.sectionIndex)) {
    return reject({ reason: "unknownSection" });
  }

  if (action.faceUp && availableEyes(trial.eyes) === 0) {
    return reject({ reason: "noEyeLeft" });
  }

  const placement: TrialPlacement = {
    sectionIndex: action.sectionIndex,
    card,
    faceUp: action.faceUp,
    player: action.player,
  };
  const violations = evaluatePlacement(
    trial.clock,
    trial.placements,
    placement,
  );
  if (violations.length > 0) {
    return reject({ reason: "ruleViolation", violations });
  }

  // La dernière pose déclenche la Résolution, dans la même action : il n'y a
  // pas d'état intermédiaire « toutes les cartes posées, pas encore résolue ».
  const next = withPlacement(trial, seat, placement);
  return {
    accepted: true,
    trial: isPlacementComplete(next) ? resolveTrial(next) : next,
  };
}

/** Nouvelle épreuve, après une pose acceptée. */
function withPlacement(
  trial: PlacingTrial,
  seat: Seat,
  placement: TrialPlacement,
): PlacingTrial {
  const placements = [...trial.placements, placement];

  // Seul le siège du joueur change : les autres sont repris tels quels.
  const seats = trial.seats.map((candidate) =>
    candidate === seat
      ? {
          ...seat,
          hand: seat.hand.filter((card) => card.id !== placement.card.id),
        }
      : candidate,
  );

  return {
    ...trial,
    placements,
    seats: joinReservesIfDue(seats, placements),
    eyes: placement.faceUp
      ? { ...trial.eyes, spent: trial.eyes.spent + 1 }
      : trial.eyes,
  };
}

/**
 * Fait rejoindre la main aux réserves dès que chaque joueur a posé
 * RESERVE_JOINS_AFTER cartes. Sans réserve (3 ou 4 joueurs, ou réserves
 * déjà prises), rien ne change.
 */
function joinReservesIfDue(
  seats: readonly Seat[],
  placements: readonly TrialPlacement[],
): readonly Seat[] {
  if (seats.every((seat) => seat.reserve.length === 0)) {
    return seats;
  }
  const everyonePlacedEnough = seats.every(
    (seat) =>
      placements.filter((placement) => placement.player === seat.player)
        .length >= RESERVE_JOINS_AFTER,
  );
  if (!everyonePlacedEnough) {
    return seats;
  }
  return seats.map((seat) => ({
    ...seat,
    hand: [...seat.hand, ...seat.reserve],
    reserve: [],
  }));
}

/** Raccourci : un résultat de refus. */
function reject(rejection: TrialRejection): TrialResult {
  return { accepted: false, rejection };
}
