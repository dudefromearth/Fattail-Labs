# FatTail Labs — Options Lab Heatmap Template Help Package Spec v0.1

**Scope statement (doctrine, 2026-08-21)**
- **Active program for this document:** Options Lab — Heatmap Templates.
- **Touches:** this spec (new); Heatmap Templates Spec v0.2 §4.2 contract (amendment proposed → v0.3); existing template catalog (§5) compliance.
- **Touches outside program:** **NONE.** IKI Lab is covered by the separate IKI Template Help Package Spec v0.1 (Coach ruling: two specs). No shared file is opened by this document.

**Status:** DRAFT for Juliet — advisor draft, no authority.
**Date:** 2026-08-21
**Canonical filename:** `Specs/FatTail-Labs-Options-Lab-Template-Help-Package-Spec-v0_1.md`

**Parents:**

| Doc | Role |
|---|---|
| Heatmap Templates Spec v0.2.1 — §4.2 contract (`id`, `label`, `description` required; `layout`; `valueModes`; `computeCell` without color), §5 catalog, H8 payoff-vs-profit-claims, HM1–HM21 | The contract this spec extends |
| Help System Architecture v0.1 (§3.2 overlay, §5 `help_articles`, §6 governance, parity rule) | Where help lives; who reviews |
| OPF Truth & Elegant Failure Doctrine v1.1 (DL-396) | Named-state honesty the help must describe, not soften |
| CLAUDE.md invariant 8 · H8 | No profit claims in any help string; payoff math is not a profit claim |

## 0. Coach's requirement (2026-08-21)

> Part of any Template we create should include the purpose and what information the template will convert into knowledge as a data output or display, and why and how the user would use it to help with scenarios. All this information should go in the help system.

> Let's make it a requirement of … Heatmap Templates that a help Guide and Description of the template is part of the package. … Make them two separate specs then. One for Options Lab and one for IKI Labs.

## 1. Law

**OH1 — A heatmap template is incomplete without its help package.** HM §4.2 already requires `description`; this spec extends the required set (§2). A template whose package is missing or has an empty required field fails registration in dev (HM §4.1 fail-loud posture). **Production fallback to `ladder` (HM §4.1) is unchanged** — an incomplete template is not shown; the surface does not break.

**OH2 — The help package lives in the help system**, keyed `surface_key = heatmap-template:<id>` (Help Arch §5). The Help overlay (§3.2) opens it beside the heatmap with that template active. No copy sits in the template UI itself (HM §6 UI law: chrome stays off the grid).

**OH3 — Help strings carry the product's prohibitions.** H8 applies: payoff math may be described; profit may not be claimed. No advice. The OPF named states (EXPIRED · HELD · NOT TRADED · CHECK LEGS · UPDATING …) are described truthfully where the template can show them.

## 2. The help package (required fields)

| Field | Answers | Governance |
|---|---|---|
| `description` | *(existing §4.2)* What this template is. | Tango |
| `purpose` | What it is for — what the member is trying to find. | Tango |
| `information_in` | Which chain data it reads (sides, expiry, strikes, marks, IV, OI). | Hotel |
| `knowledge_out` | What the grid shows per `valueMode` — display, and data if exported (HM §9 agent export). | Hotel |
| `why` | The question a member has that this grid answers. | Tango + Hotel |
| `how` | How to read it: axes, color semantics (as assigned by `assignColors`), each control. | Tango |
| `scenarios` | Concrete situations in which a member reaches for this template (≥1), including what to do next (e.g., send to Analyzer). | Tango + Hotel |
| `non_claim` | What it does not tell you. Includes "not a profit claim" wording per H8. | Hotel |
| `named_states` | Which OPF named states this template can show and what each means here. | Hotel |
| `export_fields` | If HM §9 export is enabled for the template: each field and its meaning. Required iff export. | Hotel |

## 3. HM §4.2 amendment (proposed text for Heatmap Templates v0.3)

> | `id`, `label`, `description` | Required |
> | **`help`** | **Required — per Options Lab Template Help Package Spec v0.1 §2. Registration fails in dev without it; prod falls back to `ladder`.** |

## 4. Existing catalog (§5) compliance

Every template in the v0.2 catalog — ladder, the Advanced Fly set, GEX, and any registered since — needs a package. **OD-OH1 (Coach):** written in one compliance packet under this spec, or per-template as each is next touched. Either way, no template is removed from the catalog for non-compliance; the prod fallback protects members while packages land.

## 5. Acceptance

| AT | Evidence |
|---|---|
| AT-OH1 | Dev: register a template with `why: ""` → named registration error identifying the field. |
| AT-OH2 | Prod posture: incomplete template → `ladder` shown; no error surfaced to member; logged. |
| AT-OH3 | Complete template → `help_articles` draft with `surface_key = heatmap-template:<id>`; member-invisible until published. |
| AT-OH4 | Help overlay on `/app/options-lab/heatmap` with template active opens the package beside the grid; `non_claim` and `named_states` visible; grid unchanged underneath (stay-put). |
| AT-OH5 | Every catalog template has a package; Tango + Hotel review evidence per template; zero profit-claim strings (H8 grep + human read). |
| AT-OH6 | HM1–HM21 regression: tile hashes unchanged — help package is metadata, never compute. |

## 6. Boundaries

- No change to `computeCell`, `assignColors`, `resolveColumns/Rows`, or any compute path. Help is metadata.
- No help text rendered inside the grid or rail (HM §6).
- No shared file with IKI Lab. If the bench finds the two help specs want one shared `help` type, that is a **new** question to Coach, not a merge done in code.

## 7. Ideas inventory (nothing omitted)

1. Purpose; information converted to knowledge as data output or display; why and how for scenarios — in the help system, wiki links it.
2. Requirement of Heatmap Templates that a help guide and description is part of the package.
3. Two separate specs, Options Lab and IKI Lab.

**[advisor] items, held as opinion:** `named_states` and `export_fields` as Options-Lab-specific fields; "send to Analyzer" as a scenario element; OD-OH1's two options; prod-fallback-protects posture (it's HM §4.1's existing law applied, not new).

## 8. Open decisions

| ID | Question | Owner |
|---|---|---|
| OD-OH1 | Catalog compliance: one packet now, or per-template as touched. | Coach |
| OD-OH2 | Does HM §9 agent export become the `knowledge_out` data path, and is `export_fields` therefore required for every exportable template. | Hotel / India |

## 9. Review chain

Juliet → India (HM §4.2 contract boundary; `help_articles` key) → UX → UI (Echo; overlay placement on the HM §6.1 workspace) → Interaction → Tango → Hotel (mandatory; every trading statement and named state) → Coach → Lima → Juliet seeds → Delta.
