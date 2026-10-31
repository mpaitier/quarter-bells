/**
 * Élément d'un tableau à un index dont l'appelant sait qu'il existe.
 *
 * Avec noUncheckedIndexedAccess, `items[index]` est typé `T | undefined`,
 * même quand l'index est forcément valide (un lot par joueur, six sections).
 * Plutôt que d'écrire à chaque fois une branche qui ne peut jamais
 * s'exécuter, les appelants passent par cette fonction : l'impossibilité est
 * vérifiée à un seul endroit, et cet endroit est testé.
 *
 * Ne convient pas à un tableau qui peut contenir undefined : un tel élément
 * serait pris pour un index hors du tableau.
 *
 * @throws {RangeError} si l'index ne désigne aucun élément (négatif, décimal
 * ou trop grand) : c'est une erreur de programmation, pas un cas de jeu
 */
export function requireAt<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) {
    throw new RangeError(
      `Index ${String(index)} is out of bounds for a length of ${String(items.length)}`,
    );
  }
  return item;
}
