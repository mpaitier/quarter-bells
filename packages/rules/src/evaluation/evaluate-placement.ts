import {
  SECTION_COUNT,
  type Clock,
  type ClockRule,
  type SectionRule,
} from "../clocks/clock.js";
import type { Placement } from "../placements/placement.js";
import { checkFirstPlacements } from "../rule-checks/first-placements.js";
import { compareViolations, type Violation } from "../rule-checks/violation.js";

/**
 * Évalue une pose proposée pendant la Pose, avant de l'accepter (ADR 0009).
 *
 * Applique les contraintes de pose de toutes les sections et de l'horloge.
 * Les conditions de réussite ne sont pas regardées : elles se jugent à la
 * Résolution, une fois toutes les cartes posées.
 *
 * Ne vérifie ni que c'est le tour du joueur, ni qu'il possède la carte, ni
 * qu'il reste des poses à faire : c'est le rôle de l'épreuve, qui appelle
 * cette fonction.
 *
 * Seule la structure de l'horloge (sections et clockRules) est lue : un test
 * n'a pas à construire une horloge entière.
 *
 * @param placements pose déjà faite, dans l'ordre des poses
 * @param candidate pose proposée ; son rang est placements.length
 * @returns toutes les violations, triées par règle puis par section ; liste
 * vide si la pose est acceptée
 * @throws {RangeError} si candidate vise une section hors de l'horloge
 */
export function evaluatePlacement(
  clock: Pick<Clock, "sections" | "clockRules">,
  placements: readonly Placement[],
  candidate: Placement,
): Violation[] {
  // Le type promet un index valide, mais seulement si la commande a été
  // validée. Une section inexistante produirait une violation fausse
  // (attemptedSection hors du cadran) : mieux vaut échouer ici.
  const isValidSection =
    Number.isInteger(candidate.sectionIndex) &&
    candidate.sectionIndex >= 0 &&
    candidate.sectionIndex < SECTION_COUNT;
  if (!isValidSection) {
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
    violations.push(...clockRuleAtPlacement(rule));
  }

  // Seul firstPlacements refuse pour l'instant, et les sections sont
  // parcourues dans l'ordre : le tri ne change encore rien. Il garantit
  // l'ordre attendu (règle, puis section) dès qu'une seconde règle refusera
  // pendant la Pose, comme les bornes hautes connues (F-JEU-21).
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
    case "firstPlacements": {
      const violation = checkFirstPlacements(
        section,
        placements,
        candidate,
        rule.params,
      );
      return violation === undefined ? [] : [violation];
    }

    // Bornes hautes connues (F-JEU-21) : une évaluation pendant la Pose est
    // prévue quand toutes les cartes de la section sont visibles. Elle fait
    // l'objet d'une issue séparée ; d'ici là, rien n'est refusé.
    case "maxSum":
    case "sumInRange":
      return [];

    // Conditions de réussite seulement : un nombre de cartes ne se juge
    // qu'une fois toutes les cartes posées.
    case "minCardCount":
    case "exactCardCount":
      return [];
  }
}

/**
 * Évaluation d'une règle d'horloge pendant la Pose. Aucune n'en a pour
 * l'instant, mais le switch oblige chaque nouveau kind à se déclarer, comme
 * pour les règles de section. Quand une règle d'horloge aura une évaluation
 * pendant la Pose, cette fonction recevra aussi la pose et la candidate.
 */
function clockRuleAtPlacement(rule: ClockRule): Violation[] {
  switch (rule.kind) {
    // Ordre des valeurs : jugé à la Résolution, sur toutes les cartes.
    case "ascendingOrder":
      return [];

    // Borne haute connue (F-JEU-21), comme maxSum en section.
    case "maxSum":
      return [];
  }
}
