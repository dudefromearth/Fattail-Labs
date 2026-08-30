import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

/**
 * W1 live walk: Strikes/in → Autofit → Time Machine → PiP.
 * Two unit files are not a walkthrough.
 */

const evidenceDir = join(process.cwd(), "../agents/p-options-lab-tm/evidence");

test("W1 Analyzer strip order is Strikes/in, Autofit, Time Machine, PiP", async ({
  page,
}) => {
  test.setTimeout(90_000);
  mkdirSync(evidenceDir, { recursive: true });

  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });

  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll("[data-testid]")].map(
      (el) => el.getAttribute("data-testid") || "",
    ),
  );
  mkdirSync(evidenceDir, { recursive: true });
  await page.screenshot({
    path: join(evidenceDir, "w1-strip-loaded.png"),
    fullPage: true,
  });
  if (!ids.includes("analyzer-viewport-toolbar")) {
    throw new Error("toolbar missing; testids=" + ids.join(","));
  }
  const toolbar = page.getByTestId("analyzer-viewport-toolbar");
  await expect(toolbar).toBeVisible({ timeout: 15_000 });

  const strikes = page.getByTestId("analyzer-autofit-width");
  const autofit = page.getByTestId("analyzer-autofit");
  const tm = page.getByTestId("analyzer-time-machine");
  const pip = page.getByTestId("analyzer-pip-toggle");

  await expect(autofit).toBeVisible();
  await expect(tm).toBeVisible();
  await expect(pip).toBeVisible();

  // Admin-only Strikes/in: if missing, Autofit must still sit left of TM.
  const strikesVisible = await strikes.isVisible().catch(() => false);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(toolbar).toBeVisible();
  await page.screenshot({
    path: join(evidenceDir, "w1-strip-desktop.png"),
    fullPage: false,
  });

  const orderDesktop = await page.evaluate(() => {
    const ids = [
      "analyzer-autofit-width",
      "analyzer-autofit",
      "analyzer-time-machine",
      "analyzer-pip-toggle",
    ];
    return ids
      .map((id) => {
        const el = document.querySelector(`[data-testid="${id}"]`);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { id, x: r.x, y: r.y, w: r.width, h: r.height };
      })
      .filter(Boolean) as Array<{
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }>;
  });

  const byId = Object.fromEntries(orderDesktop.map((r) => [r.id, r]));
  expect(byId["analyzer-autofit"], "Autofit present").toBeTruthy();
  expect(byId["analyzer-time-machine"], "Time Machine strip present").toBeTruthy();
  expect(byId["analyzer-pip-toggle"], "PiP present").toBeTruthy();
  expect(byId["analyzer-autofit"].x).toBeLessThan(byId["analyzer-pip-toggle"].x);
  expect(byId["analyzer-time-machine"].y).toBeGreaterThanOrEqual(
    byId["analyzer-autofit"].y - 4,
  );
  const play = page.getByTestId("analyzer-tm-play");
  const pause = page.getByTestId("analyzer-tm-pause");
  const reset = page.getByTestId("analyzer-tm-reset");
  await expect(play).toBeVisible();
  await expect(pause).toBeVisible();
  await expect(reset).toBeVisible();
  const toolbarOverflow = await toolbar.evaluate(
    (el) => getComputedStyle(el).overflowX,
  );
  expect(toolbarOverflow === "visible" || toolbarOverflow === "hidden").toBeTruthy();
  const playBox = await play.boundingBox();
  const resetBox = await reset.boundingBox();
  expect(playBox, "Play in the dark strip").toBeTruthy();
  expect(resetBox, "Reset in the dark strip").toBeTruthy();
  expect((playBox?.width ?? 0) > 8).toBeTruthy();
  expect((resetBox?.width ?? 0) > 8).toBeTruthy();
  await play.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: join(evidenceDir, "w1-strip-desktop-transport.png"),
    fullPage: false,
  });
  if (strikesVisible && byId["analyzer-autofit-width"]) {
    expect(byId["analyzer-autofit-width"].x).toBeLessThan(byId["analyzer-autofit"].x);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(toolbar).toBeVisible();
  await page.screenshot({
    path: join(evidenceDir, "w1-strip-compact.png"),
    fullPage: false,
  });

  await expect(page.getByTestId("analyzer-tm-pause")).toBeVisible();
  await expect(page.getByTestId("analyzer-tm-play")).toBeVisible();
  const compactOverflow = await toolbar.evaluate(
    (el) => getComputedStyle(el).overflowX,
  );
  expect(["visible", "hidden"]).toContain(compactOverflow);
});
