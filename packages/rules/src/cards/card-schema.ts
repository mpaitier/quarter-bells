// Schémas des cartes, pour valider les données venant de JSON (horloges,
// cas de test). Construits à partir des listes de card.ts : ajouter une
// famille ou une valeur là-bas la rend valide ici sans autre changement.

import Type, { type Static } from "typebox";
import { CARD_FAMILIES, CARD_VALUES } from "./card.js";

/** Une famille de carte valide. */
export const CardFamilySchema = Type.Enum(CARD_FAMILIES);

/** Une valeur de carte valide (1 à 12). */
export const CardValueSchema = Type.Enum(CARD_VALUES);

/**
 * Ce que les règles lisent d'une carte : sa famille et sa valeur.
 * Sans identifiant : une règle n'a pas à savoir de quelle carte physique
 * il s'agit. Une Card complète est compatible avec ce type.
 */
export const CardFaceSchema = Type.Object(
  {
    family: CardFamilySchema,
    value: CardValueSchema,
  },
  { additionalProperties: false },
);
export type CardFace = Static<typeof CardFaceSchema>;
