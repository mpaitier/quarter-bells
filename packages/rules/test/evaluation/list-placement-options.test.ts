import { describe, expect, it } from "vitest";
import { toCardId, type Card, type CardValue } from "../../src/cards/card.js";
import type { SectionRule } from "../../src/clocks/clock.js";
import { listPlacementOptions } from "../../src/evaluation/list-placement-options.js";
import type {
  Placement,
  PublicPlacement,
} from "../../src/placements/placement.js";
import { deepFreeze } from "../support/deep-freeze.js";
import { clockWith } from "../support/placement-clock.js";

// Le détail de chaque règle est couvert par evaluate-placement.test.ts et
// test/cases/. Ce fichier teste ce que listPlacementOptions ajoute : une
// option par carte et par section, dans un ordre stable, et l'exception des
// bornes connues (ADR 0011).

// Carte de la main. L'identifiant reprend la valeur : lisible dans les
// messages d'échec, et unique tant qu'un test ne met pas deux fois la même.
function card(value: CardValue): Card {
  return { id: toCardId(`card-${String(value)}`), family: "instant", value };
}

// Carte déjà posée face visible : sa valeur est publique.
function visible(sectionIndex: number, value: CardValue): Placement {
  return { sectionIndex, card: { family: "eternity", value }, faceUp: true };
}

// Règle « la pose de ce rang doit se faire devant cette section ».
function rankHere(rank: number): SectionRule {
  return { kind: "firstPlacements", params: { placementIndexes: [rank] } };
}

describe("listPlacementOptions", () => {
  describe("shape", () => {
    it("lists every card against every section, card by card", () => {
      // Ordre attendu par le client pour construire sa grille : cartes dans
      // l'ordre de la main, puis sections de 0 à 5.
      const options = listPlacementOptions(
        clockWith({}),
        [],
        [card(3), card(8)],
      );
      expect(
        options.map((option) => [option.cardId, option.sectionIndex]),
      ).toEqual([
        ...[0, 1, 2, 3, 4, 5].map((section) => ["card-3", section]),
        ...[0, 1, 2, 3, 4, 5].map((section) => ["card-8", section]),
      ]);
    });

    it("permits everything on a clock without rule", () => {
      const options = listPlacementOptions(clockWith({}), [], [card(3)]);
      expect(options.every((option) => option.permitted)).toBe(true);
      expect(options.every((option) => option.violations.length === 0)).toBe(
        true,
      );
    });

    it("returns no option for an empty hand", () => {
      expect(listPlacementOptions(clockWith({}), [], [])).toEqual([]);
    });
  });

  describe("rejected placements", () => {
    it("rejects a placement constraint with its violation", () => {
      // La première pose doit aller en section 2 : partout ailleurs, refus
      // avec la violation que le client affichera (F-JEU-20).
      const options = listPlacementOptions(
        clockWith({ 2: [rankHere(0)] }),
        [],
        [card(3)],
      );
      expect(options.find((option) => option.sectionIndex === 4)).toEqual({
        cardId: "card-3",
        sectionIndex: 4,
        permitted: false,
        violations: [
          {
            kind: "firstPlacements",
            params: { placementIndexes: [0] },
            section: 2,
            placementIndex: 0,
            attemptedSection: 4,
          },
        ],
      });
      expect(
        options.filter((option) => option.permitted).map((o) => o.sectionIndex),
      ).toEqual([2]);
    });

    it("rejects a known bound when another placement is fully permitted", () => {
      // Section 1 visible à 21 : le 5 la porterait à 26. Les autres sections
      // restent libres, donc la borne guide le joueur et refuse.
      const options = listPlacementOptions(
        clockWith({}),
        [visible(1, 11), visible(1, 10)],
        [card(5)],
      );
      expect(options.find((option) => option.sectionIndex === 1)).toEqual({
        cardId: "card-5",
        sectionIndex: 1,
        permitted: false,
        violations: [
          { kind: "maxSum", params: { max: 24 }, section: 1, value: 26 },
        ],
      });
    });

    it("keeps a known bound when a single card still fits", () => {
      // Le 3 tient en section 1 (24), le 5 non : l'exception ne joue pas,
      // puisqu'une pose est entièrement permise.
      const clock = clockWith({ 1: [rankHere(2)] });
      const options = listPlacementOptions(
        clock,
        [visible(1, 11), visible(1, 10)],
        [card(3), card(5)],
      );
      const onSection1 = options.filter((option) => option.sectionIndex === 1);
      expect(onSection1.map((option) => option.permitted)).toEqual([
        true,
        false,
      ]);
    });
  });

  describe("known bounds when nothing is fully permitted (ADR 0011)", () => {
    // La 3e pose (rang 2) doit aller en section 1, déjà visible à 21 :
    // aucune carte de la main n'y tient sous 24, et les autres sections sont
    // refusées par la pose imposée. Même situation que le blocage décrit
    // dans l'ADR 0011.
    const clock = clockWith({ 1: [rankHere(2)] });
    const pose = [visible(1, 11), visible(1, 10)];
    const hand = [card(5), card(9)];
    const options = listPlacementOptions(clock, pose, hand);

    it("permits a placement that only breaks a known bound", () => {
      // Aucune section n'est marquée interdite à cause de la borne : le
      // joueur peut toujours poser, l'épreuve échouera à la Résolution.
      const onSection1 = options.filter((option) => option.sectionIndex === 1);
      expect(onSection1.every((option) => option.permitted)).toBe(true);
    });

    it("keeps the violations of a forced placement", () => {
      // Le client reconnaît la pose forcée à ses violations, et peut
      // prévenir le joueur que l'épreuve va échouer.
      expect(
        options.find(
          (option) => option.cardId === "card-5" && option.sectionIndex === 1,
        )?.violations,
      ).toEqual([
        { kind: "maxSum", params: { max: 24 }, section: 1, value: 26 },
      ]);
    });

    it("never lets a placement constraint give way", () => {
      const elsewhere = options.filter((option) => option.sectionIndex !== 1);
      expect(elsewhere.some((option) => option.permitted)).toBe(false);
    });

    it("rejects a placement that breaks a bound and a constraint", () => {
      // Sections 1 et 3 visibles à 21, et la 5e pose (rang 4) imposée en
      // section 1. En section 3, le 5 enfreint la borne ET la pose imposée :
      // une seule contrainte suffit à refuser, même quand rien d'autre
      // n'est entièrement permis.
      const options = listPlacementOptions(
        clockWith({ 1: [rankHere(4)] }),
        [...pose, visible(3, 12), visible(3, 9)],
        [card(5)],
      );
      const onSection3 = options.find((option) => option.sectionIndex === 3);
      expect(onSection3?.permitted).toBe(false);
      expect(onSection3?.violations.map((violation) => violation.kind)).toEqual(
        ["maxSum", "firstPlacements"],
      );
    });
  });

  describe("public information only (ADR 0016)", () => {
    it("works on the view of another player", () => {
      // Section 1 avec une carte cachée d'un autre joueur, sans valeur : la
      // somme est inconnue, aucune borne ne s'applique.
      const view: PublicPlacement[] = [
        visible(1, 11),
        { sectionIndex: 1, card: { family: "instant" }, faceUp: false },
      ];
      const options = listPlacementOptions(clockWith({}), view, [card(12)]);
      expect(options.every((option) => option.permitted)).toBe(true);
    });
  });

  it("does not modify its arguments", () => {
    // Arguments gelés : toute écriture lèverait une TypeError.
    const clock = deepFreeze(clockWith({ 1: [rankHere(2)] }));
    const pose = deepFreeze([visible(1, 11), visible(1, 10)]);
    const hand = deepFreeze([card(5)]);
    expect(() => listPlacementOptions(clock, pose, hand)).not.toThrow();
  });
});
