import { describe, expect, it } from "vitest";
import { InvalidSeedError } from "../../src/errors.js";
import { MAX_SEED, createSeededRng, nextInt } from "../../src/random/rng.js";

/** Tire n valeurs d'un générateur, pour comparer des suites entre elles. */
function draw(seed: number, n: number): number[] {
  const rng = createSeededRng(seed);
  return Array.from({ length: n }, () => rng.next());
}

describe("createSeededRng", () => {
  // Reproductibilité : c'est la raison d'être d'un générateur à graine.
  // Sans elle, impossible de rejouer une partie ou de déboguer une
  // distribution précise.
  it("produces the same sequence for the same seed", () => {
    const firstSequence = draw(42, 100);
    const secondSequence = draw(42, 100);

    expect(firstSequence).toEqual(secondSequence);
  });

  // La graine doit réellement influencer la sortie. Un générateur qui
  // ignorerait sa graine passerait le test précédent, pas celui-ci.
  it("produces different sequences for different seeds", () => {
    const firstSequence = draw(0, 100);
    const secondSequence = draw(1, 100);

    expect(firstSequence).not.toEqual(secondSequence);
  });

  // Respect du contrat de l'interface Rng : 0 inclus, 1 exclu.
  // Le mélange des cartes en dépend : une valeur égale à 1 ferait sortir
  // l'index tiré du tableau. Beaucoup de tirages pour augmenter les chances
  // de croiser une erreur de borne.
  it("always returns a number in [0, 1)", () => {
    const values = draw(123, 10_000);

    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  // Fidélité à l'algorithme publié. Une faute de frappe dans un décalage
  // garderait le générateur déterministe et dans [0, 1), donc invisible
  // pour les tests précédents.
  it("matches the reference mulberry32 output", () => {
    // Valeurs obtenues en exécutant l'implémentation de référence de
    // mulberry32 avec la graine 42, et non en exécutant ce code-ci.
    // Si ce test casse, l'algorithme a été modifié : les parties
    // enregistrées seraient rejouées différemment. Ne pas « corriger »
    // ces valeurs pour faire passer le test.
    const expectedValues = [
      0.6011037519201636, 0.44829055899754167, 0.8524657934904099,
      0.6697340414393693, 0.17481389874592423,
    ];

    expect(draw(42, 5)).toEqual(expectedValues);
  });

  // Graines hors contrat : décimal, négatif, au-delà de 32 bits, et les
  // deux valeurs spéciales de JavaScript qu'on peut recevoir par erreur.
  it.each([
    [1.5],
    [-1],
    [MAX_SEED + 1],
    [Number.NaN],
    [Number.POSITIVE_INFINITY],
  ])("rejects seed %o", (seed) => {
    expect(() => createSeededRng(seed)).toThrow(InvalidSeedError);
  });

  // Les deux extrémités de l'intervalle valide, pendants de -1 et
  // MAX_SEED + 1 ci-dessus : ensemble, ils encadrent chaque frontière.
  it.each([[0], [MAX_SEED]])("accepts boundary seed %o", (seed) => {
    expect(() => createSeededRng(seed)).not.toThrow();
  });
});

describe('nextInt', () => {
  // Contrat de base : un entier, dans [0, maxExclusive).
  it('returns an integer in [0, maxExclusive)', () => {
    const rng = createSeededRng(7);

    for (let n = 0; n < 10_000; n++) {
      const value = nextInt(rng, 6);

      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(6);
    }
  });

  // Chaque valeur possible doit pouvoir sortir. Une erreur de borne
  // (oublier le 0 ou le 5) passerait le test précédent, pas celui-ci.
  it('can return every value in the range', () => {
    const rng = createSeededRng(7);
    const seen = new Set<number>();

    for (let i = 0; i < 10_000; i++) {
      seen.add(nextInt(rng, 6));
    }

    // Le Set ne garde que les valeurs distinctes, dans leur ordre
    // d'apparition : on le trie avant de comparer.
    const sortedSeen = [...seen].sort((a, b) => a - b);
    expect(sortedSeen).toEqual([0, 1, 2, 3, 4, 5]);
  });

  // Cas limite : avec une seule valeur possible, le résultat est forcé.
  it("always returns 0 when maxExclusive is 1", () => {
    const rng = createSeededRng(7);

    for (let n = 0; n < 100; n++) {
      expect(nextInt(rng, 1)).toBe(0);
    }
  });

  // Bornes invalides : zéro, négatif, décimal, NaN.
  it.each([[0], [-1], [2.5], [Number.NaN]])('rejects maxExclusive %o', (max) => {
    const rng = createSeededRng(7);
    expect(() => nextInt(rng, max)).toThrow(RangeError);
  });
});
