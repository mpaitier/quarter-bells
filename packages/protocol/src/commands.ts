// Commandes envoyées par l'écran de jeu (ADR 0017). Une commande demande une
// action ; la partie peut la refuser (protocol.md, « Principes »).
//
// Une commande ne dit jamais qui l'envoie : au J3, le serveur le saura par la
// connexion, et l'adaptateur local par la passerelle utilisée. Un client ne
// peut donc pas se faire passer pour un autre joueur en remplissant un champ.

import type { GameAction, GameRejection } from "@quarter-bells/game";
import type { CardId, PlayerId } from "@quarter-bells/rules";

/** L'hôte met fin à l'annonce de l'horloge. */
export interface EndAnnouncementCommand {
  readonly type: "endAnnouncement";
}

/** Le joueur se déclare prêt, ou revient sur sa décision. */
export interface SetReadyCommand {
  readonly type: "setReady";
  readonly ready: boolean;
}

/** Le joueur pose une carte de sa main devant une section. */
export interface PlaceCardCommand {
  readonly type: "placeCard";
  readonly cardId: CardId;
  readonly sectionIndex: number;
  readonly faceUp: boolean;
}

/** Une décision de l'hôte après une épreuve. */
export interface HostDecisionCommand {
  readonly type: "continue" | "retry" | "restartChapter" | "stop";
}

/** Toutes les commandes de jeu. Union discriminée sur type. */
export type GameCommand =
  | EndAnnouncementCommand
  | SetReadyCommand
  | PlaceCardCommand
  | HostDecisionCommand;

/**
 * Raison d'un refus, telle que la partie la donne. Elle deviendra la `reason`
 * de l'événement `CommandRejected` au J3.
 */
export type CommandRejection = GameRejection;

/**
 * Traduit une commande en action du moteur, pour le joueur qui l'a envoyée.
 *
 * Chaque action est reconstruite champ par champ : un champ en trop dans une
 * commande reçue du réseau (un `player` falsifié, par exemple) ne passe
 * jamais dans le moteur.
 */
export function toGameAction(
  command: GameCommand,
  player: PlayerId,
): GameAction {
  switch (command.type) {
    case "endAnnouncement":
      return { type: command.type, player };
    case "setReady":
      return { type: command.type, player, ready: command.ready };
    case "placeCard":
      return {
        type: command.type,
        player,
        cardId: command.cardId,
        sectionIndex: command.sectionIndex,
        faceUp: command.faceUp,
      };
    case "continue":
    case "retry":
    case "restartChapter":
    case "stop":
      return { type: command.type, player };
  }
}
