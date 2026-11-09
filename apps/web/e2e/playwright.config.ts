import { defineConfig, devices } from "@playwright/test";

// Sur GitHub Actions, la variable CI vaut "true".
const isCI = process.env.CI === "true";

// Port fixe du serveur de prévisualisation, distinct de celui du serveur de
// développement (5173) pour pouvoir lancer les tests pendant qu'il tourne.
const PORT = 4173;

export default defineConfig({
  // Ce fichier est dans e2e/ : les tests sont à côté de lui.
  testDir: ".",

  // Un test.only oublié ferait passer la CI en ne lançant qu'un seul test.
  forbidOnly: isCI,

  // Une seule nouvelle tentative en CI, pour absorber un raté ponctuel du
  // navigateur. Un test qui ne passe qu'à la deuxième tentative est signalé
  // « flaky » dans le rapport : c'est un signal à traiter, pas à ignorer.
  retries: isCI ? 1 : 0,

  // Rapport lisible dans les annotations de la PR en CI, liste dans le terminal
  // en local. Le rapport HTML sert à comprendre un échec (voir la CI).
  reporter: isCI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    // Trace complète (DOM, réseau, console) enregistrée lors d'une nouvelle
    // tentative : de quoi rejouer l'échec pas à pas sans le reproduire.
    trace: "on-first-retry",
  },

  // Les deux dernières versions de Chrome, Firefox, Safari et Edge (NF-CMP-01).
  // Chromium couvre Chrome et Edge, qui partagent le même moteur, et WebKit
  // couvre Safari.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],

  // Les tests visent le site tel qu'il sera publié : build de production,
  // servi par vite preview. Le serveur de développement transforme le code à
  // la volée et masquerait un problème qui n'apparaît qu'au build.
  webServer: {
    command: `pnpm build && pnpm preview --port ${String(PORT)} --strictPort`,
    // Commandes lancées depuis apps/web, où sont les scripts build et preview.
    cwd: "..",
    url: `http://localhost:${String(PORT)}`,
    // En local, réutilise un serveur déjà lancé sur ce port. En CI, toujours
    // un serveur neuf, construit à partir du code de la PR.
    reuseExistingServer: !isCI,
  },
});
