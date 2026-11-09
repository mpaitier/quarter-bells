import { IntlMessageFormat } from "intl-messageformat";
import { describe, expect, it } from "vitest";
import { CATALOGS, SUPPORTED_LOCALES } from "../../src/i18n/locales";

// Une ligne par couple (langue, message), pour qu'un échec nomme
// précisément le message fautif.
const MESSAGES = SUPPORTED_LOCALES.flatMap((locale) =>
  Object.entries(CATALOGS[locale]).map(
    ([id, message]) => [locale, id, message] as const,
  ),
);

describe("translation catalogs", () => {
  // Garde-fou : si le catalogue se vidait, les tests suivants passeraient
  // sans rien vérifier.
  it("contains at least one message", () => {
    expect(MESSAGES.length).toBeGreaterThan(0);
  });

  // Un message vide afficherait un trou à l'écran sans aucune erreur.
  it.each(MESSAGES)("%s: %s is not empty", (_locale, _id, message) => {
    expect(message.trim()).not.toBe("");
  });

  // La syntaxe ICU (pluriels, variables) n'est analysée qu'à l'affichage :
  // une accolade oubliée dans un pluriel ne se verrait qu'en jouant. Le
  // constructeur d'IntlMessageFormat analyse le message et lève une erreur
  // si la syntaxe est invalide.
  it.each(MESSAGES)("%s: %s has a valid ICU syntax", (locale, _id, message) => {
    expect(() => new IntlMessageFormat(message, locale)).not.toThrow();
  });
});
