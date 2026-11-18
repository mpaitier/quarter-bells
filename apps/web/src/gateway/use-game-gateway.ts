// Hooks de l'écran de jeu : la seule façon pour un composant de lire la vue
// et d'envoyer une commande. Aucun composant n'appelle la passerelle
// directement.

import type {
  CommandRejection,
  GameCommand,
  PlayerView,
} from "@quarter-bells/protocol";
import {
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useSyncExternalStore,
} from "react";

import type { GameGateway } from "./game-gateway";
import { GameGatewayContext } from "./game-gateway-context";

/**
 * La passerelle fournie par GameGatewayProvider.
 *
 * @throws {Error} si le composant est rendu hors de GameGatewayProvider
 */
export function useGameGateway(): GameGateway {
  const gateway = useContext(GameGatewayContext);
  if (gateway === undefined) {
    throw new Error("useGameGateway must be used inside GameGatewayProvider");
  }
  return gateway;
}

/**
 * La vue du joueur, mise à jour à chaque changement. undefined tant que la
 * passerelle n'en a reçu aucune.
 *
 * useSyncExternalStore plutôt qu'un useState alimenté par un effet : React
 * relit la vue au bon moment et ne mélange jamais deux versions dans un même
 * rendu.
 */
export function usePlayerView(): PlayerView | undefined {
  const gateway = useGameGateway();
  const subscribe = useCallback(
    (onViewChange: () => void) =>
      gateway.subscribe((event) => {
        if (event.type === "viewChanged") {
          onViewChange();
        }
      }),
    [gateway],
  );
  return useSyncExternalStore(subscribe, gateway.getView);
}

/** Envoie une commande pour le joueur de la passerelle. */
export function useSendCommand(): (command: GameCommand) => void {
  return useGameGateway().send;
}

/**
 * Appelle `onRejected` à chaque commande refusée, pour guider le joueur.
 * Le gestionnaire peut changer à chaque rendu sans réabonner la passerelle.
 */
export function useCommandRejected(
  onRejected: (rejection: CommandRejection, command: GameCommand) => void,
): void {
  const gateway = useGameGateway();
  const handle = useEffectEvent(onRejected);
  useEffect(
    () =>
      gateway.subscribe((event) => {
        if (event.type === "commandRejected") {
          handle(event.rejection, event.command);
        }
      }),
    [gateway],
  );
}
