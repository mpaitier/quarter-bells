import Type from "typebox";
import { CardFamilySchema } from "../cards/card-schema.js";

/** Entier supérieur ou égal à minimum. */
const Int = (minimum: number) => Type.Integer({ minimum });

/**
 * Fabrique le schéma d'une règle : un kind fixe et des params fermés.
 *
 * Les génériques K et P conservent le type exact du kind ("minCardCount"
 * et pas string) et des params : c'est ce qui permet ensuite à TypeScript
 * de distinguer les règles par leur kind.
 *
 * additionalProperties: false sur les deux niveaux : un champ inconnu
 * (faute de frappe « mni » au lieu de « min ») devient une erreur au lieu
 * d'être ignoré en silence.
 */
const ruleSchema = <K extends string, P extends Type.TProperties>(
  kind: K,
  params: P,
) =>
  Type.Object(
    {
      kind: Type.Literal(kind),
      params: Type.Object(params, { additionalProperties: false }),
    },
    { additionalProperties: false },
  );

/** Au moins `min` cartes devant la section. */
export const MinCardCountSchema = ruleSchema("minCardCount", { min: Int(1) });

/** Exactement `count` cartes, d'une famille donnée ou toutes familles confondues. */
export const ExactCardCountSchema = ruleSchema("exactCardCount", {
  count: Int(0),
  // Optional : le champ peut être absent (toutes familles confondues).
  // Avec exactOptionalPropertyTypes, « family: undefined » est refusé.
  family: Type.Optional(CardFamilySchema),
});

/**
 * Valeur de la section entre `min` et `max`, bornes incluses.
 * La contrainte min <= max ne s'exprime pas en JSON Schema :
 * elle est vérifiée dans parseClock (checkSemantics).
 */
export const SumInRangeSchema = ruleSchema("sumInRange", {
  min: Int(0),
  max: Int(0),
});

/**
 * Valeur inférieure ou égale à `max`. Portée section ou horloge :
 * ce schéma figure donc dans les deux tables plus bas.
 */
export const MaxSumSchema = ruleSchema("maxSum", { max: Int(1) });

/** Les poses de rang indiqué doivent se faire devant cette section. */
export const FirstPlacementsSchema = ruleSchema("firstPlacements", {
  // minItems : une liste vide ne contraindrait rien.
  // uniqueItems : [0, 0] est une erreur de saisie, pas une règle.
  placementIndexes: Type.Array(Int(0), { minItems: 1, uniqueItems: true }),
});

/** Ordre croissant à partir de la section de départ. Aucun paramètre. */
export const AscendingOrderSchema = ruleSchema("ascendingOrder", {});

/**
 * Règles autorisées dans une section, indexées par leur kind.
 * parseClock s'en sert pour retrouver le schéma d'une règle à partir
 * de son kind, sans tester toutes les branches (ADR 0008).
 */
export const SECTION_RULE_SCHEMAS = {
  minCardCount: MinCardCountSchema,
  maxSum: MaxSumSchema,
  exactCardCount: ExactCardCountSchema,
  sumInRange: SumInRangeSchema,
  firstPlacements: FirstPlacementsSchema,
} as const;

/** Règles autorisées au niveau de l'horloge, indexées par leur kind. */
export const CLOCK_RULE_SCHEMAS = {
  ascendingOrder: AscendingOrderSchema,
  maxSum: MaxSumSchema,
} as const;

/**
 * « Une règle de section, quelle qu'elle soit ».
 * Sert au JSON Schema publié et au type SectionRule.
 * Doit lister les mêmes schémas que SECTION_RULE_SCHEMAS :
 * le test de types de clock-schema.test.ts détecte un oubli.
 */
export const SectionRuleSchema = Type.Union([
  MinCardCountSchema,
  MaxSumSchema,
  ExactCardCountSchema,
  SumInRangeSchema,
  FirstPlacementsSchema,
]);

/** « Une règle d'horloge, quelle qu'elle soit ». */
export const ClockRuleSchema = Type.Union([AscendingOrderSchema, MaxSumSchema]);
