import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// L'import ci-dessus ajoute à expect les vérifications sur le DOM
// (toBeInTheDocument, toHaveAccessibleName...) et leurs types.

// Testing Library démonte les composants après chaque test seulement si
// afterEach est une variable globale. Le projet n'active pas les globales de
// Vitest : le démontage est donc déclaré ici, sinon les rendus s'empileraient
// d'un test à l'autre dans le même document.
afterEach(() => {
  cleanup();
});
