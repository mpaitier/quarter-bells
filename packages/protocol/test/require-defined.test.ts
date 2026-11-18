import { describe, expect, it } from "vitest";

import { requireDefined } from "../src/require-defined.js";

describe("requireDefined", () => {
  it("returns a value that is present", () => {
    expect(requireDefined(0, "zero")).toBe(0);
  });

  it("throws with the description when the value is missing", () => {
    expect(() => requireDefined<number>(undefined, "seat of ana")).toThrow(
      "Missing value: seat of ana",
    );
  });
});
