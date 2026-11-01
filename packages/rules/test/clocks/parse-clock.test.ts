import { describe, expect, it } from "vitest";
import { parseClock } from "../../src/clocks/parse-clock.js";
import { InvalidClockError } from "../../src/errors.js";
// Import direct du JSON : pas de lecture de fichier, le paquet reste
// sans dépendance à Node. `with { type: "json" }` indique la nature du fichier.
import exampleClock from "../fixtures/clocks/example-clock.json" with { type: "json" };
import playersChoiceClock from "../fixtures/clocks/players-choice-clock.json" with { type: "json" };

/** Copie de l'horloge valide où la section donnée n'a qu'une règle. */
const withSectionRule = (sectionIndex: number, rule: unknown) => ({
  ...exampleClock,
  sections: exampleClock.sections.map((section) =>
    section.index === sectionIndex ? { ...section, rules: [rule] } : section,
  ),
});

/** Copie de l'horloge valide sans le champ donné. */
const withoutField = (field: string) =>
  Object.fromEntries(
    Object.entries(exampleClock).filter(([key]) => key !== field),
  );

/**
 * Renvoie les anomalies trouvées par parseClock.
 * Échoue si parseClock accepte l'horloge, ou lève une autre erreur
 * qu'InvalidClockError : dans les deux cas, le test doit casser.
 */
function issuesOf(
  input: unknown,
): readonly { path: string; message: string }[] {
  try {
    parseClock(input, "broken.json");
  } catch (error) {
    if (error instanceof InvalidClockError) return error.issues;
    throw error;
  }
  throw new Error("expected parseClock to reject the clock");
}

describe("parseClock", () => {
  // Cas nominaux : chaque fixture valide se charge, et l'objet rendu est
  // identique. Une fixture par combinaison de champs qu'on veut couvrir :
  // example-clock couvre le mode fixed, players-choice-clock le mode
  // chosenByPlayers, family, firstPlacements et deux règles par section.
  it.each([
    ["example-clock.json", exampleClock],
    ["players-choice-clock.json", playersChoiceClock],
  ])("loads %s", (source, clock) => {
    expect(parseClock(clock, source)).toEqual(clock);
  });

  // Chaque ligne : nom du cas, horloge cassée, chemin attendu dans l'erreur.
  // <[string, unknown, string]> indique à TypeScript la forme de chaque ligne.
  it.each<[string, unknown, string]>([
    // Critère : 5 ou 7 sections.
    [
      "5 sections",
      { ...exampleClock, sections: exampleClock.sections.slice(0, 5) },
      "/sections",
    ],
    [
      "7 sections",
      {
        ...exampleClock,
        sections: [...exampleClock.sections, { index: 6, rules: [] }],
      },
      "/sections/6",
    ],
    // Critère : index de section mal placés.
    [
      "swapped sections",
      {
        ...exampleClock,
        sections: exampleClock.sections.map((s) =>
          s.index === 1
            ? { ...s, index: 2 }
            : s.index === 2
              ? { ...s, index: 1 }
              : s,
        ),
      },
      "/sections/1/index",
    ],
    // Critère : kind inconnu. familyOnly est un type candidat, donc refusé.
    [
      "an unknown kind",
      withSectionRule(0, {
        kind: "familyOnly",
        params: { family: "eternity" },
      }),
      "/sections/0/rules/0/kind",
    ],
    // Portée : une règle connue, mais au mauvais endroit.
    [
      "a clock rule in a section",
      withSectionRule(0, { kind: "ascendingOrder", params: {} }),
      "/sections/0/rules/0/kind",
    ],
    [
      "a section rule in clockRules",
      {
        ...exampleClock,
        clockRules: [{ kind: "minCardCount", params: { min: 1 } }],
      },
      "/clockRules/0/kind",
    ],
    // Critère : params invalides, sous toutes leurs formes.
    [
      "a param of the wrong type",
      withSectionRule(0, { kind: "minCardCount", params: { min: "2" } }),
      "/sections/0/rules/0/params/min",
    ],
    [
      "an unexpected param",
      withSectionRule(0, { kind: "minCardCount", params: { min: 2, max: 3 } }),
      "/sections/0/rules/0/params/max",
    ],
    [
      "a missing param",
      withSectionRule(0, { kind: "sumInRange", params: { min: 2 } }),
      "/sections/0/rules/0/params",
    ],
    [
      "min greater than max",
      withSectionRule(0, { kind: "sumInRange", params: { min: 10, max: 6 } }),
      "/sections/0/rules/0/params",
    ],
    [
      "duplicate placement indexes",
      withSectionRule(0, {
        kind: "firstPlacements",
        params: { placementIndexes: [0, 0] },
      }),
      "/sections/0/rules/0/params/placementIndexes",
    ],
    [
      "an unknown family",
      withSectionRule(0, {
        kind: "exactCardCount",
        params: { count: 1, family: "noon" },
      }),
      "/sections/0/rules/0/params/family",
    ],
    // minCardCount partage le schéma de famille d'exactCardCount : une
    // famille inconnue doit y être refusée de la même façon.
    [
      "an unknown family on minCardCount",
      withSectionRule(0, {
        kind: "minCardCount",
        params: { min: 1, family: "noon" },
      }),
      "/sections/0/rules/0/params/family",
    ],
    // Critère : section de départ hors de 0 à 5, aux deux bornes.
    [
      "a start section of -1",
      { ...exampleClock, defaultStartSection: -1 },
      "/defaultStartSection",
    ],
    [
      "a start section of 6",
      { ...exampleClock, defaultStartSection: 6 },
      "/defaultStartSection",
    ],
    ["a chapter of 11", { ...exampleClock, chapter: 11 }, "/chapter"],
    // Un champ obligatoire manquant est signalé sur l'objet qui le contient,
    // ici la racine (chemin vide).
    ["a missing field", withoutField("noMaxSum"), ""],
    // « Aucune donnée de partie » dans le format (clock-format.md).
    ["a game state field", { ...exampleClock, placements: [] }, "/placements"],
  ])("rejects a clock with %s", (_label, input, expectedPath) => {
    expect(issuesOf(input).map((issue) => issue.path)).toContain(expectedPath);
  });

  it("rejects a value that is not an object", () => {
    expect(issuesOf(null).map((issue) => issue.path)).toContain("");
  });

  // Critère : le message indique le fichier.
  it("names the source file in the error message", () => {
    expect(() => parseClock(null, "players-choice-clock.json")).toThrow(
      /players-choice-clock\.json/,
    );
  });

  // Deux erreurs à deux endroits : les deux doivent remonter ensemble.
  it("reports every issue at once", () => {
    const input = {
      ...withSectionRule(0, { kind: "familyOnly", params: {} }),
      clockRules: [{ kind: "nope", params: {} }],
    };
    expect(issuesOf(input)).toHaveLength(2);
  });

  // Contrôle sémantique de sumInRange (checkSemantics) : min <= max.
  // La liste plus haut vérifie que min > max est refusé ; ces deux tests
  // fixent la borne exacte du contrôle.
  describe("sumInRange bounds", () => {
    it("accepts min equal to max", () => {
      // Égalité : la section doit valoir exactement cette valeur. Si le
      // contrôle utilisait >= au lieu de >, ce test échouerait.
      const clock = withSectionRule(0, {
        kind: "sumInRange",
        params: { min: 7, max: 7 },
      });
      expect(parseClock(clock, "equal-bounds.json")).toEqual(clock);
    });

    it("reports min greater than max as a single semantic issue", () => {
      // toEqual sur la liste entière, pas seulement sur le chemin : on vérifie
      // que l'erreur vient bien du contrôle sémantique, et que le schéma n'en
      // a pas signalé d'autre au même endroit.
      const clock = withSectionRule(0, {
        kind: "sumInRange",
        params: { min: 8, max: 7 },
      });
      expect(issuesOf(clock)).toEqual([
        {
          path: "/sections/0/rules/0/params",
          message: "min must be less than or equal to max",
        },
      ]);
    });
  });

  // Contrôle sémantique de firstPlacements : un rang ne peut être imposé que
  // par une seule section, sinon l'épreuve se bloque à ce rang.
  describe("firstPlacements ranks", () => {
    /** Copie de l'horloge valide avec un firstPlacements sur deux sections. */
    const withRanks = (
      first: { section: number; ranks: number[] },
      second: { section: number; ranks: number[] },
    ) => ({
      ...exampleClock,
      sections: exampleClock.sections.map((section) => {
        const rules = [first, second]
          .filter((entry) => entry.section === section.index)
          .map((entry) => ({
            kind: "firstPlacements",
            params: { placementIndexes: entry.ranks },
          }));
        return rules.length > 0 ? { ...section, rules } : section;
      }),
    });

    it("rejects a rank required on two sections", () => {
      // Le rang 3 est imposé en section 1 puis en section 4 : l'erreur est
      // signalée sur la seconde, et nomme la première.
      const clock = withRanks(
        { section: 1, ranks: [0, 3] },
        { section: 4, ranks: [3] },
      );
      expect(issuesOf(clock)).toEqual([
        {
          path: "/sections/4/rules/0/params/placementIndexes",
          message: "placement rank 3 is already required on section 1",
        },
      ]);
    });

    it("accepts different ranks on different sections", () => {
      const clock = withRanks(
        { section: 1, ranks: [0, 3] },
        { section: 4, ranks: [1] },
      );
      expect(parseClock(clock, "distinct-ranks.json")).toEqual(clock);
    });

    it("accepts the same rank twice on the same section", () => {
      // Redondant mais jouable : la pose de rang 2 va en section 1, ce qui
      // satisfait les deux règles.
      const clock = withRanks(
        { section: 1, ranks: [2] },
        { section: 1, ranks: [2] },
      );
      expect(parseClock(clock, "same-section.json")).toEqual(clock);
    });
  });

  // Règle de conception : pas de pose imposée et de borne de valeur sur la
  // même section (docs/clock-format.md).
  describe("placement and value bound on one section", () => {
    /** Copie de l'horloge valide avec ces règles en section 2, vide au départ. */
    const withSection2 = (rules: unknown[]) => ({
      ...exampleClock,
      sections: exampleClock.sections.map((section) =>
        section.index === 2 ? { ...section, rules } : section,
      ),
    });
    const firstPlacements = {
      kind: "firstPlacements",
      params: { placementIndexes: [0] },
    };

    it.each([
      ["maxSum", { kind: "maxSum", params: { max: 9 } }],
      ["sumInRange", { kind: "sumInRange", params: { min: 4, max: 9 } }],
    ])("rejects %s next to firstPlacements", (kind, bound) => {
      // La borne est en position 1 : c'est elle que l'erreur désigne.
      expect(issuesOf(withSection2([firstPlacements, bound]))).toEqual([
        {
          path: "/sections/2/rules/1/kind",
          message: `${kind} cannot bound a section that requires placements (firstPlacements)`,
        },
      ]);
    });

    it("accepts a card count next to firstPlacements", () => {
      // Nombre et famille de cartes restent combinables avec une pose
      // imposée : ils ne dépendent pas de la valeur des cartes.
      const clock = withSection2([
        firstPlacements,
        { kind: "exactCardCount", params: { count: 2, family: "instant" } },
      ]);
      expect(parseClock(clock, "count-and-placement.json")).toEqual(clock);
    });

    it("accepts a value bound on another section", () => {
      // example-clock borne déjà la section 1 (sumInRange) : la pose imposée
      // en section 2 ne la concerne pas.
      const clock = withSection2([firstPlacements]);
      expect(parseClock(clock, "separate-sections.json")).toEqual(clock);
    });
  });
});
