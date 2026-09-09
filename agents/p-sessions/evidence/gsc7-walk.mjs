import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/ernie/Fattail-Labs/web/node_modules/playwright");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "gsc7");
const BASE = "http://localhost:3000";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await mkdir(OUT, { recursive: true });

await page.goto(`${BASE}/api/auth/dev-login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.goto(`${BASE}/resource/sessions`, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForSelector('[data-testid="sessions-map"]', { timeout: 30_000 });
await page.waitForTimeout(600);

const rec = { at: new Date().toISOString() };

async function setDate(iso) {
  await page.getByTestId("sessions-date").fill(iso);
  await page.getByTestId("sessions-date").press("Enter");
  await page.waitForTimeout(500);
}

rec.loadDays = await page.getByTestId("sessions-map").getAttribute("data-days");
rec.clock = await page.getByTestId("sessions-clock").textContent();
rec.now = await page.getByTestId("sessions-now").count();

const nowBox = await page.getByTestId("sessions-now").boundingBox();
const scrollerBox = await page.getByTestId("sessions-scroller").boundingBox();
rec.nowCentered = !!(nowBox && scrollerBox) &&
  Math.abs((nowBox.x - scrollerBox.x) - scrollerBox.width / 2) < scrollerBox.width * 0.25;

await setDate("2026-09-14");
rec.sep14days = await page.getByTestId("sessions-map").getAttribute("data-days");
rec.weekendSeam = await page.locator('[data-testid^="sessions-seam-weekend"]').count();

await setDate("2026-11-27");
rec.tgHatch = await page.locator('[data-testid="sessions-hatch-nyse-2026-11-26"]').count();
rec.earlyTrunc = await page.locator('[data-testid="sessions-seg-2026-11-27-afternoon"]').getAttribute("data-truncated");
rec.closing27 = await page.locator('[data-testid="sessions-seg-2026-11-27-closing"]').count();
rec.shotTg = path.join(OUT, "thanksgiving-week.png");
await page.screenshot({ path: rec.shotTg, fullPage: true });

await setDate("2026-12-24");
rec.xmasDay = await page.locator('[data-testid="sessions-day-nyse-2026-12-25"]').count();
rec.xmasSeam = await page.locator('[data-testid^="sessions-seam-cme-closed"]').count();
rec.shotXmas = path.join(OUT, "christmas-seam.png");
await page.screenshot({ path: rec.shotXmas, fullPage: true });

await setDate("2026-10-26");
rec.shotLondon = path.join(OUT, "london-dst.png");
await page.screenshot({ path: rec.shotLondon, fullPage: true });

await page.getByTestId("sessions-scale-fit").click();
await page.waitForTimeout(400);
const axisW = Number(await page.getByTestId("sessions-axis").getAttribute("data-axis-width"));
const days = Number(await page.getByTestId("sessions-map").getAttribute("data-days"));
const scroller = page.getByTestId("sessions-scroller");
const cw = await scroller.evaluate((el) => el.clientWidth);
rec.fit = { axisW, days, clientWidth: cw, dayPx: axisW / days, viewportMinusGutter: cw - 232 };
rec.fitOneDay = Math.abs(axisW / days - (cw - 232)) < 80;

const maxScroll = await scroller.evaluate((el) => el.scrollWidth - el.clientWidth);
await scroller.evaluate((el) => {
  el.scrollLeft = el.scrollWidth;
});
await page.waitForTimeout(200);
const atEnd = await scroller.evaluate((el) => el.scrollLeft >= el.scrollWidth - el.clientWidth - 2);
rec.scrollEnd = { maxScroll, atEnd };
rec.shotFit = path.join(OUT, "fit.png");
await page.screenshot({ path: rec.shotFit, fullPage: true });

rec.shotLoad = path.join(OUT, "load.png");

await writeFile(path.join(OUT, "walk.json"), JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec, null, 2));
await browser.close();
