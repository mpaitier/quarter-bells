import { describe, expect, it } from "vitest";

import * as protocol from "../src/index.js";
import { discussion } from "./support/games.js";

describe("public API", () => {
  it("projects a view through the package entry point", () => {
    expect(protocol.projectPlayerView(discussion(), "ana").phase).toBe(
      "discussion",
    );
  });

  it("translates a command through the package entry point", () => {
    expect(protocol.toGameAction({ type: "retry" }, "ana")).toEqual({
      type: "retry",
      player: "ana",
    });
  });

  // L'aide interne n'est pas un contrat.
  it("does not expose requireDefined", () => {
    expect(protocol).not.toHaveProperty("requireDefined");
  });
});
