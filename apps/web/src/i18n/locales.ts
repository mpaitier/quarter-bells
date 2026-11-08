import fr from "./messages/fr.json";

// Langues proposées par l'application. L'anglais est prévu (NF-I18N-01) :
// l'ajouter ici, avec son catalogue messages/en.json.
export const SUPPORTED_LOCALES = ["fr"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

// Le catalogue français fait référence : ses clés sont les seuls identifiants
// de message valides (voir intl.d.ts). Un autre catalogue doit avoir
// exactement les mêmes clés, ce que le type Catalog impose.
export type MessageId = keyof typeof fr;
export type Catalog = Readonly<Record<MessageId, string>>;

export const CATALOGS: Readonly<Record<Locale, Catalog>> = { fr };
