import { describe, expect, it } from "vitest";
import type { Card } from "../../src/cards/card.js";
import {
  PLAYER_COUNTS,
  dealCards,
  dealTrialCards,
  isPlayerCount,
  type DealtCards,
  type PlayerCount,
} from "../../src/cards/deal.js";
import { createDeck } from "../../src/cards/deck.js";
import { InvalidPlayerCountError } from "../../src/errors.js";
import { createSeededRng } from "../../src/random/rng.js";
import { shuffle } from "../../src/random/shuffle.js";

const SEED = 42;

/**
 * Règle de distribution de game-rules.md, une ligne par nombre de joueurs :
 * [joueurs, cartes en main, cartes en réserve].
 * Typée explicitement pour que la première colonne soit un PlayerCount,
 * accepté par dealCards.
 */
const DEAL_RULES: [PlayerCount, number, number][] = [
  [2, 4, 2],
  [3, 4, 0],
  [4, 3, 0],
];

/** Toutes les cartes distribuées, mains puis réserves, tous joueurs confondus. */
function allDealtCards(lots: readonly DealtCards[]): Card[] {
  return lots.flatMap((lot) => [...lot.hand, ...lot.reserve]);
}

/** Identifiants de cartes triés, pour comparer deux ensembles sans tenir compte de l'ordre. */
function sortedIds(cards: readonly Card[]): string[] {
  return cards.map((card) => card.id).sort();
}

describe("isPlayerCount", () => {
  it.each(PLAYER_COUNTS)("accepts %i", (playerCount) => {
    expect(isPlayerCount(playerCount)).toBe(true);
  });

  // Juste hors des bornes (1 et 5), valeurs absurdes, et "3" : le cas
  // typique d'un nombre arrivé du réseau sous forme de texte.
  it.each([[1], [5], [0], [2.5], ["3"], [Number.NaN], [null]])(
    "rejects %o",
    (value) => {
      expect(isPlayerCount(value)).toBe(false);
    },
  );
});

describe("dealCards", () => {
  // La règle de distribution, lue directement dans DEAL_RULES.
  it.each(DEAL_RULES)(
    "with %i players, gives %i cards in hand and %i in reserve to each",
    (playerCount, handSize, reserveSize) => {
      const deck = createDeck(createSeededRng(SEED));
      const lots = dealCards(deck, playerCount);

      expect(lots).toHaveLength(playerCount);

      for (const lot of lots) {
        expect(lot.hand).toHaveLength(handSize);
        expect(lot.reserve).toHaveLength(reserveSize);
      }
    },
  );

  // Tour de table : avec le jeu non mélangé, on sait exactement quelle
  // carte arrive chez qui. À 3 joueurs, le joueur 0 reçoit les positions
  // 0, 3, 6 et 9, le joueur 2 les positions 2, 5, 8 et 11.
  it("deals hands one card at a time around the table", () => {
    const deck = createDeck(createSeededRng(SEED));
    const lots = dealCards(deck, 3);

    expect(lots[0]?.hand).toEqual([deck[0], deck[3], deck[6], deck[9]]);
    expect(lots[2]?.hand).toEqual([deck[2], deck[5], deck[8], deck[11]]);
  });

  // À 2 joueurs, les cartes 9 à 12 (positions 8 à 11) forment les
  // réserves, elles aussi en tour de table.
  it("deals the reserve after the hands, around the table", () => {
    const deck = createDeck(createSeededRng(SEED));
    const lots = dealCards(deck, 2);

    expect(lots[0]?.reserve).toEqual([deck[8], deck[10]]);
    expect(lots[1]?.reserve).toEqual([deck[9], deck[11]]);
  });

  // Seules les 12 premières cartes sont distribuées, chacune une seule fois.
  // Le 12 est écrit en dur : c'est la règle du jeu, pas un calcul à refaire.
  it.each(PLAYER_COUNTS)(
    "deals the first 12 cards exactly once with %i players",
    (playerCount) => {
      const deck = createDeck(createSeededRng(SEED));
      const dealt = allDealtCards(dealCards(deck, playerCount));

      expect(sortedIds(dealt)).toEqual(sortedIds(deck.slice(0, 12)));
    },
  );

  // Protection contre un appel direct avec un paquet incomplet.
  it("rejects a pile too small for the deal", () => {
    const deck = createDeck(createSeededRng(SEED));

    expect(() => dealCards(deck.slice(0, 11), 3)).toThrow(RangeError);
  });
});

describe("dealTrialCards", () => {
  // Critère d'acceptation : une même graine donne toujours la même
  // distribution.
  it("gives the same deal for the same seed", () => {
    const firstDeal = dealTrialCards(3, createSeededRng(SEED));
    const secondDeal = dealTrialCards(3, createSeededRng(SEED));

    expect(firstDeal).toEqual(secondDeal);
  });

  // La graine doit réellement influencer la distribution.
  it("gives a different deal for a different seed", () => {
    const firstDeal = dealTrialCards(3, createSeededRng(SEED));
    const secondDeal = dealTrialCards(3, createSeededRng(SEED + 1));

    expect(firstDeal).not.toEqual(secondDeal);
  });

  // Fige l'ordre des tirages documenté dans le JSDoc : identifiants
  // d'abord, mélange ensuite, sur le même générateur. C'est le seul test
  // où un générateur est volontairement partagé entre deux appels,
  // puisque c'est précisément ce partage qu'on vérifie.
  it("draws ids first, then shuffles, from the same generator", () => {
    const rng = createSeededRng(SEED);
    const expected = dealCards(shuffle(createDeck(rng), rng), 3);

    expect(dealTrialCards(3, createSeededRng(SEED))).toEqual(expected);
  });

  // Critère d'acceptation : un nombre de joueurs hors de 2 à 4 est
  // refusé avec une erreur explicite.
  it.each([[1], [5], [0], [2.5], [Number.NaN]])(
    "rejects %o players",
    (playerCount) => {
      expect(() => dealTrialCards(playerCount, createSeededRng(SEED))).toThrow(
        InvalidPlayerCountError,
      );
    },
  );

  // « Explicite » : le message doit dire ce qui est permis et ce qui a été
  // reçu, pour qu'une seule ligne de log suffise à comprendre le problème.
  it("explains the allowed player counts in the error message", () => {
    expect(() => dealTrialCards(5, createSeededRng(SEED))).toThrow(
      "expected one of 2, 3, 4, received 5",
    );
  });
});
