import type { PlacedCard } from "@quarter-bells/protocol";
import { GAME_CLOCKS, parseClock, type Clock } from "@quarter-bells/rules";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ClockFace } from "../../src/clock/clock-face";
import { renderWithTranslations } from "../render-with-translations";

/** L'horloge de position `index` du chapitre 1. */
function chapter1Clock(index: number): Clock {
  const clock = GAME_CLOCKS.find(
    (candidate) =>
      candidate.chapter === 1 && candidate.indexInChapter === index,
  );
  if (clock === undefined) {
    throw new Error(`No clock ${String(index)} in chapter 1`);
  }
  return clock;
}

/** Horloge sans règle, avec le plafond, pour isoler ce que teste chaque cas. */
function bareClock(overrides: Partial<Clock> = {}): Clock {
  return parseClock(
    {
      formatVersion: 1,
      uid: "fixture-bare",
      chapter: 1,
      indexInChapter: 0,
      noMaxSum: false,
      startSectionMode: "fixed",
      defaultStartSection: 0,
      clockRules: [],
      sections: [0, 1, 2, 3, 4, 5].map((index) => ({ index, rules: [] })),
      ...overrides,
    },
    "fixture-bare",
  );
}

function renderClock(
  clock: Clock,
  {
    startSection = 0,
    placements = [],
  }: { startSection?: number; placements?: readonly PlacedCard[] } = {},
) {
  return renderWithTranslations(
    <ClockFace
      clock={clock}
      startSection={startSection}
      placements={placements}
    />,
  );
}

/** Noms accessibles des éléments, dans l'ordre du document. */
function names(elements: readonly HTMLElement[]): (string | null)[] {
  return elements.map((element) => element.getAttribute("aria-label"));
}

describe("ClockFace", () => {
  it("names the six sections after their hour, clockwise from 12 h", () => {
    renderClock(bareClock(), { startSection: 4 });
    const clock = screen.getByRole("group", { name: "Horloge" });

    expect(
      names(within(clock).getAllByRole("group", { name: /^Section de/ })),
    ).toEqual([
      "Section de 12 h",
      "Section de 2 h",
      "Section de 4 h",
      "Section de 6 h",
      "Section de 8 h, section de départ",
      "Section de 10 h",
    ]);
  });

  // L'aiguille est dessinée vers 12 h, puis tournée de l'angle du milieu de
  // la section de départ.
  it.each([
    [0, "rotate(0 60 60)"],
    [2, "rotate(120 60 60)"],
    [5, "rotate(300 60 60)"],
  ])(
    "turns the needle to the middle of section %i",
    (startSection, transform) => {
      const { container } = renderClock(bareClock(), { startSection });
      expect(
        container
          .querySelector(".clock-face__needle")
          ?.getAttribute("transform"),
      ).toBe(transform);
    },
  );

  it("gives each rule an icon named by its description, with a hover text", () => {
    renderClock(chapter1Clock(0));
    const section = screen.getByRole("group", { name: "Section de 2 h" });
    const icon = within(section).getByRole("img", {
      name: "Au moins 1 carte Éternité devant cette section",
    });

    expect(icon.querySelector("title")?.textContent).toBe(
      "Au moins 1 carte Éternité devant cette section",
    );
    expect(icon).toHaveTextContent("≥ 1");
  });

  it("shows every rule of a section that has several", () => {
    renderClock(chapter1Clock(2));
    const section = screen.getByRole("group", { name: /^Section de 12 h/ });

    expect(names(within(section).getAllByRole("img"))).toEqual([
      "Exactement 3 cartes devant cette section",
      "Au moins 1 carte Éternité devant cette section",
      "Au moins 1 carte Instant devant cette section",
    ]);
  });

  describe("clock rules", () => {
    it("shows the lifted ceiling", () => {
      renderClock(bareClock({ noMaxSum: true }));
      const rules = screen.getByRole("group", { name: "Règles de l'horloge" });
      expect(
        within(rules).getByRole("img", {
          name: "Pas de plafond de 24 : une section peut valoir plus de 24",
        }),
      ).toBeInTheDocument();
    });

    it("shows the central rules", () => {
      renderClock(
        bareClock({ clockRules: [{ kind: "maxSum", params: { max: 20 } }] }),
      );
      const rules = screen.getByRole("group", { name: "Règles de l'horloge" });
      expect(
        within(rules).getByRole("img", {
          name: "Chaque section vaut au plus 20",
        }),
      ).toBeInTheDocument();
    });

    it("has no group when the clock has none", () => {
      renderClock(bareClock());
      expect(
        screen.queryByRole("group", { name: "Règles de l'horloge" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("placed cards", () => {
    const placements: readonly PlacedCard[] = [
      {
        sectionIndex: 3,
        player: "ana",
        faceUp: true,
        card: { family: "instant", value: 7 },
      },
      {
        sectionIndex: 1,
        player: "ben",
        faceUp: true,
        card: { family: "eternity", value: 2 },
      },
      {
        sectionIndex: 3,
        player: "ben",
        faceUp: false,
        card: { family: "eternity" },
      },
      {
        sectionIndex: 3,
        player: "ana",
        faceUp: false,
        card: { family: "instant", value: 4 },
      },
    ];

    it("stacks the cards of a section in placement order", () => {
      renderClock(bareClock(), { placements });
      const section = screen.getByRole("group", { name: "Section de 6 h" });
      const cards = within(section).getByRole("group", {
        name: "3 cartes posées",
      });

      expect(names(within(cards).getAllByRole("img"))).toEqual([
        "Instant 7, face visible",
        "Éternité, face cachée",
        "Instant 4, posée face cachée",
      ]);
    });

    it("shows the number of a known card, and never invents one", () => {
      renderClock(bareClock(), { placements });
      const visible = screen.getByRole("img", {
        name: "Instant 7, face visible",
      });
      const hidden = screen.getByRole("img", { name: "Éternité, face cachée" });

      expect(visible.querySelector("text")?.textContent).toBe("7");
      expect(hidden.querySelector("text")).toBeNull();
    });

    it("draws the family symbol on every card", () => {
      const { container } = renderClock(bareClock(), { placements });
      expect(
        container.querySelectorAll(".placed-card .family-glyph--instant"),
      ).toHaveLength(2);
      expect(
        container.querySelectorAll(".placed-card .family-glyph--eternity"),
      ).toHaveLength(2);
    });

    it("says when a section has no card", () => {
      renderClock(bareClock(), { placements });
      const section = screen.getByRole("group", { name: /^Section de 12 h/ });
      expect(
        within(section).getByRole("group", { name: "Aucune carte posée" }),
      ).toBeInTheDocument();
    });
  });

  // Critère : les 4 horloges du chapitre 1 s'affichent. La vérification
  // visuelle se fait dans l'atelier ; ce test garantit que chaque règle a
  // son icône.
  it.each([0, 1, 2, 3])(
    "draws every rule of clock %i of chapter 1",
    (index) => {
      const clock = chapter1Clock(index);
      renderClock(clock);
      const sectionRules = clock.sections.flatMap((section) => section.rules);

      expect(
        within(screen.getByRole("group", { name: "Horloge" })).getAllByRole(
          "img",
        ),
      ).toHaveLength(
        sectionRules.length +
          clock.clockRules.length +
          (clock.noMaxSum ? 1 : 0),
      );
    },
  );
});
