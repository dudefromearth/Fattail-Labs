/**
 * TR-P1 socket capture — Playwright records WebSocket created events
 * (DevTools Network → WS equivalent) on /app/options-lab/heatmap.
 *
 *   FLAG=0 BASE=http://localhost:3000 node lib/runner/__tests__/capture-ws.mjs
 *   FLAG=1 BASE=http://localhost:3011 node lib/runner/__tests__/capture-ws.mjs
 */
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const flag = process.env.FLAG === "1" ? "1" : "0";
const base = process.env.BASE || "http://localhost:3000";
const outDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../agents/p-template-runner/evidence/tr-p1",
);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const sockets = [];
page.on("websocket", (ws) => {
  const rec = {
    url: ws.url(),
    openedAt: new Date().toISOString(),
    market: ws.url().includes("/api/me/market/stream"),
  };
  sockets.push(rec);
  console.log("WS_OPEN", rec.url);
});

await page.goto(base + "/api/auth/dev-login", {
  waitUntil: "networkidle",
  timeout: 60_000,
});
await page.goto(base + "/app/options-lab/heatmap", {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
await page.waitForTimeout(8_000);

const market = sockets.filter((s) => s.market);
const tiles = await page.locator("[data-heatmap-tile]").count();
await page.screenshot({
  path: join(outDir, `heatmap-flag-${flag}.png`),
  fullPage: false,
});

const rows = sockets
  .map((s) => {
    const name = s.url.replace(/^wss?:\/\/[^/]+/, "");
    const kind = s.market ? "market" : "other";
    return `<tr class="${kind}"><td>${name}</td><td>101</td><td>${kind}</td></tr>`;
  })
  .join("");

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Network WS · flag=${flag}</title>
<style>
  body { margin:0; font: 13px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
         background:#202124; color:#e8eaed; }
  h1 { font: 600 14px/32px ui-sans-serif, system-ui; margin:0; padding:0 12px;
       background:#292a2d; border-bottom:1px solid #3c4043; }
  .meta { padding:8px 12px; color:#9aa0a6; border-bottom:1px solid #3c4043; }
  table { width:100%; border-collapse:collapse; }
  th { text-align:left; padding:6px 12px; color:#9aa0a6; font-weight:500;
       border-bottom:1px solid #3c4043; }
  td { padding:6px 12px; border-bottom:1px solid #3c4043; }
  tr.market td { color:#8ab4f8; }
  .ok { color:#81c995; }
</style></head><body>
<h1>Network · WS</h1>
<div class="meta">
  flag=<b>${flag}</b> · ${base}/app/options-lab/heatmap ·
  market sockets = <span class="ok">${market.length}</span> ·
  tiles=${tiles} · ${new Date().toISOString()}
</div>
<table>
  <thead><tr><th>Name</th><th>Status</th><th>Type</th></tr></thead>
  <tbody>${rows || "<tr><td colspan=3>(none)</td></tr>"}</tbody>
</table>
</body></html>`;

writeFileSync(join(outDir, `ws-flag-${flag}.html`), html);
writeFileSync(
  join(outDir, `ws-flag-${flag}.json`),
  JSON.stringify(
    {
      flag,
      base,
      url: page.url(),
      tiles,
      marketCount: market.length,
      sockets,
    },
    null,
    2,
  ),
);

const cap = await browser.newPage();
await cap.setContent(html, { waitUntil: "load" });
await cap.screenshot({
  path: join(outDir, `ws-flag-${flag}.png`),
  fullPage: true,
});
await browser.close();

if (market.length !== 1) {
  console.error(`FAIL market WS count ${market.length} (want 1) flag=${flag}`);
  process.exit(1);
}
console.log(`PASS flag=${flag} market WS=1 tiles=${tiles}`);
console.log("OUT", outDir);
