import { sectionValue } from "./by-section.js";
import type { Placement } from "./placement.js";

/**
 * Valeur qu'aurait `section` si `candidate` y était posée, quand cette valeur
 * est connue du joueur qui pose : toutes les cartes déjà devant la section
 * sont face visible (somme publique), et il connaît sa propre carte.
 *
 * Sert aux bornes hautes connues (F-JEU-21), seule exception à la règle
 * « les valeurs ne se jugent qu'à la Résolution ».
 *
 * - Une seule carte face cachée devant la section suffit à rendre la valeur
 *   inconnue, quel que soit le joueur qui l'a posée : Placement ne dit pas
 *   qui a posé une carte, et la règle ne doit pas en dépendre.
 * - La face de la candidate ne compte pas : posée face cachée, le joueur
 *   connaît quand même sa valeur. C'est la pose suivante qui ne pourra plus
 *   être vérifiée.
 * - Une section vide a une valeur publique, 0.
 *
 * @param placements pose déjà faite, toutes sections confondues
 * @returns la valeur après la pose, ou undefined si la candidate vise une
 * autre section ou si une carte de la section est cachée
 */
export function knownValueAfter(
  section: number,
  placements: readonly Placement[],
  candidate: Placement,
): number | undefined {
  // La pose ne change pas cette section : rien à vérifier ici.
  if (candidate.sectionIndex !== section) {
    return undefined;
  }

  const sectionPlacements = placements.filter(
    (placement) => placement.sectionIndex === section,
  );
  // every renvoie true sur une liste vide : une section vide est publique.
  if (!sectionPlacements.every((placement) => placement.faceUp)) {
    return undefined;
  }

  return sectionValue([...sectionPlacements, candidate]);
}
