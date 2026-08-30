import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

/**
 * AV-13 as-built clock: open calendar → no pending `unknown` cells.
 * This is the live number Coach asked for. Availability is not built yet;
 * this walk times the coverage path that reconstructs.
 */

const evidenceDir = join(
  process.cwd(),
  "../agents/p-archive-availability/evidence",
);
const BUDGET_MS = 200;
const WAIT_MS = 120_000;

test("AV-13 as-built: calendar open to fully resolved", async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(evidenceDir, { recursive: true });

  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId("analyzer-tm-day")).toBeVisible({
    timeout: 30_000,
  });

  const coverageSeen: { t: number; status: number; url: string }[] = [];
  page.on("response", (res) => {
    const u = res.url();
    if (u.includes("/archive/coverage")) {
      coverageSeen.push({
        t: Date.now(),
        status: res.status(),
        url: u,
      });
    }
  });

  const dayInput = page.getByTestId("analyzer-tm-day");
  await dayInput.dispatchEvent("pointerdown");
  const t0 = Date.now();
  await expect(page.getByTestId("analyzer-tm-calendar")).toBeVisible({
    timeout: 10_000,
  });
  const tCal = Date.now() - t0;

  const today = await page.evaluate(() =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(
      new Date(),
    ),
  );

  let resolvedMs: number | null = null;
  const deadline = Date.now() + WAIT_MS;
  let lastSnap: Record<string, string> = {};
  while (Date.now() < deadline) {
    lastSnap = await page.evaluate((todayYmd) => {
      const cal = document.querySelector('[data-testid="analyzer-tm-calendar"]');
      if (!cal) return { error: "no-cal" };
      const buttons = [
        ...cal.querySelectorAll("button[data-testid^='analyzer-tm-cal-']"),
      ] as HTMLButtonElement[];
      const rows: Record<string, string> = {};
      let pending = 0;
      let inMonth = 0;
      for (const b of buttons) {
        const ymd = (b.getAttribute("data-testid") || "").replace(
          "analyzer-tm-cal-",
          "",
        );
        if (ymd.slice(0, 7) !== todayYmd.slice(0, 7)) continue;
        if (ymd > todayYmd) continue;
        inMonth += 1;
        const flag = b.getAttribute("data-tm-covered") || "missing";
        rows[ymd] = flag;
        if (flag === "unknown") pending += 1;
      }
      return {
        inMonth: String(inMonth),
        pending: String(pending),
        flags: JSON.stringify(rows),
      };
    }, today);
    if (lastSnap.error) break;
    if (Number(lastSnap.pending) === 0 && Number(lastSnap.inMonth) > 0) {
      resolvedMs = Date.now() - t0;
      break;
    }
    await page.waitForTimeout(50);
  }

  const out = {
    asBuilt: true,
    path: "coverage (reconstruct_book)",
    budgetMs: BUDGET_MS,
    calendarVisibleMs: tCal,
    resolvedMs,
    timedOut: resolvedMs == null,
    pendingAtEnd: lastSnap.pending ?? null,
    inMonth: lastSnap.inMonth ?? null,
    flags: lastSnap.flags ? JSON.parse(lastSnap.flags) : null,
    coverageHttp: coverageSeen,
    passBudget: resolvedMs != null && resolvedMs <= BUDGET_MS,
  };
  writeFileSync(
    join(evidenceDir, "av-13-as-built-open.json"),
    JSON.stringify(out, null, 2),
  );

  // Evidence walk — do not fail the process on as-built over-budget;
  // availability is not shipped. The number is the report.
  expect(page.getByTestId("analyzer-tm-calendar")).toBeVisible();
  console.log("AV-13 as-built open-to-resolved ms:", resolvedMs);
  console.log("AV-13 budget 200; pass?", out.passBudget);
});
