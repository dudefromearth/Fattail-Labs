import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

/** As-built walk: dense + partial HUD. Landmarks not shipped; clock must already be there. */

const evidenceDir = join(
  process.cwd(),
  "../agents/p-options-lab-tm-os/evidence",
);

async function loadDay(page: import("@playwright/test").Page, day: string) {
  await page.evaluate((d) => {
    window.dispatchEvent(new CustomEvent("tm-test-load-day", { detail: d }));
  }, day);
  await expect
    .poll(
      async () =>
        page.evaluate(
          () =>
            (
              window as unknown as {
                __tmOccupancy?: () => { archiveDay: string | null };
              }
            ).__tmOccupancy?.().archiveDay ?? "",
        ),
      { timeout: 180_000 },
    )
    .toBe(day);
}

test("as-built scrubber HUD: dense 08-27 and partial 08-17", async ({
  page,
}) => {
  test.setTimeout(420_000);
  mkdirSync(evidenceDir, { recursive: true });
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId("analyzer-time-machine")).toBeVisible({
    timeout: 30_000,
  });

  await loadDay(page, "2026-08-27");
  const hud = page.getByTestId("analyzer-day-replay-hud");
  await expect(hud).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("analyzer-day-replay-scrubber")).toBeVisible();
  await hud.screenshot({
    path: join(evidenceDir, "tm-hud-dense-08-27.png"),
  });
  const denseClock = (await hud.innerText()).replace(/\s+/g, " ");
  expect(denseClock).toMatch(/\d/);
  await expect(page.getByTestId("analyzer-tm-hold")).toBeVisible();

  await loadDay(page, "2026-08-17");
  await expect(hud).toBeVisible({ timeout: 60_000 });
  await hud.screenshot({
    path: join(evidenceDir, "tm-hud-partial-08-17.png"),
  });
  const partialClock = (await hud.innerText()).replace(/\s+/g, " ");
  expect(partialClock).toMatch(/\d/);
});
