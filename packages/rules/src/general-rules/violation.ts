// packages/rules/src/general-rules/violation.ts
//
// Violations renvoyées par les règles générales (issue #7).
// Une violation reprend la règle telle qu'elle est écrite dans l'horloge
// (kind + params, issus des schémas de rule-schemas.ts), la section où elle
// a échoué, et ce qui a été observé.
// Seul le type Violation est exporté par index.ts.

import Type, { type Static } from "typebox";
import { SectionIndexSchema } from "../clocks/section.js";
import {
  AscendingOrderSchema,
  MaxSumSchema,
  MinCardCountSchema,
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
