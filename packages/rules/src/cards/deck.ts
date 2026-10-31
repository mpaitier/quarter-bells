import { type Card, CARD_FAMILIES, CARD_VALUES, toCardId } from "./card.js";

import type { Rng } from "../random/rng.js";

import { requireAt } from "../arrays/require-at.js";
import { generateOpaqueIds } from "../random/id.js";

export function createDeck(rng: Rng): Card[] {
  const deckSize = CARD_FAMILIES.length * CARD_VALUES.length;
  const ids = generateOpaqueIds(rng, deckSize);

  const cards: Card[] = [];

  for (const family of CARD_FAMILIES) {
    for (const value of CARD_VALUES) {
      // generateOpaqueIds renvoie un identifiant par carte : requireAt ne
      // lève que si ce contrat était rompu.
      const id = requireAt(ids, cards.length);

      cards.push({ id: toCardId(id), family, value });
    }
  }

  return cards;
}
