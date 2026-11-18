// Vue d'un joueur (ADR 0017, domain-model.md « Vue d'un joueur ») : ce que
// l'écran de jeu reçoit à la place de l'état complet. Elle ne contient que ce
// que ce joueur a le droit de connaître à l'instant présent (NF-SEC-01).
//
// Comme l'état du moteur, la vue n'est faite que de données sérialisables en
// JSON : au J3, elle passera telle quelle sur le réseau.

import type {
  Candles,
  Card,
  CardFamily,
  CardId,
  Clock,
  FaceDownPlacement,
  Placement,
  PlayerId,
  ResolutionReport,
  TrialPlacement,
} from "@quarter-bells/rules";

/** Une carte dont le joueur ne voit que le dos : seule la famille est connue. */
export interface CardBack {
  readonly family: CardFamily;
}

/**
 * Une carte de la réserve du joueur (partie à 2) : il la désigne par son
 * identifiant, mais n'en connaît pas encore la valeur.
 */
export interface ReserveCard extends CardBack {
  readonly id: CardId;
}

/**
 * Une carte posée, vue par ce joueur. Une carte face visible, ou posée face
 * cachée par lui-même, garde sa valeur (F-JEU-11). Une carte posée face
 * cachée par un autre n'a que sa famille.
 *
 * Compatible avec PublicPlacement (ADR 0016) : l'écran passe la liste telle
 * quelle à listPlacementOptions.
 */
export type PlacedCard = (Placement | FaceDownPlacement) & {
  readonly player: PlayerId;
};

/** Le siège du joueur qui regarde : sa main est entièrement visible. */
export interface OwnSeat {
  readonly player: PlayerId;
  readonly hand: readonly Card[];
  readonly reserve: readonly ReserveCard[];
}

/** Le siège d'un autre joueur : uniquement les familles de ses cartes. */
export interface OtherSeat {
  readonly player: PlayerId;
  readonly hand: readonly CardBack[];
  readonly reserve: readonly CardBack[];
}

/** Une épreuve en cours de Pose, vue par un joueur. */
export interface PlacingTrialView {
  readonly startSection: number;
  /** Les poses acceptées, dans l'ordre : la position est le rang de pose. */
  readonly placements: readonly PlacedCard[];
  readonly candles: Candles;
  readonly maxBonusCandles: number;
  /** Le joueur dont c'est le tour. */
  readonly currentPlayer: PlayerId;
  readonly ownSeat: OwnSeat;
  /** Les autres joueurs, dans l'ordre de passage. */
  readonly otherSeats: readonly OtherSeat[];
}

/**
 * Une épreuve résolue. Toutes les cartes sont révélées à la Résolution
 * (F-JEU-12) : le rapport ne cache plus rien.
 */
export interface ResolvedTrialView {
  readonly startSection: number;
  readonly candles: Candles;
  readonly maxBonusCandles: number;
  readonly resolution: ResolutionReport<TrialPlacement>;
  readonly bonusCandlesAfter: number;
}

/** Champs communs à toutes les phases. */
interface PlayerViewCommon {
  /** Le joueur à qui cette vue est destinée. */
  readonly viewer: PlayerId;
  readonly turnOrder: readonly PlayerId[];
  readonly host: PlayerId;
  readonly chapterNumber: number;
  /** Rang de l'horloge dans son chapitre, à partir de 0. */
  readonly clockIndex: number;
  /** Nombre d'horloges du chapitre. */
  readonly clockCount: number;
  /** L'horloge en cours. Ses règles sont publiques. */
  readonly clock: Clock;
}

export interface AnnouncingView extends PlayerViewCommon {
  readonly phase: "announcing";
  readonly bonusCandles: number;
}

export interface DiscussionView extends PlayerViewCommon {
  readonly phase: "discussion";
  readonly bonusCandles: number;
  readonly readyPlayers: readonly PlayerId[];
}

export interface PlacementView extends PlayerViewCommon {
  readonly phase: "placement";
  readonly trial: PlacingTrialView;
}

export interface ResolvedView extends PlayerViewCommon {
  readonly phase: "succeeded" | "failed" | "runLost";
  readonly trial: ResolvedTrialView;
}

export interface ChapterCompletedView extends PlayerViewCommon {
  readonly phase: "chapterCompleted";
  readonly readyPlayers: readonly PlayerId[];
}

export interface CompletedView extends PlayerViewCommon {
  readonly phase: "completed";
}

export interface EndedView extends PlayerViewCommon {
  readonly phase: "ended";
}

/** La partie vue par un joueur. Union discriminée sur phase, comme Game. */
export type PlayerView =
  | AnnouncingView
  | DiscussionView
  | PlacementView
  | ResolvedView
  | ChapterCompletedView
  | CompletedView
  | EndedView;
