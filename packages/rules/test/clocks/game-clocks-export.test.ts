// GAME_CLOCKS doit refléter exactement le dossier packages/rules/clocks/ :
// une horloge ajoutée au dossier mais oubliée dans la liste ne serait jamais
// jouée, sans qu'aucun autre test ne le remarque.

import { describe, expect, it } from "vitest";

import { GAME_CLOCKS } from "../../src/index.js";
import { parseClock } from "../../src/clocks/parse-clock.js";
import { readGameClockFiles } from "../support/game-clocks.js";

describe("GAME_CLOCKS", () => {
  const files = readGameClockFiles();

  it("lists every clock file of the folder, in path order", () => {
    expect(GAME_CLOCKS.map((clock) => clock.uid)).toEqual(
      files.map((file) =>
        file.path.replace(/^.*\//, "").replace(/\.json$/, ""),
      ),
    );
  });

  it("holds each clock as parseClock reads it from its file", () => {
    expect(GAME_CLOCKS).toEqual(
      files.map((file) => parseClock(file.data, file.path)),
    );
  });

  it("is sorted by chapter, then by position in the chapter", () => {
    const keys = GAME_CLOCKS.map(
      (clock) => clock.chapter * 10 + clock.indexInChapter,
    );
    expect(keys).toEqual(keys.toSorted((a, b) => a - b));
  });
});
