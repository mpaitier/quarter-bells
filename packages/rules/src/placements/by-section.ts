import { SECTION_COUNT } from "../clocks/clock.js";
import type { Placement } from "./placement.js";

/**
 * Regroupe les placements par section, en conservant l'ordre de pose dans
 * chaque section. Le résultat a toujours SECTION_COUNT cases, y compris pour
 * les sections vides.
 *
 * @throws {RangeError} si un placement vise une section hors de l'horloge
 */
export function placementsBySection(
  placements: readonly Placement[],
): Placement[][] {
  // Une liste vide par section. Array.from appelle la fonction à chaque case :
  // chaque section a SA propre liste (contrairement à fill([])).
  const bySection: Placement[][] = Array.from(
    { length: SECTION_COUNT },
    () => [],
  );

  for (const placement of placements) {
    const section = bySection[placement.sectionIndex];
    // Le type promet un index valide, mais seulement si la pose a été validée.
    // Mieux vaut échouer ici que perdre une carte sans prévenir.
    if (section === undefined) {
      throw new RangeError(
        `Placement targets an unknown section: ${String(placement.sectionIndex)}`,
      );
    }
    section.push(placement);
  }

  return bySection;
}
/** Valeur d'une section : somme des valeurs de ses cartes. 0 si elle est vide. */
export function sectionValue(placements: readonly Placement[]): number {
  return placements.reduce(
    (total, placement) => total + placement.sectionIndex,
    0,
  );
}
