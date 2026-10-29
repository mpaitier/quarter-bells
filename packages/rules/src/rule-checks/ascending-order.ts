import type { Static } from "typebox";
import { clockwiseOrder } from "../clocks/clockwise-order.js";
import type { AscendingOrderSchema } from "../clocks/rule-schemas.js";
import { placementsBySection, sectionValue } from "../placements/by-section.js";
import type { Placement } from "../placements/placement.js";
import type { AscendingOrderViolation } from "./violation.js";

/** Paramètres d'ascendingOrder (aucun), déduits du schéma de la règle. */
export type AscendingOrderParams = Static<
  typeof AscendingOrderSchema
>["params"];

/**
 * Vérifie que la valeur des sections ne diminue jamais dans le sens horaire,
 * en partant de `startSection`. Chaque section est comparée à celle qui la
 * précède immédiatement ; l'égalité est permise.
 *
 * La section de départ n'est comparée à aucune autre, et la dernière section
 * du parcours n'est pas comparée à la première : le parcours ne boucle pas.
 *
 * Une section vide vaut 0 et est comparée comme les autres (les règles sont
 * indépendantes, voir violation.ts).
 *
 * @returns les violations, dans l'ordre du parcours ; liste vide si la règle
 * est respectée
 * @throws {RangeError} si startSection n'est pas une section de l'horloge
 * (levée par clockwiseOrder)
 */
export function checkAscendingOrder(
  startSection: number,
  placements: readonly Placement[],
  params: AscendingOrderParams,
): AscendingOrderViolation[] {
  const bySection = placementsBySection(placements);
  const violations: AscendingOrderViolation[] = [];
  // Section précédente dans le parcours, absente au premier tour : la section
  // de départ n'est comparée à rien. Une variable plutôt qu'un accès
  // order[i - 1], que noUncheckedIndexedAccess typerait en T | undefined.
  let previous: { section: number; value: number } | undefined;

  for (const section of clockwiseOrder(startSection)) {
    // clockwiseOrder ne renvoie que des index valides et placementsBySection
    // a toujours SECTION_COUNT cases : le ?? [] ne sert qu'à satisfaire
    // noUncheckedIndexedAccess, il ne peut pas se produire.
    const value = sectionValue(bySection[section] ?? []);

    // Comparaison au voisin immédiat, pas au maximum vu jusque-là : avec
    // 5, 3, 4, seule la section à 3 est fautive.
    if (previous !== undefined && value < previous.value) {
      violations.push({
        kind: "ascendingOrder",
        params,
        section,
        value,
        previousSection: previous.section,
        previousValue: previous.value,
      });
    }

    previous = { section, value };
  }

  return violations;
}
