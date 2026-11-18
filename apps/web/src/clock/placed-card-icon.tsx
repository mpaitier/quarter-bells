import type { PlacedCard } from "@quarter-bells/protocol";
import { useIntl } from "react-intl";

import { FamilyGlyph } from "./family-glyph";

/** Taille d'une carte posée, dans le repère du viewBox. */
export const CARD_WIDTH = 7;
const CARD_HEIGHT = 10;

interface PlacedCardIconProps {
  readonly placed: PlacedCard;
  /** Centre de la carte. */
  readonly x: number;
  readonly y: number;
}

/**
 * Une carte posée devant une section. Le nombre est en haut à gauche, pour
 * rester lisible quand les cartes se chevauchent ; le symbole de la famille
 * est en dessous (NF-ACC-01).
 *
 * Trois cas, selon ce que la vue du joueur contient :
 * - face visible : nombre et famille ;
 * - posée face cachée par ce joueur : il connaît le nombre, la carte reste
 *   marquée comme cachée (contour pointillé) ;
 * - posée face cachée par un autre : seulement la famille.
 */
export function PlacedCardIcon({ placed, x, y }: PlacedCardIconProps) {
  const intl = useIntl();
  const { card, faceUp } = placed;
  const value = "value" in card ? card.value : undefined;
  const family = intl.formatMessage({
    id: `card.family.${card.family}` as const,
  });

  const label =
    value === undefined
      ? intl.formatMessage({ id: "card.label.hidden" }, { family })
      : intl.formatMessage(
          { id: faceUp ? "card.label.faceUp" : "card.label.ownFaceDown" },
          { family, value },
        );
  const state =
    value === undefined ? "hidden" : faceUp ? "face-up" : "own-face-down";
  const className = `placed-card placed-card--${card.family} placed-card--${state}`;
  const transform = `translate(${String(x - CARD_WIDTH / 2)} ${String(y - CARD_HEIGHT / 2)})`;

  return (
    <g
      className={className}
      transform={transform}
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <rect
        className="placed-card__body"
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        rx={1}
      />
      {value === undefined ? null : (
        <text
          className="placed-card__value"
          x={1}
          y={1}
          dominantBaseline="hanging"
        >
          {value}
        </text>
      )}
      <FamilyGlyph
        family={card.family}
        x={CARD_WIDTH / 2}
        y={CARD_HEIGHT - 2.8}
        size={3.6}
      />
    </g>
  );
}
