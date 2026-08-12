/**
 * Live OPF proof: Lab butterfly create seed places on dual-side ladder + package.
 *
 *   COOKIE='ft_session=...' npx --yes tsx lib/options-lab/butterflyDefault.live.proof.ts
 *   or uses /tmp/labs-dev.jar netscape cookie file from prior dev-login.
 */

import fs from "fs";
import { buildListedStructure } from "./listedStructure";
import { snapToListed, uniqueListedStrikes } from "./listedStrikes";
import { packageEconomics } from "./packageEconomics";
import { resolveCreateSeed } from "./builderCreateDefault";

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => {
    store.set(k, String(v));
  },
  removeItem: (k) => {
    store.delete(k);
  },
  clear: () => store.clear(),
  key: () => null,
  get length() {
    return store.size;
  },
};

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

async function main() {
  const cookie = cookieFromJar("/tmp/labs-dev.jar");
  assert(cookie, "dev session cookie required");
  const headers = { Cookie: cookie };

  const expR = await fetch(
    "http://localhost:3000/api/me/market/chain-ladder/expirations?symbol=SPX&limit=10&max_dte=10",
    { headers },
  );
  assert(expR.ok, `expirations HTTP ${expR.status}`);
  const expJ = (await expR.json()) as {
    expirations?: string[];
    default_expiration?: string;
    session_open?: boolean;
    as_of_day?: string;
  };
  const exps = expJ.expirations || [];
  assert(exps.length > 0, "OPF expirations present");

  const today = expJ.as_of_day || "";
  const marketLive = !!expJ.session_open;
  // Match Builder pickDefaultFrontExpiration: today if live+listed, else next
  let front = expJ.default_expiration || exps[0];
  if (marketLive && today && exps.includes(today)) front = today;
  else if (today) {
    const after = exps.filter((e) => e > today);
    if (after.length) front = after[0];
  }

  // wings=100 only (not 250 — that 422s and empties Create dialog)
  const ladR = await fetch(
    `http://localhost:3000/api/me/market/chain-ladder?symbol=SPX&expiration=${front}&wings=100`,
    { headers },
  );
  assert(ladR.ok, `ladder HTTP ${ladR.status}`);
  const ladJ = (await ladR.json()) as {
    mode?: string;
    ladder?: {
      rows?: Array<{
        strike: number;
        side?: string;
        mid?: number | null;
        bid?: number | null;
        ask?: number | null;
      }>;
      spot?: number;
      spot_strike?: number;
    };
  };
  const lad = ladJ.ladder || {};
  const rows = lad.rows || [];
  assert(rows.length > 0, "ladder rows");
  const listed = uniqueListedStrikes(rows.map((r) => r.strike));
  const spot = lad.spot;
  assert(spot != null && spot > 0, "OPF spot");

  const seed = resolveCreateSeed("SPX");
  assert(seed.template === "butterfly", "Lab seed butterfly");
  assert(seed.direction === "buy", "buy");
  assert(seed.optionSide === "call", "call");
  assert(seed.wingWidth === 20, "wing 20");

  const atm = snapToListed(Number(spot), listed);
  assert(atm != null, "ATM listed");
  const built = buildListedStructure({
    template: seed.template,
    listed,
    preferCenter: atm! + seed.centerOffsetPts,
    preferWidth: seed.wingWidth,
    optionSide: seed.optionSide,
  });
  assert(built != null, "structure on OPF listed grid");
  assert(built!.legs.length === 3, "3 legs");
  assert(built!.body === atm, "body at ATM");

  const eco = packageEconomics(
    {
      underlying: "SPX",
      expiration: front,
      contracts: 1,
      direction: "buy",
      legs: built!.legs.map((l) => ({ ...l, entry_price: 0 })),
      net_debit_override: null,
    },
    (_exp, strike, type) => {
      const row = rows.find(
        (r) =>
          Math.abs(Number(r.strike) - strike) < 1e-6 &&
          (r.side || "call").toLowerCase() === type,
      );
      if (!row) return undefined;
      return {
        mid: row.mid ?? null,
        bid: row.bid ?? null,
        ask: row.ask ?? null,
      };
    },
  );
  assert(eco.complete, `package complete missing=${eco.missingMids}`);
  assert(eco.absMid != null && eco.absMid > 0, "live package magnitude");
  assert(eco.side === "DEBIT" || eco.side === "CREDIT", "side named");

  console.log("LIVE OPF butterfly Create default");
  console.log("  front", front, "session_open", marketLive);
  console.log("  spot", spot, "atm", atm, "width", built!.width);
  console.log(
    "  legs",
    built!.legs.map((l) => `${l.side} ${l.quantity} ${l.type} ${l.strike}`),
  );
  console.log("  package", {
    side: eco.side,
    absMid: Number(eco.absMid!.toFixed(4)),
    complete: eco.complete,
  });
  console.log("\nPASS — auto-filled Lab butterfly is OPF-live");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
