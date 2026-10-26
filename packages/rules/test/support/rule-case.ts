// Format d'un cas de test de règle (test/cases/**/*.json).
// Chaque fichier est validé avec ce schéma avant d'être exécuté : un cas
// mal écrit fait échouer le lanceur au lieu de passer en silence.

import Type, { type Static } from "typebox";
import { MinCardCountSchema } from "../../src/clocks/rule-schemas.js";
import { SectionIndex } from "../../src/clocks/section.js";
import { ViolationSchema } from "../../src/general-rules/violation.js";
import { PlacementSchema } from "../../src/placements/placement.js";

/** Cas d'une règle qui s'applique à une seule section. */
const SectionRuleCaseSchema = Type.Object(
  {
    description: Type.String({ minLength: 1 }),
    // Les règles de section que le lanceur sait exécuter. Ajouter une règle
    // ici sans l'ajouter dans evaluate (rule-cases.test.ts) fait échouer typecheck.
    rule: Type.Union([MinCardCountSchema]),
    // La section sur laquelle la règle est vérifiée.
    section: SectionIndex,
    // La pose complète, pas seulement la section vérifiée : les cas peuvent
    // ainsi vérifier que la règle ignore les autres sections.
    placements: Type.Array(PlacementSchema),
    // Violations attendues. Liste vide : la règle est respectée.
    expected: Type.Array(ViolationSchema),
  },
  { additionalProperties: false },
);

// Étape suivante : ClockRuleCaseSchema pour ascendingOrder, avec startSection
// au lieu de section.

export const RuleCaseSchema = Type.Union([SectionRuleCaseSchema]);
export type RuleCase = Static<typeof RuleCaseSchema>;
