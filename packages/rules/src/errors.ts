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

/** Une anomalie dans une horloge, localisée par un pointeur JSON. */
export interface ClockIssue {
  /** Pointeur JSON (RFC 6901) vers le champ, ex. "/sections/4/rules/0/params/min". */
  readonly path: string;
  readonly message: string;
}

/** Levée quand une horloge ne respecte pas son format. */
export class InvalidClockError extends Error {
  constructor(
    readonly source: string,
    readonly issues: readonly ClockIssue[],
  ) {
    // Une ligne par anomalie : on voit tous les problèmes d'un coup
    // au lieu de les corriger un par un.
    super(
      `Invalid clock ${source}:\n` +
        issues.map((issue) => `  ${issue.path}: ${issue.message}`).join("\n"),
    );
    this.name = "InvalidClockError";
  }
}
