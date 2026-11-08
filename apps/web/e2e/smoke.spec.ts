import { expect, test } from "@playwright/test";

// Test de fumée : vérifie que le site publié se charge et s'affiche dans un
// vrai navigateur. Il ne teste aucune fonctionnalité : il attrape ce que les
// tests de composants ne voient pas (build cassé, script qui ne se charge pas,
// erreur au montage de l'application dans main.tsx).
test.describe("home page", () => {
  test("loads without errors and shows the main heading", async ({ page }) => {
    // Erreurs JavaScript non rattrapées et erreurs écrites dans la console,
    // collectées pendant tout le chargement. Les écouteurs sont posés avant
    // la navigation pour ne rien manquer.
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    });

    await page.goto("/");

    // Le titre n'apparaît que si React a monté l'application et si la
    // traduction est branchée.
    await expect(
      page.getByRole("heading", { level: 1, name: "Quarter Bells" }),
    ).toBeVisible();

    // La langue de la page sert aux lecteurs d'écran pour choisir la voix.
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");

    expect(errors).toEqual([]);
  });
});
