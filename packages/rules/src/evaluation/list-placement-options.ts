import type { Card, CardId } from "../cards/card.js";
import type { Clock } from "../clocks/clock.js";
import { SECTION_INDEXES } from "../clocks/section.js";
import type { PublicPlacement } from "../placements/placement.js";
import type { Violation } from "../rule-checks/violation.js";
import {
  evaluatePlacement,
  isKnownBoundViolation,
} from "./evaluate-placement.js";

/**
 * Une pose envisageable : une carte de la main devant une section, et ce que
 * le moteur en dit.
 *
 * La face n'y figure pas : elle ne change pas l'évaluation (le joueur connaît
 * la valeur de sa carte même posée face cachée). Poser face visible dépend
 * seulement des bougies restantes, que l'appelant lit avec availableCandles.
 */
export interface PlacementOption {
  readonly cardId: CardId;
  readonly sectionIndex: number;
  /** L'épreuve accepterait cette pose. */
  readonly permitted: boolean;
  /**
   * Toutes les violations de la pose, triées comme celles d'evaluatePlacement.
   * Une pose permise peut en avoir : ce sont alors des bornes connues que le
   * joueur est contraint de franchir (ADR 0011), et l'épreuve échouera à la
   * Résolution. Le client peut s'en servir pour avertir le joueur.
   */
  readonly violations: readonly Violation[];
}

/**
 * Liste les poses du joueur dont c'est le tour : chaque carte de sa main
 * devant chaque section, permise ou non (F-JEU-08).
 *
 * Applique l'exception de l'ADR 0011 : quand aucune pose n'est entièrement
 * permise, une pose refusée seulement par des bornes hautes connues devient
 * permise. Les contraintes de pose (firstPlacements) ne cèdent jamais.
 *
 * Ne lit que des informations publiques et la main du joueur (ADR 0016) : le
 * client l'appelle avec sa vue, le serveur avec l'état complet. Ne vérifie ni
 * le tour, ni la phase : c'est le rôle de l'épreuve.
 *
 * @param placements pose déjà faite, dans l'ordre des poses
 * @param hand cartes jouables du joueur (sans la réserve)
 * @returns une option par carte et par section : cartes dans l'ordre de la
 * main, puis sections de 0 à 5 ; liste vide si la main est vide
 */
export function listPlacementOptions(
  clock: Pick<Clock, "sections" | "clockRules" | "noMaxSum">,
  placements: readonly PublicPlacement[],
  hand: readonly Card[],
): PlacementOption[] {
  // Première passe : les violations de chaque pose, sans exception. Seules
  // les poses face cachée sont évaluées, la face ne change rien.
  const evaluated = hand.flatMap((card) =>
    SECTION_INDEXES.map((sectionIndex) => ({
      cardId: card.id,
      sectionIndex,
      violations: evaluatePlacement(clock, placements, {
        sectionIndex,
        card,
        faceUp: false,
      }),
    })),
  );

  // L'exception ne dépend que de l'ensemble des poses : on la calcule une
  // fois, pas pour chaque option.
  const someFullyPermitted = evaluated.some(
    (option) => option.violations.length === 0,
  );

  // Seconde passe : la décision, qui a besoin de toutes les évaluations.
  return evaluated.map((option) => ({
    ...option,
    permitted:
      option.violations.length === 0 ||
      (!someFullyPermitted && option.violations.every(isKnownBoundViolation)),
  }));
}
