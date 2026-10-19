import { describe, expect, it } from "vitest";

import { SECTION_COUNT } from "./index.js";

describe("SECTION_COUNT", () => {
  it("vaut 6, une section toutes les deux heures sur le cadran", () => {
    expect(SECTION_COUNT).toBe(6);
  });
});
