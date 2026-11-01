// Générateurs fast-check propres au domaine, partagés par les tests de
// propriétés (docs/testing.md). Un générateur (« arbitrary ») décrit
// l'ensemble des valeurs possibles ; fast-check en tire des exemples et, en
// cas d'échec, réduit le contre-exemple.
//
// Les générateurs ne produisent que des valeurs valides pour le moteur :
// une propriété vérifie un comportement, pas la validation des entrées, qui a
// ses propres tests.

import { fc } from "@fast-check/vitest";
import {
  CARD_FAMILIES,
  CARD_VALUES,
  type CardFamily,
} from "../../src/cards/card.js";
import type { CardFace } from "../../src/cards/card-schema.js";
import { PLAYER_COUNTS } from "../../src/cards/deal.js";
import { SECTION_COUNT, type Clock } from "../../src/clocks/clock.js";
import { parseClock } from "../../src/clocks/parse-clock.js";
import { InvalidClockError } from "../../src/errors.js";
import type { Placement } from "../../src/placements/placement.js";
import { MAX_SEED } from "../../src/random/rng.js";

/** Toute graine acceptée par createSeededRng. */
export const seedArb = fc.integer({ min: 0, max: MAX_SEED });

/** Un nombre de joueurs autorisé : 2, 3 ou 4. */
export const playerCountArb = fc.constantFrom(...PLAYER_COUNTS);

/** Un index de section, de 0 à 5. */
export const sectionIndexArb = fc.integer({ min: 0, max: SECTION_COUNT - 1 });

/** Une famille de carte. */
const familyArb = fc.constantFrom(...CARD_FAMILIES);

/** Les 24 faces du jeu, chacune une seule fois. */
const ALL_FACES: readonly CardFace[] = CARD_FAMILIES.flatMap((family) =>
  CARD_VALUES.map((value) => ({ family, value })),
);

/**
 * Une permutation de `items` : les mêmes éléments, dans un autre ordre. Un
 * sous-tableau mélangé de même longueur contient tous les éléments.
 */
export function permutationOf<T>(items: readonly T[]): fc.Arbitrary<T[]> {
  return fc.shuffledSubarray([...items], {
    minLength: items.length,
    maxLength: items.length,
  });
}

/**
 * Une pose de 0 à 12 cartes distinctes, comme dans une épreuve, chacune
 * devant une section au hasard, face visible ou cachée.
 */
export const poseArb: fc.Arbitrary<Placement[]> = fc
  .shuffledSubarray([...ALL_FACES], { maxLength: 12 })
  .chain((faces) =>
    fc.tuple(
      // Un générateur par carte : la carte est fixée, la section et la face
      // sont tirées.
      ...faces.map((card) =>
        fc.record({
          sectionIndex: sectionIndexArb,
          card: fc.constant(card),
          faceUp: fc.boolean(),
        }),
      ),
    ),
  );

/**
 * Ajoute `family` aux paramètres une fois sur deux : le paramètre est
 * facultatif, les deux formes doivent être couvertes. Absent plutôt
 * qu'undefined (exactOptionalPropertyTypes).
 */
function withOptionalFamily<P extends object>(
  params: fc.Arbitrary<P>,
): fc.Arbitrary<P | (P & { family: CardFamily })> {
  return fc
    .tuple(params, fc.option(familyArb, { nil: undefined }))
    .map(([base, family]) =>
      family === undefined ? base : { ...base, family },
    );
}

/**
 * Une règle de section du catalogue, avec des paramètres dans leurs bornes.
 * Les plages sont choisies pour produire aussi bien des règles faciles que
 * des règles impossibles à tenir : une propriété doit tenir dans les deux cas.
 */
const sectionRuleArb = fc.oneof(
  fc.record({
    kind: fc.constant("minCardCount"),
    params: withOptionalFamily(
      fc.record({ min: fc.integer({ min: 1, max: 4 }) }),
    ),
  }),
  fc.record({
    kind: fc.constant("maxSum"),
    params: fc.record({ max: fc.integer({ min: 1, max: 40 }) }),
  }),
  fc.record({
    kind: fc.constant("exactCardCount"),
    params: withOptionalFamily(
      fc.record({ count: fc.integer({ min: 0, max: 4 }) }),
    ),
  }),
  fc.record({
    kind: fc.constant("sumInRange"),
    // Deux bornes triées : min > max serait refusé par parseClock.
    params: fc
      .tuple(fc.integer({ min: 0, max: 40 }), fc.integer({ min: 0, max: 40 }))
      .map(([a, b]) => ({ min: Math.min(a, b), max: Math.max(a, b) })),
  }),
  fc.record({
    kind: fc.constant("firstPlacements"),
    // Rangs de 0 à 11 : les 12 poses d'une épreuve.
    params: fc.record({
      placementIndexes: fc.uniqueArray(fc.integer({ min: 0, max: 11 }), {
        minLength: 1,
        maxLength: 3,
      }),
    }),
  }),
);

/** Une règle d'horloge du catalogue. */
const clockRuleArb = fc.oneof(
  fc.record({ kind: fc.constant("ascendingOrder"), params: fc.constant({}) }),
  fc.record({
    kind: fc.constant("maxSum"),
    params: fc.record({ max: fc.integer({ min: 1, max: 40 }) }),
  }),
);

/** parseClock, sans lever : undefined si l'horloge est refusée. */
function parseOrUndefined(data: unknown): Clock | undefined {
  try {
    return parseClock(data, "generated clock");
  } catch (error) {
    // Seul un refus est attendu ici : toute autre erreur est un bug.
    if (error instanceof InvalidClockError) return undefined;
    throw error;
  }
}

/**
 * Une horloge que parseClock accepte, quelconque. Les propriétés qui
 * l'utilisent valent donc pour toute horloge que le moteur peut charger, pas
 * seulement pour celles du jeu.
 *
 * Le filtre passe par parseClock plutôt que par une copie de ses règles :
 * si parseClock accepte une horloge qui casse une propriété, c'est
 * parseClock qu'il faut corriger.
 */
export const clockArb: fc.Arbitrary<Clock> = fc
  .record({
    formatVersion: fc.constant(1),
    uid: fc.constant("generated"),
    chapter: fc.integer({ min: 1, max: 10 }),
    indexInChapter: fc.integer({ min: 0, max: 3 }),
    noMaxSum: fc.boolean(),
    startSectionMode: fc.constantFrom("fixed", "chosenByPlayers"),
    defaultStartSection: sectionIndexArb,
    clockRules: fc.array(clockRuleArb, { maxLength: 2 }),
    // Six sections, chacune à sa place et avec 0 à 2 règles.
    sections: fc.tuple(
      ...Array.from({ length: SECTION_COUNT }, (_, index) =>
        fc.record({
          index: fc.constant(index),
          rules: fc.array(sectionRuleArb, { maxLength: 2 }),
        }),
      ),
    ),
  })
  .map(parseOrUndefined)
  .filter((clock): clock is Clock => clock !== undefined);
