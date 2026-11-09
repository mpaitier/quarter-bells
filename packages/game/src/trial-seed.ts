import { MAX_SEED, createSeededRng } from "@quarter-bells/rules";

/**
 * Graine d'une épreuve, dérivée de la graine de la partie et du rang de
 * l'épreuve dans la partie (ADR 0015).
 *
 * Le générateur de la partie produit une suite de nombres : l'épreuve de rang
 * n prend le n-ième. Une nouvelle tentative a un autre rang, donc d'autres
 * mains, et toute la partie se rejoue à partir de sa seule graine. Tirer n
 * nombres coûte n appels, négligeable pour quelques dizaines d'épreuves.
 *
 * @param gameSeed graine de la partie, vérifiée par createGame
 * @param trialIndex rang de l'épreuve dans la partie, à partir de 0
 * @returns un entier entre 0 et MAX_SEED, accepté par createSeededRng
 */
export function deriveTrialSeed(gameSeed: number, trialIndex: number): number {
  const rng = createSeededRng(gameSeed);
  let value = rng.next();
  for (let drawn = 0; drawn < trialIndex; drawn += 1) {
    value = rng.next();
  }
  // next() renvoie un nombre dans [0, 1) : le produit reste sous MAX_SEED + 1,
  // et sa partie entière est donc une graine valide.
  return Math.floor(value * (MAX_SEED + 1));
}
