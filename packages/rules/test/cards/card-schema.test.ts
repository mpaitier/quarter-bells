import { describe, expect, expectTypeOf, it } from "vitest";
import { Value } from "typebox/value"; // même import que dans violation.test.ts
import type { Card, CardFamily, CardValue } from "../../src/cards/card.js";
import { CardFaceSchema, type CardFace } from "../../src/cards/card-schema.js";

// Ces tests vérifient des types, pas des valeurs : ils échouent à la
// compilation (pnpm typecheck), pas à l'exécution.
describe("card face types", () => {
  // Les règles reçoivent des CardFace, le jeu manipule des Card. Si les deux
  // divergent (champ renommé, valeurs différentes), une Card ne pourrait plus
  // être évaluée : ce test le signale.
  it("accepts a full card", () => {
    expectTypeOf<Card>().toExtend<CardFace>();
  });

  // Le schéma est construit à partir des listes de card.ts : ses types
  // doivent être exactement ceux du domaine, ni plus larges ni plus étroits.
  it("uses the domain families and values", () => {
    expectTypeOf<CardFace["family"]>().toEqualTypeOf<CardFamily>();
    expectTypeOf<CardFace["value"]>().toEqualTypeOf<CardValue>();
  });

  it("rejects an out-of-range value at compile time", () => {
    // @ts-expect-error 13 ne fait pas partie des valeurs de carte
    const face: CardFace = { family: "instant", value: 13 };
    expect(face).toBeDefined();
  });
});

describe("card face schema", () => {
  // Face valide servant de base : chaque test d'échec la modifie sur un seul
  // point, pour que l'échec ait une seule cause possible.
  const validFace = { family: "instant", value: 7 };

  it("accepts a valid face", () => {
    expect(Value.Check(CardFaceSchema, validFace)).toBe(true);
  });

  // Les deux valeurs juste hors des bornes : 0 sous la première, 13 au-dessus
  // de la dernière.
  it.each([0, 13])("rejects the value %s", (value) => {
    expect(Value.Check(CardFaceSchema, { ...validFace, value })).toBe(false);
  });

  it("rejects an unknown family", () => {
    expect(
      Value.Check(CardFaceSchema, { ...validFace, family: "moment" }),
    ).toBe(false);
  });

  // Une face n'a pas d'identifiant : une fixture qui en met un se trompe de
  // type de donnée, la validation doit le dire.
  it("rejects an id", () => {
    expect(Value.Check(CardFaceSchema, { ...validFace, id: "card-1" })).toBe(
      false,
    );
  });
});
