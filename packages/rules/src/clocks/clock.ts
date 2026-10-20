import type { Static } from "typebox";
import type { ClockRuleSchema, SectionRuleSchema } from "./rule-schemas.js";
import type { ClockSchema } from "./clock-schema.js";

/** Nombre de sections d'une horloge, indexées de 0 à 5. */
export const SECTION_COUNT = 6;

/** Une horloge validée. Type dérivé du schéma, jamais écrit à la main. */
export type Clock = Static<typeof ClockSchema>;

/** Règle de section : union discriminée sur kind. */
export type SectionRule = Static<typeof SectionRuleSchema>;

/** Règle d'horloge : union discriminée sur kind. */
export type ClockRule = Static<typeof ClockRuleSchema>;
