import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/ernie/Fattail-Labs/web/node_modules/playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "gsc4");
const BASE = "http://localhost:3000";

async function shot(page, name) {
  const dest = path.join(OUT, name);
  await page.screenshot({ path: dest, fullPage: true });
  return dest;
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await mkdir(OUT, { recursive: true });

await page.goto(`${BASE}/api/auth/dev-login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(400);
await page.goto(`${BASE}/resource/sessions`, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForSelector('[data-testid="sessions-map"]', { timeout: 30_000 });

const rec = { at: new Date().toISOString(), dates: {} };

async function setDate(iso) {
  await page.getByTestId("sessions-date").fill(iso);
  await page.getByTestId("sessions-date").press("Enter");
  await page.waitForTimeout(400);
}

for (const iso of ["2026-09-08", "2026-11-27", "2026-11-26", "2026-09-05", "2026-10-12"]) {
  await setDate(iso);
  const banner = await page.getByTestId("sessions-banner").getAttribute("data-banner");
  const ribbon = await page.getByTestId("sessions-ribbon").count();
  const hatchNyse = await page.getByTestId("sessions-hatch-nyse").count();
  const now = await page.getByTestId("sessions-now").count();
  const rth = await page.getByTestId("sessions-rth-band").count();
  rec.dates[iso] = {
    banner,
    ribbon,
    hatchNyse,
    now,
    rth,
    shot: await shot(page, `${iso}.png`),
  };
}

await setDate("2026-09-08");
await page.getByTestId("sessions-scale-fit").click();
await page.waitForTimeout(300);
rec.fit = await shot(page, "fit-2026-09-08.png");

await page.getByTestId("sessions-scale-focus").click();
const scroller = page.getByTestId("sessions-scroller");
await scroller.evaluate((el) => {
  el.scrollLeft = 400;
});
await page.waitForTimeout(200);
const gutterVisible = await page.getByTestId("sessions-gutter-nyse").evaluate((el) => {
  const r = el.getBoundingClientRect();
  return r.left >= 0 && r.width >= 160;
});
rec.stickyGutter = gutterVisible;
rec.stickyShot = await shot(page, "sticky-gutter.png");

const title = await page.title();
rec.title = title;
rec.disclosure = await page.getByTestId("sessions-disclosures").textContent();

await writeFile(path.join(OUT, "walk.json"), JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec, null, 2));
await browser.close();
