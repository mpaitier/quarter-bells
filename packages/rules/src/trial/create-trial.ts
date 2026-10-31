import { dealTrialCards } from "../cards/deal.js";
import type { Clock } from "../clocks/clock.js";
import { isSectionIndex } from "../clocks/section.js";
import { createSeededRng } from "../random/rng.js";
import { MAX_BONUS_EYES, computeBaseEyes, type EyeSettings } from "./eyes.js";
import type { PlacingTrial, PlayerId, Seat } from "./trial.js";

/** Ce qu'il faut pour lancer une épreuve. */
export interface TrialSetup {
  readonly clock: Clock;
  /**
   * Les joueurs dans l'ordre de passage. Le premier reçoit la première carte
   * de la distribution (l'initiateur) et pose en premier.
   */
  readonly turnOrder: readonly PlayerId[];
  /**
   * Section de départ. En mode fixed, elle doit valoir defaultStartSection ;
   * en mode chosenByPlayers, c'est la section validée par l'hôte.
   */
  readonly startSection: number;
  /** Graine du mélange, tirée par le serveur pour chaque épreuve. */
  readonly seed: number;
  /** Yeux bonus du groupe au début de l'épreuve. */
  readonly bonusEyes: number;
  readonly eyeSettings: EyeSettings;
}

/**
 * Crée une épreuve : distribue les cartes à partir de la graine et ouvre la
 * phase de Pose (transitions « Vers Dealing » et « Vers Placement » de
 * game-state.md). La Discussion et l'annonce se jouent avant, hors du moteur.
 *
 * Pour une même configuration, l'épreuve créée est toujours identique.
 *
 * @throws {InvalidPlayerCountError} s'il n'y a pas 2, 3 ou 4 joueurs
 * @throws {InvalidSeedError} si la graine n'est pas un entier sur 32 bits
 * @throws {RangeError} pour toute autre valeur incohérente (joueur en double,
 * section de départ, yeux)
 */
export function createTrial(setup: TrialSetup): PlacingTrial {
  const { clock, turnOrder, startSection, seed, bonusEyes, eyeSettings } =
    setup;
  checkSetup(setup);

  // dealTrialCards vérifie le nombre de joueurs, createSeededRng la graine.
  const lots = dealTrialCards(turnOrder.length, createSeededRng(seed));
  const seats: Seat[] = turnOrder.map((player, position) => {
    const lot = lots[position];
    // dealTrialCards renvoie exactement un lot par joueur : impossible, mais
    // l'index d'un tableau est typé « peut-être undefined ».
    if (lot === undefined) {
      throw new Error(
        `No dealt cards for player at position ${String(position)}`,
      );
    }
    return { player, hand: lot.hand, reserve: lot.reserve };
  });

  return {
    phase: "placement",
    clock,
    startSection,
    seats,
    placements: [],
    eyes: {
      base: computeBaseEyes(turnOrder.length, eyeSettings.baseEyesCap),
      bonus: bonusEyes,
      spent: 0,
    },
    maxBonusEyes: eyeSettings.maxBonusEyes,
  };
}

/** Lève une RangeError si un champ de la configuration est incohérent. */
function checkSetup(setup: TrialSetup): void {
  const { clock, turnOrder, startSection, bonusEyes, eyeSettings } = setup;

  // Un Set ne garde qu'un exemplaire de chaque valeur : une taille plus
  // petite trahit un doublon, qui jouerait deux fois par tour.
  if (new Set(turnOrder).size !== turnOrder.length) {
    throw new RangeError("Each player must appear once in the turn order");
  }

  if (!isSectionIndex(startSection)) {
    throw new RangeError(`Unknown start section: ${String(startSection)}`);
  }
  if (
    clock.startSectionMode === "fixed" &&
    startSection !== clock.defaultStartSection
  ) {
    throw new RangeError(
      `Clock ${clock.uid} has a fixed start section (${String(clock.defaultStartSection)}), received ${String(startSection)}`,
    );
  }

  const { maxBonusEyes, baseEyesCap } = eyeSettings;
  if (!isIntegerBetween(maxBonusEyes, 0, MAX_BONUS_EYES)) {
    throw new RangeError(
      `maxBonusEyes must be an integer between 0 and ${String(MAX_BONUS_EYES)}, received ${String(maxBonusEyes)}`,
    );
  }
  if (!isIntegerBetween(bonusEyes, 0, maxBonusEyes)) {
    throw new RangeError(
      `bonusEyes must be an integer between 0 and ${String(maxBonusEyes)}, received ${String(bonusEyes)}`,
    );
  }
  if (
    baseEyesCap !== undefined &&
    !isIntegerBetween(baseEyesCap, 0, Number.MAX_SAFE_INTEGER)
  ) {
    throw new RangeError(
      `baseEyesCap must be a non-negative integer, received ${String(baseEyesCap)}`,
    );
  }
}

/** Entier compris entre min et max, bornes incluses. */
function isIntegerBetween(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}
