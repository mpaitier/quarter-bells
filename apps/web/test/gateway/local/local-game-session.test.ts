import type { GameCommand, PlayerView } from "@quarter-bells/protocol";
import { listPlacementOptions } from "@quarter-bells/rules";
import { describe, expect, it, vi } from "vitest";

import type { GatewayEvent } from "../../../src/gateway/game-gateway";
import { createLocalGameSession } from "../../../src/gateway/local/local-game-session";
import { SETUP, flushDeliveries } from "../support";

/** Les événements reçus par une passerelle, dans l'ordre. */
function record(subscribe: (listener: (event: GatewayEvent) => void) => void) {
  const events: GatewayEvent[] = [];
  subscribe((event) => events.push(event));
  return events;
}

describe("createLocalGameSession", () => {
  describe("gatewayFor", () => {
    it("gives the view of the player right away", () => {
      const view = createLocalGameSession(SETUP).gatewayFor("ben").getView();
      expect(view).toMatchObject({ viewer: "ben", phase: "announcing" });
    });

    it("always gives the same gateway to the same player", () => {
      const session = createLocalGameSession(SETUP);
      expect(session.gatewayFor("ana")).toBe(session.gatewayFor("ana"));
    });

    it("refuses a player who does not play the game", () => {
      const session = createLocalGameSession(SETUP);
      expect(() => session.gatewayFor("zoe")).toThrow(RangeError);
    });
  });

  describe("accepted commands", () => {
    it("answers after send has returned, never during it", async () => {
      const ana = createLocalGameSession(SETUP).gatewayFor("ana");
      const before = ana.getView();
      const events = record(ana.subscribe);

      ana.send({ type: "endAnnouncement" });
      expect(ana.getView()).toBe(before);
      expect(events).toEqual([]);

      await flushDeliveries();
      expect(ana.getView()?.phase).toBe("discussion");
      expect(events).toEqual([{ type: "viewChanged", view: ana.getView() }]);
    });

    it("sends each player their own view", async () => {
      const session = createLocalGameSession(SETUP);
      const ana = session.gatewayFor("ana");
      const ben = session.gatewayFor("ben");

      ana.send({ type: "endAnnouncement" });
      await flushDeliveries();

      expect(ana.getView()).toMatchObject({
        viewer: "ana",
        phase: "discussion",
      });
      expect(ben.getView()).toMatchObject({
        viewer: "ben",
        phase: "discussion",
      });
    });

    it("applies commands in the order they were sent", async () => {
      const ana = createLocalGameSession(SETUP).gatewayFor("ana");

      ana.send({ type: "endAnnouncement" });
      ana.send({ type: "setReady", ready: true });
      await flushDeliveries();

      expect(ana.getView()).toMatchObject({
        phase: "discussion",
        readyPlayers: ["ana"],
      });
    });

    it("takes the player from the gateway, not from the command", async () => {
      const session = createLocalGameSession(SETUP);
      const ben = session.gatewayFor("ben");
      const events = record(ben.subscribe);

      // ben tente de se faire passer pour l'hôte.
      ben.send({ type: "endAnnouncement", player: "ana" } as GameCommand);
      await flushDeliveries();

      expect(events).toEqual([
        {
          type: "commandRejected",
          command: { type: "endAnnouncement", player: "ana" },
          rejection: { reason: "notHost" },
        },
      ]);
    });
  });

  describe("rejected commands", () => {
    it("tells only the sender, and keeps every view", async () => {
      const session = createLocalGameSession(SETUP);
      const ana = session.gatewayFor("ana");
      const ben = session.gatewayFor("ben");
      const anaView = ana.getView();
      const anaEvents = record(ana.subscribe);
      const benEvents = record(ben.subscribe);

      ben.send({ type: "endAnnouncement" });
      await flushDeliveries();

      expect(benEvents).toEqual([
        {
          type: "commandRejected",
          command: { type: "endAnnouncement" },
          rejection: { reason: "notHost" },
        },
      ]);
      expect(anaEvents).toEqual([]);
      expect(ana.getView()).toBe(anaView);
    });
  });

  describe("subscriptions", () => {
    it("stops delivering after unsubscribing", async () => {
      const ana = createLocalGameSession(SETUP).gatewayFor("ana");
      const listener = vi.fn();
      const unsubscribe = ana.subscribe(listener);

      unsubscribe();
      ana.send({ type: "endAnnouncement" });
      await flushDeliveries();

      expect(listener).not.toHaveBeenCalled();
    });

    it("still reaches the next listener when one unsubscribes while notified", async () => {
      const ana = createLocalGameSession(SETUP).gatewayFor("ana");
      const second = vi.fn();
      const unsubscribeFirst = ana.subscribe(() => {
        unsubscribeFirst();
      });
      ana.subscribe(second);

      ana.send({ type: "endAnnouncement" });
      await flushDeliveries();

      expect(second).toHaveBeenCalledOnce();
    });

    it("delivers twice to a listener subscribed twice", async () => {
      const ana = createLocalGameSession(SETUP).gatewayFor("ana");
      const listener = vi.fn();
      ana.subscribe(listener);
      const unsubscribeSecond = ana.subscribe(listener);

      ana.send({ type: "endAnnouncement" });
      await flushDeliveries();
      unsubscribeSecond();
      ana.send({ type: "setReady", ready: true });
      await flushDeliveries();

      expect(listener).toHaveBeenCalledTimes(3);
    });
  });

  // Parcours que fera l'écran : ne lire que la vue, guider avec le moteur
  // appelé sur la vue, envoyer des commandes. Aucun accès à l'état complet.
  it("plays a whole trial through the gateways only", async () => {
    const session = createLocalGameSession(SETUP);
    const gateways = {
      ana: session.gatewayFor("ana"),
      ben: session.gatewayFor("ben"),
    };

    gateways.ana.send({ type: "endAnnouncement" });
    await flushDeliveries();
    gateways.ana.send({ type: "setReady", ready: true });
    gateways.ben.send({ type: "setReady", ready: true });
    await flushDeliveries();

    let view: PlayerView | undefined = gateways.ana.getView();
    while (view?.phase === "placement") {
      const player = view.trial.currentPlayer as "ana" | "ben";
      const own = gateways[player].getView();
      if (own?.phase !== "placement") {
        throw new Error("Views out of sync");
      }
      const option = listPlacementOptions(
        own.clock,
        own.trial.placements,
        own.trial.ownSeat.hand,
      ).find((candidate) => candidate.permitted);
      if (option === undefined) {
        throw new Error("No permitted placement");
      }
      gateways[player].send({
        type: "placeCard",
        cardId: option.cardId,
        sectionIndex: option.sectionIndex,
        faceUp: false,
      });
      await flushDeliveries();
      view = gateways.ana.getView();
    }

    expect(["succeeded", "failed", "runLost"]).toContain(view?.phase);
    expect(gateways.ben.getView()?.phase).toBe(view?.phase);
  });
});
