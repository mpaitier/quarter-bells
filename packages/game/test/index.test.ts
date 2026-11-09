import { describe, expect, it } from "vitest";

import * as rules from "@quarter-bells/rules";

import * as game from "../src/index.js";

describe("package wiring", () => {
  // Vérifie le branchement du paquet dans le monorepo : Vitest et TypeScript
  // résolvent @quarter-bells/rules par le lien du workspace (pnpm), et le
  // point d'entrée du paquet se charge. À remplacer par le test de l'API
  // publique dès que index.ts exporte quelque chose.
  it("loads its entry point and resolves rules through the workspace", () => {
    expect(game).toBeDefined();
    expect(rules.MAX_SEED).toBe(0xffffffff);
  });
});
