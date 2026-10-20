import Type, { type TSchema } from "typebox";
import { ClockRuleSchema, SectionRuleSchema } from "./rule-schemas.js";

/** Entier entre minimum et maximum, bornes incluses. */
const Int = (minimum: number, maximum: number) =>
  Type.Integer({ minimum, maximum });

/**
 * Fabrique le schéma d'une horloge à partir des schémas de règles.
 * Appelée deux fois : avec les vraies règles (schéma complet) et avec
 * une règle générique (enveloppe). Les champs de l'horloge ne sont
 * écrits qu'ici, une seule fois.
 */
function buildClockSchema<S extends TSchema, C extends TSchema>(
  sectionRule: S,
  clockRule: C,
) {
  // Section dont l'index est figé : la section en position i
  // doit déclarer index = i, sinon c'est une erreur.
  const section = <I extends number>(index: I) =>
    Type.Object(
      { index: Type.Literal(index), rules: Type.Array(sectionRule) },
      { additionalProperties: false },
    );

  return Type.Object(
    {
      // Référence vers le JSON Schema, pour l'éditeur. Facultative.
      $schema: Type.Optional(Type.String()),
      // Literal(1) : une version 2 du format sera refusée tant que le
      // moteur ne sait pas la lire.
      formatVersion: Type.Literal(1),
      uid: Type.String({ minLength: 1 }),
      chapter: Int(1, 10),
      indexInChapter: Int(0, 3),
      noMaxSum: Type.Boolean(),
      startSectionMode: Type.Union([
        Type.Literal("fixed"),
        Type.Literal("chosenByPlayers"),
      ]),
      defaultStartSection: Int(0, 5),
      clockRules: Type.Array(clockRule),
      // Tuple : exactement 6 éléments, chacun avec son propre schéma.
      sections: Type.Tuple([
        section(0),
        section(1),
        section(2),
        section(3),
        section(4),
        section(5),
      ]),
    },
    { additionalProperties: false },
  );
}

/** Schéma complet : source du JSON Schema publié et des types. */
export const ClockSchema = buildClockSchema(SectionRuleSchema, ClockRuleSchema);

/** Une règle quelconque : on ne vérifie que sa forme générale. */
const AnyRuleSchema = Type.Object(
  { kind: Type.String(), params: Type.Object({}) },
  { additionalProperties: false },
);

/**
 * Schéma d'enveloppe : la structure de l'horloge sans le détail des règles.
 * Usage interne à parseClock, jamais exporté hors du paquet.
 */
export const ClockEnvelopeSchema = buildClockSchema(
  AnyRuleSchema,
  AnyRuleSchema,
);
