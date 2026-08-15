import { test, expect, type Page } from "@playwright/test";

/**
 * Import chip → existing Manage imports dialog (DL-358).
 * Does not add Import Manager to the main header.
 */

const TOS_SNIPPET = `,Exec Time,Spread,Side,Qty,Pos Effect,Symbol,Exp,Strike,Type,Price,Net Price,Order Type
,4/21/26 14:33:52,BUTTERFLY,BUY,+1,TO OPEN,SPX,21 APR 26,7080,PUT,6.57,.60,LMT
,,,SELL,-2,TO OPEN,SPX,21 APR 26,7075,PUT,4.54,DEBIT,
,,,BUY,+1,TO OPEN,SPX,21 APR 26,7070,PUT,3.11,,
`;

async function seedImportIfNeeded(page: Page): Promise<void> {
  if ((await page.getByTestId("blotter-import-badge").count()) > 0) return;
  await page.evaluate(async (text) => {
    const accts = await fetch("/api/me/trade-log/accounts", {
      credentials: "same-origin",
    });
    const aj = await accts.json();
    let accountId = aj.accounts?.[0]?.id as number | undefined;
    if (!accountId) {
      const created = await fetch("/api/me/trade-log/accounts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "E2E Import", broker: "thinkorswim" }),
      });
      accountId = (await created.json()).id;
    }
    await fetch("/api/me/trade-log/import/commit", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapter: "thinkorswim",
        text,
        account_id: accountId,
        filename: "e2e-import-badge.csv",
      }),
    });
  }, TOS_SNIPPET);
  await page.reload();
  await expect(page.getByTestId("trade-log-table")).toBeVisible({
    timeout: 30_000,
  });
}

test.describe("Trade Log import badge", () => {
  test("?import=open opens manage-imports, not a header item", async ({
    page,
  }) => {
    await page.goto("/api/auth/dev-login");
    await page.waitForURL(/\/course|\/admin|\//, { timeout: 30_000 });
    await page.goto("/app/trade-log?import=open");
    await expect(page.getByTestId("trade-log-table")).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("dialog", { name: /manage imports/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation").getByText("Import Manager"),
    ).toHaveCount(0);
    await expect(
      page.getByRole("banner").getByText("Import Manager"),
    ).toHaveCount(0);
  });

  test("chip sits under exec time, dark gray, tooltip id, click opens manager", async ({
    page,
  }) => {
    await page.goto("/api/auth/dev-login-practice");
    await page.waitForURL(/\/app\/trade-log/, { timeout: 30_000 });
    await expect(page.getByTestId("trade-log-table")).toBeVisible({
      timeout: 30_000,
    });
    await seedImportIfNeeded(page);

    const badge = page.getByTestId("blotter-import-badge").first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(/import/i);

    const col = await badge.evaluate((el) => {
      const td = el.closest("td");
      const tr = td?.parentElement;
      if (!td || !tr) return -1;
      return Array.from(tr.children).indexOf(td);
    });
    expect(col, "Import chip must live in the Exec time column").toBe(1);

    const styles = await badge.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, fg: s.color };
    });
    expect(styles.bg).toBe("rgb(58, 58, 60)");
    expect(styles.fg).toBe("rgb(209, 209, 214)");

    const title = await badge.getAttribute("title");
    expect(title).toMatch(/^Import #\d+$|^Imported \(file or paste\)$/);

    await badge.click();
    await expect(
      page.getByRole("dialog", { name: /manage imports/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("banner").getByText("Import Manager"),
    ).toHaveCount(0);
  });
});
