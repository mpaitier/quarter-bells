// Chargement des horloges du jeu (packages/rules/clocks/) pour les tests.
// Le moteur ne lit jamais le disque (NF-QUA-04) : la lecture se fait ici,
// côté tests, puis chaque fichier passe par parseClock comme il le fera
// côté serveur.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** Dossier des horloges du jeu, calculé à partir de ce fichier. */
export const GAME_CLOCKS_DIR = fileURLToPath(
  new URL("../../clocks", import.meta.url),
);

/** Un fichier d'horloge du jeu, avant validation. */
export interface GameClockFile {
  /**
   * Chemin relatif au dossier des horloges, avec des « / » quel que soit
   * le système : « ch01/ch01-clk0.json ». Sert de nom de test et de source
   * dans les messages d'erreur.
   */
  readonly path: string;
  /** Contenu JSON parsé, pas encore validé. */
  readonly data: unknown;
}

/**
 * Lit tous les fichiers JSON du dossier des horloges, sous-dossiers compris.
 * Ne valide rien : c'est le rôle des tests, qui veulent voir l'erreur de
 * chaque fichier séparément.
 *
 * @returns les fichiers triés par chemin, pour un ordre de test stable
 */
export function readGameClockFiles(): GameClockFile[] {
  return (
    readdirSync(GAME_CLOCKS_DIR, { encoding: "utf8", recursive: true })
      // Sous Windows, readdirSync renvoie des « \ » : on normalise pour que
      // les noms de tests et les comparaisons soient identiques partout.
      .map((file) => file.replaceAll("\\", "/"))
      .filter((file) => file.endsWith(".json"))
      .toSorted()
      .map((path) => ({
        path,
        // unknown plutôt que le any de JSON.parse : rien n'est utilisable
        // avant d'être passé par parseClock.
        data: JSON.parse(
          readFileSync(join(GAME_CLOCKS_DIR, path), "utf8"),
        ) as unknown,
      }))
  );
}

/**
 * Préfixe d'un chapitre : chapitre 1 → « ch01 ». Deux chiffres pour que
 * dossiers et fichiers se trient dans l'ordre jusqu'au chapitre 10.
 */
function chapterPrefix(chapter: number): string {
  return `ch${String(chapter).padStart(2, "0")}`;
}

/** uid attendu d'après le chapitre et la position : 1, 0 → « ch01-clk0 ». */
export function expectedUid(chapter: number, indexInChapter: number): string {
  return `${chapterPrefix(chapter)}-clk${String(indexInChapter)}`;
}

/**
 * Chemin attendu d'une horloge dans le dossier des horloges :
 * 1, 0 → « ch01/ch01-clk0.json ». Le dossier regroupe un chapitre, le nom
 * du fichier est l'uid.
 */
export function expectedPath(chapter: number, indexInChapter: number): string {
  return `${chapterPrefix(chapter)}/${expectedUid(chapter, indexInChapter)}.json`;
}
