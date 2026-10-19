import { InvalidSeedError } from "../errors.js";

/**
 * Source de nombres pseudo-aléatoires reproductible.
 *
 * Le moteur ne dépend que de cette interface : il ignore quel algorithme
 * produit les nombres. Une même graine donne toujours la même suite,
 * ce qui permet de rejouer une partie à l'identique.
 */
export interface Rng {
  /** Renvoie un nombre dans l'intervalle [0, 1) : 0 inclus, 1 exclu. */
  next(): number;
}

/** Plus grande graine acceptée : le plus grand entier non signé sur 32 bits. */
export const MAX_SEED = 0xffffffff;

/**
 * Incrément ajouté à l'état à chaque tirage (suite de Weyl).
 * Impair, il garantit que l'état parcourt les 2^32 valeurs avant de boucler.
 *
 * Constante de l'algorithme de référence mulberry32. Ne pas la modifier :
 * toutes les parties enregistrées en dépendent.
 */
const WEYL_INCREMENT = 0x6d2b79f5;

/** 2^32 : sert à ramener un entier non signé sur 32 bits dans [0, 1). */
const UINT32_RANGE = 2 ** 32;

/**
 * Crée un générateur mulberry32 initialisé avec la graine donnée.
 *
 * Chaque appel crée un générateur indépendant : son état vit dans une
 * fermeture et n'est partagé avec aucun autre.
 *
 * @param seed entier entre 0 et MAX_SEED inclus
 * @throws {InvalidSeedError} si la graine n'est pas un entier dans cet intervalle
 */
export function createSeededRng(seed: number): Rng {
  // Number.isInteger écarte déjà les décimaux, NaN et Infinity.
  const isValidSeed = Number.isInteger(seed) && seed >= 0 && seed <= MAX_SEED;
  if (!isValidSeed) {
    throw new InvalidSeedError(seed, MAX_SEED);
  }

  // État interne du générateur, modifié uniquement au début de next().
  let state = seed;

  return {
    next(): number {
      // Étape 1 : avancer l'état.
      // La référence mulberry32 n'applique pas ">>> 0" ici ; on l'ajoute
      // pour que l'état reste un entier 32 bits au lieu de grossir en flottant.
      state = (state + WEYL_INCREMENT) >>> 0;

      // Étape 2 : mélanger les bits d'une copie de l'état.
      // Chaque "t ^ (t >>> n)" replie les bits de poids fort sur ceux de
      // poids faible ; la multiplication propage ensuite chaque bit vers le haut.
      // "t | 1" et "t | 61" rendent le multiplicateur impair : multiplier par
      // un impair modulo 2^32 ne perd aucune information.
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

      // Étape 3 : dernier mélange, retour en entier non signé 32 bits,
      // puis division par 2^32 pour obtenir un nombre dans [0, 1).
      return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
    },
  };
}

/**
 * Tire un entier uniformément dans [0, maxExclusive).
 *
 * @param rng générateur à utiliser
 * @param maxExclusive borne supérieure exclue, entier strictement positif
 * @throws {RangeError} si maxExclusive n'est pas un entier strictement positif
 */
export function nextInt(rng: Rng, maxExclusive: number): number {
  const isValidMax = Number.isInteger(maxExclusive) && maxExclusive > 0;

  if (!isValidMax) {
    throw new RangeError(
      `maxExclusive must be a positive integer, received ${String(maxExclusive)}.`,
    );
  }

  // next() étant dans [0, 1), le produit est dans [0, maxExclusive),
  // et l'arrondi inférieur donne un entier de 0 à maxExclusive - 1.
  return Math.floor(rng.next() * maxExclusive);
}
