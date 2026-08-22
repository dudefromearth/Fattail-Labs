/**
 * Real-bus hash pair — not fixture replay.
 *   npx --yes tsx lib/runner/__tests__/live-hash.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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
const SYMBOLS = ["SPX", "TSLA", "SPY"];

async function login(): Promise<string> {
  const r = await fetch(API + "/api/auth/dev-login", { redirect: "manual" });
  const set = r.headers.getSetCookie?.() || [];
  return set.map((c) => c.split(";")[0]).join("; ");
}

function ctxFromLadder(symbol: string, ladder: {
  rows?: LadderRow[];
  spot?: number;
  strike_step?: number;
  wings?: number;
  as_of?: string;
  content_hash?: string;
}): ChainContext {
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

async function main() {
const cookie = await login();
const expRes = await fetch(
  `${API}/api/me/market/chain-ladder/expirations?symbol=SPX`,
  { headers: { cookie } },
);
const expJson = (await expRes.json()) as {
  default_expiration?: string;
  contracts?: { expiration: string }[];
};
const exp =
  expJson.default_expiration ||
  expJson.contracts?.[0]?.expiration;
if (!exp) {
  console.error("no expiration", expJson);
  process.exit(1);
}

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
  const hash = body.content_hash || ladder.content_hash || "";
  const ctx = ctxFromLadder(symbol, { ...ladder, content_hash: hash });
  const current = paintCurrentHeatmap(ctx);
  const tpl = get(HEATMAP_TEMPLATE_ID, HEATMAP_TEMPLATE_VERSION);
  const through = run(tpl, { chain: ctx, content_hash: hash }, {});
  const hc = tilesHash(current);
  const hr = tilesHash(through);
  const equal = hc === hr;
  rows.push({
    symbol,
    expiration: exp,
    content_hash: hash,
    tilesHash_flag0_pipeline: hc,
    tilesHash_through_run: hr,
    equal,
    source: "live HTTP chain-ladder",
  });
  console.log(equal ? "ok " : "FAIL ", symbol, hash, hc, hr);
}

const outDir = join(
  import.meta.dirname,
  "../../../../agents/p-template-runner/evidence/tr-p3",
);
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "live-hash-pairs.json"),
  JSON.stringify({ captured_at: new Date().toISOString(), rows }, null, 2) + "\n",
);
if (rows.some((r) => !r.equal)) process.exit(1);
console.log("wrote live-hash-pairs.json");
}

void main();
