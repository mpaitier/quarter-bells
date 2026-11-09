import { requireAt } from "../arrays/require-at.js";
import { dealTrialCards } from "../cards/deal.js";
import type { Clock } from "../clocks/clock.js";
import { isSectionIndex } from "../clocks/section.js";
import { createSeededRng } from "../random/rng.js";
import { isIntegerBetween } from "../numbers/is-integer-between.js";
import {
  checkCandleSettings,
  computeBaseCandles,
  type CandleSettings,
} from "./candles.js";
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
  /** Bougies bonus du groupe au début de l'épreuve. */
  readonly bonusCandles: number;
  readonly candleSettings: CandleSettings;
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
 * section de départ, bougies)
 */
export function createTrial(setup: TrialSetup): PlacingTrial {
  const { clock, turnOrder, startSection, seed, bonusCandles, candleSettings } =
    setup;
  checkSetup(setup);

  // dealTrialCards vérifie le nombre de joueurs, createSeededRng la graine.
  const lots = dealTrialCards(turnOrder.length, createSeededRng(seed));
  const seats: Seat[] = turnOrder.map((player, position) => {
    // dealTrialCards renvoie exactement un lot par joueur.
    const { hand, reserve } = requireAt(lots, position);
    return { player, hand, reserve };
  });

  return {
    phase: "placement",
    clock,
    startSection,
    seats,
    placements: [],
    candles: {
      base: computeBaseCandles(turnOrder.length, candleSettings.baseCandlesCap),
      bonus: bonusCandles,
      spent: 0,
    },
    maxBonusCandles: candleSettings.maxBonusCandles,
  };
}

/** Lève une RangeError si un champ de la configuration est incohérent. */
function checkSetup(setup: TrialSetup): void {
  const { clock, turnOrder, startSection, bonusCandles, candleSettings } =
    setup;

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

  checkCandleSettings(candleSettings);
  const { maxBonusCandles } = candleSettings;
  if (!isIntegerBetween(bonusCandles, 0, maxBonusCandles)) {
    throw new RangeError(
      `bonusCandles must be an integer between 0 and ${String(maxBonusCandles)}, received ${String(bonusCandles)}`,
    );
  }
}
