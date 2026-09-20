"""HTML panels — same tokens as ssr_snapshot_dash PAGE so they transplant."""

PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>GBI ops · VP + chain (interim)</title>
<style>
  :root {
    --bg: #0b0d10;
    --panel: #14181e;
    --line: #262c36;
    --text: #e8edf4;
    --muted: #8b95a5;
    --ok: #3dd68c;
    --bad: #ff6b6b;
    --idle: #8b95a5;
    --warn: #f5c542;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: var(--bg); color: var(--text);
    font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, sans-serif; }
  header { padding: 20px 24px 12px; border-bottom: 1px solid var(--line); }
  h1 { font-size: 18px; font-weight: 620; margin: 0 0 4px; }
  .sub { color: var(--muted); font-size: 12px; }
  main { padding: 16px 24px 40px; display: grid; gap: 16px; }
  .card { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line);
    font-variant-numeric: tabular-nums; }
  th { color: var(--muted); font-size: 11px; text-transform: uppercase; }
  .LIVE, .CURRENT, .UP { color: var(--ok); }
  .STALE, .HELD, .HOLD { color: var(--warn); }
  .DOWN, .GAPPED, .BAD { color: var(--bad); }
  .NO, .UNKNOWN { color: var(--idle); }
  .k { color: var(--muted); font-size: 11px; }
</style>
</head>
<body>
<header>
  <h1>GBI ops — interim (StudioTwo)</h1>
  <div class="sub">RETIRED chrome — live pane is Chain Snapshot http://studioone.local:5055</div>
  <div class="sub" id="asof">as of —</div>
</header>
<main>
  <section class="card" data-panel="chain_feed">
    <h2>1 · chain_feed (CP-1 primacy)</h2>
    <div id="chain">—</div>
  </section>
  <section class="card" data-panel="collectors">
    <h2>2 · collectors</h2>
    <table>
      <thead><tr><th>src</th><th>state</th><th>machine</th><th>pid</th><th>age s</th><th>gaps today</th></tr></thead>
      <tbody id="collectors"></tbody>
    </table>
  </section>
  <section class="card" data-panel="engine">
    <h2>3 · engine</h2>
    <table>
      <thead><tr><th>src</th><th>state</th><th>binned</th><th>floor</th><th>ceiling</th><th>generation</th></tr></thead>
      <tbody id="engine"></tbody>
    </table>
  </section>
  <section class="card" data-panel="api">
    <h2>4 · API</h2>
    <div id="api">—</div>
  </section>
  <section class="card" data-panel="backfill">
    <h2>5 · backfill</h2>
    <div id="backfill">—</div>
  </section>
  <section class="card" data-panel="tonight">
    <h2>6 · tonight's window</h2>
    <div id="tonight">—</div>
  </section>
</main>
<script>
function cls(s) {
  const t = String(s || "");
  if (t.indexOf("NO ") === 0) return "NO";
  if (t.indexOf("NOT ") === 0) return "UNKNOWN";
  return t.split(/[^A-Z]/)[0] || "UNKNOWN";
}
function cell(v) { return v == null || v === "" ? "—" : v; }
async function load() {
  const r = await fetch("/api/status", {cache: "no-store"});
  const d = await r.json();
  document.getElementById("asof").textContent = "as of " + d.as_of + " · " + d.host + " · " + d.store;
  const ch = d.chain_feed || {};
  document.getElementById("chain").innerHTML =
    '<span class="' + cls(ch.state) + '">' + cell(ch.state) + "</span>" +
    " · pid " + cell(ch.pid) + " · freshness " + cell(ch.freshness_s) + "s" +
    "<div class=k>" + cell(ch.last_snapshot) + "</div><div class=k>" + cell(ch.note) + "</div>";
  const tb = document.getElementById("collectors");
  tb.innerHTML = "";
  for (const src of ["SPY","ES","MES"]) {
    const c = (d.collectors || {})[src] || {};
    const tr = document.createElement("tr");
    tr.innerHTML = "<td>" + src + "</td><td class='" + cls(c.state) + "'>" + cell(c.state) +
      "</td><td>" + cell(c.machine) + "</td><td>" + cell(c.pid) + "</td><td>" +
      cell(c.last_print_age_s) + "</td><td>" + cell(c.gaps_today) + "</td>";
    tb.appendChild(tr);
  }
  const eb = document.getElementById("engine");
  eb.innerHTML = "";
  for (const src of ["SPY","ES","MES"]) {
    const e = (d.engine || {})[src] || {};
    const tr = document.createElement("tr");
    tr.innerHTML = "<td>" + src + "</td><td class='" + cls(e.state) + "'>" + cell(e.state) +
      "</td><td>" + cell(e.sessions_binned) + "</td><td>" + cell(e.floor) +
      "</td><td>" + cell(e.ceiling) + "</td><td>" + cell(e.last_generation) + "</td>";
    eb.appendChild(tr);
  }
  const a = d.api || {};
  document.getElementById("api").innerHTML =
    '<span class="' + cls(a.state) + '">' + cell(a.state) + "</span> · " +
    cell(a.contract) + " · " + cell(a.base) +
    "<div class=k>coverage ES " + cell((a.coverage||{}).ES && a.coverage.ES.floor_session) +
    " · MES " + cell((a.coverage||{}).MES && a.coverage.MES.floor_session) +
    " · SPY " + cell((a.coverage||{}).SPY && a.coverage.SPY.floor_session) + "</div>";
  const b = d.backfill || {};
  document.getElementById("backfill").innerHTML =
    '<span class="' + cls(b.state) + '">' + cell(b.state) + "</span> · " +
    cell(b.tranche) + " · integrity " + cell(b.integrity);
  const t = d.tonight || {};
  document.getElementById("tonight").innerHTML =
    "VPS1-G RTH: " + cell(t.vps1_g_rth) + "<br>VPS2 ACT 3: " + cell(t.vps2_act3) +
    "<br>VPSB ACT B: " + cell(t.vpsb_act_b) + "<br>tranche 1: " + cell(t.tranche_1);
}
load();
setInterval(load, 5000);
</script>
</body>
</html>
"""
