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

// Règles générales : type des violations renvoyées. Les schémas restent internes.
export type { Violation } from "./general-rules/violation.js";
