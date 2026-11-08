import type { Locale, MessageId } from "./locales";

// Déclare à react-intl les identifiants de message et les langues valides.
// Sans ce fichier, formatMessage accepte n'importe quelle chaîne comme id :
// une faute de frappe dans une clé ne se verrait qu'à l'écran. Avec lui,
// TypeScript refuse un id absent du catalogue français.
declare global {
  namespace FormatjsIntl {
    interface Message {
      ids: MessageId;
    }
    interface IntlConfig {
      locale: Locale;
    }
  }
}
