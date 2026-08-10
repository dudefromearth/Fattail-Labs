# W0-1 India — Redis schema · dual-write · generation identity
**Result:** PASS  
**Date:** 2026-08-10

## Keys (v1)
| Key | Type | Identity |
|-----|------|----------|
| `mb:chain:{feed}:{exp}:{side}` | JSON | generation blob + content_hash + as_of |
| `mb:sym:{PRODUCT}` | JSON | last mark + source + seq |
| `mb:session:market_status` | JSON | Massive marketstatus snapshot |
| `mb:interest:{topic}` | STRING/TTL | demand refcount / last-seen unix |
| `mb:pub` | PUBLISH channel | `{topic, hash_or_seq}` notify |

## Dual-write O2
- Temporary dual-write to `market_live_marks` allowed when O2 Accept.
- **Exit:** Curate (or named reader) on bus/`sym` for 20 green sessions **or** 14 calendar days → dedicated DL removes dual-write.
- **Ban:** open-ended dual truth; India re-checks at Z1-1.

## Generation identity
One blob per `(feed, expiration, side)`; wings sliced in-process from wide listed window when present.
