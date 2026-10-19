import { describe, expect, it } from "vitest";
import { generateOpaqueIds } from "../../src/random/id.js";
import { createSeededRng, type Rng } from "../../src/random/rng.js";

/**
 * Format attendu d'un identifiant : 10 caractères pris parmi les consonnes
 * minuscules. Écrit indépendamment de ID_ALPHABET : le test décrit le
 * contrat, il ne relit pas l'implémentation.
 */
const ID_FORMAT = /^[bcdfghjklmnpqrstvwxz]{10}$/;

/** Nombre de cartes du jeu : le cas d'usage réel. */
const CARD_COUNT = 24;

const SEED = 42;

/**
 * Faux générateur qui renvoie les valeurs données, dans l'ordre.
 * Sert à provoquer des situations qu'un vrai tirage ne produit
 * pratiquement jamais, comme deux identifiants identiques.
 */
function createFakeRng(values: readonly number[]): Rng {
  let position = 0;

  return {
    next(): number {
      const value = values[position];
      if (value === undefined) {
        throw new Error("Fake Rng ran out of values");
      }
      position++;
      return value;
    },
  };
}

describe("generateOpaqueIds", () => {
  // Le nombre demandé, ni plus ni moins.
  it("returns the requested number of ids", () => {
    expect(generateOpaqueIds(createSeededRng(SEED), CARD_COUNT)).toHaveLength(
      CARD_COUNT,
    );
  });

  // Unicité : deux cartes ne doivent jamais partager un identifiant.
  it("returns distinct ids", () => {
    const ids = generateOpaqueIds(createSeededRng(SEED), CARD_COUNT);

    // Le Set élimine les doublons : s'il y en avait un, il compterait
    // un élément de moins que le tableau.
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  // Format : exactement 10 consonnes minuscules. C'est ce qui garantit
  // qu'un id ne contient ni chiffre (donc aucune valeur de carte) ni
  // voyelle (donc aucun nom de famille).
  it("only uses lowercase consonants, 10 characters long", () => {
    const ids = generateOpaqueIds(createSeededRng(SEED), CARD_COUNT);

    for (const id of ids) {
      expect(id).toMatch(ID_FORMAT);
    }
  });

  // Reproductibilité, comme pour le générateur et le mélange.
  it("returns the same ids for the same seed", () => {
    const firstIds = generateOpaqueIds(createSeededRng(SEED), CARD_COUNT);
    const secondIds = generateOpaqueIds(createSeededRng(SEED), CARD_COUNT);

    expect(firstIds).toEqual(secondIds);
  });

  // Cas limite autorisé : zéro identifiant.
  it("returns an empty array when count is 0", () => {
    expect(generateOpaqueIds(createSeededRng(SEED), 0)).toHaveLength(0);
  });

  // Valeurs de count hors contrat.
  it.each([[-1], [1.5], [Number.NaN], [Number.POSITIVE_INFINITY]])(
    "rejects count %o",
    (count) => {
      expect(() => generateOpaqueIds(createSeededRng(SEED), count)).toThrow(
        RangeError,
      );
    },
  );

  // Un identifiant tiré deux fois ne doit apparaître qu'une fois : la
  // fonction doit tirer à nouveau jusqu'à obtenir assez d'ids distincts.
  it("draws again when an id is already taken", () => {
    // 10 zéros donnent le premier id, 10 zéros de plus le même id une
    // seconde fois (doublon), puis 10 fois 0.5 donnent un id différent.
    const fakeRng = createFakeRng([
      ...Array<number>(10).fill(0),
      ...Array<number>(10).fill(0),
      ...Array<number>(10).fill(0.5),
    ]);

    expect(generateOpaqueIds(fakeRng, 2)).toEqual(["bbbbbbbbbb", "nnnnnnnnnn"]);
  });
});
