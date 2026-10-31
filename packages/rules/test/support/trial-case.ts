// Format d'un cas d'épreuve complète (test/trials/*.json) : une horloge, une
// graine, une suite de poses, un résultat attendu (docs/testing.md). Chaque
// fichier est validé avec ce schéma avant d'être joué.

import Type, { type Static } from "typebox";
import { CardFaceSchema } from "../../src/cards/card-schema.js";
import { ViolationSchema } from "../../src/rule-checks/violation.js";
import type { TrialRejection } from "../../src/trial/apply-trial-action.js";

/**
 * Raisons de refus qu'un cas peut attendre. `satisfies` vérifie à la
 * compilation que chacune existe dans TrialRejection : une raison renommée
 * dans le moteur fait échouer typecheck ici.
 */
const REJECTION_REASONS = [
  "trialOver",
  "notYourTurn",
  "cardNotInHand",
  "unknownSection",
  "noEyeLeft",
  "ruleViolation",
] as const satisfies readonly TrialRejection["reason"][];

/** Une pose tentée. La carte est désignée par sa face, unique dans le jeu. */
const TrialStepSchema = Type.Object(
  {
    player: Type.String({ minLength: 1 }),
    // Famille et valeur : les identifiants sont tirés au hasard à la
    // distribution, un cas ne peut pas les connaître à l'avance. Le lanceur
    // cherche la carte dans la main et la réserve du joueur.
    card: CardFaceSchema,
    // Entier quelconque, pas SectionIndexSchema : un cas doit pouvoir
    // tenter une section hors du cadran et attendre unknownSection.
    section: Type.Integer(),
    faceUp: Type.Boolean(),
    // Absent : la pose doit être acceptée. Présent : elle doit être refusée
    // pour cette raison, sans changer l'épreuve.
    rejected: Type.Optional(Type.Enum(REJECTION_REASONS)),
  },
  { additionalProperties: false },
);

/** Une section du rapport de Résolution, sans le détail des cartes. */
const ExpectedSectionSchema = Type.Object(
  {
    section: Type.Integer({ minimum: 0, maximum: 5 }),
    value: Type.Integer({ minimum: 0 }),
    ascending: Type.Boolean(),
  },
  { additionalProperties: false },
);

export const TrialCaseSchema = Type.Object(
  {
    description: Type.String({ minLength: 1 }),
    // Nom d'un fichier de test/fixtures/clocks/.
    clock: Type.String({ pattern: "^[a-z0-9-]+\\.json$" }),
    turnOrder: Type.Array(Type.String({ minLength: 1 })),
    startSection: Type.Integer(),
    seed: Type.Integer(),
    bonusEyes: Type.Integer(),
    eyeSettings: Type.Object(
      {
        maxBonusEyes: Type.Integer(),
        baseEyesCap: Type.Optional(Type.Integer()),
      },
      { additionalProperties: false },
    ),
    steps: Type.Array(TrialStepSchema, { minItems: 1 }),
    expected: Type.Object(
      {
        phase: Type.Enum(["succeeded", "failed", "runLost"]),
        bonusEyesAfter: Type.Integer({ minimum: 0 }),
        // Dans l'ordre de révélation.
        sections: Type.Array(ExpectedSectionSchema, {
          minItems: 6,
          maxItems: 6,
        }),
        violations: Type.Array(ViolationSchema),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);
export type TrialCase = Static<typeof TrialCaseSchema>;
export type TrialStep = TrialCase["steps"][number];
