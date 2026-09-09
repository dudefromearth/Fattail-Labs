# Tango · §12 segment copy (DRAFT)

**Date:** 2026-09-09  
**Product code:** none. Lands at GSC4 with the ribbon, after GSC2.5-G and Coach stamp.  
Hotel checks this packet for the honesty failure in addendum §12.2.

Forbidden: prime, best, window-as-edge, opportunity, “where to trade,” ranking one
segment over another. Invariant 14.

---

## §11 framework disclosure (fifth fact)

Place with the existing four Spec §11 disclosures. Correctness, not decoration:

`Morning, Afternoon, and Closing are a FatTail teaching frame on the US cash session. They are not exchange hours. Nothing at the venue changes at 12:30 or 2:30 PM.`

Do not say “we divide the day because that’s when the market shifts.” Do not analogize to NYSE auctions.

---

## StatusBanner when `currentSegment` is set

Eyebrow (Tango): `Open · {Morning | Afternoon | Closing}`  
Body: **unchanged** from the full-session row in `tango-copy.md`.

The name says when. The body still says the cash session is regular (or early / closed / weekend when `currentSegment` is null — then the banner is exactly today’s four-state table).

Do not add “you are in the afternoon session” as advice. Do not add “watch the close.”

---

## Early-close honesty (2026-11-27)

Ribbon: Morning whole, Afternoon truncated at 1:00 PM, Closing absent.  
Do not write “short afternoon” or “no closing session to trade.”  
If a caption is needed on the truncated chip: `truncated` — lowercase, clock-fact, same register as `closed` / `modified`.

---

## AT-GSC-56 static

Grep the sessions route tree and this copy for: `prime`, `best`, `edge`, `opportun`, `ideal`, `watch for`. Zero hits. Segment labels are exactly `Morning`, `Afternoon`, `Closing` (unless Coach reticks §12.7).
