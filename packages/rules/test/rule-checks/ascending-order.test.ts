import { describe, expect, it } from "vitest";
import { SECTION_COUNT } from "../../src/clocks/clock.js";
import { checkAscendingOrder } from "../../src/rule-checks/ascending-order.js";

// Le comportement de la règle est couvert par test/cases/ascendingOrder/.
// Ce fichier ne teste que ce que le format JSON ne peut pas exprimer : un cas
// avec une section de départ invalide serait refusé par le schéma de cas
// avant même d'atteindre la règle.
describe("checkAscendingOrder", () => {
  // Les deux valeurs juste hors de l'horloge, et une valeur non entière.
  // La section de départ peut venir d'un choix des joueurs, donc du réseau.
  it.each([-1, SECTION_COUNT, 2.5])(
    "rejects the start section %s",
    (startSection) => {
      expect(() => checkAscendingOrder(startSection, [], {})).toThrow(
        RangeError,
      );
    },
  );
});
