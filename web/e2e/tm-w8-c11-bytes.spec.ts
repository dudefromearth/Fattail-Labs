import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

const evidenceDir = join(process.cwd(), "../agents/p-options-lab-tm/evidence");

function todayNy(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

test("W8 C11 resident bytes + C8 one archive slot", async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(evidenceDir, { recursive: true });

  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            Boolean(
              (window as unknown as { __tmHostInited?: boolean }).__tmHostInited,
            ),
        ),
      { timeout: 15_000 },
    )
    .toBe(true);
  await page.waitForTimeout(500);

  const today = todayNy();
  await page.evaluate((today) => {
    const t0 = Date.parse(`${today}T09:30:00-04:00`);
    for (let i = 0; i < 390; i += 1) {
      window.dispatchEvent(
        new CustomEvent("tm-test-capture", {
          detail: {
            t_ms: t0 + i * 2000,
            asOf: new Date(t0 + i * 2000).toISOString(),
            contentHash: `c11-${i}`,
            spot: 6400 + (i % 20) * 0.1,
            symbol: "SPX",
            expiration: today,
          },
        }),
      );
    }
  }, today);

  const native = await page.evaluate(() => {
    const w = window as unknown as {
      __tmOccupancy?: () => {
        todayCount: number;
        archiveCount: number;
        archiveDay: string | null;
      };
      __tmSlots?: {
        today?: { gens?: unknown[] } | null;
        archive?: { gens?: unknown[] } | null;
      };
    };
    const occ = w.__tmOccupancy?.();
    const mem = (
      performance as unknown as { memory?: { usedJSHeapSize: number } }
    ).memory;
    const todayGens = w.__tmSlots?.today?.gens ?? [];
    const archiveGens = w.__tmSlots?.archive?.gens ?? [];
    return {
      todayCount: occ?.todayCount ?? 0,
      archiveCount: occ?.archiveCount ?? 0,
      occupancyJsonBytes: JSON.stringify(occ ?? {}).length,
      todayGensJsonBytes: JSON.stringify(todayGens).length,
      archiveGensJsonBytes: JSON.stringify(archiveGens).length,
      heapBytes: mem?.usedJSHeapSize ?? null,
    };
  });

  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("tm-test-load-day", { detail: "2026-08-26" }),
    );
  });
  await expect(page.getByTestId("analyzer-tm-day")).toHaveValue("2026-08-26", {
    timeout: 15_000,
  });
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

  const withArchive = await page.evaluate(() => {
    const w = window as unknown as {
      __tmOccupancy?: () => {
        todayCount: number;
        archiveCount: number;
        archiveDay: string | null;
      };
      __tmSlots?: {
        today?: { gens?: unknown[] } | null;
        archive?: { gens?: unknown[] } | null;
      };
    };
    const occ = w.__tmOccupancy?.();
    const mem = (
      performance as unknown as { memory?: { usedJSHeapSize: number } }
    ).memory;
    const todayGens = w.__tmSlots?.today?.gens ?? [];
    const archiveGens = w.__tmSlots?.archive?.gens ?? [];
    return {
      todayCount: occ?.todayCount ?? 0,
      archiveCount: occ?.archiveCount ?? 0,
      archiveDay: occ?.archiveDay ?? null,
      occupancyJsonBytes: JSON.stringify(occ ?? {}).length,
      todayGensJsonBytes: JSON.stringify(todayGens).length,
      archiveGensJsonBytes: JSON.stringify(archiveGens).length,
      heapBytes: mem?.usedJSHeapSize ?? null,
    };
  });

  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("tm-test-load-day", { detail: "2026-08-17" }),
    );
  });
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
      { timeout: 30_000 },
    )
    .toBe("2026-08-17");

  const afterSwitch = await page.evaluate(() => {
    const occ = (
      window as unknown as {
        __tmOccupancy?: () => {
          todayCount: number;
          archiveCount: number;
          archiveDay: string | null;
        };
      }
    ).__tmOccupancy?.();
    return occ;
  });

  expect(native.todayCount).toBeGreaterThanOrEqual(390);
  expect(withArchive.todayCount).toBeGreaterThanOrEqual(native.todayCount);
  expect(afterSwitch?.archiveDay).toBe("2026-08-17");
  expect(afterSwitch?.todayCount).toBeGreaterThanOrEqual(native.todayCount);

  const report = {
    at: "AT-TM-C11",
    decay: "not shipped this GO — native only; ladder not frozen",
    native,
    nativePlusArchive: withArchive,
    afterSecondPastDay: afterSwitch,
    note: "10–20 MB in spec §0.48 is transfer, not this resident figure. No ceiling named.",
  };
  writeFileSync(
    join(evidenceDir, "w8-c11-resident-bytes.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
});
