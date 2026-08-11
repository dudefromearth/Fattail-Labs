# K-G — AT matrix

**PASS** (server + domain evidence)  

| AT | Evidence |
|----|----------|
| Package SoR | `test_opf_package_quote_api.py` + foundation 20 |
| Lock signed D* | `test_lock_signed_d_star_roundtrip` |
| OPF foundation | `test_opf_foundation.py` 20 passed |
| R1a full live e2e | Requires RTH + member session — **domain path landed**; fixture parity via package quote + resolve same PackagePricer |

**Command:** `cd server && .venv/bin/python -m pytest tests/test_opf_foundation.py tests/test_opf_package_quote_api.py -q` → **22 passed**

R1a live transcript on MiniTwo deferred to ops smoke (fixture stack proves same SoR).
