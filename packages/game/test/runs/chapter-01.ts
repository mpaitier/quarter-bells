// Run complète du chapitre 1, jouée par test/chapter-01-run.test.ts.
//
// Les mains dépendent de la graine de la partie : ces poses ne valent que
// pour la graine 2 et ces trois joueurs. Elles ont été trouvées par une
// recherche hors du dépôt, puis vérifiées à la main, règle par règle (voir
// chaque description). Si la distribution ou la dérivation des graines
// change, le test signale la première carte qui n'est plus dans la main du
// joueur : il faut alors refaire les poses.
//
// Un fichier TypeScript plutôt que JSON : le type vérifie la fixture à la
// compilation, sans schéma TypeBox (le paquet ne dépend pas de TypeBox).

import type { CardFamily, CardValue } from "@quarter-bells/rules";

import type { HostDecision } from "../../src/index.js";

/** Une carte posée face cachée, désignée par sa famille et sa valeur. */
export interface RunStep {
  readonly family: CardFamily;
  readonly value: CardValue;
  readonly section: number;
}

/** Une épreuve de la run, et la décision de l'hôte qui la suit. */
export interface RunTrial {
  /** Pourquoi la pose réussit ou échoue : aide à la vérifier à la main. */
  readonly description: string;
  /** uid de l'horloge annoncée. */
  readonly clock: string;
  /** Bougies bonus du groupe au début de l'épreuve. */
  readonly bonusCandles: number;
  /** Les poses, dans l'ordre : chacune est faite par le joueur du tour. */
  readonly steps: readonly RunStep[];
  readonly expected: {
    readonly phase: "succeeded" | "failed" | "runLost";
    readonly bonusCandlesAfter: number;
  };
  readonly decision: HostDecision["type"];
}

export interface GameRun {
  readonly seed: number;
  readonly turnOrder: readonly string[];
  readonly trials: readonly RunTrial[];
}

export const CHAPTER_1_RUN: GameRun = {
  seed: 2,
  turnOrder: ["ana", "ben", "cleo"],
  trials: [
    {
      description:
        "Échec voulu : les 12 cartes en section 0, les autres sections restent vides. Aucune bougie bonus sur 3 : le groupe en gagne une.",
      clock: "ch01-clk0",
      bonusCandles: 0,
      steps: [
        { family: "instant", value: 9, section: 0 },
        { family: "eternity", value: 9, section: 0 },
        { family: "eternity", value: 3, section: 0 },
        { family: "eternity", value: 12, section: 0 },
        { family: "instant", value: 10, section: 0 },
        { family: "instant", value: 3, section: 0 },
        { family: "eternity", value: 11, section: 0 },
        { family: "eternity", value: 5, section: 0 },
        { family: "instant", value: 8, section: 0 },
        { family: "instant", value: 11, section: 0 },
        { family: "instant", value: 7, section: 0 },
        { family: "eternity", value: 8, section: 0 },
      ],
      expected: { phase: "failed", bonusCandlesAfter: 1 },
      decision: "retry",
    },
    {
      description:
        "Nouvelle tentative, avec la bougie gagnée. Sections 3, 4, 12, 19, 21, 27 depuis la section 0 : ordre croissant. Éternité 4 en section 1, deux cartes en section 4.",
      clock: "ch01-clk0",
      bonusCandles: 1,
      steps: [
        { family: "instant", value: 12, section: 3 },
        { family: "eternity", value: 12, section: 4 },
        { family: "eternity", value: 7, section: 3 },
        { family: "instant", value: 4, section: 5 },
        { family: "instant", value: 3, section: 0 },
        { family: "eternity", value: 11, section: 2 },
        { family: "eternity", value: 4, section: 1 },
        { family: "eternity", value: 8, section: 5 },
        { family: "instant", value: 5, section: 5 },
        { family: "eternity", value: 10, section: 5 },
        { family: "eternity", value: 9, section: 4 },
        { family: "instant", value: 1, section: 2 },
      ],
      expected: { phase: "succeeded", bonusCandlesAfter: 0 },
      decision: "continue",
    },
    {
      description:
        "Sections 3, 10, 11, 13, 14, 25. La 3e pose (Instant 1) va en section 1, la 5e (Instant 5) en section 4. La section 2 vaut 11, entre 9 et 15.",
      clock: "ch01-clk1",
      bonusCandles: 0,
      steps: [
        { family: "eternity", value: 2, section: 5 },
        { family: "eternity", value: 12, section: 5 },
        { family: "instant", value: 1, section: 1 },
        { family: "instant", value: 7, section: 3 },
        { family: "instant", value: 5, section: 4 },
        { family: "eternity", value: 6, section: 3 },
        { family: "eternity", value: 7, section: 4 },
        { family: "instant", value: 11, section: 5 },
        { family: "instant", value: 3, section: 0 },
        { family: "instant", value: 9, section: 1 },
        { family: "eternity", value: 11, section: 2 },
        { family: "instant", value: 2, section: 4 },
      ],
      expected: { phase: "succeeded", bonusCandlesAfter: 0 },
      decision: "continue",
    },
    {
      description:
        "Sections 6, 8, 9, 9, 17, 20 (l'égalité respecte l'ordre croissant). Section 0 : Éternité 1, Instant 2 et 3. Section 1 : 8, au plus 9. Section 4 : 17, entre 17 et 21.",
      clock: "ch01-clk2",
      bonusCandles: 0,
      steps: [
        { family: "eternity", value: 1, section: 0 },
        { family: "instant", value: 7, section: 4 },
        { family: "instant", value: 2, section: 0 },
        { family: "instant", value: 4, section: 1 },
        { family: "instant", value: 8, section: 5 },
        { family: "instant", value: 9, section: 3 },
        { family: "eternity", value: 6, section: 2 },
        { family: "eternity", value: 12, section: 5 },
        { family: "eternity", value: 10, section: 4 },
        { family: "instant", value: 3, section: 0 },
        { family: "eternity", value: 4, section: 1 },
        { family: "eternity", value: 3, section: 2 },
      ],
      expected: { phase: "succeeded", bonusCandlesAfter: 0 },
      decision: "continue",
    },
    {
      description:
        "Sections 7, 8, 10, 13, 22, 23. La 5e pose (Éternité 6) va en section 0, la 8e (Instant 2) en section 1. Section 3 : 13, entre 11 et 13. Section 5 : 23, au plus 26.",
      clock: "ch01-clk3",
      bonusCandles: 0,
      steps: [
        { family: "eternity", value: 5, section: 5 },
        { family: "eternity", value: 12, section: 3 },
        { family: "eternity", value: 1, section: 3 },
        { family: "instant", value: 1, section: 0 },
        { family: "eternity", value: 6, section: 0 },
        { family: "eternity", value: 10, section: 2 },
        { family: "instant", value: 9, section: 5 },
        { family: "instant", value: 2, section: 1 },
        { family: "eternity", value: 11, section: 4 },
        { family: "eternity", value: 9, section: 5 },
        { family: "instant", value: 11, section: 4 },
        { family: "instant", value: 6, section: 1 },
      ],
      expected: { phase: "succeeded", bonusCandlesAfter: 0 },
      decision: "continue",
    },
  ],
};
