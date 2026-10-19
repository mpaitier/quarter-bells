import { describe, expect, it } from "vitest";
import { InvalidSeedError } from "../../src/errors.js";
import { MAX_SEED, createSeededRng } from "../../src/random/rng.js";

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
