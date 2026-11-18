// Horloges du jeu, prêtes à l'emploi pour le serveur et le client web.
//
// Les fichiers JSON de packages/rules/clocks/ sont importés ici plutôt que lus
// sur le disque : le moteur ne touche jamais au système de fichiers
// (NF-QUA-04), et le client web les embarque dans son build.
//
// Ajouter une horloge : créer son fichier, puis l'ajouter à la liste
// ci-dessous. test/clocks/game-clocks-export.test.ts échoue si un fichier du
// dossier manque ici, ou si l'ordre n'est pas celui des chemins.

import ch01Clk0 from "../../clocks/ch01/ch01-clk0.json" with { type: "json" };
import ch01Clk1 from "../../clocks/ch01/ch01-clk1.json" with { type: "json" };
import ch01Clk2 from "../../clocks/ch01/ch01-clk2.json" with { type: "json" };
import ch01Clk3 from "../../clocks/ch01/ch01-clk3.json" with { type: "json" };
import type { Clock } from "./clock.js";

/**
 * Une horloge du jeu, déjà validée par les tests.
 *
 * Ces fichiers ne viennent pas de l'extérieur : test/clocks/game-clocks.test.ts
 * les passe tous par parseClock, et game-clocks-export.test.ts vérifie que
 * GAME_CLOCKS est égal, objet par objet, à ce que renvoie parseClock. Les
 * valider une seconde fois au chargement obligerait le client web à embarquer
 * TypeBox : 37 Ko compressés de plus dans son build, sur un budget
 * JavaScript de 150 Ko (ADR 0012), pour un contrôle déjà fait avant chaque
 * fusion.
 *
 * Le transtypage est nécessaire : TypeScript type un fichier JSON avec des
 * chaînes larges (`kind: string`), pas avec les littéraux du type Clock.
 */
function validatedByTests(data: unknown): Clock {
  return data as Clock;
}

/**
 * Toutes les horloges du jeu, triées par chapitre puis par position dans le
 * chapitre. Jamais vide : le type le garantit, GAME_CLOCKS[0] est une Clock.
 */
export const GAME_CLOCKS: readonly [Clock, ...Clock[]] = [
  validatedByTests(ch01Clk0),
  validatedByTests(ch01Clk1),
  validatedByTests(ch01Clk2),
  validatedByTests(ch01Clk3),
];
