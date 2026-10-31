import {
  SECTION_COUNT,
  type Clock,
  type ClockRule,
  type SectionRule,
} from "../clocks/clock.js";
import { clockwiseOrder } from "../clocks/clockwise-order.js";
import { evaluateGeneralRules } from "../general-rules/evaluate-general-rules.js";
import { sectionValue } from "../placements/by-section.js";
import type { Placement } from "../placements/placement.js";
import { checkExactCardCount } from "../rule-checks/exact-card-count.js";
import { checkMaxSum } from "../rule-checks/max-sum.js";
import { checkMinCardCount } from "../rule-checks/min-card-count.js";
import { checkSumInRange } from "../rule-checks/sum-in-range.js";
import {
  compareViolations,
  listOf,
  type Violation,
} from "../rule-checks/violation.js";

/** Index de toutes les sections, de 0 à 5. */
const ALL_SECTIONS = Array.from({ length: SECTION_COUNT }, (_, index) => index);

/** Une section telle qu'elle est révélée à la Résolution (F-JEU-12). */
export interface SectionReveal<P extends Placement = Placement> {
  readonly section: number;
  /** Cartes posées devant la section, dans l'ordre des poses. */
  readonly placements: readonly P[];
  /** Somme des cartes. 0 si la section est vide. */
  readonly value: number;
  /**
   * La section respecte l'ordre croissant : sa valeur n'est pas inférieure
   * à celle de la section révélée juste avant. Toujours vrai pour la
   * section de départ. Le client s'en sert pour la couleur de la somme.
   */
  readonly ascending: boolean;
}

/** Résultat de la Résolution d'une pose complète. */
export interface ResolutionReport<P extends Placement = Placement> {
  /** Aucune violation : l'épreuve est réussie. */
  readonly succeeded: boolean;
  /** Les six sections, dans l'ordre de révélation. */
  readonly sections: readonly SectionReveal<P>[];
  /** Toutes les conditions non remplies, triées par règle puis par section. */
  readonly violations: readonly Violation[];
}

/**
 * Évalue une pose complète à la Résolution (ADR 0009, second moment).
 *
 * Applique les règles générales (evaluateGeneralRules) puis les conditions
 * de réussite propres à l'horloge, en section et au niveau de l'horloge.
 * Les sections sont rendues dans l'ordre de révélation : sens horaire depuis
 * startSection.
 *
 * Générique sur le type des placements : un placement d'épreuve, qui porte
 * aussi le joueur et l'identifiant de la carte, ressort tel quel dans le
 * rapport, sans perdre ces champs.
 *
 * @throws {RangeError} si startSection ou un placement vise une section hors
 * de l'horloge
 */
export function evaluateResolution<P extends Placement>(
  clock: Pick<Clock, "sections" | "clockRules" | "noMaxSum">,
  startSection: number,
  placements: readonly P[],
): ResolutionReport<P> {
  // En premier : valide startSection et les sections des placements, et
  // fournit les violations d'ascendingOrder dont dépend le champ ascending.
  const generalViolations = evaluateGeneralRules(
    clock,
    startSection,
    placements,
  );

  // Filtre à la main plutôt que placementsBySection, qui renvoie des
  // Placement : on perdrait le type P et les champs en plus.
  const placementsOf = (section: number): P[] =>
    placements.filter((placement) => placement.sectionIndex === section);

  const violations: Violation[] = [...generalViolations];
  for (const section of clock.sections) {
    const sectionPlacements = placementsOf(section.index);
    for (const rule of section.rules) {
      violations.push(
        ...sectionRuleAtResolution(section.index, rule, sectionPlacements),
      );
    }
  }
  for (const rule of clock.clockRules) {
    violations.push(...clockRuleAtResolution(rule, placementsOf));
  }

  const sections = clockwiseOrder(startSection).map((section) => {
    const sectionPlacements = placementsOf(section);
    return {
      section,
      placements: sectionPlacements,
      value: sectionValue(sectionPlacements),
      ascending: !generalViolations.some(
        (violation) =>
          violation.kind === "ascendingOrder" && violation.section === section,
      ),
    };
  });

  return {
    succeeded: violations.length === 0,
    sections,
    // À égalité (même kind, même section), l'ordre de calcul est conservé :
    // règles générales, puis de section, puis d'horloge.
    violations: violations.toSorted(compareViolations),
  };
}

/**
 * Évaluation d'une règle de section à la Résolution. Un case par kind, sans
 * default : le lint oblige chaque nouveau type à se déclarer (ADR 0009).
 */
function sectionRuleAtResolution(
  section: number,
  rule: SectionRule,
  placements: readonly Placement[],
): Violation[] {
  switch (rule.kind) {
    case "minCardCount":
      return listOf(checkMinCardCount(section, placements, rule.params));
    case "maxSum":
      return listOf(checkMaxSum(section, placements, rule.params));
    case "exactCardCount":
      return listOf(checkExactCardCount(section, placements, rule.params));
    case "sumInRange":
      return listOf(checkSumInRange(section, placements, rule.params));

    // Contrainte de pose pure : une pose qui la violait a été refusée, elle
    // est donc forcément respectée ici.
    case "firstPlacements":
      return [];
  }
}

/** Évaluation d'une règle d'horloge à la Résolution. */
function clockRuleAtResolution(
  rule: ClockRule,
  placementsOf: (section: number) => readonly Placement[],
): Violation[] {
  switch (rule.kind) {
    // Déjà appliquée comme règle générale à toute épreuve. Une horloge qui
    // l'écrit quand même ne doit pas produire chaque violation deux fois.
    case "ascendingOrder":
      return [];

    // Une règle d'horloge vaut pour chaque section.
    case "maxSum":
      return ALL_SECTIONS.flatMap((section) =>
        listOf(checkMaxSum(section, placementsOf(section), rule.params)),
      );
  }
}
