#!/usr/bin/env python3
"""
Compare daily VIX (VIX + VIX1D) with the market's daily high–low range.

What it does
------------
1. Pulls daily bars for:
   - ^VIX   — Cboe 30-day implied vol
   - ^VIX1D — Cboe Daily / 1-day VIX (when Yahoo has history)
   - SPY    — proxy for cash SPX range (liquid, full OHLC)

2. Converts annualized VIX levels to an approximate *expected 1-day % move*:
       expected_daily_% ≈ VIX / sqrt(252)

3. Measures realized *intraday range %*:
       range_% = 100 * (High − Low) / Close

4. Writes:
   - matplotlib multi-panel PNG under --out-dir
   - interactive Plotly HTML under --scrots-dir (default: ./scrots)
   - optional CSV under --out-dir

Usage
-----
  server/.venv/bin/python scripts/vix_vs_daily_range.py
  server/.venv/bin/python scripts/vix_vs_daily_range.py --period 1y --underlying SPY
  server/.venv/bin/python scripts/vix_vs_daily_range.py --start 2024-01-01 --end 2026-08-01

Notes
-----
- VIX and VIX1D are annualized vol units; dividing by sqrt(252) puts them on a
  daily-% scale comparable to range_%.
- High–Low range is *not* the same as close-to-close 1σ move. For a Brownian
  path the expected (H−L)/σ is larger than 1, so range often sits above the
  VIX daily-equivalent band even when pricing is "fair".
- Requires: yfinance, pandas, matplotlib, numpy, plotly (server/.venv).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import yfinance as yf
from plotly.subplots import make_subplots

TRADING_DAYS = 252.0
VIX_TICKER = "^VIX"
VIX1D_TICKER = "^VIX1D"
DEFAULT_UNDERLYING = "SPY"
REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SCROTS_DIR = REPO_ROOT / "scrots"


def _flatten_columns(df: pd.DataFrame, ticker: str) -> pd.DataFrame:
    """Normalize yfinance multi-index / single-index OHLC to plain columns."""
    if isinstance(df.columns, pd.MultiIndex):
        # group_by=None → columns like ('Close', '^VIX') or ('Close', 'SPY')
        level0 = df.columns.get_level_values(0)
        level1 = df.columns.get_level_values(1)
        if ticker in set(level1.astype(str)):
            out = df.xs(ticker, axis=1, level=1, drop_level=True).copy()
        elif ticker in set(level0.astype(str)):
            out = df.xs(ticker, axis=1, level=0, drop_level=True).copy()
        else:
            # single-ticker download: second level is the ticker for every col
            out = df.copy()
            out.columns = level0
    else:
        out = df.copy()
    out.columns = [str(c).title() for c in out.columns]
    return out


def download_ohlc(ticker: str, *, period: str | None, start: str | None, end: str | None) -> pd.DataFrame:
    kwargs: dict = {"progress": False, "auto_adjust": True, "threads": False}
    if start:
        kwargs["start"] = start
        if end:
            kwargs["end"] = end
    else:
        kwargs["period"] = period or "2y"

    raw = yf.download(ticker, **kwargs)
    if raw is None or raw.empty:
        return pd.DataFrame()

    df = _flatten_columns(raw, ticker)
    need = {"Open", "High", "Low", "Close"}
    missing = need - set(df.columns)
    if missing:
        raise RuntimeError(f"{ticker}: missing columns {sorted(missing)}; got {list(df.columns)}")

    df = df[list(need)].dropna(how="any")
    df.index = pd.to_datetime(df.index).tz_localize(None)
    df = df.sort_index()
    return df


def build_frame(
    underlying: str,
    *,
    period: str | None,
    start: str | None,
    end: str | None,
) -> pd.DataFrame:
    u = download_ohlc(underlying, period=period, start=start, end=end)
    vix = download_ohlc(VIX_TICKER, period=period, start=start, end=end)
    vix1d = download_ohlc(VIX1D_TICKER, period=period, start=start, end=end)

    if u.empty:
        raise SystemExit(f"No bars for underlying {underlying!r}")
    if vix.empty:
        raise SystemExit(f"No bars for {VIX_TICKER}")

    out = pd.DataFrame(index=u.index)
    out["u_open"] = u["Open"]
    out["u_high"] = u["High"]
    out["u_low"] = u["Low"]
    out["u_close"] = u["Close"]
    out["range_pct"] = 100.0 * (out["u_high"] - out["u_low"]) / out["u_close"]

    out["vix"] = vix["Close"].reindex(out.index)
    out["vix_daily_pct"] = out["vix"] / np.sqrt(TRADING_DAYS)

    if not vix1d.empty:
        out["vix1d"] = vix1d["Close"].reindex(out.index)
        out["vix1d_daily_pct"] = out["vix1d"] / np.sqrt(TRADING_DAYS)
    else:
        out["vix1d"] = np.nan
        out["vix1d_daily_pct"] = np.nan

    # Prior-session VIX as a forecast of *today's* range (common comparison).
    out["vix_prior_daily_pct"] = out["vix_daily_pct"].shift(1)
    out["vix1d_prior_daily_pct"] = out["vix1d_daily_pct"].shift(1)

    out["range_over_vix"] = out["range_pct"] / out["vix_prior_daily_pct"]
    out["range_over_vix1d"] = out["range_pct"] / out["vix1d_prior_daily_pct"]

    return out


def _corr(a: pd.Series, b: pd.Series) -> float:
    pair = pd.concat([a, b], axis=1).dropna()
    if len(pair) < 5:
        return float("nan")
    return float(pair.iloc[:, 0].corr(pair.iloc[:, 1]))


def plot_comparison(df: pd.DataFrame, underlying: str, out_path: Path) -> dict[str, float]:
    has_vix1d = df["vix1d"].notna().sum() >= 20

    fig = plt.figure(figsize=(14, 11), constrained_layout=True)
    gs = fig.add_gridspec(3, 2, height_ratios=[1.15, 1.0, 1.0])

    ax_ts = fig.add_subplot(gs[0, :])
    ax_sc_vix = fig.add_subplot(gs[1, 0])
    ax_sc_vix1d = fig.add_subplot(gs[1, 1])
    ax_ratio = fig.add_subplot(gs[2, 0])
    ax_hist = fig.add_subplot(gs[2, 1])

    # --- Panel 1: time series (same units: daily %) ---
    ax_ts.plot(df.index, df["range_pct"], color="#1f4e79", lw=1.0, alpha=0.85, label=f"{underlying} daily range %")
    ax_ts.plot(
        df.index,
        df["vix_prior_daily_pct"],
        color="#c0392b",
        lw=1.1,
        alpha=0.9,
        label="Prior VIX → daily % (VIX/√252)",
    )
    if has_vix1d:
        ax_ts.plot(
            df.index,
            df["vix1d_prior_daily_pct"],
            color="#e67e22",
            lw=1.1,
            alpha=0.9,
            label="Prior VIX1D → daily %",
        )
    ax_ts.set_ylabel("Percent")
    ax_ts.set_title(
        f"Daily VIX vs {underlying} high–low range\n"
        f"(VIX levels shown as expected 1-day % = index / √252; prior close as forecast)"
    )
    ax_ts.legend(loc="upper right", fontsize=9, framealpha=0.92)
    ax_ts.grid(True, alpha=0.3)
    ax_ts.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))
    ax_ts.xaxis.set_major_locator(mdates.AutoDateLocator())

    # --- Panel 2: scatter prior VIX daily-equiv vs range ---
    sc = df.dropna(subset=["vix_prior_daily_pct", "range_pct"])
    ax_sc_vix.scatter(sc["vix_prior_daily_pct"], sc["range_pct"], s=12, alpha=0.45, c="#1f4e79", edgecolors="none")
    if len(sc) >= 5:
        lo = float(min(sc["vix_prior_daily_pct"].min(), sc["range_pct"].min()))
        hi = float(max(sc["vix_prior_daily_pct"].max(), sc["range_pct"].max()))
        ax_sc_vix.plot([lo, hi], [lo, hi], "k--", lw=1, alpha=0.5, label="1:1")
        # OLS line
        x = sc["vix_prior_daily_pct"].to_numpy()
        y = sc["range_pct"].to_numpy()
        coef = np.polyfit(x, y, 1)
        xs = np.linspace(x.min(), x.max(), 50)
        ax_sc_vix.plot(xs, np.polyval(coef, xs), color="#c0392b", lw=1.5, label=f"fit y={coef[0]:.2f}x+{coef[1]:.2f}")
    r_vix = _corr(sc["vix_prior_daily_pct"], sc["range_pct"])
    ax_sc_vix.set_xlabel("Prior VIX daily % (VIX/√252)")
    ax_sc_vix.set_ylabel(f"{underlying} range %")
    ax_sc_vix.set_title(f"Prior VIX vs range  (ρ = {r_vix:.2f})")
    ax_sc_vix.legend(fontsize=8)
    ax_sc_vix.grid(True, alpha=0.3)

    # --- Panel 3: scatter prior VIX1D ---
    if has_vix1d:
        sc1 = df.dropna(subset=["vix1d_prior_daily_pct", "range_pct"])
        ax_sc_vix1d.scatter(
            sc1["vix1d_prior_daily_pct"], sc1["range_pct"], s=12, alpha=0.45, c="#e67e22", edgecolors="none"
        )
        if len(sc1) >= 5:
            lo = float(min(sc1["vix1d_prior_daily_pct"].min(), sc1["range_pct"].min()))
            hi = float(max(sc1["vix1d_prior_daily_pct"].max(), sc1["range_pct"].max()))
            ax_sc_vix1d.plot([lo, hi], [lo, hi], "k--", lw=1, alpha=0.5, label="1:1")
            x = sc1["vix1d_prior_daily_pct"].to_numpy()
            y = sc1["range_pct"].to_numpy()
            coef = np.polyfit(x, y, 1)
            xs = np.linspace(x.min(), x.max(), 50)
            ax_sc_vix1d.plot(xs, np.polyval(coef, xs), color="#1f4e79", lw=1.5, label=f"fit y={coef[0]:.2f}x+{coef[1]:.2f}")
        r_vix1d = _corr(sc1["vix1d_prior_daily_pct"], sc1["range_pct"])
        ax_sc_vix1d.set_xlabel("Prior VIX1D daily % (VIX1D/√252)")
        ax_sc_vix1d.set_ylabel(f"{underlying} range %")
        ax_sc_vix1d.set_title(f"Prior Daily VIX (VIX1D) vs range  (ρ = {r_vix1d:.2f})")
        ax_sc_vix1d.legend(fontsize=8)
        ax_sc_vix1d.grid(True, alpha=0.3)
    else:
        r_vix1d = float("nan")
        ax_sc_vix1d.text(0.5, 0.5, "VIX1D history unavailable", ha="center", va="center", transform=ax_sc_vix1d.transAxes)
        ax_sc_vix1d.set_title("Prior Daily VIX (VIX1D) vs range")
        ax_sc_vix1d.set_xticks([])
        ax_sc_vix1d.set_yticks([])

    # --- Panel 4: rolling ratio range / VIX daily ---
    roll = 21
    ratio = df["range_over_vix"].rolling(roll, min_periods=max(5, roll // 3)).median()
    ax_ratio.plot(df.index, ratio, color="#1f4e79", lw=1.3, label=f"{roll}d median range/VIX_daily")
    if has_vix1d:
        ratio1 = df["range_over_vix1d"].rolling(roll, min_periods=max(5, roll // 3)).median()
        ax_ratio.plot(df.index, ratio1, color="#e67e22", lw=1.3, label=f"{roll}d median range/VIX1D_daily")
    ax_ratio.axhline(1.0, color="k", ls="--", lw=1, alpha=0.45)
    ax_ratio.set_ylabel("Ratio")
    ax_ratio.set_title("Realized range vs prior implied daily move")
    ax_ratio.legend(fontsize=8)
    ax_ratio.grid(True, alpha=0.3)
    ax_ratio.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))

    # --- Panel 5: histogram of ratios ---
    r_clean = df["range_over_vix"].replace([np.inf, -np.inf], np.nan).dropna()
    r_clean = r_clean[(r_clean > 0) & (r_clean < 8)]
    ax_hist.hist(r_clean, bins=40, color="#1f4e79", alpha=0.75, edgecolor="white", label="range / prior VIX daily")
    if has_vix1d:
        r1 = df["range_over_vix1d"].replace([np.inf, -np.inf], np.nan).dropna()
        r1 = r1[(r1 > 0) & (r1 < 8)]
        ax_hist.hist(r1, bins=40, color="#e67e22", alpha=0.45, edgecolor="white", label="range / prior VIX1D daily")
    ax_hist.axvline(1.0, color="k", ls="--", lw=1, alpha=0.5)
    ax_hist.set_xlabel("Range ÷ prior implied daily %")
    ax_hist.set_ylabel("Days")
    ax_hist.set_title("Distribution of range / implied daily")
    ax_hist.legend(fontsize=8)
    ax_hist.grid(True, alpha=0.3, axis="y")

    fig.suptitle(
        f"{underlying}  ·  {df.index.min().date()} → {df.index.max().date()}  ·  n={len(df.dropna(subset=['vix']))}",
        fontsize=11,
        y=1.01,
    )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)

    stats = {
        "n_days": float(len(df)),
        "corr_vix_range": r_vix,
        "corr_vix1d_range": r_vix1d,
        "median_range_pct": float(df["range_pct"].median()),
        "median_vix_daily_pct": float(df["vix_prior_daily_pct"].median()),
        "median_range_over_vix": float(df["range_over_vix"].replace([np.inf, -np.inf], np.nan).median()),
    }
    if has_vix1d:
        stats["median_vix1d_daily_pct"] = float(df["vix1d_prior_daily_pct"].median())
        stats["median_range_over_vix1d"] = float(
            df["range_over_vix1d"].replace([np.inf, -np.inf], np.nan).median()
        )
    return stats


def plot_comparison_plotly(df: pd.DataFrame, underlying: str, out_path: Path) -> Path:
    """Interactive Plotly multi-panel chart → HTML (hover, zoom, legend toggle)."""
    has_vix1d = df["vix1d"].notna().sum() >= 20
    r_vix = _corr(df["vix_prior_daily_pct"], df["range_pct"])
    r_vix1d = _corr(df["vix1d_prior_daily_pct"], df["range_pct"]) if has_vix1d else float("nan")

    fig = make_subplots(
        rows=3,
        cols=2,
        specs=[
            [{"colspan": 2}, None],
            [{}, {}],
            [{}, {}],
        ],
        row_heights=[0.38, 0.31, 0.31],
        vertical_spacing=0.10,
        horizontal_spacing=0.08,
        subplot_titles=(
            f"{underlying} daily range % vs prior VIX / VIX1D (daily % = index / √252)",
            f"Prior VIX vs range  (ρ = {r_vix:.2f})",
            f"Prior VIX1D vs range  (ρ = {r_vix1d:.2f})" if has_vix1d else "Prior VIX1D vs range (n/a)",
            "21d median range / prior implied daily",
            "Distribution of range / implied daily",
        ),
    )

    x = df.index

    fig.add_trace(
        go.Scatter(
            x=x,
            y=df["range_pct"],
            name=f"{underlying} daily range %",
            mode="lines",
            line=dict(color="#1f4e79", width=1.4),
            hovertemplate="%{x|%Y-%m-%d}<br>range: %{y:.3f}%<extra></extra>",
        ),
        row=1,
        col=1,
    )
    fig.add_trace(
        go.Scatter(
            x=x,
            y=df["vix_prior_daily_pct"],
            name="Prior VIX → daily %",
            mode="lines",
            line=dict(color="#c0392b", width=1.5),
            hovertemplate="%{x|%Y-%m-%d}<br>VIX daily: %{y:.3f}%<extra></extra>",
        ),
        row=1,
        col=1,
    )
    if has_vix1d:
        fig.add_trace(
            go.Scatter(
                x=x,
                y=df["vix1d_prior_daily_pct"],
                name="Prior VIX1D → daily %",
                mode="lines",
                line=dict(color="#e67e22", width=1.5),
                hovertemplate="%{x|%Y-%m-%d}<br>VIX1D daily: %{y:.3f}%<extra></extra>",
            ),
            row=1,
            col=1,
        )

    # Scatter: prior VIX vs range
    sc = df.dropna(subset=["vix_prior_daily_pct", "range_pct"])
    fig.add_trace(
        go.Scatter(
            x=sc["vix_prior_daily_pct"],
            y=sc["range_pct"],
            mode="markers",
            name="VIX scatter",
            marker=dict(size=6, color="#1f4e79", opacity=0.45),
            hovertemplate="VIX daily: %{x:.3f}%<br>range: %{y:.3f}%<extra></extra>",
            showlegend=False,
        ),
        row=2,
        col=1,
    )
    if len(sc) >= 5:
        lo = float(min(sc["vix_prior_daily_pct"].min(), sc["range_pct"].min()))
        hi = float(max(sc["vix_prior_daily_pct"].max(), sc["range_pct"].max()))
        fig.add_trace(
            go.Scatter(
                x=[lo, hi],
                y=[lo, hi],
                mode="lines",
                name="1:1",
                line=dict(color="black", width=1, dash="dash"),
                showlegend=False,
                hoverinfo="skip",
            ),
            row=2,
            col=1,
        )
        coef = np.polyfit(sc["vix_prior_daily_pct"].to_numpy(), sc["range_pct"].to_numpy(), 1)
        xs = np.linspace(float(sc["vix_prior_daily_pct"].min()), float(sc["vix_prior_daily_pct"].max()), 50)
        fig.add_trace(
            go.Scatter(
                x=xs,
                y=np.polyval(coef, xs),
                mode="lines",
                name=f"VIX fit y={coef[0]:.2f}x+{coef[1]:.2f}",
                line=dict(color="#c0392b", width=2),
                showlegend=False,
                hoverinfo="skip",
            ),
            row=2,
            col=1,
        )

    # Scatter: prior VIX1D vs range
    if has_vix1d:
        sc1 = df.dropna(subset=["vix1d_prior_daily_pct", "range_pct"])
        fig.add_trace(
            go.Scatter(
                x=sc1["vix1d_prior_daily_pct"],
                y=sc1["range_pct"],
                mode="markers",
                name="VIX1D scatter",
                marker=dict(size=6, color="#e67e22", opacity=0.45),
                hovertemplate="VIX1D daily: %{x:.3f}%<br>range: %{y:.3f}%<extra></extra>",
                showlegend=False,
            ),
            row=2,
            col=2,
        )
        if len(sc1) >= 5:
            lo = float(min(sc1["vix1d_prior_daily_pct"].min(), sc1["range_pct"].min()))
            hi = float(max(sc1["vix1d_prior_daily_pct"].max(), sc1["range_pct"].max()))
            fig.add_trace(
                go.Scatter(
                    x=[lo, hi],
                    y=[lo, hi],
                    mode="lines",
                    line=dict(color="black", width=1, dash="dash"),
                    showlegend=False,
                    hoverinfo="skip",
                ),
                row=2,
                col=2,
            )
            coef = np.polyfit(sc1["vix1d_prior_daily_pct"].to_numpy(), sc1["range_pct"].to_numpy(), 1)
            xs = np.linspace(
                float(sc1["vix1d_prior_daily_pct"].min()),
                float(sc1["vix1d_prior_daily_pct"].max()),
                50,
            )
            fig.add_trace(
                go.Scatter(
                    x=xs,
                    y=np.polyval(coef, xs),
                    mode="lines",
                    line=dict(color="#1f4e79", width=2),
                    showlegend=False,
                    hoverinfo="skip",
                ),
                row=2,
                col=2,
            )

    # Rolling ratio
    roll = 21
    ratio = df["range_over_vix"].rolling(roll, min_periods=max(5, roll // 3)).median()
    fig.add_trace(
        go.Scatter(
            x=x,
            y=ratio,
            name=f"{roll}d median range/VIX",
            mode="lines",
            line=dict(color="#1f4e79", width=1.6),
            hovertemplate="%{x|%Y-%m-%d}<br>ratio: %{y:.3f}<extra></extra>",
        ),
        row=3,
        col=1,
    )
    if has_vix1d:
        ratio1 = df["range_over_vix1d"].rolling(roll, min_periods=max(5, roll // 3)).median()
        fig.add_trace(
            go.Scatter(
                x=x,
                y=ratio1,
                name=f"{roll}d median range/VIX1D",
                mode="lines",
                line=dict(color="#e67e22", width=1.6),
                hovertemplate="%{x|%Y-%m-%d}<br>ratio: %{y:.3f}<extra></extra>",
            ),
            row=3,
            col=1,
        )
    fig.add_hline(y=1.0, line_dash="dash", line_color="black", opacity=0.45, row=3, col=1)

    # Histograms
    r_clean = df["range_over_vix"].replace([np.inf, -np.inf], np.nan).dropna()
    r_clean = r_clean[(r_clean > 0) & (r_clean < 8)]
    fig.add_trace(
        go.Histogram(
            x=r_clean,
            name="range / prior VIX daily",
            marker_color="#1f4e79",
            opacity=0.75,
            nbinsx=40,
            hovertemplate="bin: %{x:.2f}<br>count: %{y}<extra></extra>",
        ),
        row=3,
        col=2,
    )
    if has_vix1d:
        r1 = df["range_over_vix1d"].replace([np.inf, -np.inf], np.nan).dropna()
        r1 = r1[(r1 > 0) & (r1 < 8)]
        fig.add_trace(
            go.Histogram(
                x=r1,
                name="range / prior VIX1D daily",
                marker_color="#e67e22",
                opacity=0.5,
                nbinsx=40,
                hovertemplate="bin: %{x:.2f}<br>count: %{y}<extra></extra>",
            ),
            row=3,
            col=2,
        )
    fig.update_layout(barmode="overlay")
    fig.add_vline(x=1.0, line_dash="dash", line_color="black", opacity=0.5, row=3, col=2)

    n = int(df["vix"].notna().sum())
    fig.update_layout(
        title=dict(
            text=(
                f"Daily VIX vs {underlying} high–low range<br>"
                f"<sup>{df.index.min().date()} → {df.index.max().date()} · n={n} · "
                f"prior close as forecast</sup>"
            ),
            x=0.5,
            xanchor="center",
        ),
        height=980,
        width=1280,
        template="plotly_white",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(t=100, b=40, l=60, r=30),
        hovermode="x unified",
    )
    fig.update_yaxes(title_text="Percent", row=1, col=1)
    fig.update_xaxes(title_text="Prior VIX daily %", row=2, col=1)
    fig.update_yaxes(title_text=f"{underlying} range %", row=2, col=1)
    fig.update_xaxes(title_text="Prior VIX1D daily %", row=2, col=2)
    fig.update_yaxes(title_text=f"{underlying} range %", row=2, col=2)
    fig.update_yaxes(title_text="Ratio", row=3, col=1)
    fig.update_xaxes(title_text="Range ÷ prior implied daily %", row=3, col=2)
    fig.update_yaxes(title_text="Days", row=3, col=2)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.write_html(str(out_path), include_plotlyjs="cdn", full_html=True)
    return out_path


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Plot daily VIX / VIX1D vs underlying daily range.")
    p.add_argument("--underlying", default=DEFAULT_UNDERLYING, help="Yahoo ticker for range (default: SPY)")
    p.add_argument("--period", default="2y", help="yfinance period if --start not set (default: 2y)")
    p.add_argument("--start", default=None, help="Start date YYYY-MM-DD")
    p.add_argument("--end", default=None, help="End date YYYY-MM-DD")
    p.add_argument(
        "--out-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "output",
        help="Directory for matplotlib PNG/CSV (default: scripts/output)",
    )
    p.add_argument(
        "--scrots-dir",
        type=Path,
        default=DEFAULT_SCROTS_DIR,
        help="Directory for Plotly HTML (default: ./scrots)",
    )
    p.add_argument("--no-csv", action="store_true", help="Skip writing the merged CSV")
    p.add_argument("--no-matplotlib", action="store_true", help="Skip matplotlib PNG")
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    df = build_frame(args.underlying, period=args.period, start=args.start, end=args.end)

    stamp = f"{df.index.min().date()}_{df.index.max().date()}"
    base = f"vix_vs_range_{args.underlying}_{stamp}"
    png_path = args.out_dir / f"{base}.png"
    csv_path = args.out_dir / f"{base}.csv"
    html_path = args.scrots_dir / f"{base}.html"

    if args.no_matplotlib:
        # Still compute the same summary stats used in the console report.
        has_vix1d = df["vix1d"].notna().sum() >= 20
        stats = {
            "n_days": float(len(df)),
            "corr_vix_range": _corr(df["vix_prior_daily_pct"], df["range_pct"]),
            "corr_vix1d_range": _corr(df["vix1d_prior_daily_pct"], df["range_pct"]) if has_vix1d else float("nan"),
            "median_range_pct": float(df["range_pct"].median()),
            "median_vix_daily_pct": float(df["vix_prior_daily_pct"].median()),
            "median_range_over_vix": float(df["range_over_vix"].replace([np.inf, -np.inf], np.nan).median()),
        }
        if has_vix1d:
            stats["median_vix1d_daily_pct"] = float(df["vix1d_prior_daily_pct"].median())
            stats["median_range_over_vix1d"] = float(
                df["range_over_vix1d"].replace([np.inf, -np.inf], np.nan).median()
            )
    else:
        stats = plot_comparison(df, args.underlying, png_path)

    plot_comparison_plotly(df, args.underlying, html_path)

    if not args.no_csv:
        export_cols = [
            "u_open",
            "u_high",
            "u_low",
            "u_close",
            "range_pct",
            "vix",
            "vix_daily_pct",
            "vix_prior_daily_pct",
            "vix1d",
            "vix1d_daily_pct",
            "vix1d_prior_daily_pct",
            "range_over_vix",
            "range_over_vix1d",
        ]
        args.out_dir.mkdir(parents=True, exist_ok=True)
        df[export_cols].to_csv(csv_path, float_format="%.6f")

    print(f"Underlying : {args.underlying}")
    print(f"Window     : {df.index.min().date()} → {df.index.max().date()}  ({int(stats['n_days'])} sessions)")
    if not args.no_matplotlib:
        print(f"Plot (PNG) : {png_path}")
    print(f"Plotly     : {html_path}")
    if not args.no_csv:
        print(f"CSV        : {csv_path}")
    print()
    print("Summary")
    print(f"  median {args.underlying} range %          : {stats['median_range_pct']:.3f}%")
    print(f"  median prior VIX daily %       : {stats['median_vix_daily_pct']:.3f}%")
    print(f"  corr(prior VIX daily, range)   : {stats['corr_vix_range']:.3f}")
    print(f"  median range / prior VIX daily : {stats['median_range_over_vix']:.3f}")
    if not np.isnan(stats.get("corr_vix1d_range", float("nan"))):
        print(f"  median prior VIX1D daily %     : {stats['median_vix1d_daily_pct']:.3f}%")
        print(f"  corr(prior VIX1D daily, range) : {stats['corr_vix1d_range']:.3f}")
        print(f"  median range / prior VIX1D     : {stats['median_range_over_vix1d']:.3f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
