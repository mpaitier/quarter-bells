import type { ReactNode } from "react";
import { IntlProvider } from "react-intl";
import { CATALOGS, DEFAULT_LOCALE, type Locale } from "./locales";

interface TranslationProviderProps {
  readonly children: ReactNode;
  // Optionnel : la langue par défaut tant que le choix de langue n'existe pas.
  readonly locale?: Locale;
}

// Rend les traductions disponibles à tous les composants enfants, qui les
// lisent avec useIntl() ou <FormattedMessage>.
export function TranslationProvider({
  children,
  locale = DEFAULT_LOCALE,
}: TranslationProviderProps) {
  return (
    <IntlProvider
      locale={locale}
      // Langue des textes écrits dans le code (defaultMessage). Le projet n'en
      // écrit pas : tout vient des catalogues. La déclarer évite que react-intl
      // suppose l'anglais et signale une incohérence.
      defaultLocale={DEFAULT_LOCALE}
      messages={CATALOGS[locale]}
    >
      {children}
    </IntlProvider>
  );
}
