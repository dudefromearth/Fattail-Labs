#!/usr/bin/env python3
"""
Width Maturity — visuals from the batch job's output. Seconds to run.

  python width_maturity_visuals.py --in ./wm_out [--exit 15:00] [--pair 2026-09-02,2026-09-04]
                                   [--symbols SPX] [--dpi 150] [--theme light|dark]

Reads width_maturity_rows.parquet (+ days.csv) and writes figs/01..10_*.png + figs/index.md.
Every figure answers one question; its caption states the computed answer.
"""
import argparse, math
from pathlib import Path
import numpy as np, pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, to_hex
from scipy.stats import norm

HPY = 252 * 6.5
# ---------------------------------------------------------------- theme
THEMES = {
    "light": dict(bg="#FAFAF8", panel="#FFFFFF", ink="#1B1B1F", ink2="#5C5C66", ink3="#9A9AA3", grid="#E6E6E2",
                  accent="#FF8C1A", teal="#2FA79B", stop="#E63946",
                  ramp=["#F6C99A", "#F2A85E", "#E88A2F", "#C96E16", "#A0560F", "#7A420B", "#563008", "#3A2005"]),
    "dark":  dict(bg="#0F0F12", panel="#16161B", ink="#F5F5F5", ink2="#A5A5B0", ink3="#6B6B77", grid="#2A2A33",
                  accent="#FF8C1A", teal="#4FD1C5", stop="#E63946",
                  ramp=["#5C380D", "#7C4A0F", "#9E5D10", "#C07112", "#E28016", "#FF8C1A", "#FFA245", "#FFB86B"]),
}
T = THEMES["light"]
def apply_theme(name):
    global T; T = THEMES[name]
    plt.rcParams.update({
        "figure.facecolor": T["bg"], "axes.facecolor": T["panel"], "savefig.facecolor": T["bg"],
        "axes.edgecolor": T["grid"], "axes.labelcolor": T["ink2"], "xtick.color": T["ink2"], "ytick.color": T["ink2"],
        "text.color": T["ink"], "grid.color": T["grid"], "grid.linewidth": 0.6, "axes.grid": True, "axes.axisbelow": True,
        "axes.spines.top": False, "axes.spines.right": False, "font.size": 9.5, "axes.titlesize": 10.5,
        "axes.titleweight": "semibold", "legend.frameon": False, "figure.dpi": 110,
    })

def width_colors(widths):
    widths = sorted(widths); cmap = LinearSegmentedColormap.from_list("w", T["ramp"])
    return {w: to_hex(cmap(i / max(len(widths) - 1, 1))) for i, w in enumerate(widths)}

def clock_min(s):  # "HH:MM:SS" -> minutes since 9:30
    h, m = int(s[:2]), int(s[3:5]); return (h - 9) * 60 + m - 30
def fmt_clock(m):
    m = int(m) + 570; return f"{m // 60}:{m % 60:02d}"
def clock_axis(ax, exit_min):
    ticks = [0, 60, 120, 180, 240, 300, 360]
    ax.set_xticks(ticks); ax.set_xticklabels([fmt_clock(t) for t in ticks]); ax.set_xlim(0, 392)
    ax.axvline(exit_min, color=T["ink3"], lw=1, ls=":")
    ax.text(exit_min + 3, ax.get_ylim()[0], "exit", color=T["ink3"], fontsize=8, va="bottom")

def bs_fly_pct(r, iv=0.15, W=30.0):
    """flat-vol model: % of max at center as a function of width/sigma"""
    S = 6500.0; T_ = (W / (S * iv * r)) ** 2
    def c(K):
        v = iv * math.sqrt(T_); d1 = (math.log(S / K) + .5 * iv * iv * T_) / v
        return S * norm.cdf(d1) - K * norm.cdf(d1 - v)
    K1 = S - W; return (c(K1) - 2 * c(S) + c(S + W)) / W

def caption(fig, text):
    fig.text(0.01, 0.005, text, fontsize=8.6, color=T["ink2"], ha="left", va="bottom", wrap=True)

# ---------------------------------------------------------------- figures
INDEX = []
def save(fig, out, name, question, answer):
    p = out / name; fig.savefig(p, bbox_inches="tight"); plt.close(fig)
    INDEX.append((name, question, answer)); print(f"  {name}  —  {answer}")

def fig01_surface(rows, out, exit_min):
    rows = rows.assign(bin=(rows.cmin // 30) * 30)
    syms = sorted(rows.symbol.unique()); protos = ["constant_r2r", "constant_sigma"]
    fig, axes = plt.subplots(len(syms), 2, figsize=(12, 3.2 * len(syms) + 0.8), squeeze=False)
    ans = []
    for i, sym in enumerate(syms):
        for j, pr in enumerate(protos):
            ax = axes[i, j]; d = rows[(rows.symbol == sym) & (rows.protocol == pr)]
            if d.empty: ax.set_visible(False); continue
            g = d.groupby(["width_strikes", "bin"]).pct_of_max_center.mean().unstack()
            r = d.groupby(["width_strikes", "bin"]).width_over_sigma.mean().unstack()
            im = ax.imshow(g.values, aspect="auto", origin="lower", cmap=LinearSegmentedColormap.from_list("o", T["ramp"]), vmin=0, vmax=1,
                           extent=[g.columns.min(), g.columns.max() + 30, -0.5, len(g.index) - 0.5])
            X, Y = np.meshgrid(g.columns + 15, np.arange(len(g.index)))
            cs = ax.contour(X, Y, r.values, levels=[0.5, 1.0, 2.0], colors=[T["ink"]], linewidths=0.9, linestyles=["dotted", "solid", "dashed"])
            ax.clabel(cs, fmt={0.5: "w/σ ½", 1.0: "w/σ 1", 2.0: "w/σ 2"}, fontsize=7.5, colors=T["ink"])
            ax.set_yticks(range(len(g.index))); ax.set_yticklabels([f"{int(w)} str" for w in g.index]); ax.grid(False)
            ax.set_title(f"{sym} · {'constant R2R' if pr == 'constant_r2r' else 'constant σ-distance'}")
            clock_axis(ax, exit_min)
            if pr == "constant_r2r":
                at = d[d.cmin >= exit_min - 1].groupby("width_strikes").pct_of_max_center.mean()
                if len(at) > 1: ans.append(f"{sym}: {at.iloc[-1]:.0%} of max on the widest vs {at.iloc[0]:.0%} on the narrowest at exit")
    fig.colorbar(im, ax=axes.ravel().tolist(), fraction=0.02, pad=0.01, label="% of max at center")
    fig.suptitle("01 · Maturity surface — mean % of max realized at center, across all sessions", x=0.01, ha="left")
    a = " · ".join(ans) if ans else "n/a"
    caption(fig, f"Q: does the wide-first diagonal hold across the bank? Contours = mean width/σ. If the colour follows the contours, the invariant holds.  A: {a}")
    save(fig, out, "01_maturity_surface.png", "Does the wide-first diagonal hold across sessions?", a)

def fig02_returns(rows, out, exit_min, wc):
    for pr in ["constant_r2r", "constant_sigma"]:
        d = rows[rows.protocol == pr]
        if d.empty: continue
        fig, axes = plt.subplots(1, 2, figsize=(12, 4.2), sharex=True)
        d = d.assign(bin=(d.cmin // 15) * 15)
        for ax, col, ttl in ((axes[0], "return_center", "at center strike (conditional on being right)"), (axes[1], "return_spot", "at actual spot (what it was really worth)")):
            for w in sorted(d.width_strikes.unique()):
                g = d[d.width_strikes == w].groupby("bin")[col]
                med, lo, hi = g.median(), g.quantile(.25), g.quantile(.75)
                ax.fill_between(med.index, lo, hi, color=wc[w], alpha=0.12, lw=0)
                ax.plot(med.index, med, color=wc[w], lw=1.8, label=f"{int(w)} strikes")
                if w in (min(wc), max(wc)): ax.text(med.index[-1] + 4, med.iloc[-1], f"{int(w)}", color=wc[w], fontsize=8, va="center")
            ax.axhline(0, color=T["ink3"], lw=0.8); ax.set_title(f"Return on risk {ttl}"); ax.set_ylabel("× risk")
            ax.yaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(1.0)); clock_axis(ax, exit_min)
        axes[0].legend(loc="upper left", fontsize=8, ncol=2)
        at = d[d.cmin >= exit_min - 1].groupby("width_strikes").return_center.median()
        gap = (1 + at.iloc[-1]) / (1 + at.iloc[0]) if len(at) > 1 and (1 + at.iloc[0]) > 0 else float("nan")
        a = f"wide/narrow return ratio at exit ≈ {gap:.1f}× (model for this regime ≈ 2.2×; VIX-22 day was ≈ 5×)"
        fig.suptitle(f"02 · Return curves — median with IQR band · {'constant R2R' if pr == 'constant_r2r' else 'constant σ-distance'}", x=0.01, ha="left")
        caption(fig, f"Q: what is the return path per width, and how much does it vary day to day?  A: {a}")
        save(fig, out, f"02_returns_{pr}.png", "Return path per width", a)

def fig03_invariant(rows, out, wc, facet_symbol=False, name="03_invariant.png", title="03 · The invariant"):
    d = rows.dropna(subset=["width_over_sigma", "pct_of_max_center"]); d = d[(d.width_over_sigma > 0.05) & (d.width_over_sigma < 20)]
    iv_med = float(d.atm_iv0.median()) if "atm_iv0" in d else 0.15
    xs = np.logspace(-1.3, 1.3, 120); model = np.array([bs_fly_pct(x, iv_med) for x in xs])
    syms = sorted(d.symbol.unique()) if facet_symbol else [None]
    fig, axes = plt.subplots(2, len(syms), figsize=(5.2 * len(syms) + 1, 6.4), squeeze=False, sharex=True, gridspec_kw=dict(height_ratios=[3, 1.4]))
    ans = []
    for j, sym in enumerate(syms):
        dd = d if sym is None else d[d.symbol == sym]
        ax, axr = axes[0, j], axes[1, j]
        for w in sorted(dd.width_strikes.unique()):
            g = dd[dd.width_strikes == w]
            ax.scatter(g.width_over_sigma, g.pct_of_max_center, s=5, color=wc[w], alpha=0.25, lw=0, label=f"{int(w)} str")
            res = g.pct_of_max_center - np.interp(np.log(g.width_over_sigma), np.log(xs), model)
            axr.scatter(g.width_over_sigma, res, s=5, color=wc[w], alpha=0.25, lw=0)
        ax.plot(xs, model, color=T["ink"], lw=1.6, label=f"flat-vol model @ IV {iv_med:.0%}")
        ax.set_xscale("log"); ax.set_ylim(0, 1); ax.set_ylabel("% of max at center"); ax.yaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(1.0))
        ax.set_title(sym or "all symbols"); axr.axhline(0, color=T["ink"], lw=0.8); axr.set_ylabel("point − model"); axr.set_xlabel("width ÷ σ remaining (log)")
        if j == 0: ax.legend(fontsize=7.5, loc="upper left", ncol=2)
        # kurtosis signature: mean residual narrow vs wide
        r_by_w = dd.assign(res=dd.pct_of_max_center - np.interp(np.log(dd.width_over_sigma), np.log(xs), model)).groupby("width_strikes").res.mean()
        if len(r_by_w) > 1: ans.append(f"{sym or 'all'}: mean residual narrowest {r_by_w.iloc[0]:+.2f}, widest {r_by_w.iloc[-1]:+.2f}")
    a = " · ".join(ans)
    fig.suptitle(f"{title} — % of max at center vs width/σ, every point in the bank", x=0.01, ha="left")
    caption(fig, f"Q: is maturity a function of width/σ alone?  Collapse onto one curve = yes. Wide above / narrow below = kurtosis premium.  A: {a}")
    save(fig, out, name, "Is maturity a function of width/σ alone?", a)

def fig04_premium(rows, out, wc):
    d = rows[rows.protocol == "constant_r2r"].groupby(["symbol", "day", "width_strikes"]).entry_premium_ratio.first().reset_index()
    syms = sorted(d.symbol.unique())
    fig, axes = plt.subplots(1, len(syms), figsize=(4.4 * len(syms) + 1, 4), squeeze=False, sharey=True); ans = []
    for j, sym in enumerate(syms):
        ax = axes[0, j]; dd = d[d.symbol == sym]; g = dd.groupby("width_strikes").entry_premium_ratio
        m, lo, hi = g.mean(), g.min(), g.max()
        ax.vlines(m.index, lo, hi, color=T["ink3"], lw=1.2)
        ax.scatter(m.index, m, s=46, color=[wc[w] for w in m.index], zorder=3, edgecolor=T["bg"], lw=1)
        ax.axhline(1, color=T["ink"], lw=0.9, ls="--"); ax.set_title(sym); ax.set_xlabel("width (strikes)"); ax.set_xticks(list(m.index))
        if j == 0: ax.set_ylabel("entry debit ÷ flat-vol model debit")
        if len(m) > 1: ans.append(f"{sym}: {m.iloc[0]:.2f}× narrowest → {m.iloc[-1]:.2f}× widest")
    a = " · ".join(ans)
    fig.suptitle("04 · Entry premium ratio — do narrow flies price rich against a flat model? (constant R2R, mean with min–max)", x=0.01, ha="left")
    caption(fig, f"Q: the kurtosis test. Declining with width and > 1 at the narrow end = the VIX-22 effect holds in low vol.  A: {a}")
    save(fig, out, "04_entry_premium.png", "Do narrow flies price rich at the open?", a)

def fig05_pair(rows, out, exit_min, wc, pair):
    d = rows[rows.protocol == "constant_r2r"]
    if pair is None:
        by = d.groupby("day").atm_iv0.first(); pair = (str(by.idxmax()), str(by.idxmin()))
    hi, lo = pair
    dd = d[d.day.astype(str).isin(pair)].assign(bin=(d.cmin // 15) * 15)
    ws = sorted(dd.width_strikes.unique()); n = len(ws)
    fig, axes = plt.subplots(1, n, figsize=(2.6 * n + 1, 3.6), sharey=True, squeeze=False); ans = []
    for ax, w in zip(axes[0], ws):
        for day, ls in ((hi, "-"), (lo, "--")):
            g = dd[(dd.width_strikes == w) & (dd.day.astype(str) == day)].groupby("bin").pct_of_max_center.mean()
            ivd = dd[dd.day.astype(str) == day].atm_iv0.iloc[0] if len(dd[dd.day.astype(str) == day]) else float("nan")
            ax.plot(g.index, g, color=wc[w], lw=1.8, ls=ls, label=f"{day} · IV {ivd:.1%}")
        ax.set_title(f"{int(w)} strikes"); ax.set_ylim(0, 1); clock_axis(ax, exit_min); ax.yaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(1.0))
        g1 = dd[(dd.width_strikes == w) & (dd.day.astype(str) == hi) & (dd.cmin >= exit_min - 1)].pct_of_max_center.mean()
        g2 = dd[(dd.width_strikes == w) & (dd.day.astype(str) == lo) & (dd.cmin >= exit_min - 1)].pct_of_max_center.mean()
        if np.isfinite(g1) and np.isfinite(g2): ans.append(f"{int(w)}: {g2 - g1:+.0%}")
    axes[0, 0].legend(fontsize=7.5, loc="upper left"); axes[0, 0].set_ylabel("% of max at center")
    a = "low-vol day minus high-vol day at exit, by width → " + ", ".join(ans)
    fig.suptitle(f"05 · The regime pair — {hi} (solid) vs {lo} (dashed)", x=0.01, ha="left")
    caption(fig, f"Q: does a lower σ pull maturity earlier for every width?  Positive = every difference above is positive.  A: {a}")
    save(fig, out, "05_regime_pair.png", "Does lower σ pull maturity earlier?", a)

def fig06_t50(rows, out, exit_min, wc):
    fig, axes = plt.subplots(1, 2, figsize=(11, 4), sharey=True); ans = []
    for ax, pr in zip(axes, ["constant_r2r", "constant_sigma"]):
        d = rows[rows.protocol == pr].sort_values("cmin")
        rec = []
        for (sym, day, w), g in d.groupby(["symbol", "day", "width_strikes"]):
            h = g[g.pct_of_max_center >= 0.5]
            rec.append(dict(w=w, t=h.cmin.iloc[0] if len(h) else 395, hit=len(h) > 0))
        r = pd.DataFrame(rec)
        if r.empty: continue
        for w in sorted(r.w.unique()):
            g = r[r.w == w]; jitter = (np.random.default_rng(1).random(len(g)) - .5) * 0.5
            ax.scatter(w + jitter, g.t, s=18, color=wc[w], alpha=0.7, lw=0)
            ax.plot([w - .35, w + .35], [g.t.median()] * 2, color=T["ink"], lw=2)
        ax.set_yticks([0, 60, 120, 180, 240, 300, 360, 390]); ax.set_yticklabels([fmt_clock(t) for t in [0, 60, 120, 180, 240, 300, 360, 390]])
        ax.axhline(exit_min, color=T["ink3"], ls=":"); ax.axhline(390, color=T["stop"], lw=0.8); ax.text(ax.get_xlim()[0], 392, "never", color=T["stop"], fontsize=7.5)
        ax.set_title("constant R2R" if pr == "constant_r2r" else "constant σ-distance"); ax.set_xlabel("width (strikes)")
        med = r.groupby("w").t.median(); never = 1 - r.groupby("w").hit.mean()
        ans.append(f"{'R2R' if pr == 'constant_r2r' else 'σ'}: widest reaches 50% at ~{fmt_clock(med.iloc[-1])}, narrowest ~{fmt_clock(med.iloc[0])} ({never.iloc[0]:.0%} of days never)")
    axes[0].set_ylabel("clock when value at center first reaches 50% of max")
    a = " · ".join(ans)
    fig.suptitle("06 · Time to half-maturity — one dot per session, bar = median", x=0.01, ha="left")
    caption(fig, f"Q: when does each width reach half its value, and how tight is it?  Model (low vol): 35 ≈ 3:00, 25–30 ≈ 3:30, narrower ≈ 3:55.  A: {a}")
    save(fig, out, "06_time_to_half.png", "When does each width reach half-maturity?", a)

def fig07_confound(rows, out, wc, sigma0=1.05):
    d = rows[rows.protocol == "constant_r2r"].groupby(["symbol", "day", "width_strikes"]).body_sigma_out.first().reset_index()
    fig, ax = plt.subplots(figsize=(7, 4))
    for w in sorted(d.width_strikes.unique()):
        g = d[d.width_strikes == w]; jitter = (np.random.default_rng(2).random(len(g)) - .5) * 0.5
        ax.scatter(w + jitter, g.body_sigma_out, s=18, color=wc[w], alpha=0.7, lw=0)
        ax.plot([w - .35, w + .35], [g.body_sigma_out.median()] * 2, color=T["ink"], lw=2)
    ax.axhline(sigma0, color=T["teal"], lw=1.2, ls="--"); ax.text(ax.get_xlim()[1], sigma0, f" constant-σ protocol ({sigma0}σ)", color=T["teal"], fontsize=8, va="center")
    ax.axhline(0, color=T["ink3"], lw=0.8); ax.set_xlabel("width (strikes)"); ax.set_ylabel("body distance from spot at entry (σ)")
    m = d.groupby("width_strikes").body_sigma_out.median()
    a = f"under constant R2R the body sits {m.iloc[0]:.2f}σ out on the narrowest and {m.iloc[-1]:.2f}σ on the widest" if len(m) > 1 else "n/a"
    fig.suptitle("07 · The confound — where constant R2R puts the body", x=0.01, ha="left")
    caption(fig, f"Q: are width and location moving together in Coach's protocol?  A: {a}")
    save(fig, out, "07_confound.png", "Where does constant R2R put the body?", a)

def fig09_daysheet(rows, out, exit_min, wc):
    d = rows[rows.cmin >= exit_min - 1].groupby(["symbol", "day", "protocol", "width_strikes"]).agg(
        ret=("return_center", "first"), iv=("atm_iv0", "first"), rv=("realized_vol", "first"), ir=("implied_over_realized", "first")).reset_index()
    for sym in sorted(d.symbol.unique()):
        dd = d[d.symbol == sym]; days = sorted(dd.day.unique()); n = len(days); cols = 4; r = math.ceil(n / cols)
        fig, axes = plt.subplots(r, cols, figsize=(3.4 * cols, 2.6 * r + 0.6), squeeze=False, sharey=True)
        prof = dd[dd.protocol == "constant_r2r"].pivot_table(index="day", columns="width_strikes", values="ret")
        dist = ((prof - prof.median()) ** 2).sum(axis=1).sort_values(ascending=False)
        for i, day in enumerate(days):
            ax = axes[i // cols, i % cols]; g = dd[dd.day == day]; ws = sorted(g.width_strikes.unique()); x = np.arange(len(ws))
            for k, pr in enumerate(["constant_r2r", "constant_sigma"]):
                v = g[g.protocol == pr].set_index("width_strikes").ret.reindex(ws)
                ax.bar(x + (k - .5) * .38, v, width=.36, color=[wc[w] for w in ws], alpha=1 if k == 0 else .45, lw=0)
            ax.set_xticks(x); ax.set_xticklabels([int(w) for w in ws], fontsize=7.5); ax.axhline(0, color=T["ink3"], lw=.7)
            m = g.iloc[0]; ax.set_title(f"{day} · IV {m.iv:.1%} · RV {m.rv:.1%} · I/R {m.ir:.2f}", fontsize=8.2)
            ax.yaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(1.0))
            if str(day) in [str(x) for x in dist.index[:3]]: ax.set_facecolor("#FFF3E6" if T is THEMES["light"] else "#2A1E10")
        for k in range(n, r * cols): axes[k // cols, k % cols].set_visible(False)
        a = f"{sym}: most anomalous sessions {', '.join(str(x) for x in dist.index[:3])} (highlighted)"
        fig.suptitle(f"09 · Day sheet — {sym} · return at center at exit by width (solid = constant R2R, faint = constant σ)", x=0.01, ha="left")
        caption(fig, f"Q: which sessions are outliers?  A: {a}")
        save(fig, out, f"09_daysheet_{sym}.png", "Which sessions are outliers?", a)

def fig10_theta_sign(rows, out, exit_min):
    d = rows.assign(bin=(rows.cmin // 30) * 30, pos=(rows.theta_per_min > 0).astype(float))
    d = d[d.protocol == "constant_r2r"]; syms = sorted(d.symbol.unique())
    fig, axes = plt.subplots(len(syms), 1, figsize=(9, 2.8 * len(syms) + 0.8), squeeze=False); ans = []
    for i, sym in enumerate(syms):
        ax = axes[i, 0]; g = d[d.symbol == sym].groupby(["width_strikes", "bin"]).pos.mean().unstack()
        im = ax.imshow(g.values, aspect="auto", origin="lower", cmap=LinearSegmentedColormap.from_list("t", ["#FFFFFF" if T is THEMES["light"] else T["panel"], T["teal"]]), vmin=0, vmax=1,
                       extent=[g.columns.min(), g.columns.max() + 30, -0.5, len(g.index) - .5])
        ax.set_yticks(range(len(g.index))); ax.set_yticklabels([f"{int(w)} str" for w in g.index]); ax.grid(False); ax.set_title(sym); clock_axis(ax, exit_min)
        ans.append(f"{sym}: positive theta at spot on {d[d.symbol == sym].pos.mean():.0%} of tracked points")
    fig.colorbar(im, ax=axes.ravel().tolist(), fraction=0.03, pad=0.01, label="share of points with θ > 0 at spot")
    a = " · ".join(ans)
    fig.suptitle("10 · Theta sign at location — is a fly outside its tent ever paid to wait?", x=0.01, ha="left")
    caption(fig, f"Q: the curve-dynamics prediction says near-zero in low vol, with a patch on the Aug 25–26 expansion.  A: {a}")
    save(fig, out, "10_theta_sign.png", "Is a fly outside the tent ever paid to wait?", a)

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True); ap.add_argument("--exit", default="15:00")
    ap.add_argument("--pair", default=None, help="two dates, comma-separated"); ap.add_argument("--symbols", default=None)
    ap.add_argument("--dpi", type=int, default=150); ap.add_argument("--theme", default="light", choices=["light", "dark"])
    a = ap.parse_args(); apply_theme(a.theme); plt.rcParams["savefig.dpi"] = a.dpi
    inp = Path(a.inp); out = inp / "figs"; out.mkdir(exist_ok=True)
    rows = pd.read_parquet(inp / "width_maturity_rows.parquet")
    if a.symbols: rows = rows[rows.symbol.isin(a.symbols.split(","))]
    rows = rows.assign(cmin=rows.clock.map(clock_min)); rows = rows[rows.cmin >= 0]
    exit_min = clock_min(a.exit + ":00" if len(a.exit) == 5 else a.exit)
    wc = width_colors(rows.width_strikes.unique())
    pair = tuple(a.pair.split(",")) if a.pair else None
    print(f"{len(rows):,} rows · {rows.day.nunique()} days · {rows.symbol.nunique()} symbols · widths {sorted(rows.width_strikes.unique())}")
    fig01_surface(rows, out, exit_min); fig02_returns(rows, out, exit_min, wc); fig03_invariant(rows, out, wc)
    fig04_premium(rows, out, wc); fig05_pair(rows, out, exit_min, wc, pair); fig06_t50(rows, out, exit_min, wc)
    fig07_confound(rows, out, wc)
    if rows.symbol.nunique() > 1: fig03_invariant(rows, out, wc, facet_symbol=True, name="08_invariant_by_symbol.png", title="08 · Cross-symbol invariant")
    fig09_daysheet(rows, out, exit_min, wc); fig10_theta_sign(rows, out, exit_min)
    with open(out / "index.md", "w") as f:
        f.write("# Width Maturity — figures\n\n| figure | question | answer |\n|---|---|---|\n")
        for n, q, ans in INDEX: f.write(f"| `{n}` | {q} | {ans} |\n")
    print(f"\nwrote {len(INDEX)} figures + index.md to {out}/")

if __name__ == "__main__":
    main()