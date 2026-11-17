import { describe, expect, it } from "vitest";
import { requireFind } from "../../src/arrays/require-find.js";

describe("requireFind", () => {
  const items = [1, 2, 3, 4] as const;

  // Plusieurs éléments conviennent (2 et 4) : le premier est renvoyé, comme
  // avec find.
  it("returns the first matching item", () => {
    expect(requireFind(items, (item) => item % 2 === 0, "an even number")).toBe(
      2,
    );
  });

  // Aucun élément ne convient : erreur de programmation, avec la description
  // dans le message pour la retrouver dans les journaux.
  it("throws when no item matches", () => {
    expect(() =>
      requireFind(items, (item) => item > 4, "a big number"),
    ).toThrow("No item matches: a big number");
  });

  it("throws on an empty array", () => {
    expect(() => requireFind([], () => true, "anything")).toThrow(Error);
  });
});
