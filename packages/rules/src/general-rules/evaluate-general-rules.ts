import type { Clock } from "../clocks/clock.js";
import { placementsBySection } from "../placements/by-section.js";
import type { Placement } from "../placements/placement.js";
import { checkAscendingOrder } from "./ascending-order.js";
import { checkMaxSum, type MaxSumParams } from "./max-sum.js";
import {
  checkMinCardCount,
  type MinCardCountParams,
} from "./min-card-count.js";
import type { Violation } from "./violation.js";

/** Plafond appliqué à chaque section, sauf si l'horloge a noMaxSum. */
export const DEFAULT_MAX_SUM = 24;

/** Règle générale : au moins une carte devant chaque section. */
const GENERAL_MIN_CARD_COUNT: MinCardCountParams = { min: 1 };

/** Règle générale : aucune section au-dessus du plafond par défaut. */
const GENERAL_MAX_SUM: MaxSumParams = { max: DEFAULT_MAX_SUM };

/**
 * Rang de chaque règle dans le résultat trié. Un Record sur le type des kind
 * oblige à classer toute nouvelle violation : un kind oublié ici fait
 * échouer typecheck.
 */
const KIND_RANK: Record<Violation["kind"], number> = {
  minCardCount: 0,
  ascendingOrder: 1,
  maxSum: 2,
};

/** Compare deux violations : par règle, puis par section. */
function byKindThenSection(a: Violation, b: Violation): number {
  return KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.section - b.section;
}

/**
 * Évalue les trois règles communes à toutes les épreuves sur une pose
 * complète :
 * - minCardCount : au moins une carte devant chaque section ;
 * - ascendingOrder : valeurs croissantes dans le sens horaire depuis
 *   startSection ;
 * - maxSum : aucune section au-dessus de DEFAULT_MAX_SUM, sauf si l'horloge
 *   a noMaxSum.
 *
 * Les règles sont indépendantes : une section vide peut produire à la fois
 * minCardCount et ascendingOrder.
 *
 * Seul noMaxSum est lu dans l'horloge : la fonction ne dépend pas du reste
 * du format, et un test n'a pas à construire une horloge entière.
 *
 * @param startSection section de départ du parcours. Passée à part, car
 * elle peut être choisie par les joueurs (startSectionMode chosenByPlayers).
 * @returns toutes les violations, triées par règle puis par section ;
 * liste vide si la pose respecte les règles générales
 * @throws {RangeError} si startSection n'est pas une section de l'horloge
 */
export function evaluateGeneralRules(
  clock: Pick<Clock, "noMaxSum">,
  startSection: number,
  placements: readonly Placement[],
): Violation[] {
  const bySection = placementsBySection(placements);
  const violations: Violation[] = [];

  bySection.forEach((sectionPlacements, section) => {
    const violation = checkMinCardCount(
      section,
      sectionPlacements,
      GENERAL_MIN_CARD_COUNT,
    );
    if (violation !== undefined) {
      violations.push(violation);
    }
  });

  violations.push(...checkAscendingOrder(startSection, placements, {}));

  // noMaxSum est une propriété de l'horloge : c'est ici, et pas dans la
  // règle, qu'on décide de l'appliquer ou non.
  if (!clock.noMaxSum) {
    bySection.forEach((sectionPlacements, section) => {
      const violation = checkMaxSum(
        section,
        sectionPlacements,
        GENERAL_MAX_SUM,
      );
      if (violation !== undefined) {
        violations.push(violation);
      }
    });
  }

  // toSorted renvoie une copie triée : l'ordre de calcul ci-dessus n'a pas
  // à être celui du résultat, qui doit rester stable pour l'interface et
  // les tests.
  return violations.toSorted(byKindThenSection);
}
