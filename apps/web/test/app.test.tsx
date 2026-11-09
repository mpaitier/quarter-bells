import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/app";
import { renderWithTranslations } from "./render-with-translations";

describe("App", () => {
  // Vérifie que la page d'accueil se rend et expose un titre de niveau 1,
  // le repère principal pour un lecteur d'écran. Le texte attendu vient du
  // catalogue français : le test vérifie aussi que la traduction est branchée.
  it("renders the main heading", () => {
    renderWithTranslations(<App />);

    // On cherche par rôle, comme un lecteur d'écran, plutôt que par balise ou
    // par classe CSS : le test ne casse pas si le balisage change.
    expect(
      screen.getByRole("heading", { level: 1, name: "Quarter Bells" }),
    ).toBeInTheDocument();
  });
});
