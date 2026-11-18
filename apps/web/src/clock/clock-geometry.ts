// Géométrie de l'horloge, dans le repère du viewBox du composant.
//
// Les angles sont en degrés, mesurés depuis 12 h dans le sens horaire, comme
// dans docs/clock-format.md : la section i est centrée sur i × 60°. Le SVG a
// son axe y vers le bas, d'où le signe moins sur le cosinus.

import { SECTION_COUNT } from "@quarter-bells/rules";

/** Côté du viewBox carré : « 0 0 VIEWBOX_SIZE VIEWBOX_SIZE ». */
export const VIEWBOX_SIZE = 120;

/** Centre du cadran. */
export const CENTER: Point = { x: VIEWBOX_SIZE / 2, y: VIEWBOX_SIZE / 2 };

/** Rayon du cadran, jusqu'à son contour. */
export const DIAL_RADIUS = 34;

/** Rayon où est centrée la colonne d'icônes des règles d'une section. */
export const RULES_RADIUS = 21;

/** Écart, le long du rayon, entre deux icônes de règle d'une section. */
export const RULES_STEP = 7.5;

/** Rayon où sont centrées les cartes posées, devant le cadran. */
export const CARDS_RADIUS = 44;

/** Longueur de l'aiguille, depuis le centre. */
export const NEEDLE_LENGTH = 27;

/** Ouverture d'une section : 60° pour 6 sections. */
export const SECTION_SPAN = 360 / SECTION_COUNT;

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Angle du milieu de la section `index`. */
export function sectionCenterAngle(index: number): number {
  return index * SECTION_SPAN;
}

/**
 * Angles des séparations entre sections : à mi-chemin entre deux centres,
 * donc décalés d'une demi-section. La séparation `i` sépare les sections
 * `i - 1` et `i`.
 */
export function separatorAngles(): readonly number[] {
  return Array.from(
    { length: SECTION_COUNT },
    (_, index) => sectionCenterAngle(index) - SECTION_SPAN / 2,
  );
}

/** Point à `radius` du centre, dans la direction `angle`. */
export function pointAt(angle: number, radius: number): Point {
  const radians = (angle * Math.PI) / 180;
  return {
    x: CENTER.x + radius * Math.sin(radians),
    y: CENTER.y - radius * Math.cos(radians),
  };
}

/**
 * Centre de l'icône de la règle n° `position` sur `count`, dans la section
 * `index`. Les icônes forment une colonne le long du rayon qui passe par le
 * milieu de la section, la première vers le bord : une rangée horizontale
 * déborderait sur les sections voisines dès trois règles.
 */
export function rulePosition(
  index: number,
  position: number,
  count: number,
): Point {
  return pointAt(
    sectionCenterAngle(index),
    RULES_RADIUS - rowOffset(position, count, RULES_STEP),
  );
}

/** Point où est centrée la pile de cartes posées devant la section. */
export function cardsAnchor(index: number): Point {
  return pointAt(sectionCenterAngle(index), CARDS_RADIUS);
}

/**
 * Décalage de l'élément n° `position` dans une rangée de `count` éléments
 * espacés de `step`, centrée sur 0 : une colonne d'icônes ou une pile de
 * cartes en éventail.
 */
export function rowOffset(
  position: number,
  count: number,
  step: number,
): number {
  return (position - (count - 1) / 2) * step;
}

/**
 * Heure du cadran au milieu de la section, pour la nommer : la section 0 est
 * celle de 12 h, la section 1 celle de 2 h, etc.
 */
export function sectionHour(index: number): number {
  const hour = (index * 12) / SECTION_COUNT;
  return hour === 0 ? 12 : hour;
}
