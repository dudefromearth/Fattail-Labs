/**
 * Headless Advanced Fly against live OPF chain ladder (no UI).
 *
 *   COOKIE='ft_session=...' npx --yes tsx lib/options-lab/templates/advancedFly.opf.live.proof.ts
 */

import fs from "fs";
import {
  FlySurfacePipeline,
  chainContextFromLadderRows,
} from "./flySurfacePipeline";
import { heatmapFlyWidths } from "./symFly";

function cookieFromJar(path: string): string {
  if (process.env.COOKIE) return process.env.COOKIE;
  if (!fs.existsSync(path)) return "";
  const jar = fs.readFileSync(path, "utf8");
  for (const line of jar.split("\n")) {
    if (line.startsWith("#") || !line.trim()) continue;
    const p = line.split("\t");
    if (p.length >= 7 && p[5] === "ft_session" && p[6]) {
      return `ft_session=${p[6].trim()}`;
    }
  }
  return "";
}

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

async function fetchLadder(
  base: string,
  headers: Record<string, string>,
  symbol: string,
  expiration: string,
  wings: number,
) {
  const r = await fetch(
    `${base}/api/me/market/chain-ladder?symbol=${symbol}&expiration=${expiration}&wings=${wings}`,
    { headers },
  );
  assert(r.ok, `ladder HTTP ${r.status}`);
  return r.json() as Promise<{
    rows?: Array<{
      strike: number;
      side?: string;
      mid?: number | null;
      is_spot?: boolean;
    }>;
    spot?: number;
    strike_step?: number;
    as_of?: string;
    content_hash?: string;
    dual_side?: boolean;
  }>;
}

async function main() {
  const cookie = cookieFromJar("/tmp/labs-dev.jar");
  assert(cookie, "dev session cookie required (COOKIE= or /tmp/labs-dev.jar)");
  const headers = { Cookie: cookie };
  const base = process.env.LABS_ORIGIN || "http://localhost:3000";

  const expR = await fetch(
    `${base}/api/me/market/chain-ladder/expirations?symbol=SPX&limit=10&max_dte=14`,
    { headers },
  );
  assert(expR.ok, `expirations HTTP ${expR.status}`);
  const expJ = (await expR.json()) as {
    expirations?: string[];
    default_expiration?: string;
    session_open?: boolean;
  };
  const front = expJ.default_expiration || expJ.expirations?.[0] || "";
  assert(front, "front expiration");

  const wings = 50;
  const lad1 = await fetchLadder(base, headers, "SPX", front, wings);
  assert((lad1.rows?.length || 0) > 20, "ladder rows");

  const widths = heatmapFlyWidths(lad1.strike_step ?? 5, 7);
  const pipe = new FlySurfacePipeline();

  const ctx1 = chainContextFromLadderRows(
    "SPX",
    front,
    "call",
    lad1.rows || [],
    {
      spot: lad1.spot,
      strike_step: lad1.strike_step,
      wings,
      as_of: lad1.as_of,
      content_hash: lad1.content_hash || "gen1",
    },
  );
  const t0 = Date.now();
  const r1 = pipe.ingest(ctx1, "debit", widths, { receivedAt: t0 });
  console.log("gen1 debit", {
    front,
    session_open: expJ.session_open,
    rows: r1.rows.length,
    cols: r1.cols.length,
    stats: r1.stats,
  });
  assert(r1.stats.debitValid > 0, "gen1 has valid debits from OPF chain");

  await new Promise((r) => setTimeout(r, 800));
  const lad2 = await fetchLadder(base, headers, "SPX", front, wings);
  const ctx2 = chainContextFromLadderRows(
    "SPX",
    front,
    "call",
    lad2.rows || [],
    {
      spot: lad2.spot,
      strike_step: lad2.strike_step,
      wings,
      as_of: lad2.as_of,
      content_hash:
        lad2.content_hash && lad2.content_hash !== lad1.content_hash
          ? lad2.content_hash
          : `${lad1.content_hash || "g"}-t2`,
    },
  );
  const r2d = pipe.ingest(ctx2, "d_debit", widths, { receivedAt: t0 + 800 });
  const r2v = pipe.ingest(ctx2, "velocity", widths, { receivedAt: t0 + 800 });
  console.log("gen2", {
    d_debit: r2d.stats,
    velocity: r2v.stats,
    sampleVel: r2v.cells[Math.floor(r2v.rows.length / 2)]?.[0],
    sampleDD: r2d.cells[Math.floor(r2d.rows.length / 2)]?.[0],
  });

  assert(r2d.stats.historySize >= 1, "history after gen2");
  console.log("ok  advancedFly OPF chain pipeline proof");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
