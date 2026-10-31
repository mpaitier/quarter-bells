import { describe, expect, it } from "vitest";
import type { CardValue } from "../../src/cards/card.js";
import { knownValueAfter } from "../../src/placements/known-value.js";
import type { Placement } from "../../src/placements/placement.js";

// Fabrique un placement : section, valeur et face, les trois seules choses
// que lit knownValueAfter. La famille n'a pas d'effet ici.
function place(
  sectionIndex: number,
  value: CardValue,
  faceUp: boolean,
): Placement {
  return { sectionIndex, card: { family: "instant", value }, faceUp };
}

describe("knownValueAfter", () => {
  it("adds the candidate to a section whose cards are all face up", () => {
    // 10 + 2 déjà visibles, plus la candidate 5.
    const pose = [place(1, 10, true), place(1, 2, true)];
    expect(knownValueAfter(1, pose, place(1, 5, false))).toBe(17);
  });

  it("knows the value of an empty section", () => {
    // Aucune carte cachée devant la section : sa valeur publique est 0.
    expect(knownValueAfter(3, [], place(3, 7, false))).toBe(7);
  });

  it("is unknown as soon as one card of the section is face down", () => {
    const pose = [place(1, 10, true), place(1, 2, false)];
    expect(knownValueAfter(1, pose, place(1, 5, true))).toBeUndefined();
  });

  // La face de la candidate est sans effet : le joueur connaît sa carte.
  it.each([true, false])(
    "ignores the face of the candidate (faceUp: %s)",
    (faceUp) => {
      expect(knownValueAfter(0, [place(0, 4, true)], place(0, 6, faceUp))).toBe(
        10,
      );
    },
  );

  it("ignores cards placed on other sections", () => {
    // La carte cachée est en section 2 : elle ne rend pas la section 1
    // inconnue, et sa valeur ne s'ajoute pas.
    const pose = [place(1, 10, true), place(2, 12, false)];
    expect(knownValueAfter(1, pose, place(1, 3, false))).toBe(13);
  });

  it("is undefined when the candidate goes to another section", () => {
    expect(
      knownValueAfter(1, [place(1, 10, true)], place(4, 3, true)),
    ).toBeUndefined();
  });
});
