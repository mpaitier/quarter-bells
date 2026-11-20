import { GAME_CLOCKS, SECTION_COUNT } from "@quarter-bells/rules";
import { useId, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

import { ClockFace } from "../clock/clock-face";
import { sectionHour } from "../clock/clock-geometry";
import { SAMPLE_PLACEMENTS } from "./sample-placements";
import "./clock-workbench.css";

const SECTION_INDEXES = Array.from({ length: SECTION_COUNT }, (_, i) => i);

/**
 * Atelier provisoire (issue #35) : affiche une horloge du jeu au choix, pour
 * vérifier à l'œil son rendu. Il disparaîtra quand l'écran de jeu affichera
 * l'horloge de la partie.
 */
export function ClockWorkbench() {
  const intl = useIntl();
  const clockSelectId = useId();
  const startSelectId = useId();
  const [clockIndex, setClockIndex] = useState(0);
  const [startSection, setStartSection] = useState<number | undefined>();
  const [showCards, setShowCards] = useState(false);

  // Le sélecteur ne propose que des index de GAME_CLOCKS, et la liste n'est
  // jamais vide : la première horloge n'est qu'une valeur de repli pour le
  // typage.
  const clock = GAME_CLOCKS[clockIndex] ?? GAME_CLOCKS[0];

  return (
    <section className="clock-workbench">
      <form className="clock-workbench__controls">
        <label htmlFor={clockSelectId}>
          <FormattedMessage id="workbench.clock" />
        </label>
        <select
          id={clockSelectId}
          value={clockIndex}
          onChange={(event) => {
            setClockIndex(Number(event.target.value));
            setStartSection(undefined);
          }}
        >
          {GAME_CLOCKS.map((candidate, index) => (
            <option key={candidate.uid} value={index}>
              {intl.formatMessage(
                { id: "workbench.clockOption" },
                {
                  chapter: candidate.chapter,
                  position: candidate.indexInChapter + 1,
                },
              )}
            </option>
          ))}
        </select>

        <label htmlFor={startSelectId}>
          <FormattedMessage id="workbench.startSection" />
        </label>
        <select
          id={startSelectId}
          value={startSection ?? clock.defaultStartSection}
          onChange={(event) => {
            setStartSection(Number(event.target.value));
          }}
        >
          {SECTION_INDEXES.map((index) => (
            <option key={index} value={index}>
              {intl.formatMessage(
                { id: "clock.section.label" },
                { hour: sectionHour(index) },
              )}
            </option>
          ))}
        </select>

        <label>
          <input
            type="checkbox"
            checked={showCards}
            onChange={(event) => {
              setShowCards(event.target.checked);
            }}
          />
          <FormattedMessage id="workbench.sampleCards" />
        </label>
      </form>

      <ClockFace
        clock={clock}
        startSection={startSection ?? clock.defaultStartSection}
        placements={showCards ? SAMPLE_PLACEMENTS : []}
      />
    </section>
  );
}
