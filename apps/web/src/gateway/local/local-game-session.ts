// Adaptateur local du port GameGateway (ADR 0017), pour le J2 : la partie
// tourne dans le navigateur avec le moteur de @quarter-bells/game, et chaque
// passerelle reçoit la vue de son joueur, projetée par @quarter-bells/protocol
// comme le fera le serveur.
//
// C'est le seul endroit de apps/web autorisé à importer le moteur de partie
// (voir eslint.config.js).

import {
  applyGameAction,
  createGame,
  type Game,
  type GameSetup,
} from "@quarter-bells/game";
import {
  projectPlayerView,
  toGameAction,
  type GameCommand,
  type PlayerView,
} from "@quarter-bells/protocol";
import type { PlayerId } from "@quarter-bells/rules";

import type {
  GameGateway,
  GatewayEvent,
  GatewayListener,
} from "../game-gateway";

/** Une partie jouée dans le navigateur, partagée par tous ses joueurs. */
export interface LocalGameSession {
  /**
   * La passerelle d'un joueur : toujours la même pour un même joueur. Sa vue
   * est disponible tout de suite, comme l'instantané qu'un serveur envoie à
   * la connexion.
   *
   * @throws {RangeError} si le joueur ne fait pas partie de la partie
   */
  readonly gatewayFor: (player: PlayerId) => GameGateway;
}

/** Une passerelle locale, avec ce que la session doit pouvoir lui livrer. */
interface LocalGateway extends GameGateway {
  readonly deliverView: (view: PlayerView) => void;
  readonly deliver: (event: GatewayEvent) => void;
}

/**
 * Crée une partie locale.
 *
 * Les réponses sont livrées dans une microtâche, jamais pendant send : un
 * réseau ne répond jamais avant le retour de l'appel, et un écran qui
 * compterait sur une réponse immédiate fonctionnerait au J2 puis casserait
 * au J3. Livrer de façon asynchrone dès maintenant fait apparaître ce défaut
 * tout de suite.
 *
 * @throws les erreurs de createGame si la configuration est incohérente
 */
export function createLocalGameSession(setup: GameSetup): LocalGameSession {
  let game: Game = createGame(setup);
  const gateways = new Map<PlayerId, LocalGateway>();

  function handle(player: PlayerId, command: GameCommand): void {
    const result = applyGameAction(game, toGameAction(command, player));
    if (!result.accepted) {
      const { rejection } = result;
      queueMicrotask(() => {
        gateways
          .get(player)
          ?.deliver({ type: "commandRejected", command, rejection });
      });
      return;
    }
    // La partie avance tout de suite : une seconde commande envoyée dans la
    // même tâche s'applique bien après la première, comme sur un serveur qui
    // traite les commandes dans l'ordre d'arrivée.
    game = result.game;
    const next = game;
    queueMicrotask(() => {
      for (const [viewer, gateway] of gateways) {
        gateway.deliverView(projectPlayerView(next, viewer));
      }
    });
  }

  function gatewayFor(player: PlayerId): GameGateway {
    const existing = gateways.get(player);
    if (existing !== undefined) {
      return existing;
    }
    const gateway = createLocalGateway(
      projectPlayerView(game, player),
      (command) => {
        handle(player, command);
      },
    );
    gateways.set(player, gateway);
    return gateway;
  }

  return { gatewayFor };
}

function createLocalGateway(
  initialView: PlayerView,
  send: (command: GameCommand) => void,
): LocalGateway {
  let view = initialView;
  const listeners = new Set<GatewayListener>();

  function deliver(event: GatewayEvent): void {
    // Copie : un abonné qui se désabonne pendant la livraison ne fait pas
    // sauter le suivant.
    for (const listener of [...listeners]) {
      listener(event);
    }
  }

  return {
    getView: () => view,
    send,
    subscribe: (listener) => {
      // Un objet par abonnement : le même écouteur abonné deux fois reçoit
      // deux fois les événements, et chaque désabonnement retire le sien.
      const entry: GatewayListener = (event) => {
        listener(event);
      };
      listeners.add(entry);
      return () => {
        listeners.delete(entry);
      };
    },
    deliver,
    deliverView: (next) => {
      view = next;
      deliver({ type: "viewChanged", view: next });
    },
  };
}
