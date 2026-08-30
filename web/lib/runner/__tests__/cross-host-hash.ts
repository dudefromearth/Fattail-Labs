/**
 * Cross-host live hash pairs: Options Lab flag-1 vs /app/iki/runner.
 * Proof: both hosts paint the same bus content_hash (SPX / TSLA / SPY).
 *
 *   npx --yes tsx lib/runner/__tests__/cross-host-hash.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "@playwright/test";
import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import type { ChainContext } from "@/lib/options-lab/templates/types";
import { get, tilesHash } from "../registry";
import { run } from "../run";
import {
  HEATMAP_TEMPLATE_ID,
  HEATMAP_TEMPLATE_VERSION,
  paintCurrentHeatmap,
} from "../templates/heatmap";

const API = process.env.LABS_API || "http://127.0.0.1:4000";
const WEB = process.env.LABS_WEB_BASE_URL || "http://localhost:3000";
const SYMBOLS = ["SPX", "TSLA", "SPY"];

async function loginCookie(): Promise<string> {
  const r = await fetch(API + "/api/auth/dev-login", { redirect: "manual" });
  const set = r.headers.getSetCookie?.() || [];
  return set.map((c) => c.split(";")[0]).join("; ");
}

function ctxFromLadder(
  symbol: string,
  ladder: {
    rows?: LadderRow[];
    spot?: number;
    strike_step?: number;
    wings?: number;
    as_of?: string;
    content_hash?: string;
  },
): ChainContext {
  const contracts = new Map<string, LadderRow>();
  for (const row of ladder.rows || []) {
    contracts.set(contractKey(row.side, Number(row.strike)), row);
  }
  return {
    symbol,
    viewSide: "call",
    spot: ladder.spot ?? null,
    strikeStep: ladder.strike_step ?? null,
    wings: ladder.wings ?? 25,
    contracts,
    asOf: ladder.as_of ?? null,
    contentHash: ladder.content_hash ?? null,
  };
}

function attachHashCollector(page: Page): Set<string> {
  const hashes = new Set<string>();
  page.on("websocket", (ws) => {
    if (!ws.url().includes("/api/me/market/stream")) return;
    ws.on("framereceived", (ev) => {
      try {
        const j = JSON.parse(String(ev.payload));
        if (j?.t === "chain" && j.content_hash) {
          hashes.add(String(j.content_hash));
        }
      } catch {
        /* ignore */
      }
    });
  });
  return hashes;
}

async function hostAttr(page: Page, name: string): Promise<string> {
  return page
    .locator('[data-testid="runner-shell-host"]')
    .first()
    .getAttribute(name)
    .then((v) => v || "");
}

async function waitMatchedPair(
  olPage: Page,
  ikiPage: Page,
  symbol: string,
  timeoutMs = 30_000,
): Promise<{
  hash: string;
  ol: string;
  iki: string;
  olSymbol: string;
  ikiSymbol: string;
}> {
  const t0 = Date.now();
  let ol = "";
  let iki = "";
  let olSymbol = "";
  let ikiSymbol = "";
  while (Date.now() - t0 < timeoutMs) {
    [ol, iki, olSymbol, ikiSymbol] = await Promise.all([
      hostAttr(olPage, "data-content-hash"),
      hostAttr(ikiPage, "data-content-hash"),
      hostAttr(olPage, "data-symbol"),
      hostAttr(ikiPage, "data-symbol"),
    ]);
    if (
      ol &&
      iki &&
      ol === iki &&
      olSymbol === symbol &&
      ikiSymbol === symbol
    ) {
      return { hash: ol, ol, iki, olSymbol, ikiSymbol };
    }
    await olPage.waitForTimeout(250);
  }
  return { hash: "", ol, iki, olSymbol, ikiSymbol };
}

async function main() {
  const cookie = await loginCookie();
  const expRes = await fetch(
    `${API}/api/me/market/chain-ladder/expirations?symbol=SPX`,
    { headers: { cookie } },
  );
  const expJson = (await expRes.json()) as {
    default_expiration?: string;
    contracts?: { expiration: string }[];
  };
  const exp =
    expJson.default_expiration || expJson.contracts?.[0]?.expiration;
  if (!exp) {
    console.error("no expiration", expJson);
    process.exit(1);
  }

  const cookieParts = cookie.split("; ").map((c) => {
    const i = c.indexOf("=");
    return { name: c.slice(0, i), value: c.slice(i + 1) };
  });

  const rows: Record<string, unknown>[] = [];
  for (const symbol of SYMBOLS) {
    const url = `${API}/api/me/market/chain-ladder?symbol=${symbol}&expiration=${exp}&side=call&wings=25`;
    const r = await fetch(url, { headers: { cookie } });
    const body = (await r.json()) as {
      content_hash?: string;
      ladder?: Record<string, unknown>;
    };
    const ladder = (body.ladder || body) as {
      rows?: LadderRow[];
      spot?: number;
      strike_step?: number;
      wings?: number;
      as_of?: string;
      content_hash?: string;
    };
    const httpHash = body.content_hash || ladder.content_hash || "";
    const ctx = ctxFromLadder(symbol, { ...ladder, content_hash: httpHash });
    const pipeline = tilesHash(paintCurrentHeatmap(ctx));
    const through = tilesHash(
      run(get(HEATMAP_TEMPLATE_ID, HEATMAP_TEMPLATE_VERSION), {
        chain: ctx,
        content_hash: httpHash,
      }, {}),
    );

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    await context.addCookies(
      cookieParts.map((c) => ({
        name: c.name,
        value: c.value,
        url: WEB,
      })),
    );
    const olPage = await context.newPage();
    const ikiPage = await context.newPage();
    const olWs = attachHashCollector(olPage);
    const ikiWs = attachHashCollector(ikiPage);
    await Promise.all([
      olPage.goto(`${WEB}/app/options-lab/heatmap?symbol=${symbol}`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      }),
      ikiPage.goto(`${WEB}/app/iki/runner?symbol=${symbol}`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      }),
    ]);
    await Promise.all([
      olPage.waitForSelector('[data-testid="runner-shell-host"]', {
        timeout: 30_000,
      }),
      ikiPage.waitForSelector('[data-testid="runner-shell-host"]', {
        timeout: 30_000,
      }),
    ]);
    const pair = await waitMatchedPair(olPage, ikiPage, symbol);
    const olTiles = await olPage.locator("[data-heatmap-tile]").count();
    const ikiTiles = await ikiPage.locator("[data-heatmap-tile]").count();
    const olPanel = await olPage
      .getByTestId("options-lab-heatmap-panel")
      .count();
    const ikiPanel = await ikiPage
      .getByTestId("options-lab-heatmap-panel")
      .count();
    await browser.close();

    const wsIntersect = [...olWs].filter((h) => ikiWs.has(h));
    const sameHash =
      !!pair.hash && pair.olSymbol === symbol && pair.ikiSymbol === symbol;
    const sameTiles = pipeline === through;
    rows.push({
      symbol,
      expiration: exp,
      http_content_hash: httpHash,
      paired_content_hash: pair.hash,
      tilesHash_pipeline: pipeline,
      tilesHash_through_run: through,
      options_lab_host_content_hash: pair.ol,
      iki_runner_host_content_hash: pair.iki,
      options_lab_symbol: pair.olSymbol,
      iki_runner_symbol: pair.ikiSymbol,
      options_lab_ws_hashes: [...olWs],
      iki_runner_ws_hashes: [...ikiWs],
      ws_hash_intersection: wsIntersect,
      options_lab_tiles: olTiles,
      iki_runner_tiles: ikiTiles,
      options_lab_panel: olPanel,
      iki_runner_panel: ikiPanel,
      same_content_hash: sameHash,
      same_tilesHash: sameTiles,
    });
    console.log(
      sameHash && sameTiles ? "ok " : "FAIL ",
      symbol,
      "pair",
      pair.hash,
      "OL",
      pair.ol,
      olTiles,
      "IKI",
      pair.iki,
      ikiTiles,
      "ws∩",
      wsIntersect.length,
    );
  }

  const outDir = join(
    import.meta.dirname,
    "../../../../agents/p-iki-lab/evidence",
  );
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "cross-host-hash-pairs.json"),
    JSON.stringify({ captured_at: new Date().toISOString(), rows }, null, 2) +
      "\n",
  );
  if (rows.some((r) => !r.same_content_hash || !r.same_tilesHash)) {
    process.exit(1);
  }
  console.log("wrote cross-host-hash-pairs.json");
}

void main();
