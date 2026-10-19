import { describe, expect, it } from "vitest";
import { CARD_FAMILIES } from "../../src/cards/card.js";
import { createDeck } from "../../src/cards/deck.js";
import { createSeededRng } from "../../src/random/rng.js";

const SEED = 42;

describe("createDeck", () => {
  // Le jeu complet : 2 familles de 12 cartes. Écrit en dur, car c'est la
  // règle du jeu, pas un calcul à refaire à partir de l'implémentation.
  it("contains 24 cards", () => {
    expect(createDeck(createSeededRng(SEED))).toHaveLength(24);
  });

  // Chaque famille a exactement 12 cartes, numérotées de 1 à 12,
  // chacune une seule fois.
  it.each(CARD_FAMILIES)("contains values 1 to 12 once in %s", (family) => {
    const deck = createDeck(createSeededRng(SEED));

    // Trié pour que le test ne dépende pas de l'ordre des cartes,
    // déjà vérifié par le test d'ordre canonique.
    const sortedValues = deck
      .filter((card) => card.family === family)
      .map((card) => card.value)
      .sort((a, b) => a - b);

    expect(sortedValues).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  // L'ordre canonique est documenté dans le JSDoc de createDeck :
  // ce test le fige. S'il change, toutes les distributions changent.
  it("returns cards in canonical order", () => {
    const deck = createDeck(createSeededRng(SEED));

    // Première et dernière carte de chaque famille : si les boucles étaient
    // inversées ou décalées, au moins une de ces positions serait fausse.
    expect(deck[0]).toMatchObject({ family: "instant", value: 1 });
    expect(deck[11]).toMatchObject({ family: "instant", value: 12 });
    expect(deck[12]).toMatchObject({ family: "eternity", value: 1 });
    expect(deck[23]).toMatchObject({ family: "eternity", value: 12 });
  });

  // Unicité des identifiants sur le jeu entier.
  it("gives every card a distinct id", () => {
    const deck = createDeck(createSeededRng(SEED));

    const cardIds = deck.map((card) => card.id);
    const uniqueIds = new Set(cardIds);

    expect(uniqueIds.size).toBe(deck.length);
  });

  // Critère d'acceptation de l'issue : un identifiant ne doit révéler ni
  // la famille ni la valeur de sa carte.
  it("never reveals the family or the value in an id", () => {
    const deck = createDeck(createSeededRng(SEED));

    for (const card of deck) {
      expect(card.id).not.toContain(card.family);
      expect(card.id).not.toMatch(/\d/);
    }
  });

  // Reproductibilité : même graine, même jeu, ids compris.
  it("returns the same deck for the same seed", () => {
    const firstDeck = createDeck(createSeededRng(SEED));
    const secondDeck = createDeck(createSeededRng(SEED));

    expect(firstDeck).toEqual(secondDeck);
  });

  // La graine doit influencer les identifiants.
  it("gives different ids for different seeds", () => {
    const firstIds = createDeck(createSeededRng(SEED)).map((card) => card.id);
    const secondIds = createDeck(createSeededRng(SEED + 1)).map(
      (card) => card.id,
    );

    expect(firstIds).not.toEqual(secondIds);
  });
});
