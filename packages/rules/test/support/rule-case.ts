// Format d'un cas de test de règle (test/cases/**/*.json).
// Chaque fichier est validé avec ce schéma avant d'être exécuté : un cas
// mal écrit fait échouer le lanceur au lieu de passer en silence.
//
// Trois formes de cas :
// - règle de section, évaluée à la Résolution : la section vérifiée (section) ;
// - règle d'horloge, évaluée à la Résolution : la section de départ du
//   parcours (startSection) ;
// - évaluation pendant la Pose (contrainte de pose ou borne haute connue) :
//   la section qui porte la règle (section) et la pose proposée (candidate).
// additionalProperties: false rend les formes exclusives : un cas qui
// porterait à la fois startSection et candidate est refusé.

import Type, { type Static } from "typebox";
import {
  AscendingOrderSchema,
  ExactCardCountSchema,
  FirstPlacementsSchema,
  MaxSumSchema,
  MinCardCountSchema,
  SumInRangeSchema,
} from "../../src/clocks/rule-schemas.js";
import { SectionIndexSchema } from "../../src/clocks/section.js";
import { ViolationSchema } from "../../src/rule-checks/violation.js";
import { PlacementSchema } from "../../src/placements/placement.js";

/** Cas d'une règle qui s'applique à une seule section. */
const SectionRuleCaseSchema = Type.Object(
  {
    description: Type.String({ minLength: 1 }),
    // Les règles de section que le lanceur sait exécuter. Ajouter une règle
    // ici sans l'ajouter dans checkSectionRule (rule-cases.test.ts) fait
    // échouer le lint.
    rule: Type.Union([
      MinCardCountSchema,
      MaxSumSchema,
      ExactCardCountSchema,
      SumInRangeSchema,
    ]),
    // La section sur laquelle la règle est vérifiée.
    section: SectionIndexSchema,
    // La pose complète, pas seulement la section vérifiée : les cas peuvent
    // ainsi vérifier que la règle ignore les autres sections.
    placements: Type.Array(PlacementSchema),
    // Violations attendues. Liste vide : la règle est respectée.
    expected: Type.Array(ViolationSchema),
  },
  { additionalProperties: false },
);

/** Cas d'une règle qui s'applique à tout le cadran. */
const ClockRuleCaseSchema = Type.Object(
  {
    description: Type.String({ minLength: 1 }),
    // Une seule règle d'horloge exécutable pour l'instant. En ajouter une
    // change le type de rule.params et oblige à introduire un switch dans
    // evaluate (rule-cases.test.ts).
    rule: AscendingOrderSchema,
    // La section de départ du parcours dans le sens horaire.
    startSection: SectionIndexSchema,
    placements: Type.Array(PlacementSchema),
    // Violations attendues, dans l'ordre du parcours. Liste vide : la règle
    // est respectée.
    expected: Type.Array(ViolationSchema),
  },
  { additionalProperties: false },
);

/** Cas d'une évaluation pendant la Pose : la pose proposée est-elle refusée ? */
const PlacementCaseSchema = Type.Object(
  {
    description: Type.String({ minLength: 1 }),
    // Les règles qui ont une évaluation pendant la Pose. Ajouter une règle
    // ici sans l'ajouter dans checkAtPlacement (rule-cases.test.ts) fait
    // échouer le lint.
    rule: Type.Union([FirstPlacementsSchema, MaxSumSchema, SumInRangeSchema]),
    // La section qui porte la règle.
    section: SectionIndexSchema,
    // La pose déjà faite, dans l'ordre des poses. Sa longueur donne le rang
    // de la pose proposée.
    placements: Type.Array(PlacementSchema),
    // La pose proposée, pas encore acceptée.
    candidate: PlacementSchema,
    // Violations attendues. Liste vide : la pose est acceptée.
    expected: Type.Array(ViolationSchema),
  },
  { additionalProperties: false },
);

export const RuleCaseSchema = Type.Union([
  SectionRuleCaseSchema,
  ClockRuleCaseSchema,
  PlacementCaseSchema,
]);
export type RuleCase = Static<typeof RuleCaseSchema>;

/** Cas d'une règle de section, utile pour typer les fonctions du lanceur. */
export type SectionRuleCase = Static<typeof SectionRuleCaseSchema>;

/** Cas d'une évaluation pendant la Pose, pour typer le lanceur. */
export type PlacementCase = Static<typeof PlacementCaseSchema>;
