import { test, expect } from "@playwright/test";
import path from "node:path";

/**
 * IF-1-G browser walk. Prerequisites: web :3000 + API :4000, LABS_ENV=dev.
 * Evidence lands on the Factory board (not test-results/).
 */

const EVIDENCE = path.resolve(
  __dirname,
  "../../agents/p-iki-factory/evidence/if1-g",
);

test.describe("IKI Factory IF-1 browser walk", () => {
  test("pickup stub, drag, invalid move reason, non-admin 403", async ({
    page,
  }) => {
    const title = `zz-if1-walk-${Date.now()}`;

    await page.goto("/api/auth/dev-login");
    await page.waitForURL(/\/home|\/course|\/admin|\//, { timeout: 30_000 });
    await page.goto("/app/iki/factory");
    await expect(page.getByTestId("iki-suite-nav")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("iki-factory-board")).toBeVisible({
      timeout: 30_000,
    });

    await page.getByTestId("iki-factory-title").fill(title);
    await page.getByTestId("iki-factory-deposit-btn").click();

    const card = page
      .getByTestId("iki-factory-lane-research")
      .locator("li")
      .filter({ hasText: title });
    await expect(card).toBeVisible({ timeout: 15_000 });
    // IF-6 (v1.0 §2.4): the card face is title + originator only — auto_move_reason
    // and blocked_reason moved into the item panel, opened by clicking the card.
    await card.click();
    const panel = page.getByTestId(/iki-factory-panel-\d+/);
    await expect(panel).toContainText("Auto: Idea deposited — picked up for research.");
    await expect(panel).toContainText("No skills registered. Gemba will not invent findings.");
    await page.screenshot({
      path: path.join(EVIDENCE, "if1-pickup-stub.png"),
      fullPage: true,
    });
    await page.getByTestId("iki-factory-panel-close").click();

    const specLane = page.getByTestId("iki-factory-lane-spec");
    await card.dragTo(specLane);
    const inSpec = page
      .getByTestId("iki-factory-lane-spec")
      .locator("li")
      .filter({ hasText: title });
    await expect(inSpec).toBeVisible({ timeout: 10_000 });
    await page.screenshot({
      path: path.join(EVIDENCE, "if1-drag-research-to-spec.png"),
      fullPage: true,
    });

    const liveLane = page.getByTestId("iki-factory-lane-live");
    await inSpec.dragTo(liveLane);
    await expect(inSpec).toBeVisible();
    await expect(page.getByTestId("iki-factory-lane-live").locator("li").filter({ hasText: title })).toHaveCount(0);
    // Invalid-move reason surfaces on the page-level error banner, not on the
    // card face (the card face carries no transient state — v1.0 §2.4).
    await expect(page.getByTestId("iki-factory-error")).toContainText(
      /one lane|Skip-forward|not allowed/i,
      { timeout: 10_000 },
    );
    await page.screenshot({
      path: path.join(EVIDENCE, "if1-invalid-move-reason.png"),
      fullPage: true,
    });

    await page.goto("/api/auth/dev-login-practice");
    await page.waitForURL(/\/app\/trade-log|\/home|\//, { timeout: 30_000 });
    await page.goto("/app/iki/factory");
    await expect(page.getByTestId("iki-factory-live")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("iki-factory-board")).toHaveCount(0);
    await page.screenshot({
      path: path.join(EVIDENCE, "if1-nonadmin-soon.png"),
      fullPage: true,
    });
  });
});
