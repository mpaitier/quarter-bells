import {
  InvalidPlayerCountError,
  InvalidSeedError,
  MAX_SEED,
  PLAYER_COUNTS,
  checkCandleSettings,
  isPlayerCount,
} from "@quarter-bells/rules";

import type { AnnouncingGame, GameSetup } from "./game.js";

/**
 * Crée une partie : annonce la première horloge du premier chapitre, sans
 * bougie bonus.
 *
 * La configuration est vérifiée en entier ici, plutôt qu'à la première
 * distribution : une erreur de l'appelant se voit tout de suite, pas après la
 * Discussion.
 *
 * @throws {InvalidPlayerCountError} s'il n'y a pas 2, 3 ou 4 joueurs
 * @throws {InvalidSeedError} si la graine n'est pas un entier sur 32 bits
 * @throws {RangeError} pour toute autre valeur incohérente (chapitres,
 * joueurs, hôte, bougies)
 */
export function createGame(setup: GameSetup): AnnouncingGame {
  checkSetup(setup);
  return {
    phase: "announcing",
    setup,
    position: { chapterIndex: 0, clockIndex: 0 },
    trialCount: 0,
    bonusCandles: 0,
  };
}

/** Lève une erreur si un champ de la configuration est incohérent. */
function checkSetup(setup: GameSetup): void {
  const { chapters, turnOrder, host, seed, candleSettings } = setup;

  if (chapters.length === 0) {
    throw new RangeError("A game needs at least one chapter");
  }
  for (const chapter of chapters) {
    if (chapter.clocks.length === 0) {
      throw new RangeError(
        `Chapter ${String(chapter.number)} has no clock to play`,
      );
    }
  }

  if (!isPlayerCount(turnOrder.length)) {
    throw new InvalidPlayerCountError(turnOrder.length, PLAYER_COUNTS);
  }
  // Un Set ne garde qu'un exemplaire de chaque valeur : une taille plus
  // petite trahit un doublon, qui jouerait deux fois par tour.
  if (new Set(turnOrder).size !== turnOrder.length) {
    throw new RangeError("Each player must appear once in the turn order");
  }
  if (!turnOrder.includes(host)) {
    throw new RangeError(`The host ${host} is not in the turn order`);
  }

  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) {
    throw new InvalidSeedError(seed, MAX_SEED);
  }

  checkCandleSettings(candleSettings);
}
