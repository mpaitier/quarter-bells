import Type, { type Static } from "typebox";
import { SectionIndexSchema } from "../clocks/section.js";
import { CardFaceSchema, type CardFace } from "../cards/card-schema.js";

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

/**
 * Carte posée face visible, telle que tous les joueurs la voient : famille et
 * valeur.
 */
export interface FaceUpPlacement {
  readonly sectionIndex: number;
  readonly card: CardFace;
  readonly faceUp: true;
}

/**
 * Carte posée face cachée, telle que les autres joueurs la voient : seule sa
 * famille est connue (domain-model.md, « Vue d'un joueur »).
 */
export interface FaceDownPlacement {
  readonly sectionIndex: number;
  readonly card: Pick<CardFace, "family">;
  readonly faceUp: false;
}

/**
 * Ce que tout joueur sait d'une carte posée (ADR 0016). Union discriminée
 * sur faceUp : la valeur n'est lisible qu'après avoir vérifié la face.
 *
 * Un Placement complet est compatible avec ce type : le serveur, qui connaît
 * toutes les valeurs, appelle les mêmes fonctions sans conversion.
 */
export type PublicPlacement = FaceUpPlacement | FaceDownPlacement;
