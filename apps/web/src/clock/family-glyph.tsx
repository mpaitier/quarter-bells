import type { CardFamily } from "@quarter-bells/rules";

interface FamilyGlyphProps {
  readonly family: CardFamily;
  /** Centre du symbole. */
  readonly x: number;
  readonly y: number;
  /** Côté du carré qui contient le symbole. */
  readonly size: number;
}

/**
 * Symbole d'une famille de cartes : éclair pour Instant, infini pour
 * Éternité. Les familles se distinguent par leur forme, pas seulement par la
 * couleur (NF-ACC-01).
 *
 * Tracés provisoires, dans un carré de 10 × 10 : ils seront remplacés par
 * les symboles dessinés à la main. Toujours décoratif, le texte accessible
 * est porté par l'élément parent.
 */
export function FamilyGlyph({ family, x, y, size }: FamilyGlyphProps) {
  const className = `family-glyph family-glyph--${family}`;
  const transform = `translate(${String(x - size / 2)} ${String(y - size / 2)}) scale(${String(size / 10)})`;
  return (
    <g className={className} transform={transform} aria-hidden="true">
      {family === "instant" ? (
        <path d="M6 0 L1 6 H4.5 L3.5 10 L9 3.5 H5.5 Z" />
      ) : (
        <path
          d="M5 5 C3.5 2.5 0.5 2.5 0.5 5 C0.5 7.5 3.5 7.5 5 5 C6.5 2.5 9.5 2.5 9.5 5 C9.5 7.5 6.5 7.5 5 5 Z"
          fill="none"
          strokeWidth={1.4}
        />
      )}
    </g>
  );
}
