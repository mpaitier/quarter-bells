/** Les deux familles de cartes du jeu. */
export const CARD_FAMILIES = ['instant', 'eternity'] as const;
export type CardFamily = (typeof CARD_FAMILIES)[number];

/** Les valeurs possibles d'une carte, de 1 à 12. */
export const CARD_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type CardValue = (typeof CARD_VALUES)[number];

declare const cardIdBrand: unique symbol;

/**
 * Identifiant opaque d’une carte. Il ne porte aucune information de jeu ;
 * ce que chaque joueur voit d'une carte est décidé séparément.
 */
export type CardId = string & { readonly [cardIdBrand]: true };

/** Seul point d'entrée autorisé pour transformer une chaîne en CardId. */
export function toCardId(raw: string): CardId {
  return raw as CardId;
}

/** Une carte du jeu. */
export interface Card {
  readonly id: CardId;
  readonly family: CardFamily;
  readonly value: CardValue;
}

/** Vérifie qu'une valeur inconnue est une famille de carte valide. */
export function isCardFamily(value: unknown): value is CardFamily {
  return (CARD_FAMILIES as readonly unknown[]).includes(value);
}
