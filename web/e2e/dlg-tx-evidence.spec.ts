import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Evidence walk: transactional edit, POS portal/dismissal, centre-on-canvas.
 * Screenshots land in gate-reports/dlg-tx/.
 */

const OUT = join(
  process.cwd(),
  "../agents/p-options-lab-create-edit-dialog/gate-reports/dlg-tx",
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

async function waitCentered(page: Page) {
  const dialog = page.getByTestId("position-builder");
  await expect
    .poll(
      async () => {
        return page.evaluate(() => {
          const panel = document.querySelector(
            '[data-testid="position-builder"]',
          );
          const canvas = document.querySelector(
            '[data-testid="analyzer-risk-viewport"]',
          );
          if (!panel) return null;
          const p = panel.getBoundingClientRect();
          const c = canvas?.getBoundingClientRect();
          const cx = c ? c.left + c.width / 2 : window.innerWidth / 2;
          const cy = c ? c.top + c.height / 2 : window.innerHeight / 2;
          return {
            dx: Math.abs(p.left + p.width / 2 - cx),
            dy: Math.abs(p.top + p.height / 2 - cy),
            rightGap: window.innerWidth - p.right,
            x: p.left,
            y: p.top,
          };
        });
      },
      { timeout: 8_000 },
    )
    .toMatchObject({
      // Not pinned to the right edge (old math left ~40px).
    });
  const geo = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="position-builder"]')!;
    const canvas = document.querySelector(
      '[data-testid="analyzer-risk-viewport"]',
    );
    const p = panel.getBoundingClientRect();
    const c = canvas?.getBoundingClientRect();
    const cx = c ? c.left + c.width / 2 : window.innerWidth / 2;
    const cy = c ? c.top + c.height / 2 : window.innerHeight / 2;
    return {
      dx: Math.abs(p.left + p.width / 2 - cx),
      dy: Math.abs(p.top + p.height / 2 - cy),
      rightGap: window.innerWidth - p.right,
      x: Math.round(p.left),
      y: Math.round(p.top),
    };
  });
  expect(geo.rightGap, "not against the right edge").toBeGreaterThan(80);
  expect(geo.dx, "centred on canvas x").toBeLessThan(40);
  expect(geo.dy, "centred on canvas y").toBeLessThan(80);
  return geo;
}

test("DLG transactional edit + POS portal + centre-on-canvas", async ({
  page,
}) => {
  test.setTimeout(300_000);
  mkdirSync(OUT, { recursive: true });
  await boot(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  const dialog = await openCreate(page);
  await waitCentered(page);
  await page.screenshot({
    path: join(OUT, "01-create-centered.png"),
    fullPage: false,
  });

  const handle = dialog.getByTestId("position-builder-drag-handle");
  const beforeDrag = await dialog.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top };
  });
  await handle.hover();
  await page.mouse.down();
  await page.mouse.move(80, 40, { steps: 8 });
  await page.mouse.up();
  const dragged = await dialog.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top };
  });
  expect(Math.abs(dragged.x - beforeDrag.x) + Math.abs(dragged.y - beforeDrag.y)).toBeGreaterThan(20);
  await page.screenshot({
    path: join(OUT, "02a-dragged.png"),
    fullPage: false,
  });

  await dialog.getByTestId("position-builder-cancel").click();
  await expect(dialog).toHaveCount(0);
  await openCreate(page);
  await waitCentered(page);
  await page.screenshot({
    path: join(OUT, "02b-reopen-centered.png"),
    fullPage: false,
  });

  const handle2 = page.getByTestId("position-builder-drag-handle");
  const mid = await page.getByTestId("position-builder").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top };
  });
  await handle2.hover();
  await page.mouse.down();
  await page.mouse.move(1200, 80, { steps: 8 });
  await page.mouse.up();
  const stayed = await page.getByTestId("position-builder").evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top };
  });
  expect(Math.abs(stayed.x - mid.x)).toBeGreaterThan(40);
  await page.screenshot({
    path: join(OUT, "02c-drag-stays.png"),
    fullPage: false,
  });

  await page.getByTestId("position-builder-cancel").evaluate((el: HTMLElement) => {
    el.click();
  });
  await expect(page.getByTestId("position-builder")).toHaveCount(0);
  await openCreate(page);
  await waitCentered(page);
  await page.getByTestId("builder-analyze").evaluate((el: HTMLElement) => {
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
  const cardStrike0 = await page
    .getByTestId(`analyzer-pos-strike-${posId}-0`)
    .inputValue()
    .catch(async () =>
      page.getByTestId(`analyzer-pos-strike-${posId}-0`).innerText(),
    );
  const cardPos0 = await page
    .getByTestId(`analyzer-pos-qty-input-${posId}`)
    .inputValue()
    .catch(async () =>
      page.getByTestId(`analyzer-pos-qty-${posId}`).innerText(),
    );
  const canvasBefore = page.getByTestId("analyzer-risk-viewport");

  await page.getByTestId(`analyzer-pos-edit-${posId}`).click();
  const edit = page.getByTestId("position-builder");
  await expect(edit).toBeVisible();
  await expect(edit.getByRole("heading", { name: "Edit Position" })).toBeVisible();
  await expect
    .poll(async () => edit.getByTestId("builder-leg-strike-0").count(), {
      timeout: 45_000,
    })
    .toBeGreaterThan(0);

  const strikeSel = edit.getByTestId("builder-leg-strike-0");
  const strikeBefore = await strikeSel.inputValue();
  await edit.getByTestId("builder-leg-strike-step-0-up").click();
  await expect(strikeSel).not.toHaveValue(strikeBefore);
  await edit.getByRole("radio", { name: "Sell" }).click();
  await edit.getByTestId("builder-pos-step-caret").click();
  await expect(page.getByTestId("builder-pos-step-menu")).toBeVisible();
  await page.getByTestId("builder-pos-step-5").click();
  await expect(edit.getByTestId("builder-pos")).toHaveText("5");
  await edit.getByTestId("builder-debit-step-up").click();
  const cardStrikeMid = await page
    .getByTestId(`analyzer-pos-strike-${posId}-0`)
    .inputValue()
    .catch(async () =>
      page.getByTestId(`analyzer-pos-strike-${posId}-0`).innerText(),
    );
  expect(cardStrikeMid).toBe(cardStrike0);
  await canvasBefore.screenshot({ path: join(OUT, "03a-mid-edit-canvas.png") });
  await card.screenshot({ path: join(OUT, "03a-mid-edit-card.png") });
  await page.screenshot({
    path: join(OUT, "03a-mid-edit-page.png"),
    fullPage: false,
  });

  await edit.getByTestId("position-builder-cancel").click();
  await expect(page.getByTestId("position-builder")).toHaveCount(0);
  const cardStrikeCancel = await page
    .getByTestId(`analyzer-pos-strike-${posId}-0`)
    .inputValue()
    .catch(async () =>
      page.getByTestId(`analyzer-pos-strike-${posId}-0`).innerText(),
    );
  expect(cardStrikeCancel).toBe(cardStrike0);
  const cardPosCancel = await page
    .getByTestId(`analyzer-pos-qty-input-${posId}`)
    .inputValue()
    .catch(async () =>
      page.getByTestId(`analyzer-pos-qty-${posId}`).innerText(),
    );
  expect(cardPosCancel).toBe(cardPos0);
  await page.screenshot({
    path: join(OUT, "03b-cancel-restored.png"),
    fullPage: false,
  });
  await card.screenshot({ path: join(OUT, "03b-cancel-card.png") });

  await page.getByTestId(`analyzer-pos-edit-${posId}`).click();
  const edit2 = page.getByTestId("position-builder");
  await expect(edit2).toBeVisible();
  await expect
    .poll(async () => edit2.getByTestId("builder-leg-strike-0").count(), {
      timeout: 45_000,
    })
    .toBeGreaterThan(0);
  const strikeSel2 = edit2.getByTestId("builder-leg-strike-0");
  const strikeBefore2 = await strikeSel2.inputValue();
  await edit2.getByTestId("builder-leg-strike-step-0-up").click();
  await expect(strikeSel2).not.toHaveValue(strikeBefore2);
  await edit2.getByRole("radio", { name: "Sell" }).click();
  await edit2.getByTestId("builder-pos-step-caret").click();
  await page.getByTestId("builder-pos-step-5").click();
  await expect(edit2.getByTestId("builder-pos")).toHaveText("5");
  await edit2.getByTestId("builder-debit-step-up").click();
  await edit2.getByTestId("builder-update").click();
  await expect(page.getByTestId("position-builder")).toHaveCount(0, {
    timeout: 15_000,
  });
  await expect(card).toContainText("SELL");
  await expect
    .poll(async () =>
      page
        .getByTestId(`analyzer-pos-qty-input-${posId}`)
        .inputValue()
        .catch(async () =>
          page.getByTestId(`analyzer-pos-qty-${posId}`).innerText(),
        ),
    )
    .toMatch(/5/);
  await page.screenshot({
    path: join(OUT, "04-update-applied.png"),
    fullPage: false,
  });
  await card.screenshot({ path: join(OUT, "04-update-card.png") });

  await page.getByTestId(`analyzer-pos-edit-${posId}`).click();
  const edit3 = page.getByTestId("position-builder");
  await expect(edit3).toBeVisible();
  await expect
    .poll(async () => edit3.getByTestId("builder-live-package-price").count(), {
      timeout: 45_000,
    })
    .toBeGreaterThan(0);
  const structure = await edit3.getByTestId("builder-leg-strike-0").inputValue();
  const debit0 = (
    await edit3.getByTestId("builder-live-package-price").innerText()
  ).trim();
  let debit1 = debit0;
  const t0 = Date.now();
  while (Date.now() - t0 < 8_000) {
    await page.waitForTimeout(1000);
    debit1 = (
      await edit3.getByTestId("builder-live-package-price").innerText()
    ).trim();
    const strikeNow = await edit3.getByTestId("builder-leg-strike-0").inputValue();
    expect(strikeNow).toBe(structure);
    if (debit1 !== debit0) break;
  }
  await page.screenshot({
    path: join(OUT, "05-quote-tick.png"),
    fullPage: false,
  });
  await edit3.screenshot({ path: join(OUT, "05-quote-tick-dialog.png") });

  const caret = edit3.getByTestId("builder-pos-step-caret");
  const handle3 = edit3.getByTestId("position-builder-drag-handle");
  const handleBox = await handle3.boundingBox();
  expect(handleBox).toBeTruthy();
  await page.mouse.move(
    handleBox!.x + handleBox!.width / 2,
    handleBox!.y + handleBox!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(360, 520, { steps: 8 });
  await page.mouse.up();
  await caret.evaluate((el: HTMLElement) => el.click());
  const menu = page.getByTestId("builder-pos-step-menu");
  await expect(menu).toBeVisible();
  const menuBox = await menu.boundingBox();
  expect(menuBox, "menu visible").toBeTruthy();
  expect(menuBox!.height).toBeGreaterThan(80);
  const inDialog = await menu.evaluate(
    (el) => !!el.closest('[data-testid="position-builder"]'),
  );
  expect(inDialog, "menu is portaled out of the dialog").toBe(false);
  await page.screenshot({
    path: join(OUT, "06-pos-menu-full.png"),
    fullPage: false,
  });

  const titleBox = await edit3.getByRole("heading", { name: "Edit Position" }).boundingBox();
  expect(titleBox).toBeTruthy();
  await page.mouse.click(
    titleBox!.x + titleBox!.width / 2,
    titleBox!.y + titleBox!.height / 2,
  );
  await expect(menu).toHaveCount(0);
  await expect(edit3).toBeVisible();
  await page.screenshot({
    path: join(OUT, "07-click-elsewhere-menu-closes.png"),
    fullPage: false,
  });

  await caret.evaluate((el: HTMLElement) => el.click());
  await expect(page.getByTestId("builder-pos-step-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("builder-pos-step-menu")).toHaveCount(0);
  await expect(edit3).toBeVisible();
  await page.screenshot({
    path: join(OUT, "08-escape-menu-dialog-stays.png"),
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("position-builder")).toHaveCount(0);

  await page.getByTestId(`analyzer-pos-edit-${posId}`).click();
  const edit4 = page.getByTestId("position-builder");
  await expect(edit4).toBeVisible();
  await expect
    .poll(async () => edit4.getByTestId("builder-pos-step-caret").count(), {
      timeout: 45_000,
    })
    .toBeGreaterThan(0);
  const caret4 = edit4.getByTestId("builder-pos-step-caret");
  const caretBox = await caret4.boundingBox();
  expect(caretBox).toBeTruthy();
  await page.mouse.move(
    caretBox!.x + caretBox!.width / 2,
    caretBox!.y + caretBox!.height / 2,
  );
  await page.mouse.down();
  const opt = page.getByTestId("builder-pos-step-10");
  await expect(opt).toBeVisible();
  const optBox = await opt.boundingBox();
  expect(optBox).toBeTruthy();
  await page.mouse.move(
    optBox!.x + optBox!.width / 2,
    optBox!.y + optBox!.height / 2,
    { steps: 6 },
  );
  await page.mouse.up();
  await expect(page.getByTestId("builder-pos-step-menu")).toHaveCount(0);
  await expect(edit4.getByTestId("builder-pos")).toHaveText("10");
  await page.screenshot({
    path: join(OUT, "09-press-drag-release.png"),
    fullPage: false,
  });
  await edit4.getByTestId("position-builder-cancel").evaluate((el: HTMLElement) => {
    el.click();
  });

  const cardCaret = page.getByTestId(`analyzer-pos-qty-step-${posId}-caret`);
  await cardCaret.click();
  const cardMenu = page.getByTestId(`analyzer-pos-qty-step-${posId}-menu`);
  await expect(cardMenu).toBeVisible();
  const cardMenuInCard = await cardMenu.evaluate(
    (el) => !!el.closest('[data-testid^="analyzer-pos-card-"]'),
  );
  expect(cardMenuInCard, "card menu stays in the card (no portal)").toBe(true);
  await page.screenshot({
    path: join(OUT, "10-card-pos-menu.png"),
    fullPage: false,
  });
  await card.screenshot({ path: join(OUT, "10-card.png") });
});
