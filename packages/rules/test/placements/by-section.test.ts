import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { CARD_VALUES, type CardValue } from "../../src/cards/card.js";
import { SECTION_COUNT } from "../../src/clocks/clock.js";
import {
  placementsBySection,
  sectionValue,
} from "../../src/placements/by-section.js";
import type { Placement } from "../../src/placements/placement.js";

// Fabrique un placement en ne précisant que ce qui compte pour ces tests :
// la section et la valeur. Famille et visibilité n'ont pas d'effet ici.
function place(sectionIndex: number, value: CardValue): Placement {
  return { sectionIndex, card: { family: "instant", value }, faceUp: false };
}

describe("placementsBySection", () => {
  it("returns one empty list per section for an empty pose", () => {
    expect(placementsBySection([])).toEqual(
      Array.from({ length: SECTION_COUNT }, () => []),
    );
  });

  it("puts each card in its section and leaves the others empty", () => {
    const bySection = placementsBySection([
      place(0, 3),
      place(4, 7),
      place(0, 5),
    ]);

    expect(bySection[0]).toEqual([place(0, 3), place(0, 5)]);
    expect(bySection[4]).toEqual([place(4, 7)]);
    // Une section où personne n'a joué reste présente, et vide.
    expect(bySection[2]).toEqual([]);
  });

  it("keeps the placement order within a section", () => {
    // Le rang de pose sert à firstPlacements : regrouper ne doit pas le perdre.
    const bySection = placementsBySection([
      place(1, 9),
      place(1, 2),
      place(1, 6),
    ]);
    expect(bySection[1]).toEqual([place(1, 9), place(1, 2), place(1, 6)]);
  });

  it("gives each section its own list", () => {
    // Attrape le piège de fill([]), qui mettrait la même liste dans toutes
    // les cases : ajouter à la section 0 ne doit rien changer à la section 1.
    const bySection = placementsBySection([]);
    bySection[0]?.push(place(0, 1));
    expect(bySection[1]).toEqual([]);
  });

  it("does not modify the pose it receives", () => {
    const pose = [place(3, 4), place(2, 8)];
    placementsBySection(pose);
    expect(pose).toEqual([place(3, 4), place(2, 8)]);
  });

  it.each([-1, SECTION_COUNT])(
    "rejects a placement on section %s",
    (sectionIndex) => {
      // Le type accepte n'importe quel nombre : seule la validation du schéma
      // borne l'index. La fonction doit échouer plutôt que perdre la carte.
      expect(() => placementsBySection([place(sectionIndex, 5)])).toThrow(
        RangeError,
      );
    },
  );
});

describe("sectionValue", () => {
  it("is 0 for an empty section", () => {
    expect(sectionValue([])).toBe(0);
  });

  it("sums the card values", () => {
    expect(sectionValue([place(0, 3), place(0, 12), place(0, 5)])).toEqual(20);
  });

  // Propriété tirée de docs/testing.md : la valeur d'une section ne dépend
  // pas de l'ordre dans lequel ses cartes ont été posées.
  it("does not depend on the placement order", () => {
    fc.assert(
      fc.property(
        // Une liste de valeurs de carte, puis une permutation de cette liste :
        // un sous-tableau mélangé de même longueur contient les mêmes éléments
        // dans un autre ordre.
        fc.array(fc.constantFrom(...CARD_VALUES)).chain((values) =>
          fc.tuple(
            fc.constant(values),
            fc.shuffledSubarray(values, {
              minLength: values.length,
              maxLength: values.length,
            }),
          ),
        ),
        ([values, shuffled]) => {
          const inOrder = values.map((value) => place(0, value));
          const reordered = shuffled.map((value) => place(0, value));
          expect(sectionValue(reordered)).toBe(sectionValue(inOrder));
        },
      ),
    );
  });
});
