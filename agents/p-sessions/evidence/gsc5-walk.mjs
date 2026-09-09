import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/ernie/Fattail-Labs/web/node_modules/playwright");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "gsc5");
const BASE = "http://localhost:3000";

const browser = await chromium.launch({ headless: true });
await mkdir(OUT, { recursive: true });
const rec = { at: new Date().toISOString(), views: {}, me: {} };

async function shot(page, name) {
  const dest = path.join(OUT, name);
  await page.screenshot({ path: dest, fullPage: true });
  return dest;
}

for (const [w, h, name] of [
  [1440, 900, "1440"],
  [1024, 800, "1024"],
  [390, 844, "390"],
]) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    colorScheme: "light",
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/api/auth/dev-login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.goto(`${BASE}/resource/sessions`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector('[data-testid="sessions-map"]', { timeout: 30_000 });
  rec.views[`light-${name}`] = await shot(page, `light-${name}.png`);
  await ctx.close();

  const ctxD = await browser.newContext({
    viewport: { width: w, height: h },
    colorScheme: "dark",
  });
  const pageD = await ctxD.newPage();
  await pageD.goto(`${BASE}/api/auth/dev-login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await pageD.goto(`${BASE}/resource/sessions`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await pageD.waitForSelector('[data-testid="sessions-map"]', { timeout: 30_000 });
  rec.views[`dark-${name}`] = await shot(pageD, `dark-${name}.png`);
  await ctxD.close();
}

{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  const meHits = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/auth/me")) meHits.push(req.url());
  });
  await page.goto(`${BASE}/api/auth/dev-login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.goto(`${BASE}/resource/sessions`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector('[data-testid="sessions-map"]', { timeout: 30_000 });
  const afterLoad = meHits.length;
  await page.getByTestId("sessions-date").fill("2026-11-26");
  await page.getByTestId("sessions-date").press("Enter");
  await page.waitForTimeout(800);
  await page.getByTestId("sessions-date").fill("2026-11-27");
  await page.getByTestId("sessions-date").press("Enter");
  await page.waitForTimeout(800);
  await page.getByTestId("sessions-date").fill("2026-09-08");
  await page.getByTestId("sessions-date").press("Enter");
  await page.waitForTimeout(800);
  rec.me = { afterLoad, afterThreeDates: meHits.length, extraOnDate: meHits.length - afterLoad };
  rec.smooth = await page.getByTestId("sessions-scroller").evaluate((el) => getComputedStyle(el).scrollBehavior);
  await page.getByTestId("sessions-date").focus();
  rec.dateFocused = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  await page.getByTestId("sessions-scale-fit").focus();
  rec.fitFocused = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  rec.reduceShot = await shot(page, "reduced-motion.png");
  await ctx.close();
}

await writeFile(path.join(OUT, "walk.json"), JSON.stringify(rec, null, 2));
console.log(JSON.stringify(rec, null, 2));
await browser.close();
