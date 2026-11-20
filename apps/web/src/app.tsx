import { FormattedMessage } from "react-intl";
import logo from "./assets/logo-header.png";
import { ClockWorkbench } from "./workbench/clock-workbench";

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
        {/* Provisoire : laissera la place à l'écran de jeu. */}
        <ClockWorkbench />
      </main>
    </>
  );
}
