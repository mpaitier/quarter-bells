import { describe, expect, it } from "vitest";
import { requireAt } from "../../src/arrays/require-at.js";

describe("requireAt", () => {
  const items = ["a", "b", "c"] as const;

  // Les deux bornes valides du tableau.
  it.each([
    [0, "a"],
    [2, "c"],
  ])("returns the item at index %i", (index, expected) => {
    expect(requireAt(items, index)).toBe(expected);
  });

  // Juste avant, juste après, et un index qui n'est pas entier : aucun ne
  // désigne un élément.
  it.each([-1, 3, 1.5])("rejects the index %s", (index) => {
    expect(() => requireAt(items, index)).toThrow(RangeError);
  });

  it("rejects any index of an empty array", () => {
    expect(() => requireAt([], 0)).toThrow(/length of 0/);
  });
});
