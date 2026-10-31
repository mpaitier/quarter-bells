import Type from "typebox";
import { SECTION_COUNT } from "./clock.js";

/** Index d'une section, de 0 à SECTION_COUNT - 1. */
export const SectionIndexSchema = Type.Integer({
  minimum: 0,
  maximum: SECTION_COUNT - 1,
});

/**
 * Vérifie qu'un nombre est un index de section : un entier de 0 à
 * SECTION_COUNT - 1. Pour les valeurs venues de l'extérieur, que le type
 * number ne garantit pas.
 */
export function isSectionIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < SECTION_COUNT;
}
