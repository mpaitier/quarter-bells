import { toCardId } from "@quarter-bells/rules";
import { describe, expect, it } from "vitest";

import { toGameAction, type GameCommand } from "../src/index.js";

describe("toGameAction", () => {
  it.each<[GameCommand, object]>([
    [{ type: "endAnnouncement" }, {}],
    [{ type: "setReady", ready: false }, { ready: false }],
    [
      {
        type: "placeCard",
        cardId: toCardId("c-1"),
        sectionIndex: 4,
        faceUp: true,
      },
      { cardId: "c-1", sectionIndex: 4, faceUp: true },
    ],
    [{ type: "continue" }, {}],
    [{ type: "retry" }, {}],
    [{ type: "restartChapter" }, {}],
    [{ type: "stop" }, {}],
  ])("turns %o into an action of the sender", (command, fields) => {
    expect(toGameAction(command, "ben")).toEqual({
      type: command.type,
      player: "ben",
      ...fields,
    });
  });

  // Une commande venue du réseau peut porter des champs que son type ne
  // déclare pas. Le joueur vient toujours de la connexion.
  it("never takes the player from the command", () => {
    const forged = { type: "stop", player: "ana" } as GameCommand;
    expect(toGameAction(forged, "ben")).toEqual({
      type: "stop",
      player: "ben",
    });
  });

  it("drops the fields a command does not declare", () => {
    const padded = { type: "setReady", ready: true, extra: 1 } as GameCommand;
    expect(toGameAction(padded, "ben")).toEqual({
      type: "setReady",
      player: "ben",
      ready: true,
    });
  });
});
