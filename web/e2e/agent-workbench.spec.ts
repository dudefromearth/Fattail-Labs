import { test, expect } from "@playwright/test";

/**
 * Browser-level validation of P2 agents via /admin/ai.
 *
 * Prerequisites:
 *   1. API running with session cookie domain compatible with the web origin
 *   2. Next rewrites /api → API (NEXT_PUBLIC_LABS_API_URL)
 *   3. LABS_ENV=dev so /api/auth/dev-login works
 *   4. XAI_API_KEY on the API for the live run test
 *
 *   cd web && npx playwright test
 */

const hasXaiKey = Boolean(process.env.XAI_API_KEY);

test.describe("Agent workbench (browser)", () => {
  test.beforeEach(async ({ page }) => {
    // Mint administrator session (dev only)
    await page.goto("/api/auth/dev-login");
    await page.waitForURL(/\/courses|\/admin|\//);
  });

  test("admin can open workbench and see model status", async ({ page }) => {
    await page.goto("/admin/ai");
    await expect(page.getByTestId("ai-workbench")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("ai-workbench-title")).toContainText(
      "Agent workbench",
    );
    await expect(page.getByTestId("ai-status-panel")).toBeVisible();
    await expect(page.getByTestId("ai-primary-status")).toContainText("xai");
    await expect(page.getByTestId("ai-agent-select")).toBeVisible();
    await expect(page.getByTestId("ai-task-select")).toBeVisible();
  });

  test("workbench loads fixture inputs for bravo research_pack", async ({
    page,
  }) => {
    await page.goto("/admin/ai");
    await expect(page.getByTestId("ai-workbench")).toBeVisible();
    await page.getByTestId("ai-agent-select").selectOption("bravo");
    await page.getByTestId("ai-task-select").selectOption("research_pack");
    await page.getByTestId("ai-fixture-button").click();
    const raw = await page.getByTestId("ai-inputs").inputValue();
    const inputs = JSON.parse(raw) as { intent?: string; source?: string };
    expect(inputs.intent).toBeTruthy();
    expect(inputs.source).toBeTruthy();
  });

  test("live: bravo research_pack via browser requires XAI_API_KEY", async ({
    page,
  }) => {
    test.skip(
      !hasXaiKey,
      "Set XAI_API_KEY (and restart API) for live browser validation",
    );

    await page.goto("/admin/ai");
    await expect(page.getByTestId("ai-workbench")).toBeVisible();
    await expect(page.getByTestId("ai-primary-configured")).toContainText(
      "configured",
      { timeout: 15_000 },
    );

    await page.getByTestId("ai-agent-select").selectOption("bravo");
    await page.getByTestId("ai-task-select").selectOption("research_pack");
    await page.getByTestId("ai-fixture-button").click();

    await page.getByTestId("ai-run-button").click();
    await expect(page.getByTestId("ai-result")).toBeVisible({
      timeout: 240_000,
    });
    await expect(page.getByTestId("ai-result-meta")).toContainText("bravo");
    await expect(page.getByTestId("ai-result-meta")).toContainText("xai");
    const text = await page.getByTestId("ai-result-text").innerText();
    expect(text).toMatch(/##\s*Claims Inventory/i);
    expect(text).toMatch(/##\s*Sources/i);
    expect(text.length).toBeGreaterThan(80);
  });

  test("live: november lesson_plan via browser", async ({ page }) => {
    test.skip(!hasXaiKey, "Set XAI_API_KEY for live browser validation");

    await page.goto("/admin/ai");
    await expect(page.getByTestId("ai-primary-configured")).toContainText(
      "configured",
    );
    await page.getByTestId("ai-agent-select").selectOption("november");
    await page.getByTestId("ai-task-select").selectOption("lesson_plan");
    await page.getByTestId("ai-fixture-button").click();
    await page.getByTestId("ai-run-button").click();
    await expect(page.getByTestId("ai-result")).toBeVisible({
      timeout: 240_000,
    });
    const text = await page.getByTestId("ai-result-text").innerText();
    expect(text).toMatch(/##\s*Learning Outcomes/i);
    expect(text).toMatch(/##\s*Lesson Beats/i);
  });
});
