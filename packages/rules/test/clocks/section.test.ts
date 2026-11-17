import { describe, expect, it } from "vitest";
import { SECTION_COUNT } from "../../src/clocks/clock.js";
import { SECTION_INDEXES, isSectionIndex } from "../../src/clocks/section.js";

describe("SECTION_INDEXES", () => {
  // Une case par section, dans l'ordre croissant : les appelants s'en
  // servent pour parcourir le cadran sans recalculer la liste.
  it("lists every section once, in ascending order", () => {
    expect(SECTION_INDEXES).toEqual([0, 1, 2, 3, 4, 5]);
    expect(SECTION_INDEXES).toHaveLength(SECTION_COUNT);
  });

  // La liste décrit le cadran : chacun de ses éléments est un index valide.
  it("only contains valid section indexes", () => {
    expect(SECTION_INDEXES.every(isSectionIndex)).toBe(true);
  });
});

describe("isSectionIndex", () => {
  // Les deux bornes du cadran.
  it.each([0, SECTION_COUNT - 1])("accepts %i", (value) => {
    expect(isSectionIndex(value)).toBe(true);
  });

  // Juste avant, juste après, et un nombre qui n'est pas entier.
  it.each([-1, SECTION_COUNT, 1.5])("rejects %s", (value) => {
    expect(isSectionIndex(value)).toBe(false);
  });
});
