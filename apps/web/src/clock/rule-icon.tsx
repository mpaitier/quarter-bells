import { FamilyGlyph } from "./family-glyph";
import type { RuleText } from "./rule-text";

/** Taille d'une icône de règle, dans le repère du viewBox. */
export const RULE_ICON_WIDTH = 10;
const RULE_ICON_HEIGHT = 6.5;

interface RuleIconProps {
  readonly rule: RuleText;
  /** Centre de l'icône. */
  readonly x: number;
  readonly y: number;
}

/**
 * Icône d'une règle, avec son étiquette courte.
 *
 * La phrase complète sert de nom accessible (aria-label) et de texte au
 * survol (<title>, affiché par le navigateur). C'est ici que l'icône dessinée
 * à la main remplacera le cadre provisoire, avec une <image> par type de
 * règle : rien d'autre ne change.
 */
export function RuleIcon({ rule, x, y }: RuleIconProps) {
  const className = `rule-icon rule-icon--${rule.kind}`;
  const transform = `translate(${String(x)} ${String(y)})`;
  return (
    <g
      className={className}
      transform={transform}
      role="img"
      aria-label={rule.description}
    >
      <title>{rule.description}</title>
      <rect
        className="rule-icon__frame"
        x={-RULE_ICON_WIDTH / 2}
        y={-RULE_ICON_HEIGHT / 2}
        width={RULE_ICON_WIDTH}
        height={RULE_ICON_HEIGHT}
        rx={1.5}
      />
      {/* Avec une famille, l'étiquette laisse la place à son symbole, à
          l'intérieur du cadre pour ne pas déborder sur l'icône voisine. */}
      <text
        className="rule-icon__label"
        x={rule.family === undefined ? 0 : -1.6}
        dominantBaseline="central"
      >
        {rule.label}
      </text>
      {rule.family === undefined ? null : (
        <FamilyGlyph
          family={rule.family}
          x={RULE_ICON_WIDTH / 2 - 2}
          y={0}
          size={3.2}
        />
      )}
    </g>
  );
}
