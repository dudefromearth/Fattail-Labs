import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

const evidenceDir = join(
  process.cwd(),
  "../agents/p-options-lab-tm-os/evidence",
);
const DENSE = "2026-08-27";
const INDEX_N = 36107;

function todayNy(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

test("OS-1 raise today after bounce — no TODAY_LIVE", async ({ page }) => {
  test.setTimeout(120_000);
  mkdirSync(evidenceDir, { recursive: true });
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });
  const today = todayNy();
  await expect(page.getByTestId("analyzer-tm-day")).toHaveValue(today);
  const idx = await page.evaluate(async (day) => {
    const r = await fetch(
      `/api/me/options-lab/archive/index?day=${day}&symbol=SPX`,
      { credentials: "same-origin" },
    );
    return { status: r.status, body: await r.json() };
  }, today);
  writeFileSync(join(evidenceDir, "os3-today-index.json"), JSON.stringify(idx));
  expect(idx.status).toBe(200);
  expect((idx.body as { hole?: string }).hole).not.toBe("TODAY_LIVE");

  const marks = await page.evaluate(async (day) => {
    const r = await fetch(
      `/api/me/options-lab/archive/marks?day=${day}&symbols=VIX&t=${day}T00:38:09-04:00`,
      { credentials: "same-origin" },
    );
    return { status: r.status, body: await r.json() };
  }, today);
  writeFileSync(join(evidenceDir, "os14-today-vix.json"), JSON.stringify(marks));
  expect(marks.status).toBe(200);
  const row = (marks.body as { marks?: Array<Record<string, unknown>> }).marks?.[0];
  expect(row?.source).toBe("massive_index_v1");
  expect(row?.mid).toBe(14.43);

  await page.evaluate((d) => {
    window.dispatchEvent(new CustomEvent("tm-test-load-day", { detail: d }));
  }, today);
  await page.waitForTimeout(3_000);
  const occ = await page.evaluate(
    () =>
      (
        window as unknown as {
          __tmOccupancy?: () => {
            archiveDay: string | null;
            archiveCount: number;
          };
        }
      ).__tmOccupancy?.(),
  );
  writeFileSync(join(evidenceDir, "os1-raise-today.json"), JSON.stringify(occ));
  await page.screenshot({
    path: join(evidenceDir, "os1-raise-today.png"),
    fullPage: false,
  });
});

test("C11 dense day infill to full", async ({ page }) => {
  test.setTimeout(1_800_000);
  mkdirSync(evidenceDir, { recursive: true });
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForTimeout(800);
  await page.evaluate((d) => {
    window.dispatchEvent(new CustomEvent("tm-test-load-day", { detail: d }));
  }, DENSE);
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
      { timeout: 300_000 },
    )
    .toBe(DENSE);

  const fid = page.getByTestId("analyzer-tm-fidelity");
  await expect(fid).toBeVisible({ timeout: 60_000 });
  let reached = false;
  try {
    await expect
      .poll(async () => fid.getAttribute("data-tm-fidelity"), {
        timeout: 1_500_000,
      })
      .toBe("100");
    reached = true;
  } catch {
    reached = false;
  }
  const snap = await page.evaluate(() => {
    const occ = (
      window as unknown as {
        __tmOccupancy?: () => {
          archiveCount: number;
          archiveDay: string | null;
        };
      }
    ).__tmOccupancy?.();
    const mem = (
      performance as unknown as { memory?: { usedJSHeapSize: number } }
    ).memory;
    return {
      archiveDay: occ?.archiveDay ?? null,
      archiveCount: occ?.archiveCount ?? 0,
      usedJSHeapSize: mem?.usedJSHeapSize ?? null,
      hidden: document.visibilityState,
    };
  });
  const fidelityPct = await fid.getAttribute("data-tm-fidelity");
  const out = {
    ...snap,
    reached,
    fidelityPct,
    indexN: INDEX_N,
    matchIndex: snap.archiveCount === INDEX_N,
  };
  writeFileSync(join(evidenceDir, "w6-c11-complete.json"), JSON.stringify(out));
  await page.screenshot({
    path: join(evidenceDir, "c11-dense.png"),
    fullPage: false,
  });
  if (!reached) {
    throw new Error(
      `C11 did not reach full: fidelity=${fidelityPct} count=${snap.archiveCount}/${INDEX_N} heap=${snap.usedJSHeapSize}`,
    );
  }
  expect(snap.archiveCount).toBe(INDEX_N);
});
