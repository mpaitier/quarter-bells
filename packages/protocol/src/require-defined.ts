/**
 * Une valeur que l'appelant sait présente, alors que son type admet
 * `undefined` (le joueur du tour d'une épreuve en Pose, le siège d'un joueur
 * de la partie).
 *
 * Même raison d'être que requireAt et requireFind dans packages/rules, qui
 * restent internes à ce paquet : une branche qui ne peut jamais s'exécuter
 * n'a pas à être écrite, ni laissée sans test, chez chaque appelant.
 *
 * @param description ce qui était attendu, repris dans le message d'erreur
 * @throws {Error} si la valeur manque : c'est une erreur de programmation, pas
 * un cas de jeu
 */
export function requireDefined<T>(
  value: T | undefined,
  description: string,
): T {
  if (value === undefined) {
    throw new Error(`Missing value: ${description}`);
  }
  return value;
}
