# FatTail Labs — Market Data Provider Plugins Spec v0.1

**Status:** DRAFT for review (India Gate 1). Not law until Coach approves and Lima logs it.
**Date:** 2026-10-05
**Author:** Claude (advisor) from Coach's stated intent, 2026-10-05
**Parents:** OPF Spec v0.2.1 · OPF Generation Plane Spec v0.2.2 · Market Bus Spec v1.0.1 · Arch/28 · Arch/30
**Supersedes:** `FatTail-Labs-Databento-FOP-Provider-Spec-v0_4.md` (and v0.1–v0.3 of that line). That line built Databento into the market-data layer. Coach ruled that providers must be **plugins**, so the program is re-founded here as a plugin framework with Databento as its first plugin. Everything the v0.4 line established about Databento (discovery evidence, licence limits, FOP resolution, StudioTwo-only consumption) carries into §5 unchanged in substance.

| Area | Databento FOP v0.4 | This spec v0.1 |
|---|---|---|
| Shape | one Databento collector inside `server/market_data/` | **plugin host + SDK + registry + gateway**; Databento is plugin #1 |
| Core coupling | `ChainSource` seam wrapped Massive's `chain_feed` | **core untouched.** Massive and every core service carry zero plugin code |
| Adding a provider | new spec + new collector | new plugin directory + manifest + conformance kit + registry rows |
| Symbol → provider | hard-wired | `provider_routes` table (data); several plugins may serve the same symbol class |
| Licence | Databento laws DB-L1…L7 | licence is a **manifest property** enforced by the host; Databento's terms are its manifest (§5.2) |
| Proof of pluggability | — | a second, synthetic **fixture plugin** must swap in for Databento by data change alone (AT-PP4) |

---

## 0. Coach's intent (verbatim, 2026-10-05; do not edit)

1. "I have a new Data Provider called Databento. I need to design the backend to feed the OPF as an alternative data provider for Massive."
2. "Databento will become the backup for Massive and the supplier of unique symbols that Massive cannot provide."
3. "Build the collector first on StudioTwo, then deploy it on StudioOne."
4. "My subscription is the CME Globex MDP3.0."
5. "Databento will start by covering the thing that Massive can not cover, options on futures."
6. "Then we will see if Databento can be a plugin replacement for Massive with other symbols. That is what we are building in that order."
7. "I want the ability to add the following options on futures: ES, CL. GC" … "Oh, and MES"
8. Backup mode chosen: hot standby. *(Suspended by items 9–10 until a commercial licence exists.)*
9. "The current license that I ahve is a personal license, to the data can only be used on my dev platform and is limited to two devides"
10. "I will use it as a demonstration, and if I can get enough customers, then I will get the full commercial license" · Commercial licence: "Not planned" (today).
11. Licensed devices: "StudeoTwo and StudioOne"
12. "The application side of things will limit the data provided by databento to StudioTwo"
13. "So, in other words we will limit the commerical use of the symbols that come from Databento to StudioTwo"
14. **"I don't want this provider to be integral to operations, I want them to be like a plugin, wherer I could plugin other providers for similar symbols"**

---

## 1. What "plugin" means here

A provider plugin is a **self-contained, removable unit** that turns one vendor's feed into FatTail's normalized chain generations for the symbol classes it declares. The platform knows plugins only through a **contract** (SDK + manifest), a **registry** (data), and a **gateway** (one read door). It never knows a vendor's name.

Three tests define success:

1. **Remove it:** delete or disable any plugin and every core service, test, and production app is unaffected.
2. **Swap it:** route a symbol class from plugin A to plugin B with a data change; consumers see B's data with no code change and no deploy.
3. **Add one:** a new vendor for "similar symbols" is a new plugin directory that passes the conformance kit, plus registry rows. No core change.

---

## 2. Laws — plugin framework

| ID | Law |
|---|---|
| **PP-1 — Not integral** | Core (OPF, the Massive feeds, SPX/XSP capture, the production :5055 plane, every member app) has **zero code, config or runtime dependency** on any plugin. Core never imports plugin code, never names a vendor, and never reads a plugin keyspace. Removing the plugins directory leaves the core suite green and every core service running. |
| **PP-2 — The contract is the SDK** | A small `provider_sdk` package is the only code shared between plugins and the platform: manifest schema, normalized row and generation types, health model, keyspace helper, host guard, conformance kit. Plugins import the SDK and their vendor client; nothing else from Labs. |
| **PP-3 — Manifest** | Every plugin ships a manifest declaring: `id`, `vendor`, `version`, `symbol_classes` (e.g. `fop:ES`, `fop:CL`), `capabilities` (`quotes`, `trades`, `book_depth`, `definitions`, `open_interest`, `settlements`, `greeks` — each true/false), `required_config` (key names only), and `licence` {`scope`, `licensed_hosts`, `consumer_hosts`, `display`, `commercial`}. A manifest that fails schema validation is refused at install. |
| **PP-4 — Out of process** | Each plugin runs as **its own supervised process** (one launchd job per plugin) with its own Redis instance or DB index and its own port. A plugin crash, hang, memory leak or vendor outage never touches a core process (CP-1). |
| **PP-5 — One normalized output** | Plugins emit the existing ladder row shape (`chain_ladder.LADDER_FIELDS` + `strike, side, expiration, ticker, mid_source, last_updated`) and the existing generation shape, plus required provenance: `plugin_id`, `plugin_version`, `vendor`, `dataset`, `symbol_class`, `exercise_style`, `multiplier`, `expiry_ts`, `underlying_symbol`. A generation missing provenance is rejected. |
| **PP-6 — Namespaced keys** | Plugin keys are `plug:{plugin_id}:ladder:{symbol_class}:{exp}:listed:dual` (+ `plug:{plugin_id}:pub`, `plug:{plugin_id}:health`). A plugin may never write `mb:*` or another plugin's namespace. |
| **PP-7 — Registry is data** | Two tables: `provider_plugins` (id, version, host, installed, enabled) and `provider_routes` (symbol_class → plugin_id, priority, enabled). Several plugins may register for the same symbol class; the gateway serves the highest-priority **healthy, enabled** route. Routes may only exist for enabled `market_symbol_universe` rows (MB6). Changing provider = changing rows. |
| **PP-8 — One read door** | Consumers read plugin data only through the **Plugin Gateway**, a read-only API on the data host, on its own port, separate from :5055. Consumers ask for a symbol class, never for a plugin or vendor. Responses carry the provenance of PP-5 so the consumer can show where data came from. |
| **PP-9 — Licence is enforced by the host, not trusted to the plugin** | The plugin host refuses to start a plugin on a host not in its `licensed_hosts`. The gateway refuses callers not in the routed plugin's `consumer_hosts`, and a failover route may not hand a caller data from a plugin that caller is not licensed for. `display: "none"` plugins never appear with prices on any shared surface. |
| **PP-10 — Capability honesty** | A capability a plugin does not declare is returned as `not_supported`, never as zeros or a silent gap. Missing values inside a supported capability are `null`, never `0`. |
| **PP-11 — Greeks have one owner** | Plugins never compute greeks unless their vendor supplies them (`capabilities.greeks = true`). Filling greeks for plugins without them is OD-PP2 and, if done, lives in exactly one OPF module. A second IV cascade is a violation (OPF Reference §10 rule 8). |
| **PP-12 — Lifecycle** | Install, enable, disable and uninstall are registry operations plus the plugin's launchd job, documented as a runbook. Disable stops the process; the gateway answers `disabled` for its routes. Every state is visible on the ops dashboard. |
| **PP-13 — Conformance before enable** | Every plugin must pass the SDK conformance kit (synthetic fixtures; no vendor data) before `enabled` can be set. The kit covers PP-3, PP-5, PP-6, PP-10, health states and the host guard. |
| **PP-14 — Fail loud** | Missing plugin config, an invalid manifest, Redis down, a vendor error or a stale stream produce explicit `broken` / `stale` / `disabled` / `not_configured` states on health, gateway and dashboard. Never an empty board that looks like a quiet market (GP15). |
| **PP-15 — Placement** | The plugin host, plugins and gateway are data services: built and proven on StudioTwo, then run on **StudioOne** (TOPO-1), installed only after the RTH close, kill-tested, with a rollback script (CP-1). Each plugin's own licence may narrow this (§5.2). |
| **PP-16 — Visible first** | "If I can't see it, it does not exist." The first build delivers a screen: **Plugins** view (installed / enabled / health / routes) and a ladder view per symbol class, before any consumer wiring. Coach approves the mockup before the build. |
| **PP-17 — No secrets or vendor data in git** | Vendor keys live only in `.env` (gitignored), named `PLUGIN_{ID}_*`. No vendor data, DBN files or real-price fixtures in the repo. |
| **PP-18 — Massive stays core (for now)** | Massive is **not** converted to a plugin in this program. Whether Massive later becomes a plugin, and whether any plugin may back up core symbols, is Phase B (§7), gated per plugin by its licence. |

---

## 3. Architecture

```text
                       ┌──────────── core (untouched by this program) ────────────┐
                       │ Massive feeds → mb:* Redis → OPF :5055 → MiniTwo / members │
                       └────────────────────────────────────────────────────────────┘
                                       ▲  no imports, no keys, no config either way (PP-1)

  plugins/<id>/  (manifest + entrypoint, imports provider_sdk only)
        │  one launchd job per plugin, own Redis DB, own port (PP-4)
        ▼
  plug:{id}:ladder:{symbol_class}:{exp}:listed:dual  + plug:{id}:pub + plug:{id}:health   (PP-6)
        │
        ▼
  Plugin host  ── registry: provider_plugins, provider_routes (PP-7) ── host guard (PP-9)
        │
        ▼
  Plugin Gateway (read-only, own port, NOT :5055) ── route → plugin, licence check per caller (PP-8/9)
        │
        ├──► consumer apps (only on hosts the routed plugin licenses)
        └──► ops dashboard: Plugins view = state only for display-restricted plugins (PP-12/16)
```

**Where the plugin code lives** is OD-PP1. Either way, an import-lint check makes PP-1 and PP-2 mechanical.

---

## 4. The fixture plugin (proof of pluggability)

A synthetic plugin `fixture` ships with the SDK. It generates deterministic, obviously fake chains for any declared symbol class (e.g. `fop:ES`), with a manifest that licenses every dev host and carries no vendor data. It exists to prove PP-1, PP-7 and PP-13 without a vendor:

- the conformance kit runs against it in CI;
- AT-PP4 swaps `fop:ES` from `databento` to `fixture` by changing one `provider_routes` row and shows the consumer screen change with no deploy;
- it is never routed in production.

---

## 5. Plugin #1 — Databento (CME Globex MDP 3.0, options on futures)

### 5.1 Manifest (normative content)

```toml
id        = "databento"
vendor    = "Databento"
version   = "0.1.0"
dataset   = "GLBX.MDP3"
symbol_classes = ["fop:ES", "fop:MES", "fop:CL", "fop:GC"]   # roots are data (DBX-2)

[capabilities]
quotes = true
trades = true
book_depth = true          # available; not collected in Phase A (OD-PP5)
definitions = true
open_interest = true
settlements = true
greeks = false

[licence]
scope           = "personal_dev"
commercial      = false
licensed_hosts  = ["studiotwo", "studioone"]   # Coach, 2026-10-05
consumer_hosts  = ["studiotwo"]                # Coach, 2026-10-05
display         = "studiotwo_only"

required_config = ["PLUGIN_DATABENTO_API_KEY", "PLUGIN_DATABENTO_MAX_DTE",
                   "PLUGIN_DATABENTO_SNAPSHOT_S", "PLUGIN_DATABENTO_STALE_MS",
                   "PLUGIN_DATABENTO_ARCHIVE_DIR"]
```

**Config note:** the key is already in `~/Fattail-Labs/.env` on StudioTwo as `DATABENTO_API_KEY`. P3 renames it to `PLUGIN_DATABENTO_API_KEY` (PP-17).

### 5.2 Licence laws (Databento-specific; enforced through PP-9)

| ID | Law |
|---|---|
| **DBX-L1 — Dev only** | Databento data and anything derived from it exist only on StudioTwo and StudioOne, for dev and demonstration. |
| **DBX-L2 — Never production** | Nothing Databento-derived reaches MiniTwo, DudeOne, DudeTwo, the MacBook, Conor's Mac, `labs.fattail.ai`, the production :5055 plane or anything it feeds, any member route, Discord, the wiki, the live show, YouTube or social posts. No production config names the plugin, its port or its keyspace. |
| **DBX-L3 — StudioOne serves, StudioTwo consumes** | On StudioOne the plugin collects, stores and serves only. Every app, page or script that reads Databento-derived market data runs on **StudioTwo**. StudioOne surfaces show the plugin's **state only** (up / stale / broken, lag, message rate, archive size), never a price, quote, OI or ladder. |
| **DBX-L4 — Demonstration** | Demonstrations happen on the StudioTwo screen, within what Databento confirms the personal licence allows (OD-PP7). Until then, to Coach himself. |
| **DBX-L5 — Commercial-licence gate** | Production use, member access, or any Massive-backup role for this plugin needs a commercial Databento licence first, then a new spec version that changes this manifest's `licence` block explicitly. |

### 5.3 Collection behaviour

| ID | Law |
|---|---|
| **DBX-1 — Products resolved daily** | Before each Globex session the plugin pulls that day's `definition` file (free on the plan) and resolves every option product whose **underlying futures root** is routed to it. Hard-coded product codes (`E1A`, `LO1`, …) are a defect. |
| **DBX-2 — Roots are data** | The roots it serves (initially ES, MES, CL, GC) are `provider_routes` rows over `market_symbol_universe` rows. Adding a root is adding rows. |
| **DBX-3 — Window and book** | Every listed strike for every expiry in 0–`PLUGIN_DATABENTO_MAX_DTE` DTE (house value 5), plus the nearest monthly/quarterly. No wing clamp. |
| **DBX-4 — Stream in, snapshot out** | Live `mbp-1` maintains top-of-book per instrument; a generation is emitted every `PLUGIN_DATABENTO_SNAPSHOT_S` seconds (no default; [1,5]; house value 2). Unchanged books are not rewritten. |
| **DBX-5 — Filter** | Only `instrument_class` C/P options and F outrights. Spreads (`CLZ6-CL`, `CLX6-BZ`, …) and user-defined instruments (`UD:…`) are dropped. |
| **DBX-6 — Underlier from the same feed** | Each row's spot is the mid of its own `underlying_id` future from the same session, never a Massive mark or a proxy. |
| **DBX-7 — OI and settles** | `statistics` maps to `open_interest`, `day_close`, `volume`. Missing OI is `null`. |
| **DBX-8 — Expiry time from the definition** | `expiry_ts` is the instrument's exact definition `expiration` (ES 16:00, CL 14:30, GC 13:30, ES quarterly 09:30 ET). |
| **DBX-9 — Continuous session** | Runs through Globex hours (Sun 18:00 – Fri 17:00 ET, daily 17:00–18:00 halt), reconnects with backoff, closes gaps with intraday replay, labels replayed generations `replayed: true`. |
| **DBX-10 — Raw archive** | The live stream is written unmodified to day-sharded `.dbn.zst` per root under `PLUGIN_DATABENTO_ARCHIVE_DIR`, outside the repo and separate from the chain-snapshot archive. The DBN file is the record; generations are derived. |


---

## 6. Packets

| Packet | Machine | Content | Gate |
|---|---|---|---|
| **P0 — Re-verify** | StudioTwo | Re-run Appendix A discovery from a committed script (script only, no output in git); how Databento counts devices and its live-session limit; MES dailies (OD-PP6); how plugin generations will be priced without touching :5055 | Delta: evidence file |
| **P1 — SDK + manifest + kit** | StudioTwo | `provider_sdk`: manifest schema, row/generation types, health model, keyspace helper, host guard, conformance kit; import-lint rule for PP-1/PP-2 | Delta: suite green; lint proves zero core→plugin imports |
| **P2 — Host, registry, gateway, fixture** | StudioTwo | Migrations for `provider_plugins` and `provider_routes`; plugin host (launchd job per plugin); Plugin Gateway (own port, licence checks); the `fixture` plugin; Plugins view mockup → Coach approval → build | Delta + Coach sees the Plugins view |
| **P3 — Databento plugin** | StudioTwo | `plugins/databento` per §5: host guard first, resolver, live session, TOB, statistics, raw DBN tap, generations into its own namespace; rename the key to `PLUGIN_DATABENTO_API_KEY`; pass the conformance kit; one full Globex session recorded | Delta |
| **P4 — Visible** | StudioTwo | Ladder view per symbol class on StudioTwo (picker → expiry → bid/ask/mid/OI/age, provenance badge) + plugin health strip | Coach sees a live ES 0DTE ladder on the StudioTwo screen |
| **P5 — Greeks owner** | StudioTwo | Only if OD-PP2 = a/b: one OPF module, labeled `iv_source`, golden vectors | India + Hotel |
| **P6 — StudioOne deploy** | StudioOne, **after RTH close** | Plugin host + gateway + Databento plugin as their own launchd jobs, own Redis, gateway allowlist per manifest; StudioOne ops dashboard shows state only; kill test; rollback script; CP-1 cadence check | Delta + Coach |
| **P7 — Retire dev** | StudioTwo | Stop the StudioTwo plugin host; StudioTwo views re-point to the StudioOne gateway | Delta |
| **P8 — Docs** | StudioTwo | Arch doc "Provider plugins", plugin authoring guide (how to add a vendor), runbook, `infra/deploy.md`, ADMIN-GUIDE, decision log | Lima |

---

## 7. Phase B preview (not in scope)

"See if Databento can be a plugin replacement for Massive with other symbols." With this framework that becomes a routing question: a plugin registered for a symbol class core already serves, plus a failover arbiter. It is out of scope here and blocked for Databento by DBX-L5 (personal licence; also OPRA would be needed for SPX/XSP). PP-18 keeps Massive core until then.

---

## 8. Acceptance tests

| ID | Test |
|---|---|
| AT-PP1 | With `plugins/` removed (or every plugin disabled), the core characterization suite is green and every core service starts and runs a session normally |
| AT-PP2 | Import-lint: zero imports from core into any plugin and from any plugin into core other than `provider_sdk`; a grep of core for every installed plugin id and vendor name returns nothing |
| AT-PP3 | Kill a plugin process mid-session: core cadence and :5055 unaffected; gateway answers `broken` for that plugin's routes; dashboard shows it |
| AT-PP4 | Change the `fop:ES` route from `databento` to `fixture` by one row update: the StudioTwo ladder view switches to fixture data and provenance with no code change, no restart of other plugins, no deploy; switch back the same way |
| AT-PP5 | A plugin that fails the conformance kit cannot be set `enabled` |
| AT-PP6 | An invalid manifest is refused at install with a named error |
| AT-PP7 | A plugin attempting to write `mb:*` or another plugin's namespace is refused |
| AT-PP8 | Undeclared capability → `not_supported`; missing value → `null`, never `0` |
| AT-PP9 | Plugin started on a host not in `licensed_hosts` → refuses with a named licence error |
| AT-PP10 | Gateway request from a host not in the routed plugin's `consumer_hosts` → refused; failover never serves a caller from a plugin it is not licensed for |
| AT-PP11 | Two plugins registered for one symbol class: the higher-priority healthy one is served; disable it and the next one is served, with provenance changing accordingly |
| AT-DBX1 | Databento resolver's product set for a fixture date equals the set derived from that date's definition file; adding a root row adds its products |
| AT-DBX2 | Spreads and `UD:` instruments never appear in a generation |
| AT-DBX3 | Row spot equals the mid of its `underlying_id` future from the same session |
| AT-DBX4 | Socket killed mid-session → reconnect → gap closed by intraday replay, replayed generations labeled |
| AT-DBX5 | The day's DBN file re-reads and its record count matches the plugin's own count |
| AT-DBX6 | From MiniTwo, the MacBook, or StudioOne itself (non-loopback), a gateway request for a Databento-routed class is refused; from StudioTwo it succeeds |
| AT-DBX7 | No StudioOne page, tile or log line renders a Databento price, quote, OI or ladder |
| AT-DBX8 | No production config, plist, nginx file or deploy script names the plugin, its port or its keyspace; no `.dbn*` or Databento-derived fixture is tracked in git |
| AT-DBX9 | StudioOne SPX/XSP capture inter-file cadence after P6 matches the prior session's distribution (CP-1) |
| AT-DBX10 | Coach sees a live ES 0DTE ladder on the StudioTwo screen (screenshot evidence pinned to machine and time) |

---

## 9. Open decisions for Coach

| ID | Question, plain language | Options and consequence |
|---|---|---|
| **OD-PP1** | Where does plugin code live? | **(a) Recommended:** a top-level `plugins/` directory plus `provider_sdk/` in the Labs repo, with an import-lint rule enforcing the wall. One repo, simple to build and review. **(b)** Each plugin in its own repository, assigned to the data host. Closest to your firm/ENGAGEMENT model, at the cost of more repos to keep in step. |
| **OD-PP2** | Who computes greeks for plugins whose vendor doesn't supply them (Databento)? | **(a) Recommended:** one Black-76 module in the OPF, labeled; exact for European ES/MES dailies and weeklies, labeled approximation for American CL, GC and quarterly ES. **(b)** (a) plus an American-exercise model for CL/GC. **(c)** No greeks in this phase. |
| **OD-PP3** | Which Databento schema feeds the ladder? | **(a) Recommended:** `mbp-1` (every top-of-book change, snapshotted every 2 s). **(b)** `bbo-1s` (lighter, 1 s resolution). |
| **OD-PP4** | Backfill Databento history? | Free on your plan back to 2010 (top of book) / 2017 (full book). **(a)** Forward only. **(b)** Backfill 0–5 DTE options for a window you choose, overnight, as its own packet. |
| **OD-PP5** | Collect the full ES/MES order book too? | Available (`book_depth = true`); feeds volume-profile and order-flow work. Out of scope unless you say so. |
| **OD-PP6** | MES daily options | The Oct 2 definition file showed none. If they matter, P0 checks a week of definitions. |
| **OD-PP7** | What may a demonstration show, and to whom? | Showing live CME data to anyone else may count as display under a personal licence. **(a) Recommended:** ask Databento in writing first. **(b)** Demonstrate only to yourself until a commercial licence. *(Not legal advice; Databento's and CME's terms decide.)* |

Decided here, overridable: out-of-process plugins (PP-4); registry as data (PP-7); one gateway (PP-8); fixture plugin as the pluggability proof (§4); Massive stays core (PP-18).

---

## 10. Change declaration

*Paths assume OD-PP1 = (a); under (b) the same units move to their own repositories and are re-declared at P1.*

**New:** `provider_sdk/` (manifest schema, types, keyspace, host guard, conformance kit) · `plugins/fixture/` · `plugins/databento/` (manifest, entrypoint, resolver, client) · plugin host + Plugin Gateway (module location per OD-PP1) · migrations `NNN_provider_plugins.sql`, `NNN_provider_routes.sql` · one launchd plist per plugin + host + gateway under `infra/launchd/plugins/` (excluded from every production deploy script) · Plugins view + ladder view (StudioTwo) · state-only plugin tile on the StudioOne ops dashboard · import-lint rule · tests · this spec
**Modified:** `.env.example` (plugin key names only) · Arch docs · `infra/deploy.md` · decision log
**Not touched:** `server/market_data/chain_feed.py` and every Massive path · `server/opf/*` (unless OD-PP2 = a/b, then one new module) · the production :5055 plane and `mb:*` keys · SPX/XSP capture · MiniTwo · every member-facing app and template

---

## 11. Document control

| Version | Date | Notes |
|---|---|---|
| **v0.1** | 2026-10-05 | Re-founds the Databento FOP Provider line (v0.1–v0.4) as a provider plugin framework per Coach intent item 14. Databento is plugin #1 with its licence carried as manifest + DBX-L1…L5; fixture plugin proves pluggability; Massive stays core |

**One-line law:**
**Providers plug in and pull out: each vendor is an isolated plugin speaking one contract, routed by data, read through one licence-checking gateway, and the core never knows its name. Databento is the first, serving futures options to StudioTwo only.**

---

## Appendix A — Databento discovery evidence


All figures below were measured with Coach's key from StudioTwo (`~/dbx-venv`, `databento` 0.87.0). Re-verify at P0; this is dated evidence, not standing law.

#### A.1 Entitlement and cost

| Check | Result |
|---|---|
| Key auth (Historical `metadata.list_datasets`) | OK |
| GLBX.MDP3 history range | trades / mbp-1 / bbo-1s / definition / statistics from **2010-06-06**; MBO + MBP-10 from **2017-05-21**; data current to the morning of 2026-10-05 |
| Historical cost, one full day ES.OPT / MES.OPT, every schema tested | **$0.00** (included in the plan) |
| Historical cost, full GLBX definition file for one day (1,474,726 records) | **$0.00** |
| Live 60 s sample, `mbp-1` + `bbo-1s`, parents `E1A.OPT ML1.OPT G1M.OPT EX3.OPT ES.FUT MES.FUT CL.FUT GC.FUT` | **Entitled.** Both subscriptions "succeeded", no error records. 145,441 MBP-1 + 40,433 BBO-1s messages, 3,588 active instruments, at ~07:05 ET (pre-cash-open) |

#### A.2 What "options on ES / MES / CL / GC" actually means at CME

The `ES.OPT` parent returns **only the quarterly** ES options. Daily and weekly expiries are separate CME product codes, each with its own parent. The collector must therefore resolve products **by underlying futures root**, not by a single parent symbol.

| Root | Option product codes seen (definitions 2026-10-02) | Expiry time (ET) | Exercise (CFI) | Multiplier | Strikes listed per near expiry (C+P) |
|---|---|---|---|---|---|
| **ES** | Dailies `E1A…E5D` (week 1–5 × Mon A / Tue B / Wed C / Thu D), Friday weeklies `EW1…EW4`, month-end `EW`, quarterly `ES` | 16:00 (dailies/weeklies/EOM); 09:30 (quarterly) | **European** for dailies/weeklies/EOM; **American** for quarterly `ES` | 50 | ~710–870 near term |
| **MES** | Month-end `EX`, weekly `EX3`, quarterly `MES` | 16:00; 09:30 quarterly | European `EX`/`EX3`; American `MES` | 5 | ~580–760 |
| **CL** | Weeklies `LO1–LO4` (Fri), `ML1–ML4` (Mon), `NL1–NL5` (Tue), `WL1–WL5` (Wed), `XL1–XL5` (Thu), monthly `LO`, `LM1–LM5`, European `LCE`, daily `ICD` | 14:30 | **American** except `ICD`, `LCE` (European) | 1,000 | ~230–340 weekly; 916 monthly |
| **GC** | Dailies/weeklies `G1M…G5W` (M/T/W/R), Friday weeklies `OG1–OG4`, monthly `OG` | 13:30 | **American** (all) | 100 | ~400–470 near term; 1,246 monthly |

Every weekday has a listed ES, CL and GC expiry. **MES did not show daily expiries** in the 2026-10-02 definitions; only `EX`, `EX3` and quarterly `MES`. That is recorded as found and must be re-checked at P0 (OD-PP6), not assumed.

#### A.3 What Databento does not provide

- **No greeks and no implied volatility.** Quotes, trades, book, definitions, statistics only.
- **No OPRA in this plan.** SPX/XSP chains cannot be backed up by Databento until OPRA.PILLAR is added (Phase B prerequisite, §7).
- The `.FUT` parent includes calendar and inter-commodity **spreads** (e.g. `CLZ6-CL`, `CLX6-BZ`). Outrights must be filtered by `instrument_class == "F"`.
- User-defined instruments (`UD:…`) arrive under option parents and must be dropped.