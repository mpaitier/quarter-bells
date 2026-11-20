import type { PlacedCard } from "@quarter-bells/protocol";
import type { Clock } from "@quarter-bells/rules";
import { useIntl } from "react-intl";

import {
  CENTER,
  DIAL_RADIUS,
  NEEDLE_LENGTH,
  VIEWBOX_SIZE,
  cardsAnchor,
  pointAt,
  rowOffset,
  rulePosition,
  sectionCenterAngle,
  sectionHour,
  separatorAngles,
} from "./clock-geometry";
import { CARD_WIDTH, PlacedCardIcon } from "./placed-card-icon";
import { RULE_ICON_WIDTH, RuleIcon } from "./rule-icon";
import { describeClockRules, describeSectionRule } from "./rule-text";
import "./clock-face.css";

/** Écart entre deux icônes de la rangée des règles de l'horloge. */
const CLOCK_RULE_STEP = RULE_ICON_WIDTH + 1;

/**
 * Décalage entre deux cartes d'une pile : chaque carte recouvre la
 * précédente, en laissant voir son nombre et le symbole de sa famille.
 */
const CARD_STEP = CARD_WIDTH * 0.75;

/** Coin où sont rangées les règles de toute l'horloge. */
const CLOCK_RULES_ORIGIN = { x: 8, y: 7 };

/** Rayon du pivot de l'aiguille. */
const PIVOT_RADIUS = 2.5;

interface ClockFaceProps {
  readonly clock: Clock;
  /** Section que pointe l'aiguille. */
  readonly startSection: number;
  /** Cartes posées, dans l'ordre de pose. Vide avant la Pose. */
  readonly placements: readonly PlacedCard[];
}

/**
 * Une horloge : cadran, aiguille, règles de chaque section, règles de
 * l'horloge et cartes posées (issue #35).
 *
 * Le composant ne reçoit que des données. Il ne connaît ni la passerelle ni
 * le moteur : c'est l'écran de jeu qui lui passe l'horloge et les cartes de
 * la vue du joueur.
 *
 * Tout est dessiné dans un seul SVG (ADR 0012) dont le viewBox s'adapte à
 * la place disponible. Chaque section est un groupe nommé pour les lecteurs
 * d'écran, qui parcourent les sections dans l'ordre de leur index.
 */
export function ClockFace({ clock, startSection, placements }: ClockFaceProps) {
  const intl = useIntl();
  const clockRules = describeClockRules(intl, clock.noMaxSum, clock.clockRules);
  const viewBox = `0 0 ${String(VIEWBOX_SIZE)} ${String(VIEWBOX_SIZE)}`;
  const needleTip = pointAt(0, NEEDLE_LENGTH);
  const needleRotation = `rotate(${String(sectionCenterAngle(startSection))} ${String(CENTER.x)} ${String(CENTER.y)})`;

  return (
    <svg
      className="clock-face"
      viewBox={viewBox}
      role="group"
      aria-label={intl.formatMessage({ id: "clock.label" })}
    >
      <g className="clock-face__dial" aria-hidden="true">
        <circle cx={CENTER.x} cy={CENTER.y} r={DIAL_RADIUS} />
        {separatorAngles().map((angle) => {
          const end = pointAt(angle, DIAL_RADIUS);
          return (
            <line
              key={angle}
              x1={CENTER.x}
              y1={CENTER.y}
              x2={end.x}
              y2={end.y}
            />
          );
        })}
      </g>

      {/* L'aiguille passe sous les icônes : elle pointe souvent une
          section qui porte des règles, et ne doit pas les masquer. */}
      <g
        className="clock-face__needle"
        transform={needleRotation}
        aria-hidden="true"
      >
        <line x1={CENTER.x} y1={CENTER.y} x2={needleTip.x} y2={needleTip.y} />
        <circle cx={CENTER.x} cy={CENTER.y} r={PIVOT_RADIUS} />
      </g>

      {clock.sections.map((section) => {
        const hour = sectionHour(section.index);
        const cardsAt = cardsAnchor(section.index);
        const rules = section.rules.map((rule) =>
          describeSectionRule(intl, rule),
        );
        const cards = placements.filter(
          (placed) => placed.sectionIndex === section.index,
        );
        return (
          <g
            key={section.index}
            className="clock-face__section"
            role="group"
            aria-label={intl.formatMessage(
              {
                id:
                  section.index === startSection
                    ? "clock.section.startLabel"
                    : "clock.section.label",
              },
              { hour },
            )}
          >
            {rules.map((rule, position) => {
              const at = rulePosition(section.index, position, rules.length);
              return (
                <RuleIcon
                  // Une section peut porter deux règles du même type : la
                  // position les distingue, et la liste ne change jamais.
                  key={position}
                  rule={rule}
                  x={at.x}
                  y={at.y}
                />
              );
            })}
            <g
              role="group"
              aria-label={intl.formatMessage(
                { id: "clock.section.cards" },
                { count: cards.length },
              )}
            >
              {cards.map((placed, position) => (
                <PlacedCardIcon
                  // Les cartes d'une section ne font que s'ajouter, dans
                  // l'ordre de pose : la position est stable.
                  key={position}
                  placed={placed}
                  x={cardsAt.x + rowOffset(position, cards.length, CARD_STEP)}
                  y={cardsAt.y}
                />
              ))}
            </g>
          </g>
        );
      })}

      {clockRules.length === 0 ? null : (
        <g
          className="clock-face__clock-rules"
          role="group"
          aria-label={intl.formatMessage({ id: "clock.clockRules.label" })}
        >
          {clockRules.map((rule, position) => (
            <RuleIcon
              key={position}
              rule={rule}
              x={CLOCK_RULES_ORIGIN.x + position * CLOCK_RULE_STEP}
              y={CLOCK_RULES_ORIGIN.y}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
