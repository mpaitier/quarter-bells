// Port de l'écran de jeu (ADR 0017, architecture hexagonale) : la seule
// façon pour l'écran de parler à une partie. Il envoie des commandes et
// reçoit la vue de son joueur, sans savoir où la partie se joue.
//
// - J2 : adaptateur local (local/local-game-session.ts), la partie tourne
//   dans le navigateur.
// - J3 : adaptateur WebSocket, la partie tourne sur le serveur.
//
// Une passerelle représente un seul joueur, comme une connexion au serveur.

import type {
  CommandRejection,
  GameCommand,
  PlayerView,
} from "@quarter-bells/protocol";

/** Ce qu'une passerelle annonce à ses abonnés. */
export type GatewayEvent =
  /** La vue du joueur a changé : la relire avec getView. */
  | { readonly type: "viewChanged"; readonly view: PlayerView }
  /** Une commande de ce joueur a été refusée ; la vue n'a pas changé. */
  | {
      readonly type: "commandRejected";
      readonly command: GameCommand;
      readonly rejection: CommandRejection;
    };

export type GatewayListener = (event: GatewayEvent) => void;

/** Se désabonner. Appeler plusieurs fois ne fait rien de plus. */
export type Unsubscribe = () => void;

/**
 * Les opérations sont des propriétés et non des méthodes : l'écran peut les
 * passer telles quelles (à useSyncExternalStore, à un gestionnaire de clic)
 * sans perdre `this`.
 */
export interface GameGateway {
  /**
   * La dernière vue reçue. undefined tant qu'aucune n'est arrivée (au J3,
   * avant le premier message du serveur). Renvoie le même objet tant que la
   * vue n'a pas changé.
   */
  readonly getView: () => PlayerView | undefined;

  /**
   * Envoie une commande. Ne renvoie rien : la réponse arrive plus tard, aux
   * abonnés, sous forme de nouvelle vue ou de refus. L'écran ne doit jamais
   * supposer qu'elle arrive avant le retour de send.
   */
  readonly send: (command: GameCommand) => void;

  /** S'abonne aux événements de la passerelle. */
  readonly subscribe: (listener: GatewayListener) => Unsubscribe;
}
