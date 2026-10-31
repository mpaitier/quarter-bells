// Violations renvoyées par les vérifications de règles (un fichier par kind
// dans ce dossier).
// Une violation reprend la règle telle qu'elle est écrite dans l'horloge
// (kind + params, issus des schémas de rule-schemas.ts), la section où elle
// a échoué, et ce qui a été observé.
// Seul le type Violation est exporté par index.ts.

import Type, { type Static } from "typebox";
import { SectionIndexSchema } from "../clocks/section.js";
import {
  AscendingOrderSchema,
  ExactCardCountSchema,
  FirstPlacementsSchema,
  MaxSumSchema,
  MinCardCountSchema,
  SumInRangeSchema,
} from "../clocks/rule-schemas.js";

/** Valeur d'une section : somme de ses cartes. Une section vide vaut 0. */
const SectionValue = Type.Integer({ minimum: 0 });

/**
 * Une section ne contient pas assez de cartes.
 *
 * Décision : les règles sont indépendantes. Une section vide vaut 0 et reste
 * soumise à ascendingOrder ; elle peut produire minCardCount ET ascendingOrder.
 */
export const MinCardCountViolationSchema = Type.Object(
  {
    // kind et params viennent du schéma de la règle : une seule définition.
    ...MinCardCountSchema.properties,
    section: SectionIndexSchema,
    // Nombre de cartes réellement posées.
    cardCount: Type.Integer({ minimum: 0 }),
  },
  { additionalProperties: false },
);

/**
 * Une section vaut moins que la précédente, dans le sens horaire depuis la
 * section de départ. Une égalité n'est pas une violation.
 */
export const AscendingOrderViolationSchema = Type.Object(
  {
    ...AscendingOrderSchema.properties,
    section: SectionIndexSchema,
    value: SectionValue,
    // Section comparée et sa valeur : l'interface surligne les deux sans
    // refaire le calcul du sens horaire.
    previousSection: SectionIndexSchema,
    previousValue: SectionValue,
  },
  { additionalProperties: false },
);

/**
 * Une section dépasse le plafond (24 par défaut, ou celui d'une règle de
 * l'horloge). Ne s'applique pas si l'horloge a noMaxSum.
 */
export const MaxSumViolationSchema = Type.Object(
  {
    ...MaxSumSchema.properties,
    section: SectionIndexSchema,
    value: SectionValue,
  },
  { additionalProperties: false },
);

/**
 * Une section n'a pas exactement le nombre de cartes demandé, trop ou trop
 * peu. Avec params.family, seules les cartes de cette famille sont comptées.
 */
export const ExactCardCountViolationSchema = Type.Object(
  {
    ...ExactCardCountSchema.properties,
    section: SectionIndexSchema,
    // Nombre de cartes comptées : celles de params.family si elle est
    // précisée, toutes sinon. Comparé à params.count, il dit à l'interface
    // s'il manque des cartes ou s'il y en a trop.
    cardCount: Type.Integer({ minimum: 0 }),
  },
  { additionalProperties: false },
);

/**
 * La valeur d'une section sort de l'intervalle [min, max], par le bas ou par
 * le haut. Même forme que maxSum : la valeur observée suffit, la borne
 * franchie se déduit de params.
 */
export const SumInRangeViolationSchema = Type.Object(
  {
    ...SumInRangeSchema.properties,
    section: SectionIndexSchema,
    value: SectionValue,
  },
  { additionalProperties: false },
);

/**
 * Une pose de rang listé vise une autre section que celle qui porte la règle.
 * Seule violation produite pendant la Pose pour l'instant : elle accompagne
 * le refus de la pose, et le client s'en sert pour guider le joueur.
 */
export const FirstPlacementsViolationSchema = Type.Object(
  {
    ...FirstPlacementsSchema.properties,
    // Section qui porte la règle : celle où la carte aurait dû aller.
    section: SectionIndexSchema,
    // Rang de la pose refusée, 0 pour la première de l'épreuve.
    placementIndex: Type.Integer({ minimum: 0 }),
    // Section que le joueur avait choisie. Le client la connaît déjà, mais
    // la violation reste lisible seule (journaux, tests, relecture).
    attemptedSection: SectionIndexSchema,
  },
  { additionalProperties: false },
);

/**
 * Une violation, quelle que soit la règle. Union discriminée sur kind.
 *
 * Décision : le moteur renvoie TOUTES les violations, triées par kind puis
 * par section, pour que l'interface surligne chaque section fautive et que
 * les tests soient stables.
 */
export const ViolationSchema = Type.Union([
  MinCardCountViolationSchema,
  AscendingOrderViolationSchema,
  MaxSumViolationSchema,
  ExactCardCountViolationSchema,
  SumInRangeViolationSchema,
  FirstPlacementsViolationSchema,
]);
export type Violation = Static<typeof ViolationSchema>;

/** Violation de minCardCount. Type de retour précis de checkMinCardCount. */
export type MinCardCountViolation = Static<typeof MinCardCountViolationSchema>;

/** Violation d'ascendingOrder. */
export type AscendingOrderViolation = Static<
  typeof AscendingOrderViolationSchema
>;

/** Violation de maxSum. */
export type MaxSumViolation = Static<typeof MaxSumViolationSchema>;

/** Violation d'exactCardCount. */
export type ExactCardCountViolation = Static<
  typeof ExactCardCountViolationSchema
>;

/** Violation de sumInRange. */
export type SumInRangeViolation = Static<typeof SumInRangeViolationSchema>;

/** Violation de firstPlacements. */
export type FirstPlacementsViolation = Static<
  typeof FirstPlacementsViolationSchema
>;

/**
 * Rang de chaque règle dans un résultat trié, dans l'ordre du catalogue
 * (docs/rule-catalog.md). Un Record sur le type des kind oblige à classer
 * toute nouvelle violation : un kind oublié ici fait échouer typecheck.
 */
const KIND_RANK: Record<Violation["kind"], number> = {
  minCardCount: 0,
  ascendingOrder: 1,
  maxSum: 2,
  exactCardCount: 3,
  sumInRange: 4,
  firstPlacements: 5,
};

/**
 * Compare deux violations : par règle, puis par section. À passer à sort ou
 * toSorted pour obtenir l'ordre stable attendu par l'interface et les tests.
 */
export function compareViolations(a: Violation, b: Violation): number {
  return KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.section - b.section;
}
