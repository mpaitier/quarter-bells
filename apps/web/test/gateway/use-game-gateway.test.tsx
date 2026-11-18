import type { PlayerView } from "@quarter-bells/protocol";
import { act, render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { GameGateway } from "../../src/gateway/game-gateway";
import { GameGatewayProvider } from "../../src/gateway/game-gateway-provider";
import {
  useCommandRejected,
  useGameGateway,
  usePlayerView,
  useSendCommand,
} from "../../src/gateway/use-game-gateway";
import { createLocalGameSession } from "../../src/gateway/local/local-game-session";
import { SETUP, createFakeGateway } from "./support";

/** Deux vues réelles, produites par le moteur, pour nourrir la passerelle factice. */
function realViews(): { announcing: PlayerView; discussion: PlayerView } {
  const announcing = createLocalGameSession(SETUP).gatewayFor("ana").getView();
  if (announcing === undefined) {
    throw new Error("No view");
  }
  return {
    announcing,
    discussion: {
      ...announcing,
      phase: "discussion",
      bonusCandles: 0,
      readyPlayers: [],
    },
  };
}

function wrapperFor(gateway: GameGateway) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <GameGatewayProvider gateway={gateway}>{children}</GameGatewayProvider>
    );
  };
}

describe("useGameGateway", () => {
  it("gives the gateway of the provider", () => {
    const gateway = createFakeGateway();
    const { result } = renderHook(() => useGameGateway(), {
      wrapper: wrapperFor(gateway),
    });
    expect(result.current).toBe(gateway);
  });

  it("fails outside a provider", () => {
    // React signale l'erreur dans la console avant de la relancer.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useGameGateway())).toThrow(
      "useGameGateway must be used inside GameGatewayProvider",
    );
  });
});

describe("usePlayerView", () => {
  it("is undefined until a view arrives", () => {
    const { result } = renderHook(() => usePlayerView(), {
      wrapper: wrapperFor(createFakeGateway()),
    });
    expect(result.current).toBeUndefined();
  });

  it("renders again with each new view", () => {
    const views = realViews();
    const gateway = createFakeGateway(views.announcing);
    function Phase() {
      return <p>{usePlayerView()?.phase}</p>;
    }
    render(<Phase />, { wrapper: wrapperFor(gateway) });
    expect(screen.getByText("announcing")).toBeInTheDocument();

    act(() => {
      gateway.emit({ type: "viewChanged", view: views.discussion });
    });
    expect(screen.getByText("discussion")).toBeInTheDocument();
  });

  it("ignores rejections", () => {
    const views = realViews();
    const gateway = createFakeGateway(views.announcing);
    const { result } = renderHook(() => usePlayerView(), {
      wrapper: wrapperFor(gateway),
    });
    act(() => {
      gateway.emit({
        type: "commandRejected",
        command: { type: "stop" },
        rejection: { reason: "notHost" },
      });
    });
    expect(result.current).toBe(views.announcing);
  });

  it("unsubscribes when unmounted", () => {
    const gateway = createFakeGateway();
    const { unmount } = renderHook(() => usePlayerView(), {
      wrapper: wrapperFor(gateway),
    });
    unmount();
    expect(gateway.listenerCount()).toBe(0);
  });
});

describe("useSendCommand", () => {
  it("sends through the gateway", () => {
    const gateway = createFakeGateway();
    const { result } = renderHook(() => useSendCommand(), {
      wrapper: wrapperFor(gateway),
    });
    result.current({ type: "setReady", ready: true });
    expect(gateway.send).toHaveBeenCalledWith({
      type: "setReady",
      ready: true,
    });
  });
});

describe("useCommandRejected", () => {
  it("calls the latest handler with each rejection", () => {
    const gateway = createFakeGateway();
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = renderHook(
      ({ handler }) => {
        useCommandRejected(handler);
      },
      { wrapper: wrapperFor(gateway), initialProps: { handler: first } },
    );
    rerender({ handler: latest });

    act(() => {
      gateway.emit({
        type: "commandRejected",
        command: { type: "stop" },
        rejection: { reason: "notHost" },
      });
    });

    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledWith(
      { reason: "notHost" },
      { type: "stop" },
    );
  });

  it("ignores new views and keeps a single subscription across renders", () => {
    const views = realViews();
    const gateway = createFakeGateway(views.announcing);
    const handler = vi.fn();
    const { rerender, unmount } = renderHook(
      () => {
        useCommandRejected(handler);
      },
      { wrapper: wrapperFor(gateway) },
    );
    rerender();
    expect(gateway.listenerCount()).toBe(1);

    act(() => {
      gateway.emit({ type: "viewChanged", view: views.discussion });
    });
    expect(handler).not.toHaveBeenCalled();

    unmount();
    expect(gateway.listenerCount()).toBe(0);
  });
});
