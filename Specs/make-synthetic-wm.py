"""Synthetic width_maturity_rows.parquet with the job's exact schema — for testing the visuals only."""
import math, numpy as np, pandas as pd
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from scipy.stats import norm
HPY = 252 * 6.5; rng = np.random.default_rng(3)
def c(S, K, T, s):
    if T <= 1e-9: return max(S - K, 0.)
    v = s * math.sqrt(T); d1 = (math.log(S / K) + .5 * s * s * T) / v; return S * norm.cdf(d1) - K * norm.cdf(d1 - v)
def gk(S, K, T, s):
    if T <= 1e-9: return (1. if S > K else 0.), 0., 0.
    v = s * math.sqrt(T); d1 = (math.log(S / K) + .5 * s * s * T) / v
    return norm.cdf(d1), norm.pdf(d1) / (S * v), -S * norm.pdf(d1) * s / (2 * math.sqrt(T)) / HPY / 60
days = [d for d in (date(2026, 8, 14) + timedelta(days=i) for i in range(22)) if d.weekday() < 5]
ivs = {d: float(np.clip(rng.normal(.145, .012), .11, .19)) for d in days}
ivs[date(2026, 9, 2)] = .172; ivs[date(2026, 9, 4)] = .128
rows = []
for sym, S0, step in (("SPX", 6500., 5.), ("XSP", 650., 1.)):
    for d in days:
        iv = ivs[d]; T0 = 6.4 / HPY; sig0 = S0 * iv * math.sqrt(T0)
        # a random spot path for the day (used for value-at-spot)
        mins = np.arange(0, 391, 30 // 30 * 5)   # every 5 minutes
        path = S0 * np.exp(np.cumsum(rng.normal(0, iv * math.sqrt(5 / 60 / HPY), len(mins))))
        rv = float(np.std(np.diff(np.log(path))) * math.sqrt(len(mins) / (6.5 / HPY)))
        for proto in ("constant_r2r", "constant_sigma"):
            for n in (2, 3, 4, 5, 6, 7, 8, 10):
                W = n * step
                if proto == "constant_sigma": K2 = round((S0 + 1.05 * sig0) / step) * step
                else:  # constant R2R 7: scan bodies
                    K2 = None
                    for k in np.arange(S0, S0 + 4 * sig0, step):
                        dd = c(S0, k - W, T0, iv) - 2 * c(S0, k, T0, iv) + c(S0, k + W, T0, iv)
                        if dd <= W / 8: K2 = k; break
                    if K2 is None: K2 = round(S0 / step) * step
                K1, K3 = K2 - W, K2 + W
                kurt = 1 + 0.9 * math.exp(-n / 2.5) * (1 + .3 * rng.standard_normal())      # synthetic peak premium
                model = c(S0, K1, T0, iv) - 2 * c(S0, K2, T0, iv) + c(S0, K3, T0, iv)
                debit = max(model * kurt, 0.05)
                for i, m in enumerate(mins):
                    T = max((390 - m) / 60 / HPY, 1e-6); S = path[i]; atm = iv * (1 + .04 * rng.standard_normal())
                    sig = S * atm * math.sqrt(T)
                    vc = c(K2, K1, T, iv) - 2 * c(K2, K2, T, iv) + c(K2, K3, T, iv)
                    vs = c(S, K1, T, iv) - 2 * c(S, K2, T, iv) + c(S, K3, T, iv)
                    dl = g = th = 0.
                    for q, K in ((1, K1), (-2, K2), (1, K3)):
                        a, b, cc = gk(S, K, T, iv); dl += q * a; g += q * b; th += q * cc
                    ts = datetime(d.year, d.month, d.day, 9, 30, tzinfo=timezone(timedelta(hours=-4))) + timedelta(minutes=int(m))
                    rows.append(dict(symbol=sym, day=d, ts=ts, clock=ts.strftime("%H:%M:%S"), protocol=proto, width_strikes=n, width=W,
                                     K1=K1, K2=K2, K3=K3, entry_debit=debit, model_debit=model, entry_premium_ratio=debit / model,
                                     achieved_r2r=W / debit - 1, placement="reached", body_sigma_out=(K2 - S0) / sig0, spot=S,
                                     T_hours=T * HPY, atm_iv=atm, sigma_remaining=sig, width_over_sigma=W / sig,
                                     value_center=vc, pct_of_max_center=vc / W, return_center=vc / debit - 1,
                                     value_spot_mid=vs, value_spot_model=vs, return_spot=vs / debit - 1,
                                     delta=dl, gamma=g, theta_per_min=th, iv_K1=iv, iv_K2=iv, iv_K3=iv, resid_K1=0, resid_K2=0, resid_K3=0,
                                     entry_ts=ts, spot0=S0, atm_iv0=iv, sigma0_pts=sig0, step=step, realized_vol=rv, implied_over_realized=iv / rv))
out = Path("wm_test"); out.mkdir(exist_ok=True)
pd.DataFrame(rows).to_parquet(out / "width_maturity_rows.parquet", index=False)
print(len(rows), "rows ->", out)