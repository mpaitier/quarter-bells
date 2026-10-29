import Type, { type Static } from "typebox";
import { SectionIndexSchema } from "../clocks/section.js";
import { CardFaceSchema } from "../cards/card-schema.js";

/**
 * Une carte posée devant une section.
 * Dans une pose, les placements sont rangés dans l'ordre où ils ont été
 * faits : la position dans le tableau est le rang de pose (firstPlacements
 * s'en sert). Ne jamais trier ce tableau.
 */
export const PlacementSchema = Type.Object(
  {
    sectionIndex: SectionIndexSchema,
    card: CardFaceSchema,
    // Carte visible des autres joueurs. Sans effet sur l'évaluation, où
    // toutes les cartes sont révélées.
    faceUp: Type.Boolean(),
  },
  { additionalProperties: false },
);
export type Placement = Static<typeof PlacementSchema>;
