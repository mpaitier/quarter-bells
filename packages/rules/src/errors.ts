/** Levée quand une graine de générateur n'est pas un entier valide sur 32 bits. */
export class InvalidSeedError extends Error {
  constructor(
    readonly received: unknown,
    readonly maxSeed: number,
  ) {
    super(
      `Invalid seed: expected an integer between 0 and ${String(maxSeed)}, received ${String(received)}`,
    );
    this.name = "InvalidSeedError";
  }
}
