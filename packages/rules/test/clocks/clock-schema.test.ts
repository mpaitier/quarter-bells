import { describe, expect, expectTypeOf, it } from "vitest";
import type { Clock, ClockRule, SectionRule } from "../../src/clocks/clock.js";
import { ClockSchema } from "../../src/clocks/clock-schema.js";

// Ces tests vérifient des types, pas des valeurs : ils échouent à la
// compilation (pnpm typecheck), pas à l'exécution. Critère : « les types
// TypeScript correspondent au schéma ».
describe("clock types", () => {
  it("has exactly 6 sections", () => {
    expectTypeOf<Clock["sections"]["length"]>().toEqualTypeOf<6>();
  });

  // Si on ajoute un schéma à la table sans l'ajouter à l'union,
  // ou l'inverse, ce test le signale.
  it("lists the known section rule kinds", () => {
    expectTypeOf<SectionRule["kind"]>().toEqualTypeOf<
      | "minCardCount"
      | "maxSum"
      | "exactCardCount"
      | "sumInRange"
      | "firstPlacements"
    >();
  });

  it("lists the known clock rule kinds", () => {
    expectTypeOf<ClockRule["kind"]>().toEqualTypeOf<
      "ascendingOrder" | "maxSum"
    >();
  });

  it("rejects a candidate kind at compile time", () => {
    // @ts-expect-error familyOnly est un type candidat
    const rule: SectionRule = { kind: "familyOnly", params: {} };
    expect(rule).toBeDefined();
  });

  it("leaves family absent rather than undefined", () => {
    const rule: SectionRule = {
      kind: "exactCardCount",
      // @ts-expect-error exactOptionalPropertyTypes : undefined n'est pas « absent »
      params: { count: 1, family: undefined },
    };
    expect(rule).toBeDefined();
  });
});

describe("clock JSON Schema", () => {
  // Le fichier versionné doit être exactement ce que produit ClockSchema.
  // En local, `-u` le (re)génère. En CI, un fichier périmé fait échouer
  // le test : le schéma publié ne peut pas dériver de sa source.
  it("matches the committed file", async () => {
    const document = {
      $schema: "http://json-schema.org/draft-07/schema#",
      ...ClockSchema,
    };
    await expect(JSON.stringify(document, null, 2) + "\n").toMatchFileSnapshot(
      "../../schema/clock.schema.json",
    );
  });
});
