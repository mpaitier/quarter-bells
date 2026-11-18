import { createContext } from "react";

import type { GameGateway } from "./game-gateway";

/**
 * La passerelle de l'écran de jeu. Pas de valeur par défaut : un composant
 * rendu hors de GameGatewayProvider est une erreur de montage, signalée par
 * useGameGateway.
 */
export const GameGatewayContext = createContext<GameGateway | undefined>(
  undefined,
);
