import { test, expect } from "@playwright/test";

/**
 * PC8-F — padlock shackle must sit inside the data row, not under the sticky
 * symbol header. Escaped PC8-E because nothing measured the rendered box.
 */
const POS_KEY = "ft_options_lab_analyzer_positions_v2";

function fly(id: string, locked: boolean) {
  return {
    id,
    label: "SPX 20-wide fly",
    notation: "+1 5990C / -2 6010C / +1 6030C",
    status: "ANALYSIS",
    visible: true,
    lock: locked
      ? {
          mode: "locked",
          lockedAt: "2026-09-11T14:00:00.000Z",
          packageDebitPerShare: 1.09,
          lockSource: "user_limit",
          freezeIv: false,
          freezeMarks: false,
        }
      : { mode: "unlocked" },
    liveState: "live",
    livePackagePerShare: 1.09,
    lastNatSigned: 1.09,
    createdAt: 1,
    updatedAt: 1,
    position: {
      underlying: "SPX",
      expiration: "2026-12-18",
      contracts: 1,
      direction: "buy",
      legs: [
        { strike: 5990, type: "call", quantity: 1, side: "long", entry_price: 12 },
        { strike: 6010, type: "call", quantity: 2, side: "short", entry_price: 8 },
        { strike: 6030, type: "call", quantity: 1, side: "long", entry_price: 5 },
      ],
    },
  };
}

test("PC8-F padlock SVG box is inside the button and the data row, both states", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });
  await page.evaluate(
    ({ key, positions }) => {
      localStorage.setItem(key, JSON.stringify(positions));
      sessionStorage.setItem(key, JSON.stringify(positions));
    },
    {
      key: POS_KEY,
      positions: [fly("pc8f-unlock", false), fly("pc8f-lock", true)],
    },
  );
  await page.reload();

  for (const id of ["pc8f-unlock", "pc8f-lock"] as const) {
    const btn = page.getByTestId(`analyzer-pos-lock-${id}`);
    await expect(btn).toBeVisible({ timeout: 15_000 });
    const box = await btn.evaluate((el) => {
      const svg = el.querySelector("svg");
      const row = el.closest("tr");
      if (!svg || !row) return null;
      const s = svg.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      return {
        svgH: Math.round(s.height * 100) / 100,
        svgW: Math.round(s.width * 100) / 100,
        svgTop: s.top,
        svgBottom: s.bottom,
        btnTop: b.top,
        btnBottom: b.bottom,
        rowTop: r.top,
        rowBottom: r.bottom,
      };
    });
    expect(box).not.toBeNull();
    expect(box!.svgH).toBe(18);
    expect(box!.svgW).toBe(22);
    expect(box!.svgTop).toBeGreaterThanOrEqual(box!.btnTop - 0.5);
    expect(box!.svgBottom).toBeLessThanOrEqual(box!.btnBottom + 0.5);
    expect(box!.svgTop).toBeGreaterThanOrEqual(box!.rowTop - 0.5);
    expect(box!.svgBottom).toBeLessThanOrEqual(box!.rowBottom + 0.5);
  }
});
