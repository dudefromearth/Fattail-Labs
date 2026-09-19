import { test, expect } from "@playwright/test";

/**
 * AZ-VP-9-A23 W4-G closures: pan/zoom + remount, member route and admin twin.
 * Dev login (LABS_ENV=dev). StudioTwo :3000/:4000.
 */

async function login(page: import("@playwright/test").Page) {
  page.on("pageerror", (e) => {
    (page as unknown as { _vpErr?: string[] })._vpErr = [
      ...((page as unknown as { _vpErr?: string[] })._vpErr || []),
      e.message,
    ];
  });
  await page.goto("/api/auth/dev-login");
  await page.waitForURL((u) => !u.pathname.includes("dev-login"), {
    timeout: 30_000,
  });
}

async function waitChart(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const host = page.getByTestId("sa-price-chart");
  await expect(host).toBeVisible({ timeout: 45_000 });
  await expect(host).toHaveAttribute("data-vp-paint", "primitive");
  await expect(page.getByTestId("sa-vp-overlay")).toHaveCount(0);
  await page.setViewportSize({ width: 1400, height: 900 });
  await expect
    .poll(async () => Number((await host.getAttribute("data-bar-count")) || "0"), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0);
  await expect(host.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
  const n = await host.locator("canvas").count();
  let best = host.locator("canvas").first();
  let bestArea = 0;
  for (let i = 0; i < n; i++) {
    const c = host.locator("canvas").nth(i);
    const b = await c.boundingBox();
    const area = b ? b.width * b.height : 0;
    if (area > bestArea) {
      bestArea = area;
      best = c;
    }
  }
  const canvas = best;
  try {
    if (bestArea < 80 * 80) throw new Error("pane small");
  } catch {
    const dump = await host.evaluate((el: HTMLElement) => {
      const inner = el.firstElementChild as HTMLElement | null;
      return {
        w: el.clientWidth,
        h: el.clientHeight,
        innerW: inner?.clientWidth,
        innerH: inner?.clientHeight,
        canvases: el.querySelectorAll("canvas").length,
        html: el.innerHTML.slice(0, 500),
      };
    });
    const early = (page as unknown as { _vpErr?: string[] })._vpErr || [];
    throw new Error(
      `chart dump ${JSON.stringify(dump)} pageerror=${JSON.stringify([...early, ...errors])}`,
    );
  }
  return { host, canvas };
}

async function panZoom(canvas: import("@playwright/test").Locator) {
  const box = await canvas.boundingBox();
  if (!box || box.width < 80) throw new Error(`pane too small ${JSON.stringify(box)}`);
  const x = box.x + box.width * 0.5;
  const y = box.y + box.height * 0.45;
  const page = canvas.page();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 80, y, { steps: 8 });
  await page.mouse.up();
  await page.mouse.wheel(0, 200);
  await page.mouse.wheel(0, -200);
  await expect(canvas).toBeVisible();
}

test.describe("A23 VP primitive", () => {
  test("member route: primitive, pan/zoom, remount", async ({ page }) => {
    await login(page);
    await page.goto("/app/options-lab/volume-profile");
    const first = await waitChart(page);
    await panZoom(first.canvas);
    await page.goto("/app/options-lab");
    await page.goto("/app/options-lab/volume-profile");
    const second = await waitChart(page);
    await panZoom(second.canvas);
  });

  test("admin twin: primitive, pan/zoom, remount", async ({ page }) => {
    await login(page);
    await page.goto("/admin/sa-dev");
    const first = await waitChart(page);
    await panZoom(first.canvas);
    await page.goto("/admin");
    await page.goto("/admin/sa-dev");
    const second = await waitChart(page);
    await panZoom(second.canvas);
  });
});
