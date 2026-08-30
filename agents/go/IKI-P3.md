# GO token — IKI-P3 · Runner chrome to Apple HIG, Heatmap style

**ID:** `IKI-P3`  
**Callsign:** Charlie (build) · Echo (gate, mandatory) · Delta `IKI-P3-G`  
**Board:** `agents/p-iki-lab/`  
**Active program (DL-539):** IKI Lab. The Runner as mounted at `/app/iki/runner` is IKI Lab work.

**Authority:** Heatmap Templates Spec v0.2 **§6.1** · **§6.2** · **HM14** · Human Interface Spec v1.0 · Runner Spec **TR13** (as-built on IKI host after W1).

---

## Coach stamp

- [x] **GO** — this brief is the stamp  
**Signed:** Coach  
**Date:** 2026-08-22  

**W0 wait:** specialist studies, declares import vs re-implement, declares files, **stops for Coach ack** before W1.

---

## DL-539 three successive OKs — read-only of out-of-scope files

**Coach (2026-08-22), three OKs in one ruling:** *“You got three okays so long as opening files out of scope is in read only mode.”*

| | |
|--|--|
| **OK 1 · OK 2 · OK 3** | Granted |
| **What** | **Open** (read) files outside the IKI-P3 allowlist: Options Lab, `web/lib/market/`, `server/`, Runner internals (`subscribe.ts`, `sinks/render.ts`, …). |
| **What not** | **Write.** Editing those files is still frozen. A write still needs its own three-OK or a B3/C1 write tick. |

W0 Heatmap study and any later read of `render.ts` / `subscribe.ts` for chrome mapping sit under this grant.

---

## Frozen trees

**None touched.** Options Lab is **read-only reference**. `web/lib/market/`, `server/`, Market Bus, templates (`sym-fly`, `spread-tax`): not edited.

If W0 finds HIG parity requires editing any of those: **stop and report**. Do not proceed under this GO.

---

## Coach — DL-539 / Runner internals (B3)

Coach: *“The Runner as mounted at `/app/iki/runner` is IKI Lab work.”*

Does that include `web/lib/runner/sinks/render.ts` (chrome: strip selector, keep session + `TileGrid`) and `web/lib/runner/__tests__/iki-p3-chrome.test.ts`?

Compute stays frozen either way: `subscribe.ts`, `run.ts`, `registry.ts`, `host.ts`, `templates/**`.

- [x] **Yes** — those two paths are IKI chrome for this packet.  
- [ ] **No** — do not edit `render.ts` or `web/lib/runner/__tests__/`. Selector-bar removal lives on the IKI page/rail only.

**Coach GO W1** 2026-08-22.

---

## Out of scope

Any edit to Options Lab · shared `web/lib/market/` · `server/` · new templates · data/notification/signal sinks · catalog card/nav naming · chain snapshot template.
