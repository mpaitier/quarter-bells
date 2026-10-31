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
    expect(() => parseClock(null, "ch03-clk1.json")).toThrow(/ch03-clk1\.json/);
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
});
