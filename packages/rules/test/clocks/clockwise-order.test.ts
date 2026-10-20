// Vérifie l'ordre de parcours des sections dans le sens horaire.
// ascendingOrder s'appuie dessus : une erreur ici fausserait la règle
// pour toutes les horloges.

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { SECTION_COUNT } from "../../src/clocks/clock.js";
import { clockwiseOrder } from "../../src/clocks/clockwise-order.js";

describe("clockwiseOrder", () => {
  // it.each lance le même test sur plusieurs lignes de données.
  // $start dans le nom est remplacé par la valeur : chaque cas a son propre
  // nom dans le rapport, et on voit tout de suite lequel échoue.
  it.each([
    // Départ sur la première section : pas de retour à 0.
    { start: 0, expected: [0, 1, 2, 3, 4, 5] },
    // Départ au milieu : le retour à 0 arrive en cours de parcours.
    { start: 3, expected: [3, 4, 5, 0, 1, 2] },
    // Départ sur la dernière section : retour à 0 dès le deuxième élément.
    { start: 5, expected: [5, 0, 1, 2, 3, 4] },
  ])(
    "commence en $start et tourne dans le sens horaire",
    ({ start, expected }) => {
      expect(clockwiseOrder(start)).toEqual(expected);
    },
  );

  it.each([
    // Juste sous la première section.
    -1,
    // Première valeur au-delà de la dernière section.
    SECTION_COUNT,
    // Bien dans l'intervalle, mais une section n'est jamais « à moitié ».
    2.5,
  ])("refuse le départ %s", (start) => {
    // On vérifie le type d'erreur, pas le texte du message : reformuler le
    // message ne doit pas casser le test (tester le comportement, pas
    // l'implémentation).
    expect(() => clockwiseOrder(start)).toThrow(RangeError);
  });

  it("commence par le départ et passe une fois par chaque section", () => {
    // Liste attendue une fois triée : [0, 1, ..., SECTION_COUNT - 1].
    // Construite à partir de SECTION_COUNT pour ne pas écrire 6 en dur.
    const allSections = Array.from({ length: SECTION_COUNT }, (_, i) => i);

    fc.assert(
      fc.property(
        // Génère des départs valides : tous les entiers de 0 à SECTION_COUNT - 1.
        fc.integer({ min: 0, max: SECTION_COUNT - 1 }),
        (start) => {
          const order = clockwiseOrder(start);

          // Le parcours commence bien par la section de départ.
          expect(order[0]).toBe(start);

          // Une fois trié, on retrouve chaque section exactement une fois :
          // ni oubli, ni doublon. La copie [...order] évite de trier le
          // résultat lui-même ; (a, b) => a - b trie en nombres, pas en texte.
          expect([...order].sort((a, b) => a - b)).toEqual(allSections);
        },
      ),
    );
  });
});
