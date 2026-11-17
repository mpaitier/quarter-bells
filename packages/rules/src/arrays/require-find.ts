/**
 * Premier élément d'un tableau qui vérifie `predicate`, quand l'appelant sait
 * qu'il en existe un.
 *
 * Même raison d'être que requireAt : `find` est typé `T | undefined`, et une
 * branche qui ne peut jamais s'exécuter n'a pas à être écrite (ni laissée
 * sans test) chez chaque appelant.
 *
 * @param description ce qui était cherché, repris dans le message d'erreur
 * @throws {Error} si aucun élément ne convient : c'est une erreur de
 * programmation, pas un cas de jeu
 */
export function requireFind<T>(
  items: readonly T[],
  predicate: (item: T) => boolean,
  description: string,
): T {
  const item = items.find(predicate);
  if (item === undefined) {
    throw new Error(`No item matches: ${description}`);
  }
  return item;
}
