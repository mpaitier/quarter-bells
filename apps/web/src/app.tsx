import { SECTION_COUNT } from "@quarter-bells/rules";
import { FormattedMessage } from "react-intl";
import logo from "./assets/logo-header.png";

// Géométrie de l'esquisse d'horloge, dans le repère du viewBox.
const CENTER = 50;
const RADIUS = 45;

// Une séparation par section : SECTION_COUNT vient du moteur de règles, ce qui
// prouve que le lien avec @quarter-bells/rules fonctionne jusqu'au build.
const SEPARATOR_ANGLES = Array.from(
  { length: SECTION_COUNT },
  (_, index) => (2 * Math.PI * index) / SECTION_COUNT,
);

export function App() {
  return (
    <>
      <header>
        {/* Décoratif : le nom du jeu est écrit juste à côté, un texte
            alternatif le ferait lire deux fois par un lecteur d'écran. */}
        <img src={logo} alt="" width={48} height={48} />
        <h1>
          <FormattedMessage id="app.title" />
        </h1>
      </header>
      <main>
        {/* Décoratif : masqué aux lecteurs d'écran. */}
        <svg viewBox="0 0 100 100" width="200" height="200" aria-hidden="true">
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
          />
          {SEPARATOR_ANGLES.map((angle) => (
            <line
              key={angle}
              x1={CENTER}
              y1={CENTER}
              x2={CENTER + RADIUS * Math.cos(angle)}
              y2={CENTER + RADIUS * Math.sin(angle)}
              stroke="currentColor"
            />
          ))}
        </svg>
      </main>
    </>
  );
}
