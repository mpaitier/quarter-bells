/**
 * API publique du moteur de partie (ADR 0015).
 *
 * Seul ce fichier est importable depuis les autres packages. Tout ce qui
 * est exporté ici est un contrat : le retirer ou le modifier oblige à
 * adapter le serveur et le web. On n'y ajoute donc que ce dont ils ont
 * réellement besoin.
 */

// Partie : configuration, état et création.
export { createGame } from "./create-game.js";
export {
  currentClock,
  type AnnouncingGame,
  type Chapter,
  type ChapterCompletedGame,
  type ClockPosition,
  type CompletedGame,
  type DiscussionGame,
  type EndedGame,
  type Game,
  type GameSetup,
  type PlacementGame,
  type ResolvedGame,
} from "./game.js";

// Actions : le reducer de la partie, sur le modèle de l'épreuve (ADR 0010).
export {
  applyGameAction,
  type EndAnnouncementAction,
  type GameAction,
  type SetReadyAction,
} from "./apply-game-action.js";
export type { GameRejection, GameResult } from "./game-result.js";
export type {
  ContinueAction,
  HostDecision,
  RestartChapterAction,
  RetryAction,
  StopAction,
} from "./host-decisions.js";
