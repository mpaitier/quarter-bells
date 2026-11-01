// Format d'une pose gagnante (test/clock-solutions/**/*.json) : la preuve
// qu'une horloge du jeu peut être réussie. Chaque fichier est validé avec ce
// schéma avant d'être rejoué.
//
// Toutes les cartes sont posées face cachée, donc le fichier n'a pas de
// champ faceUp. Aucune règle n'oblige à poser une carte visible : une
// horloge qu'on ne réussit qu'avec des cartes visibles dépendrait des yeux
// disponibles, et ne serait pas réussissable à coup sûr.

import Type, { type Static } from "typebox";
import { CardFaceSchema } from "../../src/cards/card-schema.js";
import { SectionIndexSchema } from "../../src/clocks/section.js";

/** Une carte posée, dans l'ordre des poses. */
const SolutionStepSchema = Type.Object(
  {
    section: SectionIndexSchema,
    // Famille et valeur suffisent : le jeu ne contient qu'un exemplaire de
    // chaque carte (createDeck).
    card: CardFaceSchema,
  },
  { additionalProperties: false },
);

export const ClockSolutionSchema = Type.Object(
  {
    // Pourquoi cette pose gagne : aide le relecteur à vérifier à la main.
    description: Type.String({ minLength: 1 }),
    // uid de l'horloge résolue. Le fichier porte le même nom.
    clock: Type.String({ minLength: 1 }),
    // Le nombre de cartes n'est pas fixé ici : le test le compare à la
    // distribution du moteur, seule source de vérité.
    steps: Type.Array(SolutionStepSchema, { minItems: 1 }),
  },
  { additionalProperties: false },
);
export type ClockSolution = Static<typeof ClockSolutionSchema>;
