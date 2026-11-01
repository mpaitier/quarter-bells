// Vérifie les horloges du jeu (packages/rules/clocks/), pas des fixtures :
// ce sont les données que le serveur chargera. Critères de l'issue #13 et
// de docs/testing.md (« Tests du format des horloges »).

import { describe, expect, it } from "vitest";
import type { Clock } from "../../src/clocks/clock.js";
import { parseClock } from "../../src/clocks/parse-clock.js";
import {
  expectedPath,
  expectedUid,
  readGameClockFiles,
} from "../support/game-clocks.js";

const files = readGameClockFiles();

// Une ligne par fichier, [chemin, données] : le chemin sert de nom de test,
// on sait directement quel fichier ouvrir en cas d'échec.
const rows = files.map((file) => [file.path, file.data] as const);

/**
 * Toutes les horloges validées. Une horloge invalide lève une erreur qui
 * nomme son fichier : les tests qui comparent les horloges entre elles
 * échouent alors avec un message clair, en plus du test de validité.
 */
const parseAll = (): Clock[] =>
  files.map((file) => parseClock(file.data, file.path));

describe("game clocks", () => {
  // Sans ce test, un dossier vide ou mal nommé donnerait une suite verte
  // qui ne vérifie rien.
  it("finds at least one clock", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  describe("each clock", () => {
    // Critère : chaque horloge est validée par le schéma, et n'utilise que
    // des types de règles du catalogue (parseClock refuse les autres).
    it.each(rows)("%s is a valid clock", (path, data) => {
      expect(() => parseClock(data, path)).not.toThrow();
    });

    // Le chapitre et la position décident de l'uid : impossible d'avoir deux
    // conventions de nommage, ni un uid qui ment sur la place de l'horloge.
    it.each(rows)(
      "%s has the uid of its chapter and position",
      (path, data) => {
        const clock = parseClock(data, path);
        expect(clock.uid).toBe(
          expectedUid(clock.chapter, clock.indexInChapter),
        );
      },
    );

    // Le fichier se retrouve à partir de l'uid, sans index à maintenir :
    // dossier du chapitre, nom de fichier égal à l'uid.
    it.each(rows)("%s is stored under its uid", (path, data) => {
      const clock = parseClock(data, path);
      expect(path).toBe(expectedPath(clock.chapter, clock.indexInChapter));
    });

    // ascendingOrder est déjà appliquée à toute épreuve comme règle
    // générale (evaluateGeneralRules). L'écrire dans une horloge ne change
    // rien au jeu, mais laisse croire au relecteur qu'elle est particulière.
    it.each(rows)("%s does not repeat a general rule", (path, data) => {
      const clock = parseClock(data, path);
      expect(clock.clockRules.map((rule) => rule.kind)).not.toContain(
        "ascendingOrder",
      );
    });
  });

  describe("all clocks", () => {
    // Critère : uid uniques dans tout le jeu. L'état des épreuves et la
    // progression référencent une horloge par son uid.
    it("uses each uid only once", () => {
      const uids = parseAll().map((clock) => clock.uid);
      expect(new Set(uids).size).toBe(uids.length);
    });
  });
});
