/**
 * GSC3-G browser walks — local dev stack only.
 * Signed-in member + anonymous. Library/Tags regression. /api/auth/me counts.
 */
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/ernie/Fattail-Labs/web/node_modules/playwright");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "gsc3");
const BASE = "http://localhost:3000";

function meTracker(page) {
  const hits = [];
  page.on("request", (req) => {
    const u = req.url();
    if (u.includes("/api/auth/me")) {
      hits.push({
        t: Date.now(),
        method: req.method(),
        url: u,
        resource: req.resourceType(),
      });
    }
  });
  return hits;
}

async function shot(page, name) {
  const dest = path.join(OUT, name);
  await page.screenshot({ path: dest, fullPage: true });
  return dest;
}

async function walkAnon(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const hits = meTracker(page);

  await page.goto(`${BASE}/resource/sessions`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForTimeout(1200);
  await page.waitForFunction(
    () => document.title.includes("Sessions") || document.title.length > 0,
    null,
    { timeout: 15_000 },
  ).catch(() => {});

  const title = await page.title();
  const signIn = page.getByTestId("sessions-anon-gate");
  const pill = page.getByTestId("resources-hub-tab-sessions");
  const stub = page.getByTestId("sessions-map-stub");
  const header = page.locator("header.site-header");
  const suite = page.getByTestId("resources-suite-nav");

  const rec = {
    url: page.url(),
    title,
    hasSignIn: await signIn.isVisible(),
    signInText: (await signIn.textContent())?.trim() ?? null,
    sessionsPillVisible: await pill.isVisible().catch(() => false),
    stubVisible: await stub.isVisible().catch(() => false),
    labsHeader: await header.isVisible(),
    suiteNav: await suite.isVisible(),
    meOnLoad: hits.length,
    screenshot: await shot(page, "anon-sessions.png"),
  };

  // Library + Tags on /resource, pill still absent
  await page.goto(`${BASE}/resource`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(800);
  const libBtn = page.getByTestId("resources-hub-tab-library");
  const tagsBtn = page.getByTestId("resources-hub-tab-tags");
  await libBtn.click();
  await page.waitForTimeout(400);
  const libraryVisible = await page.getByTestId("resources-hub").isVisible();
  rec.libraryClickOk = libraryVisible;
  rec.anonResourceScreenshot = await shot(page, "anon-resource-library.png");
  await tagsBtn.click();
  await page.waitForTimeout(800);
  rec.tagsVisible = await page.getByTestId("resources-tags").isVisible();
  rec.anonTagsScreenshot = await shot(page, "anon-resource-tags.png");
  rec.sessionsPillOnResource = await page
    .getByTestId("resources-hub-tab-sessions")
    .isVisible()
    .catch(() => false);
  rec.meTotalAnon = hits.length;

  await ctx.close();
  return rec;
}

async function walkMember(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(`${BASE}/api/auth/dev-login`, {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await page.waitForTimeout(400);

  const hits = meTracker(page);
  const t0 = Date.now();
  await page.goto(`${BASE}/resource/sessions`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector('[data-testid="sessions-map-stub"]', {
    timeout: 30_000,
  });
  await page.waitForFunction(() => document.title.includes("Sessions"), null, {
    timeout: 15_000,
  }).catch(() => {});
  await page.waitForTimeout(500);
  const afterLoad = hits.length;
  const title = await page.title();

  const pill = page.getByTestId("resources-hub-tab-sessions");
  const box = await pill.boundingBox();
  const ariaCurrent = await pill.getAttribute("aria-current");
  const header = page.locator("header.site-header");
  const stubText = (await page.getByTestId("sessions-map-stub").textContent())?.trim();

  await page.getByTestId("resources-hub-tab-library").focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(
    () => document.activeElement?.getAttribute("data-testid") || null,
  );
  const outline = await pill.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      outline: s.outline,
      outlineWidth: s.outlineWidth,
      outlineColor: s.outlineColor,
      boxShadow: s.boxShadow,
    };
  });
  const memberSessionsShot = await shot(page, "member-sessions.png");
  const memberFocusShot = await shot(page, "member-sessions-focus.png");

  // Settle window: no date control in GSC3. Wait; extra /api/auth/me must be 0.
  await page.waitForTimeout(3000);
  const afterSettle = hits.length;
  const extraAfterLoad = afterSettle - afterLoad;

  // Library / Tags regression (new navigations — HelpLauncher may refetch; not the GSC3 load count)
  const meBeforeNav = hits.length;
  await page.getByTestId("resources-hub-tab-library").click();
  await page.waitForURL("**/resource", { timeout: 30_000 });
  await page.waitForSelector('[data-testid="resources-hub"]', { timeout: 30_000 });
  await page.waitForTimeout(600);
  const libraryOk = await page.getByTestId("resources-hub").isVisible();
  const memberLibraryShot = await shot(page, "member-resource-library.png");
  const sessionsOnLibrary = await page
    .getByTestId("resources-hub-tab-sessions")
    .isVisible();

  await page.getByTestId("resources-hub-tab-tags").click();
  await page.waitForTimeout(1000);
  const tagsOk = await page.getByTestId("resources-tags").isVisible();
  const memberTagsShot = await shot(page, "member-resource-tags.png");

  await page.getByTestId("resources-hub-tab-sessions").click();
  await page.waitForURL("**/resource/sessions", { timeout: 30_000 });
  await page.waitForSelector('[data-testid="sessions-map-stub"]', {
    timeout: 30_000,
  });
  const backAria = await page
    .getByTestId("resources-hub-tab-sessions")
    .getAttribute("aria-current");

  const rec = {
    url: page.url(),
    title,
    labsHeader: await header.isVisible(),
    stubText,
    ariaCurrent,
    backAria,
    pillBox: box,
    hitHeightPx: box?.height ?? null,
    hitWidthPx: box?.width ?? null,
    focusedTestId: focused,
    focusOutline: outline,
    meOnLoad: afterLoad,
    extraMeAfterSettle: extraAfterLoad,
    meHitsOnLoad: hits.filter((h) => h.t - t0 < 4000),
    meBeforeNav,
    meTotal: hits.length,
    libraryOk,
    tagsOk,
    sessionsOnLibrary,
    screenshots: {
      memberSessionsShot,
      memberFocusShot,
      memberLibraryShot,
      memberTagsShot,
    },
  };

  await ctx.close();
  return rec;
}

const browser = await chromium.launch({ headless: true });
await mkdir(OUT, { recursive: true });
const result = { machine: "Ernies-MacBook-Pro.local", base: BASE, at: new Date().toISOString() };
try {
  result.anon = await walkAnon(browser);
  result.member = await waitMemberSafe(browser);
} finally {
  await browser.close();
}

async function waitMemberSafe(browser) {
  return walkMember(browser);
}

const outFile = path.join(OUT, "walk.json");
await writeFile(outFile, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
console.log("wrote", outFile);
