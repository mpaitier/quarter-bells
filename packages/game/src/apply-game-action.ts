import {
  applyTrialAction,
  createTrial,
  type PlaceCardAction,
  type PlayerId,
  type TrialRejection,
} from "@quarter-bells/rules";

import {
  currentClock,
  type AnnouncingGame,
  type DiscussionGame,
  type Game,
  type PlacementGame,
} from "./game.js";
import { deriveTrialSeed } from "./trial-seed.js";

/** L'hôte met fin à l'annonce de l'horloge : la Discussion commence. */
export interface EndAnnouncementAction {
  readonly type: "endAnnouncement";
  readonly player: PlayerId;
}

/** Un joueur se déclare prêt, ou revient sur sa décision (F-JEU-04). */
export interface SetReadyAction {
  readonly type: "setReady";
  readonly player: PlayerId;
  readonly ready: boolean;
}

/**
 * Les actions possibles sur une partie. Chacune porte le joueur qui
 * l'envoie : au J3, le serveur le remplira d'après la connexion. Poser une
 * carte reprend telle quelle l'action de l'épreuve.
 */
export type GameAction =
  EndAnnouncementAction | SetReadyAction | PlaceCardAction;

/**
 * Raison structurée d'un refus : celles de l'épreuve, transmises telles
 * quelles, et celles de la partie.
 */
export type GameRejection =
  | TrialRejection
  /** Le joueur ne fait pas partie de la partie. */
  | { readonly reason: "unknownPlayer" }
  /** L'action n'a pas de sens dans la phase actuelle. */
  | { readonly reason: "wrongPhase" }
  /** Action réservée à l'hôte. */
  | { readonly reason: "notHost" };

/**
 * Résultat d'une action. Un refus ne contient pas de partie : l'appelant
 * garde celle qu'il avait, qui n'a pas changé.
 */
export type GameResult =
  | { readonly accepted: true; readonly game: Game }
  | { readonly accepted: false; readonly rejection: GameRejection };

/**
 * Applique une action à une partie (ADR 0015, sur le modèle de l'ADR 0010).
 * Ne modifie jamais la partie reçue : renvoie une nouvelle partie, ou un
 * refus.
 */
export function applyGameAction(game: Game, action: GameAction): GameResult {
  // Vérifié une fois pour toutes les actions : les suivantes peuvent
  // supposer que le joueur joue.
  if (!game.setup.turnOrder.includes(action.player)) {
    return reject({ reason: "unknownPlayer" });
  }

  switch (action.type) {
    case "endAnnouncement":
      return game.phase === "announcing"
        ? endAnnouncement(game, action)
        : reject({ reason: "wrongPhase" });
    case "setReady":
      return game.phase === "discussion"
        ? setReady(game, action)
        : reject({ reason: "wrongPhase" });
    case "placeCard":
      return game.phase === "placement"
        ? placeCard(game, action)
        : reject({ reason: "wrongPhase" });
  }
}

function endAnnouncement(
  game: AnnouncingGame,
  action: EndAnnouncementAction,
): GameResult {
  if (action.player !== game.setup.host) {
    return reject({ reason: "notHost" });
  }
  return accept({ ...game, phase: "discussion", readyPlayers: [] });
}

function setReady(game: DiscussionGame, action: SetReadyAction): GameResult {
  const readyPlayers = updateReadyPlayers(
    game.readyPlayers,
    action.player,
    action.ready,
  );
  // Tous prêts : la distribution suit dans la même action. Il n'existe pas
  // d'état « tous prêts, cartes pas encore distribuées ».
  if (readyPlayers.length === game.setup.turnOrder.length) {
    return accept(dealTrial(game));
  }
  return accept({ ...game, readyPlayers });
}

/**
 * Les joueurs prêts après le changement d'un joueur. Se déclarer prêt deux
 * fois, ou pas prêt sans l'avoir été, ne change rien.
 */
function updateReadyPlayers(
  readyPlayers: readonly PlayerId[],
  player: PlayerId,
  ready: boolean,
): readonly PlayerId[] {
  const alreadyReady = readyPlayers.includes(player);
  if (ready && !alreadyReady) {
    return [...readyPlayers, player];
  }
  if (!ready && alreadyReady) {
    return readyPlayers.filter((other) => other !== player);
  }
  return readyPlayers;
}

/**
 * Distribue les cartes de l'horloge en cours et ouvre la Pose (transitions
 * « Vers Dealing » et « Vers Placement » de game-state.md).
 */
function dealTrial(game: DiscussionGame): PlacementGame {
  const { setup, trialCount, bonusCandles } = game;
  const clock = currentClock(game);
  const trial = createTrial({
    clock,
    turnOrder: setup.turnOrder,
    // Le choix de la section de départ (F-JEU-17, chapitre 3) n'existe pas
    // encore : la section par défaut de l'horloge est toujours jouée.
    startSection: clock.defaultStartSection,
    seed: deriveTrialSeed(setup.seed, trialCount),
    bonusCandles,
    candleSettings: setup.candleSettings,
  });
  // On reconstruit l'objet au lieu d'étaler la Discussion : bonusCandles et
  // readyPlayers n'ont rien à faire dans une partie en Pose.
  return {
    phase: "placement",
    setup,
    position: game.position,
    trialCount: trialCount + 1,
    trial,
  };
}

/** Transmet la pose au reducer de l'épreuve, et reprend sa phase si elle se résout. */
function placeCard(game: PlacementGame, action: PlaceCardAction): GameResult {
  const result = applyTrialAction(game.trial, action);
  if (!result.accepted) {
    return reject(result.rejection);
  }
  const { trial } = result;
  // Le reducer ne renvoie que ces deux formes : une épreuve en Pose, ou une
  // épreuve résolue dont la phase devient celle de la partie.
  return accept(
    trial.phase === "placement"
      ? { ...game, trial }
      : { ...game, phase: trial.phase, trial },
  );
}

function accept(game: Game): GameResult {
  return { accepted: true, game };
}

function reject(rejection: GameRejection): GameResult {
  return { accepted: false, rejection };
}
