// Textes d'une règle : l'étiquette courte affichée sur son icône, et la
// phrase complète donnée au survol et aux lecteurs d'écran. Tous viennent du
// catalogue de traductions (NF-I18N-01).

import type { CardFamily, ClockRule, SectionRule } from "@quarter-bells/rules";
import type { IntlShape } from "react-intl";

/** Ce qu'il faut pour dessiner l'icône d'une règle. */
export interface RuleText {
  /** Type de la règle, pour choisir l'icône. */
  readonly kind: SectionRule["kind"] | ClockRule["kind"] | "noMaxSum";
  /** Étiquette courte, sur l'icône : les paramètres de la règle. */
  readonly label: string;
  /** Phrase complète : texte au survol et nom lu par un lecteur d'écran. */
  readonly description: string;
  /** Famille visée, pour ajouter son symbole à l'icône. */
  readonly family?: CardFamily;
}

/** Valeur de `family` pour les sélecteurs ICU : « any » si la règle n'en a pas. */
function familyKey(family: CardFamily | undefined): CardFamily | "any" {
  return family ?? "any";
}

/** Une règle de section. */
export function describeSectionRule(
  intl: IntlShape,
  rule: SectionRule,
): RuleText {
  switch (rule.kind) {
    case "minCardCount": {
      const { min, family } = rule.params;
      return {
        kind: rule.kind,
        label: intl.formatMessage({ id: "rule.minCardCount.label" }, { min }),
        description: intl.formatMessage(
          { id: "rule.minCardCount.description" },
          { min, family: familyKey(family) },
        ),
        ...(family === undefined ? {} : { family }),
      };
    }
    case "exactCardCount": {
      const { count, family } = rule.params;
      return {
        kind: rule.kind,
        label: intl.formatMessage(
          { id: "rule.exactCardCount.label" },
          { count },
        ),
        description: intl.formatMessage(
          { id: "rule.exactCardCount.description" },
          { count, family: familyKey(family) },
        ),
        ...(family === undefined ? {} : { family }),
      };
    }
    case "sumInRange": {
      const { min, max } = rule.params;
      return {
        kind: rule.kind,
        label: intl.formatMessage(
          { id: "rule.sumInRange.label" },
          { min, max },
        ),
        description: intl.formatMessage(
          { id: "rule.sumInRange.description" },
          { min, max },
        ),
      };
    }
    case "maxSum": {
      const { max } = rule.params;
      return {
        kind: rule.kind,
        label: intl.formatMessage({ id: "rule.maxSum.label" }, { max }),
        description: intl.formatMessage(
          { id: "rule.maxSum.description" },
          { max },
        ),
      };
    }
    case "firstPlacements": {
      // Les rangs sont comptés à partir de 0 dans l'horloge, à partir de 1
      // pour le joueur : la première pose est la pose n° 1.
      const ranks = intl.formatList(
        rule.params.placementIndexes.map((index) => String(index + 1)),
        { type: "conjunction" },
      );
      const count = rule.params.placementIndexes.length;
      return {
        kind: rule.kind,
        label: intl.formatMessage(
          { id: "rule.firstPlacements.label" },
          { ranks },
        ),
        description: intl.formatMessage(
          { id: "rule.firstPlacements.description" },
          { ranks, count },
        ),
      };
    }
  }
}

/**
 * Les règles de toute l'horloge : le plafond levé (`noMaxSum`), qui est une
 * propriété de l'horloge, puis ses règles centrales, dans leur ordre.
 */
export function describeClockRules(
  intl: IntlShape,
  noMaxSum: boolean,
  rules: readonly ClockRule[],
): readonly RuleText[] {
  const ceiling: readonly RuleText[] = noMaxSum
    ? [
        {
          kind: "noMaxSum",
          label: intl.formatMessage({ id: "rule.noMaxSum.label" }),
          description: intl.formatMessage({ id: "rule.noMaxSum.description" }),
        },
      ]
    : [];
  return [...ceiling, ...rules.map((rule) => describeClockRule(intl, rule))];
}

function describeClockRule(intl: IntlShape, rule: ClockRule): RuleText {
  switch (rule.kind) {
    case "maxSum": {
      const { max } = rule.params;
      return {
        kind: rule.kind,
        label: intl.formatMessage({ id: "rule.maxSum.label" }, { max }),
        description: intl.formatMessage(
          { id: "rule.clockMaxSum.description" },
          { max },
        ),
      };
    }
    case "ascendingOrder":
      return {
        kind: rule.kind,
        label: intl.formatMessage({ id: "rule.ascendingOrder.label" }),
        description: intl.formatMessage({
          id: "rule.ascendingOrder.description",
        }),
      };
  }
}
