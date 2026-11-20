import type { ClockRule, SectionRule } from "@quarter-bells/rules";
import { createIntl } from "react-intl";
import { describe, expect, it } from "vitest";

import {
  describeClockRules,
  describeSectionRule,
} from "../../src/clock/rule-text";
import { CATALOGS, DEFAULT_LOCALE } from "../../src/i18n/locales";

const intl = createIntl({
  locale: DEFAULT_LOCALE,
  messages: CATALOGS[DEFAULT_LOCALE],
});

describe("describeSectionRule", () => {
  it.each<[SectionRule, string, string]>([
    [
      { kind: "minCardCount", params: { min: 2 } },
      "≥ 2",
      "Au moins 2 cartes devant cette section",
    ],
    [
      { kind: "minCardCount", params: { min: 1, family: "eternity" } },
      "≥ 1",
      "Au moins 1 carte Éternité devant cette section",
    ],
    [
      { kind: "exactCardCount", params: { count: 3 } },
      "= 3",
      "Exactement 3 cartes devant cette section",
    ],
    [
      { kind: "exactCardCount", params: { count: 1, family: "instant" } },
      "= 1",
      "Exactement 1 carte Instant devant cette section",
    ],
    [
      { kind: "exactCardCount", params: { count: 0, family: "eternity" } },
      "= 0",
      "Aucune carte Éternité devant cette section",
    ],
    [
      { kind: "sumInRange", params: { min: 9, max: 15 } },
      "9–15",
      "La section vaut entre 9 et 15",
    ],
    [
      { kind: "maxSum", params: { max: 9 } },
      "≤ 9",
      "La section vaut au plus 9",
    ],
    [
      { kind: "firstPlacements", params: { placementIndexes: [2] } },
      "n° 3",
      "La pose n° 3 se fait devant cette section",
    ],
    [
      { kind: "firstPlacements", params: { placementIndexes: [0, 3] } },
      "n° 1 et 4",
      "Les poses n° 1 et 4 se font devant cette section",
    ],
  ])("describes %o", (rule, label, description) => {
    expect(describeSectionRule(intl, rule)).toMatchObject({
      kind: rule.kind,
      label,
      description,
    });
  });

  it("keeps the family, to draw its symbol", () => {
    expect(
      describeSectionRule(intl, {
        kind: "exactCardCount",
        params: { count: 1, family: "instant" },
      }).family,
    ).toBe("instant");
    expect(
      describeSectionRule(intl, { kind: "minCardCount", params: { min: 1 } }),
    ).not.toHaveProperty("family");
  });
});

describe("describeClockRules", () => {
  it("is empty for a clock with the ceiling and no central rule", () => {
    expect(describeClockRules(intl, false, [])).toEqual([]);
  });

  it("starts with the lifted ceiling, then the central rules", () => {
    const rules: ClockRule[] = [
      { kind: "maxSum", params: { max: 20 } },
      { kind: "ascendingOrder", params: {} },
    ];
    expect(describeClockRules(intl, true, rules)).toEqual([
      {
        kind: "noMaxSum",
        label: "24+",
        description:
          "Pas de plafond de 24 : une section peut valoir plus de 24",
      },
      {
        kind: "maxSum",
        label: "≤ 20",
        description: "Chaque section vaut au plus 20",
      },
      {
        kind: "ascendingOrder",
        label: "↗",
        description:
          "Les sections vont en ordre croissant, à partir de la section de départ",
      },
    ]);
  });
});
