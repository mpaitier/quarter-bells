import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ClockWorkbench } from "../../src/workbench/clock-workbench";
import { renderWithTranslations } from "../render-with-translations";

/** Choisit une option d'une liste déroulante, par son texte. */
function choose(listName: string, optionName: string): void {
  const list = screen.getByRole("combobox", { name: listName });
  const option = within(list).getByRole<HTMLOptionElement>("option", {
    name: optionName,
  });
  fireEvent.change(list, { target: { value: option.value } });
}

describe("ClockWorkbench", () => {
  it("shows the first clock of chapter 1, without cards", () => {
    renderWithTranslations(<ClockWorkbench />);

    expect(
      screen.getByRole("combobox", { name: "Horloge" }),
    ).toHaveDisplayValue("Chapitre 1, horloge 1");
    expect(
      screen.getAllByRole("group", { name: "Aucune carte posée" }),
    ).toHaveLength(6);
  });

  it("switches to another clock of the game", () => {
    renderWithTranslations(<ClockWorkbench />);

    choose("Horloge", "Chapitre 1, horloge 3");

    expect(
      screen.getByRole("img", { name: "La section vaut au plus 9" }),
    ).toBeInTheDocument();
  });

  it("moves the needle to the chosen start section, until the clock changes", () => {
    renderWithTranslations(<ClockWorkbench />);

    choose("Section de départ", "Section de 6 h");
    expect(
      screen.getByRole("group", { name: "Section de 6 h, section de départ" }),
    ).toBeInTheDocument();

    choose("Horloge", "Chapitre 1, horloge 2");
    expect(
      screen.getByRole("combobox", { name: "Section de départ" }),
    ).toHaveDisplayValue("Section de 12 h");
  });

  it("shows the sample cards on demand", () => {
    renderWithTranslations(<ClockWorkbench />);

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Afficher des cartes d'exemple" }),
    );

    const section = screen.getByRole("group", { name: "Section de 10 h" });
    expect(
      within(section).getByRole("group", { name: "4 cartes posées" }),
    ).toBeInTheDocument();
  });
});
