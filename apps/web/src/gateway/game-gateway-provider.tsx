import type { ReactNode } from "react";

import type { GameGateway } from "./game-gateway";
import { GameGatewayContext } from "./game-gateway-context";

interface GameGatewayProviderProps {
  /**
   * La passerelle du joueur affiché. Le composant racine choisit
   * l'adaptateur (local au J2, WebSocket au J3) : rien en dessous ne sait
   * lequel.
   */
  readonly gateway: GameGateway;
  readonly children: ReactNode;
}

/** Donne la passerelle à tous les composants de l'écran de jeu. */
export function GameGatewayProvider({
  gateway,
  children,
}: GameGatewayProviderProps) {
  return <GameGatewayContext value={gateway}>{children}</GameGatewayContext>;
}
