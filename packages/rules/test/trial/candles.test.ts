import { describe, expect, it } from "vitest";
import {
  MAX_BONUS_CANDLES,
  checkCandleSettings,
  type CandleSettings,
} from "../../src/trial/candles.js";

describe("checkCandleSettings", () => {
  // Réglages extrêmes encore valides : bougies bonus désactivées, maximum
  // autorisé, plafond à 0 (aucune bougie de base).
  it.each<CandleSettings>([
    { maxBonusCandles: 0 },
    { maxBonusCandles: MAX_BONUS_CANDLES },
    { maxBonusCandles: 3, baseCandlesCap: 0 },
  ])("accepts %j", (settings) => {
    expect(() => {
      checkCandleSettings(settings);
    }).not.toThrow();
  });

  // Chaque ligne : un seul champ hors de ses bornes. Le message nomme le
  // champ fautif, pour que l'erreur se corrige sans lire le code.
  it.each<[CandleSettings, RegExp]>([
    [{ maxBonusCandles: -1 }, /maxBonusCandles/],
    [{ maxBonusCandles: MAX_BONUS_CANDLES + 1 }, /maxBonusCandles/],
    [{ maxBonusCandles: 1.5 }, /maxBonusCandles/],
    [{ maxBonusCandles: 3, baseCandlesCap: -1 }, /baseCandlesCap/],
    [{ maxBonusCandles: 3, baseCandlesCap: 1.5 }, /baseCandlesCap/],
  ])("rejects %j", (settings, message) => {
    expect(() => {
      checkCandleSettings(settings);
    }).toThrow(message);
  });
});
