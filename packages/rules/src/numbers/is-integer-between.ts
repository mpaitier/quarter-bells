/** Entier compris entre min et max, bornes incluses. */
export function isIntegerBetween(
  value: number,
  min: number,
  max: number,
): boolean {
  // Number.isInteger écarte déjà les décimaux, NaN et Infinity.
  return Number.isInteger(value) && value >= min && value <= max;
}
