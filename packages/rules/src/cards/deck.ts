import { type Card, CARD_FAMILIES, CARD_VALUES, toCardId } from "./card.js";

import type { Rng } from "../random/rng.js";

import { generateOpaqueIds } from "../random/id.js";

export function createDeck(rng: Rng): Card[] {
  const deckSize = CARD_FAMILIES.length * CARD_VALUES.length;
  const ids = generateOpaqueIds(rng, deckSize);

  const cards: Card[] = [];

  for (const family of CARD_FAMILIES) {
    for (const value of CARD_VALUES) {
      const id = ids[cards.length];

      if (id === undefined) {
        throw new Error(
          `Missing id for card at position ${String(cards.length)}: generateOpaqueIds returned fewer ids than cards`,
        );
      }

      cards.push({ id: toCardId(id), family, value });
    }
  }

  return cards;
}
