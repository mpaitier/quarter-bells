import { describe, expect, it } from "vitest";

import {
  CARDS_RADIUS,
  CENTER,
  RULES_RADIUS,
  RULES_STEP,
  cardsAnchor,
  pointAt,
  rowOffset,
  rulePosition,
  sectionCenterAngle,
  sectionHour,
  separatorAngles,
} from "../../src/clock/clock-geometry";

describe("clock geometry", () => {
  // docs/clock-format.md : la section i est centrée sur i × 60°, depuis 12 h,
  // dans le sens horaire.
  it.each([
    [0, 0],
    [1, 60],
    [2, 120],
    [3, 180],
    [4, 240],
    [5, 300],
  ])("centers section %i on %i°", (index, angle) => {
    expect(sectionCenterAngle(index)).toBe(angle);
  });

  it("puts each separator half a section before the section center", () => {
    expect(separatorAngles()).toEqual([-30, 30, 90, 150, 210, 270]);
  });

  describe("pointAt", () => {
    it("points up at 0° (12 h)", () => {
      const point = pointAt(0, 10);
      expect(point.x).toBeCloseTo(CENTER.x);
      expect(point.y).toBeCloseTo(CENTER.y - 10);
    });

    it("turns clockwise: right at 90° (3 h), down at 180° (6 h)", () => {
      expect(pointAt(90, 10).x).toBeCloseTo(CENTER.x + 10);
      expect(pointAt(90, 10).y).toBeCloseTo(CENTER.y);
      expect(pointAt(180, 10).y).toBeCloseTo(CENTER.y + 10);
    });
  });

  it("anchors the cards outside the dial, in the middle of the section", () => {
    expect(cardsAnchor(3)).toEqual(pointAt(180, CARDS_RADIUS));
  });

  describe("rulePosition", () => {
    it("centers a single rule on the rules radius", () => {
      expect(rulePosition(1, 0, 1)).toEqual(pointAt(60, RULES_RADIUS));
    });

    it("lines several rules up along the radius, the first towards the rim", () => {
      expect([0, 1, 2].map((position) => rulePosition(2, position, 3))).toEqual(
        [
          pointAt(120, RULES_RADIUS + RULES_STEP),
          pointAt(120, RULES_RADIUS),
          pointAt(120, RULES_RADIUS - RULES_STEP),
        ],
      );
    });
  });

  it.each([
    [1, [0]],
    [2, [-2, 2]],
    [3, [-4, 0, 4]],
  ])("centers a row of %i items on 0", (count, offsets) => {
    expect(
      Array.from({ length: count }, (_, position) =>
        rowOffset(position, count, 4),
      ),
    ).toEqual(offsets);
  });

  it.each([
    [0, 12],
    [1, 2],
    [2, 4],
    [3, 6],
    [4, 8],
    [5, 10],
  ])("names section %i after %i o'clock", (index, hour) => {
    expect(sectionHour(index)).toBe(hour);
  });
});
