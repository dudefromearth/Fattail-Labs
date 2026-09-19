# SYM3-F1 — REQ-003 F1 clauses 2–3 (full search + strip order)

**Depends:** SYM3-G PASS · SYM-SWAP-G PASS · **DL-776**  
**Agents:** Charlie (dialog) · Echo (highlight chrome) · Alpha (payload so the surface does not invent front/forward or names)  
**Machine:** StudioTwo. If the member hop is live (`LABS_SYMBOLOGY_API_BASE=http://192.168.1.111:4011`), overlay `server/symbology/` onto StudioOne after Alpha — **CP-1**. MiniTwo not this tree.

**REQ-003 stays OPEN.** Do not write "done." AP-1 is Coach's browser after this gate.

**Law:** `artifacts/reqs/REQ-003-F1.md` · **DL-776**  
**Coach wording (RL-1):** "full search" (tickers AND names both matched); "the current active and the forward contract are on top."

F1 clauses **1, 4–6** stand as issued — do not invent or rewrite them. This packet is **2–3 only**.

## Do

### Alpha — live strip on the wire (SYM-4)

Universe (and resolve matches) must carry, as-of `strip_generation_id`:

- per futures group: `front` and `forward` as **dated long form** from `current_strip()` / `catalog.pick_nth(..., n=2)` — not client calendar
- per row: `display_name` (plain English). Roots: existing titles (E-mini S&P 500 Futures, …). Contracts: that title plus the contract month/year from the **server** catalog. Client still must not contain `FGHJKMNQUVXZ`.

Resolve `q` matches **ticker AND display_name** (substring, case-insensitive). `"e-mini"`, `"s&p"`, `"500"` reach the ES family. `"es"` is a ticker-prefix on ES.

Do not grant ACTIVE. Do not answer D6/D7/D8. Do not add `1!` as an ingest key.

After Alpha: if StudioTwo Labs hops to StudioOne `:4011`, rsync `server/symbology/` (no git pull) and kickstart `ai.fattail.labs.symbology`. **CP-1 verbatim** in the GO; BEFORE/AFTER chain_feed pid + last-line; rollback is kickstart-back / bootout of symbology only.

### Charlie + Echo — picker

`web/components/symbology/SymbolSearchDialog.tsx` + `web/lib/symbology/picker.ts` (+ types/tests/e2e).

2. **Full search.** Every keystroke matches ticker AND `display_name`. Highlight matched substrings in ticker and name. Echo: TV-like mark, white/black (clause 5). `data-testid` on highlights.

3. **Ordering.** Ticker-prefix groups rank above name-only groups. Within a futures family, children are always:

   1. current **front** contract, with `{root}1!` shown **against** that row  
   2. **forward** contract, with `{root}2!` shown against it  
   3. remaining strip contracts in chronological order from the group's contract list  

   Front/forward **from the payload** (`group.front` / `group.forward` as-of `strip_generation_id`). Never hardcode `ESZ2026` / `ESH2027`. `/ES` `@ES` stay search dialects (SYM-3), not extra rest-children.

Keep: chips All/Futures/Stocks/Indices; gray law; pair badge; continuity caption on 1! / `/ES` / `@ES`; no FIXTURE in production web.

## Out

LIM / QFRIC / XS / PPL. MiniTwo. REQ-001. REQ-002. Closing REQ-003. Inventing F1 clauses 1, 4–6.

## Gate SYM3-F1-G

Headed `LABS_WEB_BASE_URL=http://studiotwo:3000` artifact:

- type **"es"** → ES family on top  
- first child = live front, second = live forward, `ES1!` / `ES2!` visible against those rows  
- highlights visible on the matched substring  

Plus: `"e-mini"` / `"s&p"` / `"500"` reach ES; ticker-prefix ranks above name-only; client grep still clean of `FGHJKMNQUVXZ` and `FIXTURE`.

Not AP-1. File `agents/p-symbology-registry/gate-reports/SYM3-F1-G.md` with screenshot path(s).
