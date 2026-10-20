import type { TSchema } from "typebox";
import Value from "typebox/value";
import { InvalidClockError, type ClockIssue } from "../errors.js";
import type { Clock } from "./clock.js";
import { ClockEnvelopeSchema } from "./clock-schema.js";
import { CLOCK_RULE_SCHEMAS, SECTION_RULE_SCHEMAS } from "./rule-schemas.js";

/** Table « kind → schéma », comme SECTION_RULE_SCHEMAS. */
type RuleTable = Readonly<Record<string, TSchema>>;

/**
 * Transforme une valeur inconnue (du JSON parsé) en horloge validée.
 *
 * `source` ne sert qu'aux messages d'erreur : nom de fichier dans les
 * tests, uid ou URL côté serveur. Le moteur ne lit jamais le disque
 * (NF-QUA-04) : c'est à l'appelant de lire le fichier.
 *
 * @throws InvalidClockError avec la liste de toutes les anomalies trouvées.
 */
export function parseClock(input: unknown, source: string): Clock {
  // Passe 1 : l'enveloppe. Value.Check est une « garde de type » :
  // si elle renvoie true, TypeScript considère ensuite que input a la
  // forme de l'enveloppe, et on peut lire input.sections sans erreur.
  if (!Value.Check(ClockEnvelopeSchema, input)) {
    throw new InvalidClockError(
      source,
      collectIssues(ClockEnvelopeSchema, input, ""),
    );
  }

  // Passe 2 : chaque règle contre le schéma de son kind.
  // On accumule au lieu de lever à la première erreur, pour tout signaler.
  const issues: ClockIssue[] = [];

  input.clockRules.forEach((rule, j) => {
    issues.push(
      ...checkRule(
        rule,
        `/clockRules/${String(j)}`,
        CLOCK_RULE_SCHEMAS,
        SECTION_RULE_SCHEMAS,
        "a section rule cannot be used as a clock rule",
      ),
    );
  });
  input.sections.forEach((section, i) => {
    section.rules.forEach((rule, j) => {
      issues.push(
        ...checkRule(
          rule,
          `/sections/${String(i)}/rules/${String(j)}`,
          SECTION_RULE_SCHEMAS,
          CLOCK_RULE_SCHEMAS,
          "a clock rule cannot be used in a section",
        ),
      );
    });
  });
  if (issues.length > 0) throw new InvalidClockError(source, issues);

  // À ce stade, la structure et chaque règle ont été validées contre les
  // mêmes schémas que ClockSchema : le cast est justifié. C'est le seul
  // du fichier.
  const clock = input as Clock;

  // Passe 3 : la sémantique, sur un objet désormais typé.
  issues.push(...checkSemantics(clock));
  if (issues.length > 0) throw new InvalidClockError(source, issues);

  return clock;
}

/**
 * Valide une règle contre le schéma de son kind.
 * Si le kind n'est pas autorisé à cet endroit, on distingue deux cas
 * pour un message utile : bonne règle au mauvais endroit, ou kind inconnu.
 */
function checkRule(
  rule: { kind: string },
  path: string,
  allowed: RuleTable,
  otherScope: RuleTable,
  wrongScopeMessage: string,
): ClockIssue[] {
  // Object.hasOwn plutôt que `rule.kind in allowed` : "toString" ou
  // "constructor" sont « dans » tout objet JavaScript (hérités), et
  // passeraient pour des kinds valides.
  const schema = Object.hasOwn(allowed, rule.kind)
    ? allowed[rule.kind]
    : undefined;
  if (schema !== undefined) return collectIssues(schema, rule, path);

  const message = Object.hasOwn(otherScope, rule.kind)
    ? wrongScopeMessage
    : `unknown rule kind "${rule.kind}"`;
  return [{ path: `${path}/kind`, message }];
}

/** Contrôles que JSON Schema ne sait pas exprimer. */
function checkSemantics(clock: Clock): ClockIssue[] {
  const issues: ClockIssue[] = [];
  clock.sections.forEach((section, i) => {
    section.rules.forEach((rule, j) => {
      // Après le test sur kind, TypeScript sait que rule est un sumInRange
      // et autorise rule.params.min. Sans ce test, il refuserait :
      // les autres règles n'ont pas forcément de min.
      if (rule.kind === "sumInRange" && rule.params.min > rule.params.max) {
        issues.push({
          path: `/sections/${String(i)}/rules/${String(j)}/params`,
          message: "min must be less than or equal to max",
        });
      }
    });
  });
  return issues;
}

/**
 * Traduit les erreurs TypeBox en ClockIssue, en préfixant le chemin.
 * Seul endroit du paquet où le format d'erreur de TypeBox apparaît :
 * changer de bibliothèque ne toucherait que cette fonction (ADR 0008).
 */
function collectIssues(
  schema: TSchema,
  value: unknown,
  prefix: string,
): ClockIssue[] {
  return Value.Errors(schema, value).map((error) => ({
    path: prefix + error.instancePath,
    message: error.message,
  }));
}
