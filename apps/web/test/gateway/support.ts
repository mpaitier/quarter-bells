// Outils partagés par les tests de la passerelle.

import type { GameSetup } from "@quarter-bells/game";
import type { PlayerView } from "@quarter-bells/protocol";
import { parseClock } from "@quarter-bells/rules";
import { vi, type Mock } from "vitest";

import type {
  GameGateway,
  GatewayEvent,
  GatewayListener,
} from "../../src/gateway/game-gateway";

/**
 * Horloge sans règle propre : toute pose est permise, ce qui suffit à faire
 * avancer une partie. Écrite ici plutôt qu'importée de packages/rules/clocks :
 * apps/web ne lit pas les fichiers d'un autre dossier du monorepo.
 */
const FREE_CLOCK = parseClock(
  {
    formatVersion: 1,
    uid: "web-test-free",
    chapter: 1,
    indexInChapter: 0,
    noMaxSum: true,
    startSectionMode: "fixed",
    defaultStartSection: 0,
    clockRules: [],
    sections: [0, 1, 2, 3, 4, 5].map((index) => ({ index, rules: [] })),
  },
  "web-test-free",
);

/** 2 joueurs, ana est l'hôte, une seule horloge. */
export const SETUP: GameSetup = {
  chapters: [{ number: 1, clocks: [FREE_CLOCK] }],
  turnOrder: ["ana", "ben"],
  host: "ana",
  seed: 7,
  candleSettings: { maxBonusCandles: 3 },
};

/**
 * Laisse passer les microtâches en attente : l'adaptateur local livre ses
 * réponses après le retour de send.
 */
export function flushDeliveries(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/** Passerelle factice pilotée par le test, pour les hooks de l'écran. */
export interface FakeGateway extends GameGateway {
  readonly send: Mock<GameGateway["send"]>;
  readonly emit: (event: GatewayEvent) => void;
  readonly listenerCount: () => number;
}

export function createFakeGateway(initialView?: PlayerView): FakeGateway {
  let view = initialView;
  const listeners = new Set<GatewayListener>();
  return {
    getView: () => view,
    send: vi.fn<GameGateway["send"]>(),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    emit: (event) => {
      if (event.type === "viewChanged") {
        view = event.view;
      }
      for (const listener of [...listeners]) {
        listener(event);
      }
    },
    listenerCount: () => listeners.size,
  };
}
