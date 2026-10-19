import { describe, expect, it } from 'vitest';
import {
  CARD_FAMILIES,
  isCardFamily,
  toCardId,
  type Card,
  type CardId,
} from '../../src/cards/card.js';

describe('isCardFamily', () => {
  it.each(CARD_FAMILIES)('accepts %s', (family) => {
    expect(isCardFamily(family)).toBe(true);
  });

  it.each([['instants'], ['Eternity'], ['Horloge'], [''], [42], [null], [undefined]])(
    'rejects %o',
    (value) => {
      expect(isCardFamily(value)).toBe(false);
    },
  );
});

describe('Card typing', () => {
  const validCard: Card = { id: toCardId('c1'), family: 'instant', value: 7 };

  it('rejects an unknown family at compile time', () => {
    // @ts-expect-error 'yellow' n'est pas une CardFamily
    const card: Card = { ...validCard, family: 'yellow' };
    expect(card).toBeDefined();
  });

  it('rejects a string value at compile time', () => {
    // @ts-expect-error '12' est une chaîne, pas une CardValue
    const card: Card = { ...validCard, value: '12' };
    expect(card).toBeDefined();
  });

  it('rejects 0 as a value at compile time', () => {
    // @ts-expect-error 0 est sous l'intervalle des CardValue
    const card: Card = { ...validCard, value: 0 };
    expect(card).toBeDefined();
  });

  it('rejects 13 as a value at compile time', () => {
    // @ts-expect-error 13 est au-dessus de l'intervalle des CardValue
    const card: Card = { ...validCard, value: 13 };
    expect(card).toBeDefined();
  });

  it('rejects a raw string as CardId at compile time', () => {
    // @ts-expect-error une chaîne brute n'est pas un CardId
    const id: CardId = 'c1';
    expect(id).toBeDefined();
  });

  it('forbids changing a card value at compile time', () => {
    const card: Card = { ...validCard };
    // @ts-expect-error value est en lecture seule
    card.value = 5;
    expect(card).toBeDefined();
  });
});
