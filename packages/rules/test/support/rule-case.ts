// Format d'un cas de test de règle (test/cases/**/*.json).
// Chaque fichier est validé avec ce schéma avant d'être exécuté : un cas
// mal écrit fait échouer le lanceur au lieu de passer en silence.
//
// Deux formes de cas : les règles de section indiquent la section vérifiée
// (section), les règles d'horloge indiquent la section de départ du parcours
// (startSection). additionalProperties: false rend les deux exclusives : un
// cas qui porterait les deux champs est refusé.

import Type, { type Static } from "typebox";
import {
  AscendingOrderSchema,
  MaxSumSchema,
  MinCardCountSchema,
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
    // échouer typecheck.
    rule: Type.Union([MinCardCountSchema, MaxSumSchema]),
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

export const RuleCaseSchema = Type.Union([
  SectionRuleCaseSchema,
  ClockRuleCaseSchema,
]);
export type RuleCase = Static<typeof RuleCaseSchema>;

/** Cas d'une règle de section, utile pour typer les fonctions du lanceur. */
export type SectionRuleCase = Static<typeof SectionRuleCaseSchema>;
