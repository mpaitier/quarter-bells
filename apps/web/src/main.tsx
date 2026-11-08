import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { TranslationProvider } from "./i18n/translation-provider";

// L'élément racine est déclaré dans index.html. S'il manque, autant échouer
// tout de suite avec un message clair plutôt que sur un « null » plus loin.
const root = document.getElementById("root");
if (root === null) {
  throw new Error("Élément #root introuvable dans index.html");
}

// StrictMode monte chaque composant deux fois en développement, pour révéler
// les effets mal nettoyés (voir ADR 0012). Il n'a aucun effet en production.
createRoot(root).render(
  <StrictMode>
    <TranslationProvider>
      <App />
    </TranslationProvider>
  </StrictMode>,
);
