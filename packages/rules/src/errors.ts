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

/** Levée quand le nombre de joueurs n'est pas l'un de ceux autorisés. */
export class InvalidPlayerCountError extends Error {
  constructor(
    readonly received: unknown,
    readonly allowed: readonly number[],
  ) {
    super(
      `Invalid player count: expected one of ${allowed.join(", ")}, received ${String(received)}`,
    );
    this.name = "InvalidPlayerCountError";
  }
}
