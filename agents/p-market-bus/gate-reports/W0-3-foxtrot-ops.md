# W0-3 Foxtrot — MiniTwo ops · launchd
**Result:** PASS (design)  

| Unit | Notes |
|------|--------|
| redis | Homebrew/local; localhost; already available in dev |
| labs-chain-feed | 1 writer; launchd KeepAlive |
| labs-sym-feed | 1 writer (or combined labs-market-feed) |
| Fail-loud | API raises if REDIS_URL missing when LABS_MARKET_BUS=1 |

O1 Accept recommendation: split units OK; one writer per class.
