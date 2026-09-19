import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * R2-G evidence on the live VP member route. Not AP-1.
 * REQ-002 stays OPEN until Coach's own browser / right-click.
 */

const shots = join(process.cwd(), "../artifacts/req-002");

async function login(page: import("@playwright/test").Page) {
  await page.goto("/api/auth/dev-login");
  await page.waitForURL((u) => !u.pathname.includes("dev-login"), {
    timeout: 30_000,
  });
}

async function waitChart(page: import("@playwright/test").Page) {
  const host = page.getByTestId("sa-price-chart");
  await expect(host).toBeVisible({ timeout: 45_000 });
  await expect(host).toHaveAttribute("data-vp-paint", "primitive");
  await expect
    .poll(async () => Number((await host.getAttribute("data-bar-count")) || "0"), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0);
  return host;
}

test.describe("REQ-002 TV settings dialog", () => {
  test("dialog chrome, two right-click sections, Ok/Cancel", async ({ page }) => {
    test.setTimeout(180_000);
    mkdirSync(shots, { recursive: true });
    await page.setViewportSize({ width: 1600, height: 1200 });
    await login(page);
    await page.goto("/app/options-lab/volume-profile");
    const host = await waitChart(page);

    await page.getByTestId("sa-settings-open").click();
    const dialog = page.getByTestId("sa-part-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("data-clause5", "white-black");
    await expect(dialog).toHaveAttribute("data-part", "L0");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByTestId("sa-settings-section-L0")).toBeVisible();
    await expect(page.getByTestId("sa-settings-section-axis")).toBeVisible();
    await expect(page.getByTestId("sa-defaults-menu")).toBeVisible();
    await expect(page.getByTestId("sa-settings-cancel")).toHaveText("Cancel");
    await expect(page.getByTestId("sa-settings-ok")).toHaveText("Ok");

    const box = await dialog.boundingBox();
    expect(box, "dialog on screen").toBeTruthy();
    expect(box!.width).toBeGreaterThan(700);
    expect(box!.height).toBeGreaterThan(600);

    await dialog.screenshot({ path: join(shots, "a-dialog-open-canvas.png") });

    await page.getByTestId("sa-settings-section-axis").click();
    await expect(dialog).toHaveAttribute("data-part", "axis");
    await expect(page.getByTestId("sa-scale-side")).toBeVisible();
    await dialog.screenshot({ path: join(shots, "a-dialog-scales.png") });
    await page.screenshot({
      path: join(shots, "a-page-dialog-open.png"),
      fullPage: false,
    });

    await page.getByTestId("sa-settings-cancel").click();
    await expect(dialog).toHaveCount(0);

    const chartBox = await host.boundingBox();
    expect(chartBox).toBeTruthy();
    await page.mouse.click(
      chartBox!.x + 24,
      chartBox!.y + chartBox!.height * 0.45,
      { button: "right" },
    );
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("data-part", "axis");
    await dialog.screenshot({ path: join(shots, "b-right-click-axis.png") });
    await page.getByTestId("sa-settings-cancel").click();
    await expect(dialog).toHaveCount(0);

    await page.getByTestId("sa-layer-L2").click({ button: "right" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("data-part", "L2");
    await expect(page.getByTestId("sa-vp-anchor")).toBeVisible();
    await dialog.screenshot({ path: join(shots, "b-right-click-profile.png") });

    const before = await page.getByTestId("sa-vp-anchor").inputValue();
    await page.getByTestId("sa-vp-anchor").selectOption("rtl");
    await expect(page.getByTestId("sa-vp-anchor")).toHaveValue("rtl");
    await page.getByTestId("sa-settings-cancel").click();
    await expect(dialog).toHaveCount(0);

    await page.getByTestId("sa-layer-L2").click({ button: "right" });
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("sa-vp-anchor")).toHaveValue(before);
    await page.getByTestId("sa-vp-anchor").selectOption(
      before === "rtl" ? "ltr" : "rtl",
    );
    await page.getByTestId("sa-settings-ok").click();
    await expect(dialog).toHaveCount(0);

    await page.getByTestId("sa-layer-L2").click({ button: "right" });
    await expect(page.getByTestId("sa-vp-anchor")).toHaveValue(
      before === "rtl" ? "ltr" : "rtl",
    );
    await page.getByTestId("sa-vp-anchor").selectOption(before);
    await page.getByTestId("sa-settings-ok").click();
  });
});
