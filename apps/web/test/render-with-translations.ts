import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { TranslationProvider } from "../src/i18n/translation-provider";

// Rend un composant entouré du fournisseur de traductions, comme dans
// l'application. Sans lui, un composant qui affiche un message traduit
// échouerait : react-intl exige un IntlProvider au-dessus de lui.
export function renderWithTranslations(ui: ReactElement): RenderResult {
  return render(ui, { wrapper: TranslationProvider });
}
