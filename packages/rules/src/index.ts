/**
 * API publique du moteur de règles.
 *
 * Seul ce fichier est importable depuis les autres packages. Tout ce qui
 * est exporté ici est un contrat : le retirer ou le modifier oblige à
 * adapter le serveur et le web. On n'y ajoute donc que ce dont ils ont
 * réellement besoin.
 */

// Cartes : types du domaine, et validation des valeurs venues du réseau.
export {
  CARD_FAMILIES,
  CARD_VALUES,
  isCardFamily,
  toCardId,
  type Card,
  type CardFamily,
  type CardId,
  type CardValue,
} from "./cards/card.js";

// Distribution d'une épreuve.
export {
  PLAYER_COUNTS,
  dealTrialCards,
  isPlayerCount,
  type DealtCards,
  type PlayerCount,
} from "./cards/deal.js";

// Générateur à graine : le serveur en crée un par épreuve.
export { MAX_SEED, createSeededRng, type Rng } from "./random/rng.js";

// Horloges : chargement et types. Les schémas TypeBox restent internes.
export { parseClock } from "./clocks/parse-clock.js";
export {
  SECTION_COUNT,
  type Clock,
  type ClockRule,
  type SectionRule,
} from "./clocks/clock.js";

// Erreurs que le serveur doit pouvoir reconnaître et traiter.
export {
  InvalidClockError,
  InvalidPlayerCountError,
  InvalidSeedError,
  type ClockIssue,
} from "./errors.js";

// Violations renvoyées par le moteur. Les schémas restent internes.
export type { Violation } from "./rule-checks/violation.js";

// Règles générales : évaluation d'une pose complète.
export {
  DEFAULT_MAX_SUM,
  evaluateGeneralRules,
} from "./general-rules/evaluate-general-rules.js";

// Pose : une carte posée, et l'évaluation d'une pose proposée avant de
// l'accepter (ADR 0009). Le serveur s'en sert pour refuser, le client pour
// signaler les sections interdites (F-JEU-08).
export type { Placement } from "./placements/placement.js";
export { evaluatePlacement } from "./evaluation/evaluate-placement.js";

// Résolution : forme du rapport, que le serveur envoie dans TrialResolved.
// L'évaluation elle-même est déclenchée par la dernière pose d'une épreuve.
export type {
  ResolutionReport,
  SectionReveal,
} from "./evaluation/evaluate-resolution.js";

// Épreuve : création et actions, sur le modèle du reducer (ADR 0010).
export { createTrial, type TrialSetup } from "./trial/create-trial.js";
export {
  applyTrialAction,
  type PlaceCardAction,
  type TrialAction,
  type TrialRejection,
  type TrialResult,
} from "./trial/apply-trial-action.js";
export {
  currentPlayer,
  type PlacingTrial,
  type PlayerId,
  type ResolvedTrial,
  type Seat,
  type Trial,
  type TrialPlacement,
} from "./trial/trial.js";
export {
  MAX_BONUS_EYES,
  availableEyes,
  type EyeSettings,
  type Eyes,
} from "./trial/eyes.js";
