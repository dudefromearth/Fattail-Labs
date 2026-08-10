#!/usr/bin/env python3
"""Market Bus scale smoke: N concurrent ladder fills → Massive calls ~O(1).

  LABS_MARKET_BUS=1 REDIS_URL=redis://127.0.0.1:6379/0 \\
    .venv/bin/python scripts/mb_scale_smoke.py --n 20
"""

from __future__ import annotations

import argparse
import os
import sys
import threading
import time

# ensure server on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--n", type=int, default=10)
    p.add_argument("--symbol", default="SPX")
    p.add_argument("--wings", type=int, default=25)
    args = p.parse_args()

    os.environ.setdefault("LABS_MARKET_BUS", "1")
    os.environ.setdefault("REDIS_URL", "redis://127.0.0.1:6379/0")

    from market_data.market_bus.metrics import massive_call_count, reset_metrics
    from market_data.market_bus.store import BusStore
    from routes import chain_ladder as cl

    # clear redis ladder keys for clean measure
    try:
        st = BusStore()
        for k in st._r.scan_iter("mb:ladder:*"):
            st._r.delete(k)
    except Exception as exc:
        print(f"redis warn: {exc}")

    resolved = cl._resolve_universe_symbol(args.symbol)
    from datetime import date, timedelta
    from routes.chain_ladder import _scan_expirations_live

    exps = _scan_expirations_live(
        resolved["chain_underlier"], days=14, limit=1, today=date.today()
    )
    if not exps:
        print("no expirations", file=sys.stderr)
        return 2
    exp = exps[0]
    print(f"symbol={args.symbol} exp={exp} n={args.n}")

    reset_metrics()
    errors: list[str] = []
    barrier = threading.Barrier(args.n)

    def worker() -> None:
        try:
            barrier.wait()
            cl._fetch_ladder(
                product=resolved["product"],
                chain_underlier=resolved["chain_underlier"],
                kind=str(resolved.get("kind") or "equity"),
                expiration=exp,
                side="call",
                wings=args.wings,
                strike_step_cfg=resolved.get("strike_step"),
            )
        except Exception as exc:
            errors.append(str(exc))

    t0 = time.time()
    threads = [threading.Thread(target=worker) for _ in range(args.n)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=120)
    dt = time.time() - t0
    calls = massive_call_count()
    print(f"wall_s={dt:.2f} massive_calls={calls} errors={len(errors)}")
    if errors:
        print("sample err:", errors[0][:200])
    # With single-flight + redis, first wave should be ~2–4 Massive calls not N*2
    ok = calls <= max(8, args.n // 5) and not errors
    print("PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
