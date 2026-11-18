// Cartes d'exemple pour l'atelier de l'horloge : de quoi vérifier à l'œil
// les piles de 0 à 4 cartes et les trois façons de voir une carte. Elles ne
// suivent aucune règle et disparaîtront avec l'atelier.

import type { PlacedCard } from "@quarter-bells/protocol";

export const SAMPLE_PLACEMENTS: readonly PlacedCard[] = [
  {
    sectionIndex: 0,
    player: "ana",
    faceUp: true,
    card: { family: "instant", value: 3 },
  },
  {
    sectionIndex: 1,
    player: "ben",
    faceUp: false,
    card: { family: "eternity" },
  },
  {
    sectionIndex: 2,
    player: "ana",
    faceUp: false,
    card: { family: "instant", value: 8 },
  },
  {
    sectionIndex: 1,
    player: "ana",
    faceUp: true,
    card: { family: "eternity", value: 12 },
  },
  {
    sectionIndex: 3,
    player: "ben",
    faceUp: true,
    card: { family: "instant", value: 5 },
  },
  {
    sectionIndex: 3,
    player: "ana",
    faceUp: false,
    card: { family: "eternity", value: 1 },
  },
  {
    sectionIndex: 3,
    player: "ben",
    faceUp: false,
    card: { family: "instant" },
  },
  {
    sectionIndex: 5,
    player: "ana",
    faceUp: true,
    card: { family: "eternity", value: 10 },
  },
  {
    sectionIndex: 5,
    player: "ben",
    faceUp: true,
    card: { family: "instant", value: 7 },
  },
  {
    sectionIndex: 5,
    player: "ana",
    faceUp: false,
    card: { family: "instant", value: 2 },
  },
  {
    sectionIndex: 5,
    player: "ben",
    faceUp: false,
    card: { family: "eternity" },
  },
];
