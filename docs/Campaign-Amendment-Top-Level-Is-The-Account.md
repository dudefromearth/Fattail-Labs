# Campaign Amendment — The Top Level Is the Account

**Formal Spec (review):** [`Specs/FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md`](../Specs/FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md)  
**Amends:** `FatTail-Labs-Member-Campaign-Spec-v1_3.md` (targets v1.4)  
**Companion:** [`Specs/FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.2.md`](../Specs/FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.2.md) (fungibility, funding composition)  
**Status:** DRAFT — Coach-dictated 2026-08-09; for bench review, decision-log entry, and reversal seed  
**⚠️ This amendment SUPERSEDES landed doctrine and partially reverses landed migrations. Nothing here is a refinement; it is a removal, flagged per operating rule.**

---

## 1. The change in Coach's terms

The main account doesn't need a top-level campaign. **It is the top level.** It has no stated goals; it is what it is. People adopting the Practice come from a wide variety of circumstances — we cannot expect them to define it all up front. The trading they do within the top-level account is whatever they choose. **The Journey helps them stay on track.** Then they have the option to direct campaigns and allocate capital as they see fit — wrap an account in a campaign, wrap multiple accounts, or proportion capital from different accounts to a campaign.

**The fungibility principle:** accounts are fungible sources until the user chooses to organize them for specific purposes. Until then, nothing is imposed on them.

## 2. What is removed

| Removed | Was |
|---|---|
| **The ledger campaign** | Every account received a default "furniture" campaign at birth — never signed, no bounds, no lifecycle, but still a campaign object that undirected trades belonged to |
| **Genesis ledger creation** (Law 1, in part) | Default campaign created with the account |
| **Silent ledger fallback** (Law 3, in part) | Memory fell back to the account's ledger when the remembered campaign was ineligible |
| **Ledger rows in the campaign registry** | Ledgers registered with a ledger flag |

**Replacement:** undirected trades carry **no campaign at all**. The resting state is genuinely unstructured — not "structured by a default object pretending not to be structure." Memory's fallback becomes simply **no direction**. The registry carries deliberate campaigns only.

## 3. What is unchanged

- **Direction is the stamp** — deliberate, member-chosen, memory pre-answers. Now optional at the trade level: an undirected trade is lawful and permanent-ly so until the member directs it.
- **Window eligibility, account freedom, exclusive membership, name law** — all window-model laws stand.
- **Bounds, prescribed panel, six controls** — unchanged for deliberate campaigns.
- **The Journey** — remains the process-standing witness for all trading, directed or not. With the ledger gone, the Journey is the *only* structure over undirected trading, which is its correct role.
- **Badges** — a position with no direction simply wears no badge. No "ledger badge."

## 4. Why this is honest

Demanding structure at adoption is false precision. Members arrive mid-life, mid-mess, with existing accounts and histories. The doctrine's promise — structure always available, deliberate structure always optional — is *better* kept without the ledger: the previous model kept the letter ("never signed, no bounds") while an object still silently claimed every trade. Now the umpire imposes nothing until the trader organizes.

## 5. Reversal accounting (prominent, per operating rule)

- **Migrations 102–104** landed ledger/stamp/memory machinery. This amendment **reverses the ledger portion**: genesis-ledger creation is removed; existing ledger campaign rows need a disposition (delete vs. tombstone — India/Lima to propose; trades stamped to ledgers become unstamped).
- **Stamp and memory machinery survive** — they serve deliberate campaigns.
- Requires: decision-log entry (supersession of the ledger doctrine), reversal seed, characterization-test updates (Kilo: undirected-trade resting state, no-fallback memory).

## 6. Spec deltas for v1.4 (enumerated)

1. **Law 1 (genesis):** account birth creates the account only. No campaign.
2. **Law 3 (memory):** ineligible remembered campaign → offer no pre-answer (undirected), never a fallback object.
3. **Ledger doctrine section:** removed entirely; replaced by a one-paragraph "the account is the top level" statement citing this amendment.
4. **Registry (§9a-pending):** deliberate campaigns only; ledger flag deleted from metadata set.
5. **Funding composition:** allocations gain provenance (wrap one / wrap many / proportion) per the capital model §Ring 2. Wrapping is capital-sourcing only — never direction.
6. **Trade Log (§9):** badge column simply empty for undirected trades; picker offers eligible deliberate campaigns or nothing.

## 7. Gates

| Gate | Holder | Question |
|---|---|---|
| Architecture | India | Ledger row disposition; registry metadata change; no orphaned FK paths from 102–104 |
| Doctrine | Hotel / Tango | Resting-state copy — "undirected" must read as lawful and neutral, never as deficiency |
| Tests | Kilo | Undirected resting state; memory no-fallback; celebrate-the-drift unaffected |
| Decision log | Lima | Supersession entry same day as ratification |
