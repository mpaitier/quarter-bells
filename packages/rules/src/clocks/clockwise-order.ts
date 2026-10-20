// packages/rules/src/clocks/clockwise-order.ts

import { SECTION_COUNT } from "./clock.js";

/**
 * Index des sections dans le sens horaire, en commençant par `start`.
 * Exemple : start = 4 donne [4, 5, 0, 1, 2, 3].
 *
 * @throws {RangeError} si la valeur n'est pas entre 0 et SECTION_COUNT - 1
 */
export function clockwiseOrder(start: number): number[] {
  const isValidStart =
    Number.isInteger(start) && start >= 0 && start < SECTION_COUNT;
  if (!isValidStart) {
    throw new RangeError(
      `Start value is incorrect: expected an integer between 0 - ${String(SECTION_COUNT - 1)}, received ${String(start)}`,
    );
  }

  return Array.from(
    { length: SECTION_COUNT },
    (_, i) => (start + i) % SECTION_COUNT,
  );
}
