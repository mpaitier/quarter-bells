import { describe, expect, it } from 'vitest';
import { createSeededRng } from '../../src/random/rng.js';
import { shuffle } from '../../src/random/shuffle.js';

/** Les entiers de 0 à 23 : même taille que le jeu de cartes. */
const ITEMS = Object.freeze(Array.from({ length: 24 }, (_, index) => index));

/** Graine commune : chaque test crée son propre générateur à partir d'elle. */
const SEED = 42;

describe('shuffle', () => {
  // Un mélange ne doit ni perdre, ni dupliquer, ni inventer d'élément.
  it("returns a permutation of the input", () => {
    const shuffled = shuffle(ITEMS, createSeededRng(SEED));

    // ITEMS est déjà trié : une fois le résultat remis dans l'ordre
    // numérique, il doit lui être identique.
    const sorted = [...shuffled].sort((a, b) => a - b);

    expect(sorted).toEqual(ITEMS);
  });

  // L'appelant ne doit pas voir son tableau modifié.
  it('does not modify the input array', () => {
    const original = [...ITEMS]
    shuffle(ITEMS, createSeededRng(SEED))

    expect(ITEMS).toEqual(original);
  });

  // Le résultat doit être un nouveau tableau, pas l'entrée elle-même.
  it('returns a new array', () => {
    const shuffled = shuffle(ITEMS, createSeededRng(SEED))

    expect(shuffled).not.toBe(ITEMS)
  });

  // Reproductibilité, comme pour le générateur.
  it('gives the same order for the same seed', () => {
    const firstOrder = shuffle(ITEMS, createSeededRng(SEED))
    const secondOrder = shuffle(ITEMS, createSeededRng(SEED))

    expect(firstOrder).toEqual(secondOrder)
  });

  // Le mélange doit réellement changer l'ordre. Un échange qui ne
  // permuterait rien passerait tous les tests précédents.
  it('actually changes the order', () => {
    expect(shuffle(ITEMS, createSeededRng(SEED))).not.toEqual(ITEMS);
  });

  // Cas limites : la boucle ne tourne pas, la copie doit rester correcte.
  it('handles empty and single-element arrays', () => {
    expect(shuffle([], createSeededRng(SEED))).toEqual([]);
    expect(shuffle(["a"], createSeededRng(SEED))).toEqual(['a']);
  });

  // Uniformité : chaque ordre doit sortir avec la même fréquence.
  // Avec 3 éléments, il y a 6 ordres possibles ; sur 60 000 mélanges,
  // chacun doit apparaître environ 10 000 fois.
  //
  // La tolérance de 500 vaut environ 5 écarts-types : un mélange correct
  // ne la dépasse pratiquement jamais. Un mélange biaisé (tirage dans
  // [0, n)) donne certains ordres à environ 11 100 occurrences, et la
  // variante de Sattolo (tirage dans [0, i)) n'en produit que 2 sur 6.
  // La graine est fixe : le test est déterministe, jamais aléatoire en CI.
  it("produces every order with the same frequency", () => {
    const letters = ["a", "b", "c"];
    const counts = new Map<string, number>();

    // Un seul générateur pour tout le test : chaque mélange prend la
    // suite du précédent. Un générateur neuf à chaque tour, avec la
    // même graine, produirait 60 000 fois le même ordre.
    const rng = createSeededRng(SEED);

    for (let n = 0; n < 60_000; n++) {
      // L'ordre obtenu sert de clé : ["b", "c", "a"] devient "bca".
      const key = shuffle(letters, rng).join("");
      const current = counts.get(key) ?? 0;
      counts.set(key, current + 1);
    }

    // Sattolo n'atteint que 2 ordres sur 6 : ce contrôle l'attrape
    // avec un message clair avant même de regarder les compteurs.
    expect(counts.size).toBe(6);

    for (const count of counts.values()) {
      expect(count).toBeGreaterThanOrEqual(9_500);
      expect(count).toBeLessThanOrEqual(10_500);
    }
  });
});


