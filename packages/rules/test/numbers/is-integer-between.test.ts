import { describe, expect, it } from "vitest";
import { isIntegerBetween } from "../../src/numbers/is-integer-between.js";

describe("isIntegerBetween", () => {
  // Les deux bornes sont incluses.
  it.each([0, 1, 3])("accepts %s between 0 and 3", (value) => {
    expect(isIntegerBetween(value, 0, 3)).toBe(true);
  });

  // Juste en dehors des bornes, puis des valeurs qui ne sont pas des entiers.
  it.each([-1, 4, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects %s",
    (value) => {
      expect(isIntegerBetween(value, 0, 3)).toBe(false);
    },
  );
});
