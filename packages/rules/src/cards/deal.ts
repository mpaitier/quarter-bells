import { InvalidPlayerCountError } from "../errors.js";
import type { Rng } from "../random/rng.js";
import { shuffle } from "../random/shuffle.js";
import type { Card } from "./card.js";
import { createDeck } from "./deck.js";

/** Nombres de joueurs autorisés dans une partie. */
export const PLAYER_COUNTS = [2, 3, 4] as const;
export type PlayerCount = (typeof PLAYER_COUNTS)[number];

/** Vérifie qu'une valeur inconnue est un nombre de joueurs valide. */
export function isPlayerCount(value: unknown): value is PlayerCount {
  return (PLAYER_COUNTS as readonly unknown[]).includes(value);
}

/** Nombre de cartes reçues par chaque joueur pour un nombre de joueurs donné. */
interface DealConfig {
  /** Cartes en main, visibles par leur propriétaire. */
  readonly handSize: number;
  /** Cartes de réserve, faces cachées, qui rejoignent la main plus tard. */
  readonly reserveSize: number;
}

/**
 * Règles de distribution par nombre de joueurs.
 * Dans tous les cas, 12 cartes sont distribuées au total.
 */
const DEAL_CONFIGS: Readonly<Record<PlayerCount, DealConfig>> = {
  2: { handSize: 4, reserveSize: 2 },
  3: { handSize: 4, reserveSize: 0 },
  4: { handSize: 3, reserveSize: 0 },
};

/** Cartes reçues par un joueur lors de la distribution. */
export interface DealtCards {
  /** Cartes en main, connues de leur propriétaire et jouables tout de suite. */
  readonly hand: readonly Card[];
  /** Cartes de réserve, faces cachées. Vide sauf en partie à 2. */
  readonly reserve: readonly Card[];
}

/**
 * Garde, parmi des cartes distribuées en tour de table, celles qui
 * reviennent au joueur placé à la position seat.
 */
function takeRoundRobin<T>(
  cards: readonly T[],
  playerCount: number,
  seat: number,
): T[] {
  return cards.filter((_, position) => position % playerCount === seat);
}

/**
 * Distribue des cartes déjà dans l'ordre de distribution.
 *
 * Les cartes sont données une par une en tour de table : d'abord les mains,
 * puis les réserves. Le premier lot renvoyé est celui du joueur qui reçoit
 * la première carte (l'initiateur) ; attribuer les lots aux joueurs est la
 * responsabilité de l'appelant.
 *
 * Aucun hasard ici : avec les mêmes cartes, la distribution est toujours
 * la même. Le mélange se fait avant, dans dealTrialCards.
 *
 * @param cards cartes dans l'ordre de distribution ; les cartes au-delà
 *   du nombre nécessaire sont ignorées
 * @param playerCount nombre de joueurs
 * @returns un lot par joueur, dans l'ordre de distribution
 * @throws {RangeError} s'il n'y a pas assez de cartes
 */
export function dealCards(
  cards: readonly Card[],
  playerCount: PlayerCount,
): DealtCards[] {
  const { handSize, reserveSize } = DEAL_CONFIGS[playerCount];

  // On récupère le nombre de cartes dans toutes les mains et toutes les réserves
  const handTotal = playerCount * handSize;
  const dealtTotal = playerCount * (handSize + reserveSize);

  // Erreur si on n'a pas assez de cartes
  if (cards.length < dealtTotal) {
    throw new RangeError(
      `Not enough cards to deal: expected at least ${String(dealtTotal)}, received ${String(cards.length)}`,
    );
  }

  // On coupe le paquet pour avoir les premières cartes pour les mains
  // le reste jusqu'à dealtTotal pour la réserve
  const handCards = cards.slice(0, handTotal);
  const reserveCards = cards.slice(handTotal, dealtTotal);

  // Un lot par joueur : chacun prend, dans chaque tas, les cartes que le
  // tour de table lui attribue.
  return Array.from({ length: playerCount }, (_, seat) => ({
    hand: takeRoundRobin(handCards, playerCount, seat),
    reserve: takeRoundRobin(reserveCards, playerCount, seat),
  }));
}

/**
 * Distribue les cartes d'une nouvelle épreuve : crée un jeu neuf, le mélange
 * et le distribue selon le nombre de joueurs.
 *
 * Ordre des tirages sur rng : identifiants des cartes (createDeck), puis
 * mélange (shuffle). Pour une même graine, la distribution est toujours
 * identique.
 *
 * @param playerCount nombre de joueurs, non vérifié : valeur venant de l'extérieur
 * @param rng générateur à graine de l'épreuve
 * @returns un lot par joueur, dans l'ordre de distribution
 * @throws {InvalidPlayerCountError} si playerCount n'est pas 2, 3 ou 4
 */
export function dealTrialCards(playerCount: number, rng: Rng): DealtCards[] {
  if (!isPlayerCount(playerCount)) {
    throw new InvalidPlayerCountError(playerCount, PLAYER_COUNTS);
  }

  const deck = createDeck(rng);
  const shuffled = shuffle(deck, rng);

  return dealCards(shuffled, playerCount);
}
