import type { Clock, ClockRule, SectionRule } from "../clocks/clock.js";
import { isSectionIndex } from "../clocks/section.js";
import { GENERAL_MAX_SUM } from "../general-rules/evaluate-general-rules.js";
import type { Placement } from "../placements/placement.js";
import { checkFirstPlacements } from "../rule-checks/first-placements.js";
import { checkMaxSumAtPlacement } from "../rule-checks/max-sum.js";
import { checkSumInRangeAtPlacement } from "../rule-checks/sum-in-range.js";
import {
  compareViolations,
  listOf,
  type Violation,
} from "../rule-checks/violation.js";

/**
 * Évalue une pose proposée pendant la Pose, avant de l'accepter (ADR 0009).
 *
 * Applique les contraintes de pose de toutes les sections et de l'horloge,
 * et les bornes hautes connues (F-JEU-21) : plafond général de 24 (sauf
 * noMaxSum), règles maxSum et maximum de sumInRange, quand toutes les cartes
 * de la section visée sont face visible. Le reste des conditions de réussite
 * se juge à la Résolution, une fois toutes les cartes posées.
 *
 * Ne vérifie ni que c'est le tour du joueur, ni qu'il possède la carte, ni
 * qu'il reste des poses à faire : c'est le rôle de l'épreuve, qui appelle
 * cette fonction.
 *
 * Seuls sections, clockRules et noMaxSum sont lus dans l'horloge : un test
 * n'a pas à construire une horloge entière.
 *
 * @param placements pose déjà faite, dans l'ordre des poses
 * @param candidate pose proposée ; son rang est placements.length
 * @returns toutes les violations, triées par règle puis par section ; liste
 * vide si la pose est acceptée
 * @throws {RangeError} si candidate vise une section hors de l'horloge
 */
export function evaluatePlacement(
  clock: Pick<Clock, "sections" | "clockRules" | "noMaxSum">,
  placements: readonly Placement[],
  candidate: Placement,
): Violation[] {
  // Le type promet un index valide, mais seulement si la commande a été
  // validée. Une section inexistante produirait une violation fausse
  // (attemptedSection hors du cadran) : mieux vaut échouer ici.
  if (!isSectionIndex(candidate.sectionIndex)) {
    throw new RangeError(
      `Candidate targets an unknown section: ${String(candidate.sectionIndex)}`,
    );
  }

  const violations: Violation[] = [];

  // Toutes les sections, pas seulement celle visée : firstPlacements refuse
  // justement une pose faite AILLEURS que sur la section qui porte la règle.
  for (const section of clock.sections) {
    for (const rule of section.rules) {
      violations.push(
        ...sectionRuleAtPlacement(section.index, rule, placements, candidate),
      );
    }
  }

  for (const rule of clock.clockRules) {
    violations.push(...clockRuleAtPlacement(rule, placements, candidate));
  }

  // Plafond général : propriété de l'horloge, pas une règle (voir
  // evaluateGeneralRules). Seule la section visée peut changer de valeur.
  if (!clock.noMaxSum) {
    violations.push(
      ...listOf(
        checkMaxSumAtPlacement(
          candidate.sectionIndex,
          placements,
          candidate,
          GENERAL_MAX_SUM,
        ),
      ),
    );
  }

  // Ordre stable pour le client et les tests : par règle, puis par section.
  // À égalité (deux maxSum sur la même section), l'ordre de calcul est
  // conservé : règles de section, puis d'horloge, puis plafond général.
  return violations.toSorted(compareViolations);
}

/**
 * Évaluation d'une règle de section pendant la Pose : les violations
 * produites, liste vide si la règle ne refuse rien ou n'a pas d'évaluation
 * à ce moment-là.
 *
 * Chaque kind doit avoir son case, sans default : le lint
 * (switch-exhaustiveness-check) oblige ainsi tout nouveau type de règle à
 * dire s'il a une évaluation pendant la Pose. C'est ici que se lit la nature
 * d'un type, qui n'est pas écrite dans l'horloge (clock-format.md).
 */
function sectionRuleAtPlacement(
  section: number,
  rule: SectionRule,
  placements: readonly Placement[],
  candidate: Placement,
): Violation[] {
  switch (rule.kind) {
    case "firstPlacements":
      return listOf(
        checkFirstPlacements(section, placements, candidate, rule.params),
      );

    // Bornes hautes connues (F-JEU-21) : seul le maximum, et seulement si
    // toutes les cartes de la section sont visibles.
    case "maxSum":
      return listOf(
        checkMaxSumAtPlacement(section, placements, candidate, rule.params),
      );
    case "sumInRange":
      return listOf(
        checkSumInRangeAtPlacement(section, placements, candidate, rule.params),
      );

    // Conditions de réussite seulement : un nombre de cartes ne se juge
    // qu'une fois toutes les cartes posées.
    case "minCardCount":
    case "exactCardCount":
      return [];
  }
}

/**
 * Évaluation d'une règle d'horloge pendant la Pose. Même principe que pour
 * les règles de section : un case par kind, sans default.
 */
function clockRuleAtPlacement(
  rule: ClockRule,
  placements: readonly Placement[],
  candidate: Placement,
): Violation[] {
  switch (rule.kind) {
    // Ordre des valeurs : jugé à la Résolution, sur toutes les cartes.
    case "ascendingOrder":
      return [];

    // Borne haute connue (F-JEU-21). Une règle d'horloge vaut pour chaque
    // section, mais seule la section visée change de valeur.
    case "maxSum":
      return listOf(
        checkMaxSumAtPlacement(
          candidate.sectionIndex,
          placements,
          candidate,
          rule.params,
        ),
      );
  }
}
