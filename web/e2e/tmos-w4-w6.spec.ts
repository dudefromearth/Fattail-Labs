import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";

const evidenceDir = join(
  process.cwd(),
  "../agents/p-options-lab-tm-os/evidence",
);
const DENSE = "2026-08-27";

function todayNy(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

test("W4 hold line + calendar; W6 dense infill C11; OS-13 VIX source", async ({
  page,
}) => {
  test.setTimeout(900_000);
  mkdirSync(evidenceDir, { recursive: true });
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });

  const book = await page.evaluate(() => {
    const raw =
      localStorage.getItem("ft_options_lab_analyzer_positions_v2") ||
      localStorage.getItem("ft_options_lab_analyzer_positions_v1") ||
      "[]";
    try {
      const arr = JSON.parse(raw) as Array<{ entryAt?: number }>;
      if (!Array.isArray(arr)) return { n: 0, missingEntryAt: 0 };
      return {
        n: arr.length,
        missingEntryAt: arr.filter(
          (p) => p.entryAt == null || !Number.isFinite(p.entryAt),
        ).length,
      };
    } catch {
      return { n: 0, missingEntryAt: 0 };
    }
  });
  writeFileSync(
    join(evidenceDir, "w6-entryAt-local.json"),
    JSON.stringify(book),
  );

  await expect(page.getByTestId("analyzer-tm-hold")).toBeVisible();
  await expect(page.getByTestId("analyzer-tm-hold")).not.toContainText(
    "from the open",
  );

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
      { timeout: 120_000 },
    )
    .toBe(DENSE);

  await expect(page.getByTestId("analyzer-tm-hold")).toContainText(
    "The archive holds from",
    { timeout: 30_000 },
  );
  await expect(page.getByTestId("analyzer-tm-hold")).toContainText("ET");
  await expect(page.getByTestId("analyzer-tm-hold")).toContainText("1:17");
  await expect(page.getByTestId("analyzer-tm-hold")).not.toContainText(
    "from the open",
  );

  await page.getByTestId("analyzer-tm-day").click();
  const cal = page.getByTestId("analyzer-tm-calendar");
  await expect(cal).toBeVisible();
  const denseCell = page.getByTestId(`analyzer-tm-cal-${DENSE}`);
  await expect
    .poll(async () => denseCell.getAttribute("data-tm-covered"), {
      timeout: 60_000,
    })
    .toBe("true");
  const todayCell = page.getByTestId(`analyzer-tm-cal-${todayNy()}`);
  await expect(todayCell).toBeVisible();
  await expect(todayCell).not.toHaveAttribute("data-tm-covered", "false");
  await page.screenshot({
    path: join(evidenceDir, "w4-calendar-hold.png"),
    fullPage: false,
  });
  await page.keyboard.press("Escape");

  const fid = page.getByTestId("analyzer-tm-fidelity");
  let infillFull = false;
  try {
    await expect
      .poll(async () => fid.getAttribute("data-tm-fidelity"), {
        timeout: 720_000,
      })
      .toBe("100");
    infillFull = true;
  } catch {
    infillFull = false;
  }

  const c11 = await page.evaluate(() => {
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
    };
  });
  const fidelityPct = await fid.getAttribute("data-tm-fidelity");
  writeFileSync(
    join(evidenceDir, "w6-c11-dense.json"),
    JSON.stringify({ ...c11, infillFull, fidelityPct }),
  );
  expect(c11.archiveDay).toBe(DENSE);
  expect(c11.archiveCount).toBeGreaterThan(1000);

  const vix = await page.evaluate(async () => {
    const r = await fetch(
      "/api/me/options-lab/archive/marks?day=2026-08-27&symbols=VIX&t=2026-08-27T14:32:00-04:00",
      { credentials: "same-origin" },
    );
    return r.json();
  });
  writeFileSync(join(evidenceDir, "w6-os13-vix.json"), JSON.stringify(vix));
  const row = (vix as { marks?: Array<{ source?: string; mid?: number }> })
    .marks?.[0];
  expect(row?.source).toBe("massive_proxy_v1");
  expect(row?.mid).toBeGreaterThan(0);

  await page.goto("/app/options-lab/heatmap?symbol=SPX");
  await expect(page.getByTestId("heatmap-tm-hold").first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Instant Replay")).toHaveCount(0);
  await page.screenshot({
    path: join(evidenceDir, "w4-heatmap-hold.png"),
    fullPage: false,
  });
});
