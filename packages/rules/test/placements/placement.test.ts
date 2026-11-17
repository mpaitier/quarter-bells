import { describe, expect, expectTypeOf, it } from "vitest";
import { Value } from "typebox/value"; // même import que dans violation.test.ts
import type { CardFace } from "../../src/cards/card-schema.js";
import { SECTION_COUNT } from "../../src/clocks/clock.js";
import {
  PlacementSchema,
  type FaceDownPlacement,
  type Placement,
  type PublicPlacement,
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

// Vue publique d'une pose (ADR 0016). Vérifiée à la compilation, comme le
// describe précédent.
describe("public placement types", () => {
  // Le serveur passe ses placements complets aux fonctions qui attendent une
  // vue publique : sans cette compatibilité, il devrait les convertir.
  it("accepts a full placement as a public placement", () => {
    expectTypeOf<Placement>().toExtend<PublicPlacement>();
  });

  // Une carte cachée des autres joueurs n'a pas de valeur dans la vue.
  it("allows a face-down card without value", () => {
    const placement: PublicPlacement = {
      sectionIndex: 0,
      card: { family: "eternity" },
      faceUp: false,
    };
    expect(placement.faceUp).toBe(false);
  });

  it("requires the value of a face-up card", () => {
    // @ts-expect-error une carte visible a toujours une valeur
    const placement: PublicPlacement = {
      sectionIndex: 0,
      card: { family: "instant" },
      faceUp: true,
    };
    expect(placement).toBeDefined();
  });

  // Le cœur de la décision : la valeur n'est lisible qu'après avoir vérifié
  // la face. Lire value sur une carte cachée ne compile pas.
  it("hides the value of a face-down card", () => {
    expectTypeOf<FaceDownPlacement["card"]>().not.toHaveProperty("value");
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
