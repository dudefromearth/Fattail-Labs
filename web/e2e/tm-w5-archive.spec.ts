import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

const evidenceDir = join(process.cwd(), "../agents/p-options-lab-tm/evidence");
const DAY_A = "2026-08-26";
const DAY_B = "2026-08-17";
const UNCOVERED = "2026-08-22";

function todayNy(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

test("W5 archive slot, occupancy across load, NO PATH, no 1-min", async ({
  page,
}) => {
  test.setTimeout(180_000);
  mkdirSync(evidenceDir, { recursive: true });

  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForTimeout(500);

  const day = page.getByTestId("analyzer-tm-day");
  await expect(day).toHaveValue(todayNy());

  let delayed = false;
  await page.route("**/api/me/options-lab/archive/fetch**", async (route) => {
    const url = route.request().url();
    if (!delayed && url.includes("level=0")) {
      delayed = true;
      await new Promise((r) => setTimeout(r, 400));
    }
    await route.continue();
  });

  await page.evaluate((today) => {
    const w = window as unknown as {
      __tmLog?: unknown[];
      __tmOccupancy?: () => unknown;
    };
    w.__tmLog = [];
    const push = () => {
      const snap = w.__tmOccupancy?.();
      if (snap) w.__tmLog!.push(snap);
    };
    window.dispatchEvent(
      new CustomEvent("tm-test-capture", {
        detail: {
          t_ms: Date.now() - 4_000,
          asOf: `${today}T14:00:00-04:00`,
          contentHash: "e2e-pre-a",
          spot: 6400,
          symbol: "SPX",
          expiration: today,
        },
      }),
    );
    window.dispatchEvent(
      new CustomEvent("tm-test-capture", {
        detail: {
          t_ms: Date.now() - 2_000,
          asOf: `${today}T14:00:01-04:00`,
          contentHash: "e2e-pre-b",
          spot: 6400.5,
          symbol: "SPX",
          expiration: today,
        },
      }),
    );
    push();
    (w as { __tmPoll?: number }).__tmPoll =
      window.setInterval(push, 40) as unknown as number;
  }, todayNy());

  let tickN = 0;
  const tickTimer = setInterval(() => {
    tickN += 1;
    const n = tickN;
    void page.evaluate(
      ({ today, n }) => {
        const now = Date.now();
        window.dispatchEvent(
          new CustomEvent("tm-test-capture", {
            detail: {
              t_ms: now,
              asOf: new Date(now).toISOString(),
              contentHash: `e2e-tick-${n}-${now}`,
              spot: 6400 + n * 0.01,
              symbol: "SPX",
              expiration: today,
            },
          }),
        );
      },
      { today: todayNy(), n },
    );
  }, 80);

  await page.evaluate((d) => {
    window.dispatchEvent(new CustomEvent("tm-test-load-day", { detail: d }));
  }, DAY_A);
  await expect(day).toHaveValue(DAY_A, { timeout: 15_000 });
  await expect(page.getByTestId("analyzer-replay-watermark")).toBeVisible({
    timeout: 90_000,
  });
  await expect(page.getByTestId("analyzer-day-replay-hud")).toBeVisible();
  await expect
    .poll(
      async () =>
        page.evaluate(
          () =>
            (
              window as unknown as {
                __tmOccupancy?: () => { archiveCount: number };
              }
            ).__tmOccupancy?.().archiveCount ?? 0,
        ),
      { timeout: 90_000 },
    )
    .toBeGreaterThan(0);
  await expect(page.getByTestId("analyzer-tm-fidelity")).toBeVisible();
  await page.screenshot({
    path: join(evidenceDir, "w5-archive-loaded.png"),
    fullPage: false,
  });

  await page.evaluate((today) => {
    window.dispatchEvent(
      new CustomEvent("tm-test-capture", {
        detail: {
          t_ms: Date.now(),
          asOf: `${today}T15:00:00-04:00`,
          contentHash: "e2e-after-load",
          spot: 6410,
          symbol: "SPX",
          expiration: today,
        },
      }),
    );
  }, todayNy());
  const afterA = await page.evaluate(() => {
    const w = window as unknown as {
      __tmOccupancy?: () => {
        todayHashes: string[];
        todayCount: number;
        archiveDay: string | null;
      };
      __tmLog?: Array<{ archiveDay: string | null; todayHashes: string[] }>;
      __tmCaptures?: string[];
    };
    return {
      now: w.__tmOccupancy?.(),
      log: w.__tmLog ?? [],
      captures: w.__tmCaptures ?? [],
    };
  });
  // Occupancy across the load is asserted below; keep the dump off the default reporter.
  expect(afterA.now?.archiveDay).toBe(DAY_A);
  expect(afterA.now?.todayHashes).toContain("e2e-pre-a");
  expect(afterA.now?.todayHashes).toContain("e2e-pre-b");
  const log = afterA.log as Array<{
    archiveDay: string | null;
    todayHashes: string[];
    todayCount: number;
  }>;
  const beforeLoad = log.find((s) => s.archiveDay == null);
  const duringLoad = log.filter((s) => s.archiveDay === DAY_A);
  expect(beforeLoad).toBeTruthy();
  expect(duringLoad.length).toBeGreaterThan(0);
  const countsWhileOpen = duringLoad.map((s) => s.todayCount);
  expect(
    Math.max(...countsWhileOpen),
    "today gen count grew while the archive day was open — no hole",
  ).toBeGreaterThan(countsWhileOpen[0]);
  const ticksDuring = duringLoad
    .flatMap((s) => s.todayHashes)
    .filter((h) => h.startsWith("e2e-tick-"));
  expect(ticksDuring.length).toBeGreaterThan(0);
  const lastTick = ticksDuring[ticksDuring.length - 1];
  expect(afterA.now?.todayHashes).toContain(lastTick);

  const todayCountAtA = afterA.now!.todayCount;
  clearInterval(tickTimer);

  await page.evaluate((d) => {
    window.dispatchEvent(new CustomEvent("tm-test-load-day", { detail: d }));
  }, DAY_B);
  await expect(day).toHaveValue(DAY_B, { timeout: 15_000 });
  await expect
    .poll(
      async () =>
        page.evaluate(
          () =>
            (
              window as unknown as {
                __tmOccupancy?: () => {
                  archiveDay: string | null;
                  archiveCount: number;
                };
              }
            ).__tmOccupancy?.(),
        ),
      { timeout: 90_000 },
    )
    .toMatchObject({ archiveDay: DAY_B });
  const afterB = await page.evaluate(() => {
    const w = window as unknown as {
      __tmOccupancy?: () => {
        todayHashes: string[];
        todayCount: number;
        archiveDay: string | null;
      };
      __tmLog?: Array<{ archiveDay: string | null }>;
    };
    return { now: w.__tmOccupancy?.(), log: w.__tmLog ?? [] };
  });
  expect(afterB.now?.archiveDay).toBe(DAY_B);
  expect(afterB.now?.todayCount).toBeGreaterThanOrEqual(todayCountAtA);
  const switchDays = (afterB.log ?? []).map((s) => s.archiveDay);
  const iA = switchDays.indexOf(DAY_A);
  const iB = switchDays.lastIndexOf(DAY_B);
  expect(iA).toBeGreaterThanOrEqual(0);
  expect(iB).toBeGreaterThan(iA);
  expect(switchDays.slice(iA, iB + 1).includes(null)).toBeTruthy();

  await page.getByTestId("analyzer-tm-reset").click();
  await expect(page.getByTestId("analyzer-replay-watermark")).toHaveCount(0);
  await expect(day).toHaveValue(todayNy());
  const afterReset = await page.evaluate(() => {
    const w = window as unknown as {
      __tmOccupancy?: () => {
        todayHashes: string[];
        todayCount: number;
        archiveDay: string | null;
      };
    };
    return w.__tmOccupancy?.();
  });
  expect(afterReset?.archiveDay).toBeNull();
  expect(afterReset?.todayHashes).toContain("e2e-pre-a");
  expect(afterReset?.todayHashes.some((h) => h.startsWith("e2e-tick-"))).toBe(
    true,
  );
  await page.screenshot({
    path: join(evidenceDir, "w5-reset-keeps-today.png"),
    fullPage: false,
  });

  await page.evaluate((d) => {
    window.dispatchEvent(new CustomEvent("tm-test-load-day", { detail: d }));
  }, DAY_A);
  await expect(day).toHaveValue(DAY_A, { timeout: 15_000 });
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
      { timeout: 90_000 },
    )
    .toBe(DAY_A);
  await expect(page.getByTestId("analyzer-tm-no-path")).toHaveCount(0);
  await page.getByTestId("analyzer-tm-reset").click();
  await expect(day).toHaveValue(todayNy());

  await page.evaluate((d) => {
    window.dispatchEvent(new CustomEvent("tm-test-load-day", { detail: d }));
  }, UNCOVERED);
  await expect(day).toHaveValue(UNCOVERED, { timeout: 15_000 });
  await expect(page.getByTestId("analyzer-tm-no-path")).toBeVisible({
    timeout: 30_000,
  });
  await page.getByTestId("analyzer-tm-day").click();
  const cal = page.getByTestId("analyzer-tm-calendar");
  await expect(cal).toBeVisible({ timeout: 15_000 });
  const uncoveredCell = page.getByTestId(`analyzer-tm-cal-${UNCOVERED}`);
  await expect(uncoveredCell).toBeVisible();
  await expect(uncoveredCell).toHaveAttribute("data-tm-covered", "false");
  await page.screenshot({
    path: join(evidenceDir, "w5-no-path.png"),
    fullPage: false,
  });

  await page.evaluate(() => {
    const w = window as unknown as { __tmPoll?: number };
    if (w.__tmPoll) window.clearInterval(w.__tmPoll);
  });
});
