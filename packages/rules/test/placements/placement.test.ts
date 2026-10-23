import { describe, expect, expectTypeOf, it } from "vitest";
import { Value } from "typebox/value"; // même import que dans violation.test.ts
import type { CardFace } from "../../src/cards/card-schema.js";
import { SECTION_COUNT } from "../../src/clocks/clock.js";
import {
  PlacementSchema,
  type Placement,
} from "../../src/placements/placement.js";

// Ces tests vérifient des types, pas des valeurs : ils échouent à la
// compilation (pnpm typecheck), pas à l'exécution.
describe("placement types", () => {
  // Un placement porte la face de la carte, pas la Card complète : si quelqu'un
  // remplace CardFaceSchema par un autre schéma, ce test le signale.
  it("holds a card face", () => {
    expectTypeOf<Placement["card"]>().toEqualTypeOf<CardFace>();
  });

  it("requires faceUp at compile time", () => {
    // @ts-expect-error faceUp est obligatoire, même s'il ne sert pas aux règles générales
    const placement: Placement = {
      sectionIndex: 0,
      card: { family: "instant", value: 7 },
    };
    expect(placement).toBeDefined();
  });
});

describe("placement schema", () => {
  // Placement valide servant de base : chaque test d'échec le modifie sur un
  // seul point, pour que l'échec ait une seule cause possible.
  const validPlacement = {
    sectionIndex: 2,
    card: { family: "instant", value: 7 },
    faceUp: false,
  };

  it("accepts a valid placement", () => {
    expect(Value.Check(PlacementSchema, validPlacement)).toBe(true);
  });

  // Les deux index juste hors de l'horloge : -1 sous la première section,
  // SECTION_COUNT au-delà de la dernière.
  it.each([-1, SECTION_COUNT])("rejects the section %s", (sectionIndex) => {
    expect(
      Value.Check(PlacementSchema, { ...validPlacement, sectionIndex }),
    ).toBe(false);
  });

  // La face d'une carte n'a pas d'identifiant : la règle de CardFaceSchema
  // doit s'appliquer aussi à l'intérieur d'un placement.
  it("rejects a card with an id", () => {
    expect(
      Value.Check(PlacementSchema, {
        ...validPlacement,
        card: { ...validPlacement.card, id: "card-1" },
      }),
    ).toBe(false);
  });

  it("rejects a placement without faceUp", () => {
    // Copie typée comme un objet quelconque pour pouvoir retirer un champ.
    const withoutFaceUp: Record<string, unknown> = { ...validPlacement };
    delete withoutFaceUp.faceUp;
    expect(Value.Check(PlacementSchema, withoutFaceUp)).toBe(false);
  });

  it("rejects an unknown field", () => {
    expect(Value.Check(PlacementSchema, { ...validPlacement, rank: 0 })).toBe(
      false,
    );
  });
});
