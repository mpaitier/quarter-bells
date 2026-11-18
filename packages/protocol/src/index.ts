/**
 * API publique du protocole (ADR 0017).
 *
 * Seul ce fichier est importable depuis les autres packages. Tout ce qui
 * est exporté ici est un contrat entre l'écran de jeu et la partie : le
 * retirer ou le modifier oblige à adapter le web et, au J3, le serveur.
 */

// Vue d'un joueur : tout ce que l'écran de jeu reçoit.
export type {
  AnnouncingView,
  CardBack,
  ChapterCompletedView,
  CompletedView,
  DiscussionView,
  EndedView,
  OtherSeat,
  OwnSeat,
  PlacedCard,
  PlacementView,
  PlacingTrialView,
  PlayerView,
  ReserveCard,
  ResolvedTrialView,
  ResolvedView,
} from "./player-view.js";

// Projection de l'état complet vers la vue d'un joueur. Appelée par
// l'adaptateur local au J2 et par le serveur au J3, jamais par l'écran.
export { projectPlayerView } from "./project-player-view.js";

// Commandes : tout ce que l'écran de jeu envoie.
export {
  toGameAction,
  type CommandRejection,
  type EndAnnouncementCommand,
  type GameCommand,
  type HostDecisionCommand,
  type PlaceCardCommand,
  type SetReadyCommand,
} from "./commands.js";
