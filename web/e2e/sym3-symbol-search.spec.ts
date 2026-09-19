import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * SYM3-G evidence on the live VP member route. Not AP-1.
 * REQ-003 stays OPEN. Does not close on the tagged picker.
 */

const shots = join(process.cwd(), "../artifacts/symbology/sym3");

async function login(page: import("@playwright/test").Page) {
  await page.goto("/api/auth/dev-login");
  await page.waitForURL((u) => !u.pathname.includes("dev-login"), {
    timeout: 30_000,
  });
}

test.describe("SYM3 symbol search", () => {
  test("tile opens TV dialog; rest / ES / dialect / gray", async ({ page }) => {
    test.setTimeout(180_000);
    mkdirSync(shots, { recursive: true });
    await login(page);
    await page.goto("/app/options-lab/volume-profile");
    const tile = page.getByTestId("symbol-search-tile");
    await expect(tile).toBeVisible({ timeout: 45_000 });
    await tile.click();
    const dialog = page.getByTestId("symbol-search-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("data-clause5", "white-black");
    await expect(dialog).toHaveAttribute("data-roles", "options,price-structure");
    await expect(page.getByTestId("symbol-search-chip-all")).toBeVisible();
    await expect(page.getByTestId("symbol-search-chip-futures")).toBeVisible();
    await expect(page.getByTestId("symbol-search-chip-stocks")).toBeVisible();
    await expect(page.getByTestId("symbol-search-chip-indices")).toBeVisible();
    await expect(page.getByText("Forex")).toHaveCount(0);
    await expect(page.getByText("ISIN")).toHaveCount(0);
    await expect(page.getByTestId("symbol-search-row-SPX")).toBeVisible();
    await expect(page.getByTestId("symbol-search-row-ES")).toBeVisible();
    await expect(page.getByTestId("symbol-search-row-ES1!")).toHaveCount(0);
    await dialog.screenshot({ path: join(shots, "a-at-rest.png") });

    await page.getByTestId("symbol-search-row-ES").click();
    await expect(page.getByTestId("symbol-search-row-ES1!")).toBeVisible();
    await expect(page.getByTestId("symbol-search-row-ES2!")).toBeVisible();
    await expect(page.getByTestId("symbol-search-family-ES")).toContainText(
      "opens front contract · continuous coming",
    );
    await expect(page.getByTestId("symbol-search-pair-badge").filter({ hasText: "ES → SPX" }).first()).toBeVisible();
    await dialog.screenshot({ path: join(shots, "b-es-family.png") });

    await page.getByTestId("symbol-search-input").fill("/ES");
    await expect(page.getByTestId("symbol-search-row-/ES")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("symbol-search-continuity-label")).toContainText(
      "opens front contract · continuous coming",
    );
    await dialog.screenshot({ path: join(shots, "c-slash-es.png") });

    await page.getByTestId("symbol-search-input").fill("NQ");
    await expect(page.getByTestId("symbol-search-miss")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("symbol-search-gray-reason")).toContainText(
      "Not supported yet",
    );
    await dialog.screenshot({ path: join(shots, "d-gray-nq.png") });
  });
});
