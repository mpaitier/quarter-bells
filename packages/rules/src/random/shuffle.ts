import { nextInt, type Rng } from "./rng.js";

/**
 * Échange deux cases d'un tableau, sur place.
 * L'appelant doit garantir que i et j sont dans [0, array.length).
 */
function swap(array: unknown[], i: number, j: number): void {
  // Le type des éléments n'a pas d'importance : on ne fait que déplacer
  // des valeurs déjà présentes dans le tableau. Avec unknown[], lire une
  // case donne unknown et y écrire un unknown est permis, ce qui évite
  // toute assertion malgré noUncheckedIndexedAccess.
  const valueAtI = array[i];
  array[i] = array[j];
  array[j] = valueAtI;
}

/**
 * Mélange un tableau avec l'algorithme de Fisher-Yates (variante de Durstenfeld).
 *
 * Chaque ordre possible a la même probabilité de sortir. Le tableau reçu
 * n'est pas modifié : la fonction renvoie un nouveau tableau.
 *
 * @param items éléments à mélanger
 * @param rng générateur à graine ; la même graine donne toujours le même ordre
 * @returns une copie mélangée de items
 */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  // On mélange cette copie, jamais le tableau reçu.
  const copy = [...items];

  // On parcourt de la fin vers le début : à chaque tour, la position i
  // reçoit un élément tiré parmi les positions 0 à i, puis devient définitive.
  // On s'arrête à 1 : à la position 0, il ne reste qu'un seul choix possible.
  for (let i = copy.length - 1; i >= 1; i--) {
    // j doit pouvoir valoir i (i inclus) : un élément a le droit de rester
    // à sa place. Tirer dans [0, i) ou dans [0, n) fausserait l'uniformité.
    const j = nextInt(rng, i + 1);

    swap(copy, i, j);
  }
  return copy;
}
