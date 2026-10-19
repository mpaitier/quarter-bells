import { nextInt, type Rng } from "./rng.js";

/**
 * Caractères autorisés dans un identifiant opaque : les consonnes minuscules.
 *
 * Sans chiffre, un identifiant ne peut pas contenir une valeur de carte ;
 * sans voyelle, il ne peut écrire aucun mot, en particulier aucun nom de
 * famille de carte. La garantie vient de l'alphabet lui-même, pas du hasard.
 */
const ID_ALPHABET = "bcdfghjklmnpqrstvwxz";

/**
 * Longueur d'un identifiant. 20 caractères possibles sur 10 positions
 * donnent environ 10^13 combinaisons : les collisions sont très rares,
 * mais generateOpaqueIds les élimine quand même.
 */
const ID_LENGTH = 10;

/** Construit un identifiant à partir du générateur. */
function generateOpaqueId(rng: Rng): string {
  let id = "";

  for (let n = 0; n < ID_LENGTH; n++) {
    const index = nextInt(rng, ID_ALPHABET.length);
    id += ID_ALPHABET.charAt(index);
  }

  return id;
}

/**
 * Génère des identifiants opaques, tous distincts.
 *
 * Les identifiants sont tirés du générateur à graine : avec un générateur
 * dans le même état, on obtient toujours les mêmes identifiants, dans le
 * même ordre.
 *
 * @param rng générateur à graine
 * @param count nombre d'identifiants voulus, entier positif ou nul
 * @returns count identifiants distincts
 * @throws {RangeError} si count n'est pas un entier positif ou nul
 */
export function generateOpaqueIds(rng: Rng, count: number): string[] {
  // TODO 2 : valider count, sur le modèle de nextInt.
  // Attention, ici 0 est autorisé : demander zéro identifiant est légitime.

  const isValidCount = Number.isInteger(count) && count >= 0;
  if (!isValidCount) {
    throw new RangeError(
      `count must be a non-negative integer, received ${String(count)}`,
    );
  }

  // Un Set ne garde chaque valeur qu'une fois : si un tirage produit un
  // identifiant déjà vu, l'ajout est sans effet et on tire à nouveau.
  const ids = new Set<string>();

  while (ids.size < count) {
    ids.add(generateOpaqueId(rng));
  }

  // Un Set conserve l'ordre d'insertion : le tableau renvoyé suit l'ordre
  // des tirages, ce qui garde le résultat reproductible.
  return [...ids];
}
