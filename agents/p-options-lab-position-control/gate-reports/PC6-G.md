# PC6-G

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Verdict:** PASS

## Evidence

```
$ npx --yes tsx lib/options-lab/lock.pc6.test.ts
  ok  AT-PC-26 POS scale leaves lock standing; strike change → CHECK PRICE
  ok  AT-PC-48 Buy/Sell invert moves CHECK PRICE
  ok  AT-PC-51 ToS always @LMT; pending CHECK PRICE script uses live mid
  ok  AT-PC-06 Create never implicit-locks
  ok  AT-PC-28 freeze_iv and freeze_marks are false on lock
  ok  AT-PC-29 …
  ok  AT-PC-64 / 32 CHECK PRICE half …
  ok  Keep clears CHECK PRICE …
  ok  chip and Keep render on BASIS
lock.pc6.test.ts 9 ok
```

PC6-G-numeral: pending CHECK PRICE uses `line-through` + amber, not live BASIS styling.

## Divergence

D-PC-7 — dialog Limit input still writes `net_debit_override`. CardLockState is the lock SoR; override is not read for CHECK PRICE. Full removal of the eight dialog override sites is leftover chrome.
