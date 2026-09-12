import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(
  process.cwd(),
  "../agents/p-options-lab-create-edit-dialog/gate-reports/dlg-type",
);

async function boot(page: Page) {
  await page.goto("/api/auth/dev-login");
  await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
  await page.goto("/app/options-lab/analyzer?symbol=SPX");
  await expect(page.getByTestId("options-lab-opf-risk-analyzer")).toBeVisible({
    timeout: 30_000,
  });
  await page.addStyleTag({
    content: `[data-testid="wiki-agent-admin-open"] { display: none !important; }`,
  });
}

async function openCreate(page: Page) {
  await page.getByTestId("analyzer-controls-create-position").click();
  const dialog = page.getByTestId("position-builder");
  await expect(dialog).toBeVisible();
  await expect
    .poll(async () => dialog.getByTestId("builder-leg-qty-0").count(), {
      timeout: 45_000,
    })
    .toBeGreaterThan(0);
  return dialog;
}

async function rowTypes(dialog: ReturnType<Page["getByTestId"]>) {
  const n = await dialog.locator('[data-testid^="builder-leg-type-"]').count();
  const types: string[] = [];
  for (let i = 0; i < n; i++) {
    types.push(await dialog.getByTestId(`builder-leg-type-${i}`).inputValue());
  }
  return types;
}

test("TYPE is a per-leg select; rows do not jump", async ({ page }) => {
  test.setTimeout(120_000);
  mkdirSync(OUT, { recursive: true });
  await boot(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  const dialog = await openCreate(page);
  await expect(dialog.getByTestId("builder-template")).toHaveValue("butterfly");
  await expect(dialog.getByTestId("builder-leg-type-0")).toHaveValue("call");
  await expect(dialog.getByTestId("builder-leg-type-1")).toHaveValue("call");
  await expect(dialog.getByTestId("builder-leg-type-2")).toHaveValue("call");

  const type0 = dialog.getByTestId("builder-leg-type-0");
  await expect(type0).toHaveJSProperty("tagName", "SELECT");
  await expect(type0.locator("option")).toHaveText(["CALL", "PUT"]);
  await type0.click();
  await page.screenshot({
    path: join(OUT, "01-type-menu.png"),
    fullPage: false,
  });

  await type0.selectOption("put");
  expect(await rowTypes(dialog)).toEqual(["put", "call", "call"]);
  await page.screenshot({
    path: join(OUT, "02-row0-put.png"),
    fullPage: false,
  });

  await dialog.getByTestId("builder-leg-type-1").selectOption("put");
  expect(await rowTypes(dialog)).toEqual(["put", "put", "call"]);
  await page.screenshot({
    path: join(OUT, "03-row1-put.png"),
    fullPage: false,
  });

  await dialog.getByTestId("builder-leg-type-2").selectOption("put");
  expect(await rowTypes(dialog)).toEqual(["put", "put", "put"]);
  await page.screenshot({
    path: join(OUT, "04-row2-put.png"),
    fullPage: false,
  });

  await dialog.getByTestId("builder-template").selectOption("vertical");
  await expect
    .poll(async () => dialog.getByTestId("builder-leg-type-0").count(), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0);
  const afterRebuild = await rowTypes(dialog);
  const tags = await dialog
    .locator('[data-testid^="builder-leg-type-"]')
    .evaluateAll((els) =>
      els.map((el) => (el as HTMLSelectElement).value),
    );
  expect(tags[0]).toBe("call");
  if (tags.length > 1) {
    for (let i = 1; i < tags.length; i++) {
      if (tags[i] === "put" && tags[i - 1] === "put") continue;
      if (tags[i] === "call" && tags[i - 1] === "put") {
        throw new Error(`calls not first: ${tags.join(",")}`);
      }
    }
  }
  const strikes = await dialog
    .locator('[data-testid^="builder-leg-strike-"]')
    .evaluateAll((els) =>
      els.map((el) => Number((el as HTMLSelectElement).value)),
    );
  const calls = tags
    .map((t, i) => ({ t, s: strikes[i] }))
    .filter((x) => x.t === "call")
    .map((x) => x.s);
  const puts = tags
    .map((t, i) => ({ t, s: strikes[i] }))
    .filter((x) => x.t === "put")
    .map((x) => x.s);
  expect([...calls].sort((a, b) => a - b)).toEqual(calls);
  expect([...puts].sort((a, b) => a - b)).toEqual(puts);
  await page.screenshot({
    path: join(OUT, "05-rebuild-canonical.png"),
    fullPage: false,
  });
  void afterRebuild;

  await dialog.getByLabel("Add leg").click();
  const n = await dialog.locator('[data-testid^="builder-leg-type-"]').count();
  expect(n).toBeGreaterThan(tags.length);
  const last = n - 1;
  await dialog.getByTestId(`builder-leg-type-${last}`).selectOption("put");
  const afterAdd = await rowTypes(dialog);
  expect(afterAdd[last]).toBe("put");
  expect(afterAdd.slice(0, last)).toEqual(tags);
  await page.screenshot({
    path: join(OUT, "06-add-leg-stays-bottom.png"),
    fullPage: false,
  });

  await dialog.getByTestId("builder-analyze").evaluate((el: HTMLElement) => {
    el.click();
  });
  await expect(page.getByTestId("position-builder")).toHaveCount(0, {
    timeout: 15_000,
  });
  const card = page.locator('[data-testid^="analyzer-pos-card-"]').first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  const posId = (await card.getAttribute("data-testid"))!.replace(
    "analyzer-pos-card-",
    "",
  );
  await page.getByTestId(`analyzer-pos-edit-${posId}`).click();
  const edit = page.getByTestId("position-builder");
  await expect(edit).toBeVisible();
  await expect
    .poll(async () => edit.getByTestId("builder-leg-type-0").count(), {
      timeout: 45_000,
    })
    .toBeGreaterThan(0);
  await page.screenshot({
    path: join(OUT, "07-edit-stored-order.png"),
    fullPage: false,
  });
  await edit.getByTestId("position-builder-cancel").evaluate((el: HTMLElement) => {
    el.click();
  });
  await expect(page.getByTestId("position-builder")).toHaveCount(0);
  await card.screenshot({ path: join(OUT, "08-card.png") });
  await page.screenshot({
    path: join(OUT, "08-card-page.png"),
    fullPage: false,
  });
});
