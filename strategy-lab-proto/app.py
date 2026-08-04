"""Strategy Lab prototype — guided single flow (Basic/Pro).

  cd strategy-lab-proto && set -a && source .env && set +a
  ../server/.venv/bin/streamlit run app.py --server.port 8501
"""

from __future__ import annotations

import os
import sys
import traceback
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

_env = ROOT / ".env"
if _env.exists():
    for line in _env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v


def _purge_stale_engine_modules() -> None:
    """Streamlit re-runs app.py but often keeps old engine.* in sys.modules.

    That yields ImportError on new names (e.g. BODY_SIDE_LABELS) after engine
    edits until a full process restart. Drop engine modules so every script
    run imports fresh from disk.
    """
    for name in list(sys.modules):
        if name == "engine" or name.startswith("engine."):
            del sys.modules[name]


_purge_stale_engine_modules()

from engine.backtest import BacktestResult, run_backtest
from engine.massive_ext import MassiveLabClient, default_date_window
from engine.risk_graph import figure_risk_png, geometry_summary
from engine.risk_graph_interactive import interactive_chart_data
from engine.risk_engine.handles import apply_handle_drag
from engine.risk_engine import build_package
from components.risk_handles import (
    consume_live_drag,
    risk_handles_chart,
    to_msc_chart_payload,
    write_live_chart,
)
from engine.spec import (
    BODY_SIDE_LABELS,
    EXIT_MODE_LABELS,
    R2R_RULE_LABELS,
    STRUCTURE_LABELS,
    STRIKE_MODE_LABELS,
    TAKE_PROFIT_BASIS_LABELS,
    StrategySpec,
)
from engine.sessions import (
    DTE_LABELS,
    ENTRY_FILL_LABELS,
    ENTRY_SESSION_LABELS,
    get_session,
)
from engine.store import MAX_PER_PHASE, LabStore
from engine.lifecycle_states import (
    PHASE_LABELS as LC_PHASE_LABELS,
    PHASE_STATES,
    default_state,
    normalize_phase as lc_normalize_phase,
    ready_for_curation,
    state_label,
    state_order,
)
from engine import universe as uni

TEMPLATES = ["long_condor", "long_butterfly", "put_debit", "call_debit"]

st.set_page_config(
    page_title="Strategy Lab",
    page_icon="🧪",
    layout="wide",
    # Collapsed by default so strategies + risk graph own the screen.
    # Open the left drawer (») for Design Spec, backtest, and other details.
    initial_sidebar_state="collapsed",
)

# Details drawer — Apple HIG-style overlay:
# fully retracts when collapsed; slides over main when open (does not compress chart).
st.html(
    """
<style>
  /*
   * FatTail Labs HI Spec v1.0 tokens (web/styles/tokens.css)
   * Invariant: canvas = soft wash; surface = OPAQUE elevated white/#1c1c1e.
   * Border-only / transparent boxes that inherit the page wash are NOT HIG-compliant.
   */
  :root {
    --color-canvas: #f5f5f7;
    --color-surface: #ffffff;
    --color-surface-secondary: #f2f2f7;
    --color-separator: rgba(60, 60, 67, 0.12);
    --color-label: #1d1d1f;
    --color-label-secondary: #6e6e73;
    --color-fill: rgba(120, 120, 128, 0.12);
    --elevation-1: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
    /* Slightly stronger lift so lanes clearly float off canvas (HI Spec elevation-2) */
    --elevation-2: 0 2px 8px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.10);
    --radius-lg: 0.875rem;
    --radius-md: 0.625rem;
    --font-ui: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI",
      system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --color-canvas: #000000;
      --color-surface: #1c1c1e;
      --color-surface-secondary: #2c2c2e;
      --color-separator: rgba(84, 84, 88, 0.65);
      --color-label: #f5f5f7;
      --color-label-secondary: #98989d;
      --color-fill: rgba(120, 120, 128, 0.24);
      --elevation-1: 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
      --elevation-2: 0 4px 12px rgba(0, 0, 0, 0.35), 0 12px 32px rgba(0, 0, 0, 0.4);
    }
  }

  html, body, [data-testid="stAppViewContainer"], .stApp,
  [data-testid="stHeader"], header[data-testid="stHeader"] {
    font-family: var(--font-ui) !important;
    -webkit-font-smoothing: antialiased;
    background: var(--color-canvas) !important;
    background-color: var(--color-canvas) !important;
    color: var(--color-label) !important;
  }
  /* Kill Streamlit glass / translucent theme washes */
  [data-testid="stAppViewContainer"] > .main,
  [data-testid="stMain"],
  section.main,
  .stMain,
  .main,
  [data-testid="stAppViewBlockContainer"],
  [data-testid="stDecoration"] {
    background: var(--color-canvas) !important;
    background-color: var(--color-canvas) !important;
  }
  section.main,
  [data-testid="stAppViewContainer"] > .main,
  [data-testid="stMain"] {
    margin-left: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  [data-testid="stAppViewContainer"] {
    width: 100% !important;
  }
  [data-testid="stMain"] .block-container {
    padding-top: 1.25rem !important;
    padding-bottom: 2rem !important;
    padding-left: 3.5rem !important;
    max-width: 100% !important;
    background: transparent !important;
  }
  [data-testid="stMain"] h1 {
    margin-top: 1em !important;
    color: var(--color-label) !important;
  }
  [data-testid="stMain"] [data-testid="stCaptionContainer"],
  [data-testid="stMain"] .stCaption {
    color: var(--color-label-secondary) !important;
  }

  /*
   * HI Spec §4.2 — surface-card on canvas:
   * canvas = soft wash; surface = OPAQUE pure white (light) / #1c1c1e (dark).
   * Streamlit keys → class "st-key-<key>" — target lanes/cards by that class.
   */
  [data-testid="stMain"] [data-testid="stVerticalBlockBorderWrapper"],
  [data-testid="stMain"] [data-testid="stExpander"],
  [data-testid="stMain"] [data-testid="stMetric"],
  [data-testid="stMain"] [data-testid="stAlert"],
  [data-testid="stMain"] [data-testid="stForm"] {
    background: var(--color-surface) !important;
    background-color: var(--color-surface) !important;
    opacity: 1 !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
  [data-testid="stMain"] [data-testid="stVerticalBlockBorderWrapper"] {
    border: 1px solid var(--color-separator) !important;
    border-radius: var(--radius-lg) !important;
    box-shadow: var(--elevation-1) !important;
  }

  /* —— Design / Curation / Deployment lanes: bright interior + lift —— */
  [data-testid="stMain"] [class*="st-key-lane-"],
  [data-testid="stMain"] [class*="st-key-lane-"] > div,
  [data-testid="stMain"] [class*="st-key-lane-"] [data-testid="stVerticalBlockBorderWrapper"],
  [data-testid="stMain"] [class*="st-key-lane-"] [data-testid="stVerticalBlock"] {
    background: var(--color-surface) !important;
    background-color: var(--color-surface) !important;
    opacity: 1 !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
  [data-testid="stMain"] [class*="st-key-lane-"] {
    border: 1px solid var(--color-separator) !important;
    border-radius: var(--radius-lg) !important;
    box-shadow: var(--elevation-2) !important;
    padding: 0.75rem 0.85rem !important;
  }
  /* Strategy cards inside a lane: slightly brighter nested tile + hairline */
  [data-testid="stMain"] [class*="st-key-card-"],
  [data-testid="stMain"] [class*="st-key-card-"] > div {
    background: var(--color-surface-secondary) !important;
    background-color: var(--color-surface-secondary) !important;
    opacity: 1 !important;
    backdrop-filter: none !important;
  }
  [data-testid="stMain"] [class*="st-key-card-"] {
    border: 1px solid var(--color-separator) !important;
    border-radius: var(--radius-md) !important;
    box-shadow: var(--elevation-1) !important;
    margin-bottom: 0.5rem !important;
    padding: 0.5rem 0.65rem !important;
  }
  /* Light mode: pure white lanes (must pop off #f5f5f7 canvas) */
  @media (prefers-color-scheme: light) {
    [data-testid="stMain"] [class*="st-key-lane-"],
    [data-testid="stMain"] [class*="st-key-lane-"] > div {
      background: #ffffff !important;
      background-color: #ffffff !important;
    }
    [data-testid="stMain"] [class*="st-key-card-"],
    [data-testid="stMain"] [class*="st-key-card-"] > div {
      background: #f2f2f7 !important;
      background-color: #f2f2f7 !important;
    }
  }
  /* Dark mode: lifted gray lanes on pure black canvas */
  @media (prefers-color-scheme: dark) {
    [data-testid="stMain"] [class*="st-key-lane-"],
    [data-testid="stMain"] [class*="st-key-lane-"] > div {
      background: #1c1c1e !important;
      background-color: #1c1c1e !important;
    }
    [data-testid="stMain"] [class*="st-key-card-"],
    [data-testid="stMain"] [class*="st-key-card-"] > div {
      background: #2c2c2e !important;
      background-color: #2c2c2e !important;
    }
  }
  /* Expander chrome */
  [data-testid="stMain"] [data-testid="stExpander"] details,
  [data-testid="stMain"] [data-testid="stExpander"] summary {
    background: var(--color-surface) !important;
    background-color: var(--color-surface) !important;
  }
  /* Metric tiles */
  [data-testid="stMain"] [data-testid="stMetric"] {
    border: 1px solid var(--color-separator) !important;
    border-radius: var(--radius-md) !important;
    padding: 0.65rem 0.85rem !important;
    box-shadow: var(--elevation-1) !important;
  }
  /* Info / status banners solid */
  [data-testid="stMain"] [data-testid="stAlert"] > div {
    background: var(--color-surface) !important;
    background-color: var(--color-surface) !important;
  }
  /* Controls: solid fill, not glass */
  [data-testid="stMain"] .stButton > button {
    border-radius: var(--radius-md) !important;
    opacity: 1 !important;
  }
  [data-testid="stMain"] .stButton > button[kind="secondary"],
  [data-testid="stMain"] .stButton > button[data-testid="baseButton-secondary"] {
    background-color: var(--color-surface) !important;
    border: 1px solid var(--color-separator) !important;
    color: var(--color-label) !important;
  }
  [data-testid="stMain"] [data-baseweb="select"] > div,
  [data-testid="stMain"] .stTextInput input,
  [data-testid="stMain"] .stNumberInput input,
  [data-testid="stMain"] .stTextArea textarea {
    background-color: var(--color-surface) !important;
    border-radius: var(--radius-md) !important;
    opacity: 1 !important;
  }

  /* —— Drawer shell (fixed overlay, HIG material + spring curve) —— */
  section[data-testid="stSidebar"] {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    height: 100vh !important;
    z-index: 1000001 !important;
    border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
    /* Drawer: opaque elevated surface (HI Spec surface), not glass over chart */
    background: var(--color-surface) !important;
    background-color: var(--color-surface) !important;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1),
                width 0.32s cubic-bezier(0.32, 0.72, 0, 1),
                min-width 0.32s cubic-bezier(0.32, 0.72, 0, 1),
                max-width 0.32s cubic-bezier(0.32, 0.72, 0, 1),
                box-shadow 0.32s cubic-bezier(0.32, 0.72, 0, 1),
                visibility 0.32s !important;
  }
  section[data-testid="stSidebar"] [data-testid="stSidebarContent"],
  section[data-testid="stSidebar"] > div {
    background: var(--color-surface) !important;
    background-color: var(--color-surface) !important;
  }
  section[data-testid="stSidebar"] > div {
    width: 100% !important;
    min-width: 0 !important;
    height: 100% !important;
  }
  section[data-testid="stSidebar"] [data-testid="stSidebarContent"] {
    width: 100% !important;
    padding-top: 0.75rem !important;
  }

  /* OPEN — full drawer with room for controls */
  section[data-testid="stSidebar"][aria-expanded="true"] {
    width: min(92vw, 28rem) !important;
    min-width: min(92vw, 28rem) !important;
    max-width: min(92vw, 28rem) !important;
    transform: translateX(0) !important;
    visibility: visible !important;
    pointer-events: auto !important;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2),
                16px 0 48px rgba(0, 0, 0, 0.35) !important;
    overflow: auto !important;
  }

  /* CLOSED — fully off-screen (no residual strip) */
  section[data-testid="stSidebar"][aria-expanded="false"] {
    width: 0 !important;
    min-width: 0 !important;
    max-width: 0 !important;
    transform: translateX(-100%) !important;
    visibility: hidden !important;
    pointer-events: none !important;
    box-shadow: none !important;
    border: none !important;
    overflow: hidden !important;
  }
  section[data-testid="stSidebar"][aria-expanded="false"] * {
    visibility: hidden !important;
  }

  /* Leading control — HIG toolbar button, aligned with title row, not over text */
  [data-testid="stSidebarCollapsedControl"] {
    z-index: 1000003 !important;
    position: fixed !important;
    top: 1.1rem !important;
    left: 0.75rem !important;
  }
  [data-testid="stSidebarCollapsedControl"] button {
    width: 2.25rem !important;
    height: 2.25rem !important;
    min-width: 2.25rem !important;
    min-height: 2.25rem !important;
    border-radius: var(--radius-md) !important;
    background: var(--color-surface) !important;
    background-color: var(--color-surface) !important;
    border: 1px solid var(--color-separator) !important;
    box-shadow: var(--elevation-2) !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    opacity: 1 !important;
  }

  /* Dim main content when drawer is open (modal-sheet context) */
  body:has(section[data-testid="stSidebar"][aria-expanded="true"]) [data-testid="stAppViewContainer"]::before {
    content: "";
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.28);
    z-index: 1000000;
    pointer-events: none;
  }
</style>
"""
)

store = LabStore()


def get_client() -> MassiveLabClient | None:
    if not (os.environ.get("MASSIVE_API_KEY") or "").strip():
        return None
    try:
        return MassiveLabClient()
    except Exception as exc:  # noqa: BLE001
        st.error(f"Massive client failed: {exc}")
        return None


def ensure_demo_strategy() -> str:
    """F1: one blank versionable strategy (generic name, no attributes)."""
    rows = store.list_strategies()
    if not rows:
        row = store.ensure_f1_seed()
        st.session_state["sid"] = row["id"]
        return row["id"]
    return st.session_state.get("sid") or rows[0]["id"]


def apply_strategy_move(
    strategy_id: str,
    to_phase: str,
    *,
    reason: str | None = None,
    disposition: str | None = None,
) -> bool:
    """Programmatic move between phases. Returns True on success; notices on failure."""
    to_phase = _normalize_phase(to_phase)
    row = store.get(strategy_id)
    if not row:
        push_notice("error", f"Strategy {strategy_id} not found.")
        return False
    issues = unsaved_issues(
        StrategySpec.from_dict(row["spec"])
        if isinstance(row.get("spec"), dict)
        else None
    )
    # Blank F1 strategies: ignore shape dirty if no attributes yet
    attrs = row.get("attributes") if isinstance(row.get("attributes"), dict) else {}
    if not attrs and not st.session_state.get("lab_unsaved"):
        issues = [i for i in issues if "risk-graph" not in i and "not saved" not in i]
    if issues:
        push_notice(
            "warning",
            "Cannot move strategy — save your work first: " + "; ".join(issues),
        )
        return False
    try:
        if to_phase == "bin":
            disp = disposition if disposition in ("retired", "trashed") else "retired"
            store.send_to_bin(
                strategy_id,
                disposition=disp,  # type: ignore[arg-type]
                reason=reason or "Moved to Bin",
            )
            push_notice(
                "success",
                f"Strategy {strategy_id} → Bin ({disp}).",
            )
        else:
            store.move_phase(strategy_id, to_phase)  # type: ignore[arg-type]
            push_notice(
                "success",
                f"Strategy {strategy_id} → {_PHASE_LABELS.get(to_phase, to_phase)}.",
            )
        st.session_state["sid"] = strategy_id
        st.session_state["nav_phase"] = to_phase
        clear_lab_unsaved()
        return True
    except ValueError as exc:
        push_notice("error", str(exc))
        return False


# Back-compat alias (older call sites)
apply_product_move = apply_strategy_move


# Life-cycle phases (UI) — Development (was Design) · Curation · Deployment · Bin
_PHASE_META: list[tuple[str, str]] = [
    ("development", "Development"),
    ("curation", "Curation"),
    ("deployment", "Deployment"),
    ("bin", "Bin"),
]
_PHASE_LABELS = dict(_PHASE_META)
_PHASE_TO_STORE = {k: k for k, _ in _PHASE_META}


def _normalize_phase(stage: str | None) -> str:
    """Map store stage / legacy aliases → life-cycle phase key."""
    return lc_normalize_phase(stage)


def push_notice(level: str, message: str) -> None:
    """Queue a notification for the panel under the header (info|success|warning|error)."""
    q = list(st.session_state.get("lab_notices") or [])
    q.append({"level": level, "message": message})
    st.session_state["lab_notices"] = q[-8:]


def mark_lab_unsaved(reason: str = "edits") -> None:
    st.session_state["lab_unsaved"] = True
    st.session_state["lab_unsaved_reason"] = reason


def clear_lab_unsaved() -> None:
    st.session_state["lab_unsaved"] = False
    st.session_state.pop("lab_unsaved_reason", None)


def unsaved_issues(spec: StrategySpec | None) -> list[str]:
    """Return human labels for pending work that should block phase switch."""
    issues: list[str] = []
    if st.session_state.get("lab_unsaved"):
        issues.append(str(st.session_state.get("lab_unsaved_reason") or "unsaved edits"))
    if st.session_state.get("rg_pending_shape"):
        issues.append("pending risk-graph change (not applied yet)")
    if spec is None:
        return issues
    shape = st.session_state.get("rg_shape")
    if isinstance(shape, dict):
        if shape.get("structure") not in (None, spec.structure):
            issues.append("structure not saved to Spec")
        if shape.get("body_side") not in (None, spec.body_side):
            issues.append("direction not saved to Spec")
        if abs(float(shape.get("wing_width") or 0) - float(spec.wing_width or 0)) > 1e-6:
            issues.append("wing width not saved to Spec")
        if abs(
            float(shape.get("body_offset") or 0)
            - float(getattr(spec, "body_offset", 0) or 0)
        ) > 1e-6:
            issues.append("body offset not saved to Spec")
        if int(shape.get("contracts") or 1) != int(spec.contracts or 1):
            issues.append("positions not saved to Spec")
    und = (st.session_state.get("underlying_sym") or "").upper()
    if und and und != (spec.underlying or "").upper():
        issues.append("underlying not saved to Spec")
    # de-dupe preserve order
    seen: set[str] = set()
    out: list[str] = []
    for x in issues:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def switch_phase_context(target_phase: str, *, all_rows: list) -> None:
    """Switch UI phase context: select a card in that phase (if any).

    Assumes unsaved work was already checked by the caller.
    """
    target = _normalize_phase(target_phase)
    store_stage = _PHASE_TO_STORE.get(target, "development")
    st.session_state["nav_phase"] = target
    in_phase = [
        r
        for r in all_rows
        if _normalize_phase(str(r.get("phase") or r.get("stage"))) == store_stage
    ]
    if in_phase:
        # Prefer keeping current card if already in target phase
        cur = st.session_state.get("sid")
        if not any(r.get("id") == cur for r in in_phase):
            st.session_state["sid"] = in_phase[0]["id"]
        label = _PHASE_LABELS.get(target, target)
        push_notice(
            "info",
            f"Context: {label} · working on {st.session_state['sid']}.",
        )
    else:
        label = _PHASE_LABELS.get(target, target)
        push_notice(
            "info",
            f"Context: {label} · no strategies in this phase yet.",
        )


def try_switch_phase(target_phase: str, *, all_rows: list, spec: StrategySpec | None) -> None:
    """Switch phase if clean; otherwise notify and stay put."""
    target = _normalize_phase(target_phase)
    current = _normalize_phase(
        st.session_state.get("nav_phase")
        or (
            (store.get(st.session_state.get("sid") or "") or {}).get("stage")
            if st.session_state.get("sid")
            else "development"
        )
    )
    if target == current:
        return
    issues = unsaved_issues(spec)
    if issues:
        push_notice(
            "warning",
            "Cannot switch phase — save your work first: "
            + "; ".join(issues)
            + ". Open Details → Save Spec (or finish the risk-graph apply).",
        )
        return
    switch_phase_context(target, all_rows=all_rows)
    st.rerun()


def render_header_cycle_nav(active_phase: str, *, all_rows: list, spec: StrategySpec | None) -> None:
    """Compact clickable cycle nav for the header (title left, this centered)."""
    phase = _normalize_phase(active_phase)
    st.html(
        """
<style>
  /* Header cycle nav — compact phase bins */
  .st-key-lc-header-nav {
    display: flex;
    justify-content: center;
    width: 100%;
  }
  .st-key-lc-header-nav [data-testid="stHorizontalBlock"] {
    justify-content: center;
    gap: 0.35rem;
  }
  .st-key-lc-header-nav .stButton > button {
    min-height: 2.4rem;
    padding: 0.35rem 0.75rem;
    border-radius: 10px;
    font-weight: 650;
    letter-spacing: -0.01em;
    border: 1.5px solid rgba(60, 60, 67, 0.14);
    background: #f5f5f7;
    color: #1d1d1f;
  }
  .st-key-lc-header-nav .stButton > button[kind="primary"],
  .st-key-lc-header-nav .stButton > button[data-testid="baseButton-primary"] {
    border-color: #0071e3;
    background: #e8f1fc;
    color: #0071e3;
    box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.16);
  }
  .st-key-lc-arrow {
    display: flex;
    align-items: center;
    color: #86868b;
    font-weight: 600;
    padding: 0 0.1rem;
    font-size: 0.95rem;
  }
  .st-key-lc-sep {
    display: flex;
    align-items: center;
    color: #c7c7cc;
    padding: 0 0.25rem;
    font-size: 0.85rem;
  }
</style>
"""
    )
    with st.container(key="lc-header-nav"):
        cols = st.columns([3.2, 0.8, 2.6, 0.8, 2.8, 0.8, 2.2], vertical_alignment="center")
        with cols[0]:
            if st.button(
                "Development",
                key="nav_phase_development",
                type="primary" if phase == "development" else "secondary",
                width="stretch",
                help="Hypothesis → Model → IS → OOS → Deployed (ready for curation)",
            ):
                try_switch_phase("development", all_rows=all_rows, spec=spec)
        with cols[1]:
            st.html('<div class="st-key-lc-arrow">→</div>')
        with cols[2]:
            if st.button(
                "Curation",
                key="nav_phase_curation",
                type="primary" if phase == "curation" else "secondary",
                width="stretch",
                help="Categorized → Grouped → Position sized → Monitored",
            ):
                try_switch_phase("curation", all_rows=all_rows, spec=spec)
        with cols[3]:
            st.html('<div class="st-key-lc-arrow">→</div>')
        with cols[4]:
            if st.button(
                "Deployment",
                key="nav_phase_deployment",
                type="primary" if phase == "deployment" else "secondary",
                width="stretch",
                help="Strategy handoff → capital → schedule → run → prune → retro",
            ):
                try_switch_phase("deployment", all_rows=all_rows, spec=spec)
        with cols[5]:
            st.html('<div class="st-key-lc-sep">|</div>')
        with cols[6]:
            if st.button(
                "Bin",
                key="nav_phase_bin",
                type="primary" if phase == "bin" else "secondary",
                width="stretch",
                help="Off-ramp · retired / trashed",
            ):
                try_switch_phase("bin", all_rows=all_rows, spec=spec)


def render_notification_panel() -> None:
    """Notification strip — occupies the band under the header (former cycle-nav slot)."""
    notices = list(st.session_state.get("lab_notices") or [])
    st.html(
        """
<style>
  .sl-notify {
    margin: 0 0 0.85rem 0;
    padding: 0.65rem 0.9rem;
    border-radius: 12px;
    border: 1px solid rgba(60, 60, 67, 0.12);
    background: #ffffff;
    min-height: 2.75rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .sl-notify-empty {
    font-size: 0.85rem;
    color: #6e6e73;
  }
  .sl-notify-item {
    font-size: 0.88rem;
    line-height: 1.35;
    margin: 0.2rem 0;
    color: #1d1d1f;
  }
  .sl-notify-item.warning { color: #9a6700; }
  .sl-notify-item.error { color: #b00020; }
  .sl-notify-item.success { color: #0d7a3f; }
  .sl-notify-item.info { color: #1d1d1f; }
  @media (prefers-color-scheme: dark) {
    .sl-notify {
      background: #1c1c1e;
      border-color: rgba(84, 84, 88, 0.55);
    }
    .sl-notify-empty { color: #98989d; }
    .sl-notify-item { color: #f5f5f7; }
    .sl-notify-item.warning { color: #ffd60a; }
    .sl-notify-item.error { color: #ff6961; }
    .sl-notify-item.success { color: #30d158; }
  }
</style>
"""
    )
    if not notices:
        st.html(
            '<div class="sl-notify"><span class="sl-notify-empty">'
            "Notifications — phase switches and save reminders appear here."
            "</span></div>"
        )
        return

    def _esc(s: str) -> str:
        return (
            s.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
        )

    items = []
    for n in notices[-4:]:
        lvl = _esc(str(n.get("level") or "info"))
        msg = _esc(str(n.get("message") or ""))
        items.append(f'<div class="sl-notify-item {lvl}">{msg}</div>')
    st.html('<div class="sl-notify">' + "".join(items) + "</div>")
    n1, n2 = st.columns([6, 1])
    with n2:
        if st.button("Clear", key="clear_notices", width="stretch"):
            st.session_state["lab_notices"] = []
            st.rerun()


# ---------------------------------------------------------------------------
# Primary UI: strategies + risk graph
# Details (spec form, backtest, connection, …) live in the left sidebar drawer.
# ---------------------------------------------------------------------------

# Mode default from store (sidebar radio may update later this run)
mode = store.get_mode()
if mode not in ("basic", "pro"):
    mode = "basic"

sid = ensure_demo_strategy()
all_s = store.list_strategies()
_active_row = store.get(sid) or {}
_card_phase = _normalize_phase(
    str(_active_row.get("phase") or _active_row.get("stage") or "development")
)
# Nav phase = explicit context (from cycle click) or card's phase
if "nav_phase" not in st.session_state:
    st.session_state["nav_phase"] = _card_phase
# Keep nav in sync when user selects a card in another phase (not via cycle nav)
if st.session_state.get("_sid_for_nav") != sid:
    st.session_state["_sid_for_nav"] = sid
    st.session_state["nav_phase"] = _card_phase
_active_phase = _normalize_phase(str(st.session_state.get("nav_phase") or _card_phase))

_hdr_spec = None
try:
    if _active_row.get("spec"):
        _hdr_spec = StrategySpec.from_dict(_active_row["spec"])
except Exception:  # noqa: BLE001
    _hdr_spec = None

# Header: title left · cycle nav centered · status right
_hdr_l, _hdr_c, _hdr_r = st.columns([1.35, 2.4, 0.85], vertical_alignment="center")
with _hdr_l:
    st.title("Strategy Lab")
    st.caption("Development → Curation → Deployment · Bin off-ramp")
with _hdr_c:
    render_header_cycle_nav(_active_phase, all_rows=all_s, spec=_hdr_spec)
with _hdr_r:
    key_ok = bool((os.environ.get("MASSIVE_API_KEY") or "").strip())
    if key_ok:
        st.success("Massive ready", icon=":material/check_circle:")
    else:
        st.error("No API key")

# Notification panel — former cycle-nav vertical band
render_notification_panel()

# ---------------------------------------------------------------------------
# Phase bins — always-visible cards; compact horizontal strategy rows
# ---------------------------------------------------------------------------

def _strategy_description(p: dict) -> str:
    d = str(p.get("description") or "").strip()
    if d:
        return d
    sp = p.get("spec") if isinstance(p.get("spec"), dict) else {}
    hyp = str(sp.get("hypothesis") or "").strip()
    if hyp:
        return hyp
    return "No description yet."


def _phase_state_of(p: dict) -> str:
    return str(p.get("phase_state") or default_state(str(p.get("phase") or "development")))


def _phase_state_label(p: dict) -> str:
    phase = _normalize_phase(str(p.get("phase") or "development"))
    return state_label(phase, _phase_state_of(p))


def _esc_html(s: str) -> str:
    return (
        str(s)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _sort_strategies(items: list[dict], sort_mode: str, phase: str) -> list[dict]:
    """Sort by newness and/or in-phase state."""
    mode = (sort_mode or "newest").lower()
    order = state_order(phase)

    def _ts(p: dict) -> str:
        return str(p.get("updated_at") or p.get("created_at") or "")

    if mode == "oldest":
        return sorted(items, key=_ts)
    if mode == "state":
        ordered = sorted(items, key=_ts, reverse=True)
        return sorted(
            ordered,
            key=lambda p: order.get(_phase_state_of(p), 99),
        )
    return sorted(items, key=_ts, reverse=True)


st.subheader("Phase bins")
st.caption(
    "Every phase is always visible. Cards show name, version, short description, "
    "and **phase state** (Development: Hypothesis→…→Deployed; Curation & Deployment "
    f"have their own states). Up to {MAX_PER_PHASE} strategies per bin."
)

_f1, _f2 = st.columns([3, 1], vertical_alignment="bottom")
with _f1:
    _board_search = (
        st.text_input(
            "Quick search",
            key="phase_board_search",
            placeholder="Search name, description, id…",
        )
        or ""
    ).strip().lower()
with _f2:
    _board_filter = st.selectbox(
        "Lifecycle state",
        ["all", "active", "retired", "trashed"],
        key="phase_board_filter",
        help="Bin disposition filter (active / retired / trashed)",
    )


def _strategy_matches(p: dict) -> bool:
    stt = str(p.get("state") or "active")
    if _board_filter and _board_filter != "all" and stt != _board_filter:
        return False
    if not _board_search:
        return True
    hay = (
        f"{p.get('name') or ''} {p.get('id') or ''} {p.get('version') or ''} "
        f"{_strategy_description(p)} {_phase_state_of(p)} "
        f"{_phase_state_label(p)} {stt}"
    ).lower()
    return _board_search in hay


# Compact horizontal strategy rows — density over chrome
st.html(
    """
<style>
  .st-key-strategy-board [data-testid="stColumn"] {
    background: #ffffff !important;
    background-color: #ffffff !important;
    border: 1px solid rgba(60, 60, 67, 0.12) !important;
    border-radius: 14px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.08) !important;
    padding: 10px 10px 8px 10px !important;
    min-height: 260px !important;
    max-height: 340px !important;
    overflow-y: auto !important;
    opacity: 1 !important;
  }
  @media (prefers-color-scheme: dark) {
    .st-key-strategy-board [data-testid="stColumn"] {
      background: #1c1c1e !important;
      background-color: #1c1c1e !important;
      border: 1px solid rgba(84, 84, 88, 0.65) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35) !important;
    }
  }
  .st-key-strategy-board [data-testid="stColumn"] > div { background: transparent !important; }
  .st-key-strategy-board [data-testid="stColumn"] [data-testid="stVerticalBlock"] {
    background: transparent !important;
  }
  .sl-stage-head {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 0.4rem; margin: 0 0 0.15rem 0;
  }
  .sl-stage-title {
    font-size: 0.95rem; font-weight: 650; letter-spacing: -0.02em; margin: 0;
    color: #1d1d1f;
  }
  .sl-stage-count {
    font-size: 0.7rem; font-weight: 650; color: #6e6e73;
    font-variant-numeric: tabular-nums;
    background: rgba(120,120,128,0.12);
    padding: 0.1rem 0.45rem; border-radius: 999px;
  }
  .sl-stage-hint {
    font-size: 0.7rem; color: #6e6e73; margin: 0 0 0.4rem 0; line-height: 1.3;
  }
  .sl-stage-empty {
    font-size: 0.78rem; color: #6e6e73; padding: 1rem 0.5rem; text-align: center;
    background: #f2f2f7; border: 1px dashed rgba(60, 60, 67, 0.22); border-radius: 10px;
  }
  /* Horizontal minimal strategy card */
  .sl-scard {
    display: flex; flex-direction: row; align-items: center; gap: 0.55rem;
    width: 100%; box-sizing: border-box;
    padding: 0.4rem 0.5rem; margin: 0 0 0.35rem 0;
    border-radius: 8px; border: 1px solid rgba(60, 60, 67, 0.12);
    background: #f5f5f7;
  }
  .sl-scard.is-selected {
    border-color: #0071e3; background: #e8f1fc;
    box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.15);
  }
  .sl-scard-main { flex: 1 1 auto; min-width: 0; }
  .sl-scard-row1 {
    display: flex; align-items: baseline; gap: 0.4rem; flex-wrap: wrap;
  }
  .sl-scard-name {
    font-size: 0.82rem; font-weight: 650; color: #1d1d1f;
    margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 100%;
  }
  .sl-scard-ver {
    font-size: 0.68rem; font-weight: 600; color: #6e6e73;
    font-variant-numeric: tabular-nums; flex-shrink: 0;
  }
  .sl-scard-desc {
    font-size: 0.7rem; color: #6e6e73; margin: 0.1rem 0 0 0;
    line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sl-scard-badge {
    flex: 0 0 auto; font-size: 0.62rem; font-weight: 650;
    padding: 0.15rem 0.4rem; border-radius: 999px;
    background: rgba(120,120,128,0.16); color: #3a3a3c;
    white-space: nowrap;
  }
  .sl-scard-badge.hypothesis,
  .sl-scard-badge.strategy { background: #e8f1fc; color: #0071e3; }
  .sl-scard-badge.model,
  .sl-scard-badge.categorized,
  .sl-scard-badge.capital_allocation { background: #e7f1ff; color: #0b5cab; }
  .sl-scard-badge.is_test,
  .sl-scard-badge.grouped,
  .sl-scard-badge.scheduled { background: #fff3cd; color: #856404; }
  .sl-scard-badge.oos_test,
  .sl-scard-badge.position_sized,
  .sl-scard-badge.started { background: #d1ecf1; color: #0c5460; }
  .sl-scard-badge.deployed,
  .sl-scard-badge.monitored,
  .sl-scard-badge.ended { background: #d4edda; color: #155724; }
  .sl-scard-badge.paused,
  .sl-scard-badge.stopped { background: #f8d7da; color: #721c24; }
  .sl-scard-badge.pruned,
  .sl-scard-badge.retired { background: #e2e3e5; color: #383d41; }
  .sl-scard-badge.trashed { background: #f8d7da; color: #721c24; }
  .sl-scard-badge.retrospective { background: #e2d5f1; color: #4a2c7a; }
  @media (prefers-color-scheme: dark) {
    .sl-stage-title { color: #f5f5f7; }
    .sl-stage-count { color: #98989d; background: rgba(120,120,128,0.24); }
    .sl-stage-hint, .sl-stage-empty { color: #98989d; }
    .sl-stage-empty { background: #2c2c2e; border-color: rgba(84, 84, 88, 0.65); }
    .sl-scard { background: #2c2c2e; border-color: rgba(84, 84, 88, 0.55); }
    .sl-scard.is-selected { background: #0a2847; border-color: #0a84ff; }
    .sl-scard-name { color: #f5f5f7; }
    .sl-scard-ver, .sl-scard-desc { color: #98989d; }
    .sl-scard-badge { background: rgba(120,120,128,0.28); color: #f5f5f7; }
  }
  .st-key-strategy-board [class*="st-key-card-"] {
    background: transparent !important; border: none !important;
    box-shadow: none !important; padding: 0 !important; margin: 0 0 0.15rem 0 !important;
  }
  .st-key-strategy-board [class*="st-key-card-"] > div { background: transparent !important; }
  /* Slim action buttons under each horizontal card */
  .st-key-strategy-board [class*="st-key-card-"] .stButton > button {
    min-height: 1.65rem; padding: 0.15rem 0.4rem; font-size: 0.72rem;
  }
  .st-key-strategy-board [data-testid="stColumn"]:has(.sl-bin-focus-marker) {
    box-shadow: 0 0 0 2px rgba(0, 113, 227, 0.35), 0 8px 24px rgba(0, 0, 0, 0.08) !important;
  }
</style>
"""
)

_stage_lanes = (
    (
        "development",
        "Development",
        "Hypothesis · Model · IS · OOS · Deployed",
        "Empty — no strategies.",
    ),
    (
        "curation",
        "Curation",
        "Categorized · Grouped · Sized · Monitored",
        "Empty — no strategies.",
    ),
    (
        "deployment",
        "Deployment",
        "Strategy · Capital · Schedule · Run · Prune · Retro",
        "Empty — no strategies.",
    ),
    ("bin", "Bin", "Retired / trashed", "Empty — no strategies."),
)

with st.container(key="strategy-board"):
    cols = st.columns(4, gap="medium", border=True)
    for col, (stage, label, hint, empty_msg) in zip(cols, _stage_lanes):
        full_n = sum(
            1
            for x in all_s
            if _normalize_phase(str(x.get("phase") or x.get("stage"))) == stage
        )
        is_ctx = _normalize_phase(stage) == _active_phase
        with col:
            if is_ctx:
                st.markdown(
                    '<div class="sl-bin-focus-marker"></div>',
                    unsafe_allow_html=True,
                )
            st.markdown(
                f'<div class="sl-stage-head">'
                f'<p class="sl-stage-title">{label}'
                f'{" · here" if is_ctx else ""}</p>'
                f'<span class="sl-stage-count">{full_n}/{MAX_PER_PHASE}</span>'
                f"</div>"
                f'<p class="sl-stage-hint">{hint}</p>',
                unsafe_allow_html=True,
            )
            # Per-bin sort: state + newness
            _sort = st.selectbox(
                "Sort",
                options=["newest", "oldest", "state"],
                format_func=lambda x: {
                    "newest": "Newest first",
                    "oldest": "Oldest first",
                    "state": "Phase state · newest",
                }.get(x, x),
                key=f"bin_sort_{stage}",
                label_visibility="collapsed",
            )
            items = [
                x
                for x in all_s
                if _normalize_phase(str(x.get("phase") or x.get("stage"))) == stage
                and _strategy_matches(x)
            ]
            items = _sort_strategies(items, str(_sort), stage)

            if not items:
                st.markdown(
                    f'<div class="sl-stage-empty">{empty_msg}</div>',
                    unsafe_allow_html=True,
                )
            for s in items:
                pid = s["id"]
                pname = str(s.get("name") or "Untitled strategy")
                pver = str(s.get("version") or "1.0.0")
                pdesc = _strategy_description(s)
                if len(pdesc) > 72:
                    pdesc = pdesc[:69].rstrip() + "…"
                pstate = _phase_state_of(s)
                plabel = _phase_state_label(s)
                active = pid == sid
                sel_cls = " is-selected" if active else ""
                st.html(
                    f'<div class="sl-scard{sel_cls}">'
                    f'<div class="sl-scard-main">'
                    f'<div class="sl-scard-row1">'
                    f'<span class="sl-scard-name">{_esc_html(pname)}</span>'
                    f'<span class="sl-scard-ver">v{_esc_html(pver)}</span>'
                    f"</div>"
                    f'<p class="sl-scard-desc">{_esc_html(pdesc)}</p>'
                    f"</div>"
                    f'<span class="sl-scard-badge {pstate}" title="Phase state">'
                    f"{_esc_html(plabel)}</span>"
                    f"</div>"
                )
                with st.container(key=f"card-{pid}"):
                    bc1, bc2 = st.columns([1.2, 1])
                    with bc1:
                        if st.button(
                            "Selected" if active else "Open",
                            key=f"pick-{pid}",
                            width="stretch",
                            type="primary" if active else "secondary",
                            disabled=active,
                        ):
                            st.session_state["sid"] = pid
                            st.session_state["nav_phase"] = stage
                            st.rerun()
                    with bc2:
                        if stage == "development":
                            nxt, nxt_label = "curation", "→"
                        elif stage == "curation":
                            nxt, nxt_label = "deployment", "→"
                        elif stage == "deployment":
                            nxt, nxt_label = "bin", "Bin"
                        else:
                            nxt, nxt_label = "development", "Dev"
                        if st.button(
                            nxt_label,
                            key=f"hop-{pid}",
                            width="stretch",
                            help=f"Move to {_PHASE_LABELS.get(nxt, nxt)}",
                        ):
                            if apply_strategy_move(
                                pid,
                                nxt,
                                reason="Quick hop from phase bin",
                                disposition="retired",
                            ):
                                st.rerun()

sid = st.session_state.get("sid") or ensure_demo_strategy()
row = store.get(sid)
if not row:
    st.stop()
# Refresh normalized strategy fields
row = store.get(sid) or row
spec = StrategySpec.from_dict(row.get("spec") or {})
_phase = _normalize_phase(str(row.get("phase") or row.get("stage") or "development"))
_ver = str(row.get("version") or "1.0.0")
_pstate = str(row.get("phase_state") or default_state(_phase))
_pstate_lab = state_label(_phase, _pstate)
_pname = str(row.get("name") or spec.name or "Untitled strategy")
_attrs = row.get("attributes") if isinstance(row.get("attributes"), dict) else {}
_is_blank = not _attrs  # F1 seed: no plugin attributes yet

# ── Work area (selected strategy) ─────────────────────────────────────────
st.subheader("Work area")
st.caption(
    "Selected strategy — rename, advance phase state, move between bins."
)

with st.container(border=True):
    w1, w2, w3, w4 = st.columns([2.2, 1, 1, 1.4])
    with w1:
        st.markdown(f"### {_pname}")
        st.caption(f"`{sid}` · strategy key `{row.get('product_key') or sid}`")
    with w2:
        st.metric("Version", _ver)
    with w3:
        st.metric("Phase", _PHASE_LABELS.get(_phase, _phase))
    with w4:
        st.metric("Phase state", _pstate_lab)

    # Advance / set phase-local state
    st.markdown("**Phase state**")
    _ps_opts = [k for k, _ in PHASE_STATES.get(_phase, [])]
    if _ps_opts:
        ps1, ps2, ps3 = st.columns([2.5, 1.2, 1.2], vertical_alignment="bottom")
        with ps1:
            _ps_pick = st.selectbox(
                "State in this phase",
                _ps_opts,
                index=_ps_opts.index(_pstate) if _pstate in _ps_opts else 0,
                format_func=lambda k: state_label(_phase, k),
                key=f"phase_state_pick_{sid}",
                help=(
                    "Development: Hypothesis→Model→IS→OOS→Deployed (ready for curation). "
                    "Curation: Categorized→Grouped→Sized→Monitored. "
                    "Deployment: Strategy handoff→Capital→Scheduled→run control→Pruned→Retro."
                ),
            )
        with ps2:
            if st.button("Set state", key=f"set_ps_{sid}", width="stretch"):
                try:
                    store.set_phase_state(sid, str(_ps_pick))
                    push_notice(
                        "success",
                        f"Phase state → {state_label(_phase, str(_ps_pick))}.",
                    )
                    st.rerun()
                except ValueError as exc:
                    push_notice("error", str(exc))
        with ps3:
            if st.button(
                "Advance →",
                key=f"adv_ps_{sid}",
                width="stretch",
                help="Move to the next ordered state in this phase",
            ):
                try:
                    store.advance_phase_state(sid)
                    push_notice("success", "Advanced to next phase state.")
                    st.rerun()
                except ValueError as exc:
                    push_notice("warning", str(exc))
        if _phase == "development" and _pstate == "deployed":
            st.caption(
                "Development **Deployed** — ready for Curation (sim or live capable)."
            )
        if _phase == "deployment" and _pstate == "strategy":
            st.caption(
                "Deployment **Strategy** — handoff from Curation; next: capital allocation & schedule."
            )

    # Rename strategy (logs event; optional version bump)
    with st.form(key=f"rename_form_{sid}", border=False):
        st.markdown("**Rename strategy**")
        rn1, rn2 = st.columns([3, 1.2], vertical_alignment="bottom")
        with rn1:
            _new_name = st.text_input(
                "Title",
                value=_pname,
                key=f"rename_title_{sid}",
                help="Changing the title is logged. You can advance the version if this is a meaningful change.",
            )
        with rn2:
            _bump = st.checkbox(
                "Advance version?",
                value=False,
                key=f"rename_bump_{sid}",
                help="If checked, version number increases (minor by default).",
            )
        rn3, rn4 = st.columns([1.5, 3], vertical_alignment="bottom")
        with rn3:
            _bump_part = st.selectbox(
                "Bump",
                ["minor", "patch", "major"],
                key=f"rename_bump_part_{sid}",
                disabled=not _bump,
                help="Which part of the version to advance",
            )
        with rn4:
            _rename_go = st.form_submit_button(
                "Save title",
                type="primary",
                width="stretch",
            )
        if _rename_go:
            try:
                _updated = store.rename(
                    sid,
                    str(_new_name),
                    bump_version=bool(_bump),
                    bump_part=_bump_part if _bump else "minor",  # type: ignore[arg-type]
                )
                if _updated is None:
                    push_notice("error", "Strategy not found.")
                else:
                    _msg = f'Renamed to "{_updated.get("name")}".'
                    if _bump:
                        _msg += f' Version → {_updated.get("version")}.'
                    else:
                        _msg += " Version unchanged."
                    push_notice("success", _msg)
                    st.rerun()
            except ValueError as exc:
                push_notice("error", str(exc))

    if _is_blank:
        st.info(
            "This is a **blank strategy** (generic name, no attributes). "
            "Use the life cycle only — plugins attach attributes later.",
            icon=":material/inventory_2:",
        )

    st.markdown("**Move strategy**")
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        if st.button(
            "→ Curation",
            key="prog_to_curation",
            width="stretch",
            disabled=_phase == "curation",
            help="Promote / move to Curation (paper)",
        ):
            if apply_strategy_move(sid, "curation"):
                st.rerun()
    with m2:
        if st.button(
            "→ Deployment",
            key="prog_to_deploy",
            width="stretch",
            disabled=_phase == "deployment",
            help="Move to Deployment (broker path)",
        ):
            if apply_strategy_move(sid, "deployment"):
                st.rerun()
    with m3:
        if st.button(
            "→ Development",
            key="prog_to_development",
            width="stretch",
            disabled=_phase == "development",
            help="Return to Development",
        ):
            if apply_strategy_move(sid, "development"):
                st.rerun()
    with m4:
        _target = st.selectbox(
            "Move to…",
            ["development", "curation", "deployment", "bin"],
            format_func=lambda x: _PHASE_LABELS.get(x, x),
            key="prog_move_select",
            label_visibility="collapsed",
        )
        if st.button("Go", key="prog_move_go", width="stretch"):
            if apply_strategy_move(
                sid,
                str(_target),
                reason="Programmatic move",
                disposition="retired",
            ):
                st.rerun()

    b1, b2, b3 = st.columns(3)
    with b1:
        _retire_reason = st.text_input(
            "Bin reason",
            value="Lifecycle demo complete",
            key="bin_reason",
        )
    with b2:
        if st.button("Retire → Bin", key="prog_retire", width="stretch"):
            if apply_strategy_move(
                sid, "bin", reason=_retire_reason or "Retired", disposition="retired"
            ):
                st.rerun()
    with b3:
        if st.button("Trash → Bin", key="prog_trash", width="stretch"):
            if apply_strategy_move(
                sid, "bin", reason=_retire_reason or "Trashed", disposition="trashed"
            ):
                st.rerun()

    if _phase == "bin":
        if st.button("Restore → Development", key="prog_restore", type="primary"):
            try:
                store.restore_from_bin(sid, to_phase="development")
                push_notice("success", f"Strategy {sid} restored to Development.")
                st.session_state["nav_phase"] = "development"
                st.rerun()
            except ValueError as exc:
                push_notice("error", str(exc))

    log = list(row.get("lifecycle_log") or [])
    if log:
        with st.expander("Lifecycle log", expanded=False):
            for entry in reversed(log[-12:]):
                ev = entry.get("event", "—")
                if ev == "rename":
                    st.caption(
                        f"{entry.get('at', '—')} · rename · "
                        f"{entry.get('from_name', '')!r} → {entry.get('to_name', '')!r} · "
                        f"v{entry.get('version', _ver)}"
                    )
                elif ev == "version_bump":
                    st.caption(
                        f"{entry.get('at', '—')} · version · "
                        f"{entry.get('from_version', '')} → {entry.get('version', '')} · "
                        f"{entry.get('reason') or entry.get('part') or ''}"
                    )
                elif ev == "phase_state":
                    st.caption(
                        f"{entry.get('at', '—')} · state · "
                        f"{entry.get('from_label') or entry.get('from_state')} → "
                        f"{entry.get('to_label') or entry.get('to_state')} · "
                        f"v{entry.get('version', _ver)}"
                    )
                else:
                    st.caption(
                        f"{entry.get('at', '—')} · {ev} · "
                        f"{entry.get('from_phase', '')} → "
                        f"{entry.get('to_phase', entry.get('phase', ''))} · "
                        f"v{entry.get('version', _ver)}"
                    )

# Subprocess tools (plugins) — still available below for non-blank strategies
if _is_blank:
    st.caption(
        "Subprocess tools (risk graph, Spec editor, backtest) stay off for blank strategies. "
        "They plug in when attributes are added."
    )
    st.stop()

st.markdown("**Underlying** (this strategy)")

if "underlying_sym" not in st.session_state:
    st.session_state["underlying_sym"] = (spec.underlying or uni.default_symbol()).upper()

# Sync when switching strategies
if st.session_state.get("underlying_sid") != sid:
    st.session_state["underlying_sym"] = (spec.underlying or uni.default_symbol()).upper()
    st.session_state["underlying_sid"] = sid

lookup = st.text_input(
    "Quick lookup",
    value="",
    placeholder="Type SPX, oil, NVDA, gold…",
    key="sym_lookup",
    help="Filters the dropdown. Click a chip or pick from the list.",
)
hits = uni.search(lookup, limit=20)
if not hits:
    hits = uni.search("", limit=20)

sym_options = [u.symbol for u in hits]
# Ensure current selection stays visible even if filtered out
cur = st.session_state["underlying_sym"]
if cur not in sym_options and uni.get(cur):
    sym_options = [cur] + sym_options

try:
    sym_index = sym_options.index(cur) if cur in sym_options else 0
except ValueError:
    sym_index = 0

picked = st.selectbox(
    "Underlying",
    sym_options,
    index=sym_index,
    format_func=lambda s: uni.get(s).label if uni.get(s) else s,
    key="sym_select",
)
st.session_state["underlying_sym"] = picked

# Quick chips
chip_cols = st.columns(min(10, len(uni.quick_picks())))
for i, chip in enumerate(uni.quick_picks()):
    with chip_cols[i % len(chip_cols)]:
        if st.button(chip, key=f"chip-{chip}", use_container_width=True):
            st.session_state["underlying_sym"] = chip
            st.rerun()

_sel = uni.get(st.session_state["underlying_sym"])
if _sel:
    if _sel.proto_0dte_options:
        st.success(
            f"**{_sel.symbol}** — {_sel.name} · bars `{_sel.bar_ticker}` · "
            f"options `{_sel.options_underlying}` · backtest ready"
        )
    else:
        sub = _sel.etf_substitute
        st.warning(
            f"**{_sel.symbol}** — {_sel.name} ({_sel.asset_class}). "
            f"{_sel.notes} "
            + (
                f" Click **Use {sub}** below for a listed-options Spec."
                if sub
                else " Options Run test is blocked (no absolute false results)."
            )
        )
        if sub and st.button(f"Use {sub} instead", key=f"use-sub-{_sel.symbol}"):
            st.session_state["underlying_sym"] = sub
            st.rerun()
else:
    st.error("Pick a symbol from the curated list.")

underlying = st.session_state["underlying_sym"]


def _rg_seed_from_spec(sp: StrategySpec) -> dict:
    sm = (
        sp.normalized_strike_mode()
        if hasattr(sp, "normalized_strike_mode")
        else ("otm" if getattr(sp, "strike_mode", "atm") in ("otm", "otm_r2r") else "atm")
    )
    return {
        "structure": sp.structure,
        "body_side": getattr(sp, "body_side", None) or "both",
        "wing_width": float(sp.wing_width),
        "strike_mode": sm if sm in ("atm", "otm") else "atm",
        "body_offset": float(getattr(sp, "body_offset", 0.0) or 0.0),
        "contracts": int(sp.contracts),
    }


def _rg_apply_shape_to_widgets(shape_dict: dict) -> None:
    """Write shape into widget keys. Call ONLY before those widgets are created."""
    st.session_state["rg_structure"] = shape_dict["structure"]
    st.session_state["rg_body_side"] = shape_dict["body_side"]
    st.session_state["rg_wing"] = float(
        uni.snap_wing_width(underlying, float(shape_dict["wing_width"]))
    )
    st.session_state["rg_contracts"] = int(shape_dict.get("contracts") or 1)
    st.session_state["rg_strike_mode"] = shape_dict.get("strike_mode") or "atm"
    st.session_state["rg_body_offset"] = float(shape_dict.get("body_offset") or 0.0)
    st.session_state["rg_shape"] = {
        **shape_dict,
        "wing_width": st.session_state["rg_wing"],
        "contracts": st.session_state["rg_contracts"],
        "strike_mode": st.session_state["rg_strike_mode"],
        "body_offset": st.session_state["rg_body_offset"],
    }


def _persist_shape_to_design_spec(shape_dict: dict, base: StrategySpec) -> StrategySpec | None:
    """Merge risk-graph geometry into the saved Design Spec (strikes source of truth)."""
    updated = StrategySpec.from_dict(base.to_dict())
    updated.underlying = underlying
    updated.structure = shape_dict["structure"]  # type: ignore[assignment]
    updated.body_side = shape_dict["body_side"]  # type: ignore[assignment]
    updated.wing_width = float(
        uni.snap_wing_width(underlying, float(shape_dict["wing_width"]))
    )
    updated.strike_mode = (  # type: ignore[assignment]
        "atm" if mode == "basic" else (shape_dict.get("strike_mode") or "atm")
    )
    updated.body_offset = float(shape_dict.get("body_offset") or 0.0)
    updated.contracts = int(shape_dict.get("contracts") or base.contracts or 1)
    blocked = updated.honesty_errors()
    if blocked:
        return None
    store.save_spec(sid, updated)
    clear_lab_unsaved()
    return updated


# Apply handle-drag / pending shape BEFORE Design Spec form so the form and
# plain-English blurb see the new body_offset / wing / strikes.
if "rg_pending_shape" in st.session_state:
    _pending = st.session_state.pop("rg_pending_shape")
    if isinstance(_pending, dict):
        _rg_apply_shape_to_widgets(_pending)
        _saved = _persist_shape_to_design_spec(_pending, spec)
        if _saved is not None:
            spec = _saved
            row = store.get(sid) or row

_file_drag = consume_live_drag()
if isinstance(_file_drag, dict) and abs(float(_file_drag.get("offset") or 0)) >= 1e-12:
    _ts = _file_drag.get("ts")
    if _ts is None or st.session_state.get("rg_last_drag_ts") != _ts:
        st.session_state["rg_last_drag_ts"] = _ts
        _cur0 = dict(st.session_state.get("rg_shape") or _rg_seed_from_spec(spec))
        try:
            _sp0 = StrategySpec.from_dict(spec.to_dict())
            _sp0.underlying = underlying
            _sp0.structure = _cur0["structure"]  # type: ignore[assignment]
            _sp0.body_side = _cur0["body_side"]  # type: ignore[assignment]
            _sp0.wing_width = float(
                uni.snap_wing_width(underlying, float(_cur0["wing_width"]))
            )
            _sp0.strike_mode = _cur0.get("strike_mode") or "atm"  # type: ignore[assignment]
            _sp0.body_offset = float(_cur0.get("body_offset") or 0.0)
            _sp0.contracts = int(_cur0.get("contracts") or 1)
            _pkg0 = build_package(_sp0)
            _ns0 = apply_handle_drag(
                structure=_cur0["structure"],
                body_side=_cur0["body_side"],
                wing_width=float(_cur0["wing_width"]),
                strike_mode=str(_cur0.get("strike_mode") or "atm"),
                body_offset=float(_cur0.get("body_offset") or 0.0),
                symbol=underlying,
                package=_pkg0,
                event=_file_drag,
            )
            st.session_state["rg_pending_shape"] = {
                **_cur0,
                **_ns0,
                "contracts": int(_cur0.get("contracts") or 1),
            }
            _bo = float(_ns0.get("body_offset") or 0)
            _bo0 = float(_cur0.get("body_offset") or 0)
            if abs(_bo - _bo0) > 1e-9:
                st.session_state["rg_pending_toast"] = (
                    f"Design Spec updated · body {_bo:+g} vs ATM · wing ${_ns0['wing_width']:g}"
                )
            else:
                st.session_state["rg_pending_toast"] = (
                    f"Design Spec updated · wing ${_ns0['wing_width']:g}"
                )
            st.rerun()
        except Exception:  # noqa: BLE001
            pass

# Wing width grid follows symbol (SPY $1, SPX $5, NVDA $2.5, …)
_wing_p = uni.wing_input_params(underlying)
_wing_key = f"wing_w_{underlying}"
_sym_changed = st.session_state.get("wing_sym_prev") not in (None, underlying)
if _wing_key not in st.session_state or _sym_changed:
    if _sym_changed:
        # New symbol → its default wing (don't keep a SPY $5 on SPX)
        st.session_state[_wing_key] = _wing_p["default"]
    else:
        snapped = uni.snap_wing_width(underlying, float(spec.wing_width))
        st.session_state[_wing_key] = (
            snapped
            if abs(snapped - float(spec.wing_width)) < 1e-6
            else _wing_p["default"]
        )
st.session_state["wing_sym_prev"] = underlying

# ---------------------------------------------------------------------------
# Details drawer (sidebar) — Design Spec form, mode, connection
# Primary surface continues below with Risk Graph.
# ---------------------------------------------------------------------------
with st.sidebar:
    st.header("Details")
    st.caption(
        "Shape first on the graph, then: **Save Spec → Run backtest → Gate**. "
        "Close to return to the graph."
    )
    mode = st.radio(
        "Mode",
        ["basic", "pro"],
        horizontal=True,
        index=0 if store.get_mode() == "basic" else 1,
        format_func=lambda m: "Basic" if m == "basic" else "Pro",
        key="mode_radio",
    )
    if mode != store.get_mode():
        store.set_mode(mode)  # type: ignore[arg-type]

    with st.expander("Massive connection", expanded=not key_ok):
        st.write("Confirms the API key can fetch history.")
        if st.button("Ping Massive now", type="primary", key="ping_btn"):
            c = get_client()
            if not c:
                st.error("Client unavailable — check strategy-lab-proto/.env")
            else:
                try:
                    with st.spinner("Calling Massive…"):
                        ping = c.ping()
                    st.success(f"Connected to {ping.get('base')}")
                    st.json(ping)
                except Exception as exc:  # noqa: BLE001
                    st.error(f"Ping failed: {exc}")
                    st.code(traceback.format_exc())

    st.subheader("Save Spec")
    st.caption(f"Rules for `{sid}`. Save before you trust a backtest.")
    with st.expander("Honesty precept", expanded=False):
        st.warning(
            "**Precept #1 — No absolute false results.** "
            "We may hide advanced knobs in Basic, but we never turn off costs or pretend "
            "minute-perfect fills we don’t have. Fantasy backtests are forbidden."
        )

with st.sidebar:
  with st.form("spec_form", clear_on_submit=False):
    a, b = st.columns(2)
    with a:
        name = st.text_input("Name", spec.name)
        hypothesis = st.text_area("Hypothesis", spec.hypothesis, height=90)
        st.text_input(
            "Underlying (from selector above)",
            value=underlying,
            disabled=True,
        )
        _structs = list(TEMPLATES)
        _si = _structs.index(spec.structure) if spec.structure in _structs else 0
        structure = st.selectbox(
            "Structure",
            _structs,
            index=_si,
            format_func=lambda x: STRUCTURE_LABELS.get(x, x),
        )
        dte = st.selectbox(
            "DTE",
            [0, 1],
            index=0 if int(getattr(spec, "dte", 0) or 0) == 0 else 1,
            format_func=lambda x: DTE_LABELS.get(int(x), str(x)),
            help="Only 0 and 1 DTE are supported. Expiry is same day or next session.",
        )
        entry_session = st.selectbox(
            "Entry session",
            ["morning", "afternoon", "closing"],
            index=["morning", "afternoon", "closing"].index(
                getattr(spec, "entry_session", None) or "afternoon"
            )
            if (getattr(spec, "entry_session", None) or "afternoon")
            in ("morning", "afternoon", "closing")
            else 1,
            format_func=lambda x: (
                f"{ENTRY_SESSION_LABELS.get(x, x)} (~{get_session(x).fill_et} ET fill)"
            ),
        )
        entry_fill = st.selectbox(
            "Fill when",
            ["session_time", "condition", "session_and_condition"],
            index=["session_time", "condition", "session_and_condition"].index(
                getattr(spec, "entry_fill", None) or "session_time"
            )
            if (getattr(spec, "entry_fill", None) or "session_time")
            in ("session_time", "condition", "session_and_condition")
            else 0,
            format_func=lambda x: ENTRY_FILL_LABELS.get(x, x),
            help=(
                "Session time: fill at the session clock if day filters pass. "
                "Condition / session+condition: also require open-move (enable below)."
            ),
        )
        st.caption(
            f"Fill clock **{get_session(entry_session).fill_et} ET** · "
            f"prefers Massive **1-minute** bars (day bar only as labeled fallback)."
        )
    with b:
        wing_width = st.number_input(
            "Wing width ($)",
            min_value=float(_wing_p["min_value"]),
            max_value=float(_wing_p["max_value"]),
            step=float(_wing_p["step"]),
            help=(
                f"Steps of ${_wing_p['step']:g} for {underlying} "
                f"(min ${_wing_p['min_value']:g}, max ${_wing_p['max_value']:g}). "
                "Matches typical listed strike increments."
            ),
            key=_wing_key,
        )
        st.caption(
            f"Strike grid for **{underlying}**: "
            f"**${_wing_p['step']:g}** increments · default wing **${_wing_p['default']:g}**"
        )

        # --- 1) ATM / OTM switch ---
        st.markdown("**1 · ATM / OTM**")
        if mode == "basic":
            strike_mode = "atm"
            st.info("**Basic = ATM only.** Switch to **Pro** to use OTM.")
        else:
            _sm0 = spec.normalized_strike_mode() if hasattr(spec, "normalized_strike_mode") else (
                "otm" if spec.strike_mode in ("otm", "otm_r2r") else "atm"
            )
            strike_mode = st.radio(
                "Strikes",
                ["atm", "otm"],
                index=0 if _sm0 == "atm" else 1,
                format_func=lambda x: STRIKE_MODE_LABELS.get(x, x),
                horizontal=True,
                help="ATM = body at the money. OTM = scan further out; R2R picks which width.",
            )

        # --- 2) Direction (required with ATM and OTM) ---
        st.markdown("**2 · Direction** (required)")
        _bs = getattr(spec, "body_side", None) or "both"
        if _bs not in ("below", "above", "both"):
            _bs = "both"
        body_side = st.radio(
            "Vs ATM",
            ["below", "above", "both"],
            index=["below", "above", "both"].index(_bs),
            format_func=lambda x: BODY_SIDE_LABELS.get(x, x),
            horizontal=True,
            help=(
                "Below = put side only. Above = call side only. "
                "Both = put + call. Required — no blank. "
                "Independent of structure (fly, condor, vertical)."
            ),
        )
        if body_side == "both":
            st.caption("Both — put side and call side.")
        elif body_side == "below":
            st.caption("Below — put side only.")
        else:
            st.caption("Above — call side only.")

        # --- 3) R2R only when OTM (or optional min filter) ---
        target_r2r = float(spec.target_r2r) if spec.target_r2r else 0.33
        r2r_rule = getattr(spec, "r2r_rule", None) or "nearest"
        if mode == "pro" and strike_mode == "otm":
            st.markdown("**3 · OTM R2R**")
            r2r_rule = st.radio(
                "R2R rule",
                ["nearest", "minimum"],
                index=0 if r2r_rule == "nearest" else 1,
                format_func=lambda x: R2R_RULE_LABELS.get(x, x),
                horizontal=True,
            )
            target_r2r = st.number_input(
                "Target R2R (max profit ÷ debit)",
                min_value=0.05,
                max_value=50.0,
                value=min(50.0, max(0.05, float(target_r2r))),
                step=0.05,
                help=(
                    "(wing − debit) / debit. "
                    "Higher R2R = more reward per dollar of debit risk. "
                    "Minimum skips the day if nothing qualifies on that side."
                ),
            )
            if r2r_rule == "minimum":
                w = float(st.session_state.get(_wing_key, 3))
                # debit ≈ wing / (1 + R2R) when R2R = (wing−d)/d
                deb_hint = w / (1.0 + float(target_r2r))
                st.caption(
                    f"Only enter that side when R2R **≥ {target_r2r:g}** "
                    f"(on a ${w:g} wing ⇒ debit ≲ ${deb_hint:.2f})."
                )
            else:
                st.caption(f"Pick OTM width with R2R closest to **{target_r2r:g}** on each side.")
        elif mode == "pro" and strike_mode == "atm":
            r2r_rule = "nearest"
            st.caption("ATM: body/inners on the money for the direction(s) you chose. No OTM scan.")
        else:
            r2r_rule = "nearest"

        entry_time_et = get_session(entry_session).fill_et
        st.text_input(
            "Fill clock ET (from session)",
            value=entry_time_et,
            disabled=True,
        )
        contracts = int(st.number_input("Positions", 1, 20, int(spec.contracts)))
        capital = st.number_input("Capital context $", 500.0, 1e6, float(spec.capital), 100.0)
        skip_fomc = st.checkbox(
            "Skip FOMC days (day filter — not a vol edge by itself)",
            spec.skip_fomc,
        )
        use_open = st.checkbox(
            "Condition: only if open move is small",
            spec.open_move_max_pct is not None
            or (getattr(spec, "entry_fill", "") in ("condition", "session_and_condition")),
        )
        open_pct = st.number_input(
            "Max |open move| % (vs prior close)",
            0.1,
            5.0,
            float((spec.open_move_max_pct or 0.01) * 100),
            0.1,
        )
        _ex_default = (
            "hold_expiry"
            if spec.normalized_exit_mode() == "hold_expiry"
            else "take_profit"
        )
        exit_mode = st.selectbox(
            "Exit",
            ["hold_expiry", "take_profit"],
            index=0 if _ex_default == "hold_expiry" else 1,
            format_func=lambda x: EXIT_MODE_LABELS.get(x, x),
            help=(
                "Hold to expiry: no early exit. "
                "Take profit: close when target is reached on the daily close proxy."
            ),
        )
        take_profit_pct = float(spec.take_profit_pct) if spec.take_profit_pct else 50.0
        _tp_raw = getattr(spec, "take_profit_basis", "debit")
        take_profit_basis = "risk" if _tp_raw == "risk" else "debit"
        if exit_mode == "take_profit":
            take_profit_basis = st.selectbox(
                "Take profit measured as",
                ["debit", "risk"],
                index=0 if take_profit_basis == "debit" else 1,
                format_func=lambda x: TAKE_PROFIT_BASIS_LABELS.get(x, x),
                help=(
                    "% of max profit: exit when unrealized gain ≥ that share of "
                    "(wing − debit). "
                    "% of risk: target profit = that % of max loss (the debit paid)."
                ),
            )
            take_profit_pct = st.number_input(
                "Take profit %",
                min_value=1.0,
                max_value=100.0,
                value=float(take_profit_pct),
                step=5.0,
            )
            if take_profit_basis == "debit":
                st.caption(
                    f"Exit when profit ≥ **{take_profit_pct:g}%** of max profit "
                    f"(max profit ≈ wing − debit)."
                )
            else:
                st.caption(
                    f"Exit when profit ≥ **{take_profit_pct:g}%** of max loss "
                    f"(max loss = debit paid)."
                )
        else:
            take_profit_pct = float(spec.take_profit_pct) if spec.take_profit_pct else 50.0
            _tp_raw = getattr(spec, "take_profit_basis", "debit")
            take_profit_basis = "risk" if _tp_raw == "risk" else "debit"

    st.markdown("**Friction** (always applied in the backtest — costs stay on)")
    st.caption(
        "Slippage = $ worse than mid on premium. Commission & fees = $ per option "
        "contract per side (open and close). A 4-leg structure × 1 position = "
        "8 commission lines round-turn. **Basic** uses fixed defaults; **Pro** lets you edit."
    )
    if mode == "pro":
        p1, p2, p3, p4 = st.columns(4)
        with p1:
            slip_open = st.number_input("Open slippage $", 0.0, 1.0, float(spec.slip_open), 0.01)
        with p2:
            slip_close = st.number_input("Close slippage $", 0.0, 1.0, float(spec.slip_close), 0.01)
        with p3:
            commission = st.number_input(
                "Commission $/contract/side",
                0.0,
                5.0,
                float(spec.commission_per_contract),
                0.05,
            )
        with p4:
            fees = st.number_input(
                "Fees $/contract/side",
                0.0,
                2.0,
                float(spec.fees_per_contract),
                0.01,
            )
    else:
        # Always applied — not “Pro-only.” Values are fixed in Basic for simplicity.
        slip_open = float(spec.slip_open) if spec.slip_open is not None else 0.05
        slip_close = float(spec.slip_close) if spec.slip_close is not None else 0.05
        commission = (
            float(spec.commission_per_contract)
            if spec.commission_per_contract is not None
            else 0.50
        )
        fees = float(spec.fees_per_contract) if spec.fees_per_contract is not None else 0.10
        # Normalize Basic defaults if an old Spec had zeros/missing
        if mode == "basic":
            slip_open, slip_close = 0.05, 0.05
            commission, fees = 0.50, 0.10
        st.info(
            f"Using Basic defaults (always on): "
            f"open/close slippage **${slip_open:.2f}/${slip_close:.2f}** · "
            f"commission **${commission:.2f}**/contract/side · "
            f"fees **${fees:.2f}**/contract/side. "
            f"Switch to **Pro** only if you need to change these numbers."
        )

    max_loss_day = st.number_input(
        "Risk shell · max loss / day $",
        50.0,
        50_000.0,
        float(spec.risk.max_loss_per_day),
        50.0,
    )
    ack = st.checkbox(
        "I will not retune rules mid-campaign",
        value=spec.risk.acknowledge_no_retune or True,
    )

    # Preserve body_offset from Design Spec / risk-graph handle moves
    # (not on the form UI — set by drag on the risk graph).
    _body_off = float(
        st.session_state.get("rg_body_offset", getattr(spec, "body_offset", 0.0)) or 0.0
    )
    draft = StrategySpec(
        name=name,
        hypothesis=hypothesis,
        underlying=underlying,
        structure=structure,  # type: ignore[arg-type]
        wing_width=float(uni.snap_wing_width(underlying, float(wing_width))),
        strike_mode=("atm" if mode == "basic" else strike_mode),  # type: ignore[arg-type]
        target_r2r=float(target_r2r),
        r2r_rule=(
            "nearest"
            if mode == "basic" or strike_mode == "atm"
            else r2r_rule
        ),  # type: ignore[arg-type]
        body_side=body_side,  # type: ignore[arg-type]
        body_offset=_body_off,
        dte=int(dte),  # type: ignore[arg-type]
        entry_session=entry_session,  # type: ignore[arg-type]
        entry_fill=entry_fill,  # type: ignore[arg-type]
        entry_time_et=entry_time_et,
        contracts=int(contracts),
        capital=float(capital),
        skip_fomc=skip_fomc,
        open_move_max_pct=(open_pct / 100.0) if use_open else None,
        exit_mode=exit_mode,  # type: ignore[arg-type]
        take_profit_pct=float(take_profit_pct),
        take_profit_basis=take_profit_basis,  # type: ignore[arg-type]
        slip_open=float(slip_open),
        slip_close=float(slip_close),
        commission_per_contract=float(commission),
        fees_per_contract=float(fees),
    )
    draft.risk.max_loss_per_day = float(max_loss_day)
    draft.risk.acknowledge_no_retune = ack

    st.info(draft.plain_english())
    st.caption(
        f"Est. round-turn commission+fees for this Spec: "
        f"**${draft.friction_dollars_round_turn():.2f}** "
        f"({draft.n_legs()} legs × {draft.contracts} position(s) × 2 sides)."
    )
    save = st.form_submit_button("Save Spec", type="primary", use_container_width=True)
    if save:
        if not hypothesis.strip():
            st.error("Hypothesis is required.")
        elif not ack:
            st.error("Check the risk-shell acknowledgment.")
        else:
            blocked = draft.honesty_errors()
            if blocked:
                for e in blocked:
                    st.error(f"Honesty block: {e}")
            else:
                store.save_spec(sid, draft)
                clear_lab_unsaved()
                push_notice("success", "Spec saved. You can switch life-cycle phase.")
                st.success("Spec saved.")
                st.rerun()

# reload after possible save
row = store.get(sid) or row
spec = StrategySpec.from_dict(row.get("spec") or {})

# ---------------------------------------------------------------------------
# Risk graph (primary) — shape + chart
# ---------------------------------------------------------------------------

st.subheader("Shape on the risk graph")
st.caption(
    "Drag **body** / **wing**. Blue = expiry · orange = real-time. "
    "When the tent matches the idea → **Details** (left edge) → Save Spec → Run backtest."
)

_RISK_GRAPH_CACHE_VER = 7  # 7 = interactive strike handles

# Shape widgets + chart (pending drag already applied earlier, before Design form)
if st.session_state.get("rg_shape_sid") != sid:
    _seed0 = _rg_seed_from_spec(spec)
    st.session_state["rg_shape_sid"] = sid
    _rg_apply_shape_to_widgets(_seed0)
    st.session_state["rg_viewport_mode"] = "autofit"
    st.session_state["rg_view_box"] = None
    st.session_state["rg_force_autofit"] = True
    st.session_state["rg_viewport_seq"] = int(st.session_state.get("rg_viewport_seq") or 0) + 1
    st.session_state["rg_hours"] = 0.0
    st.session_state["rg_vol_shift"] = 0.0
    st.session_state["rg_spot_pct"] = 0.0

_wing_p_rg = uni.wing_input_params(underlying)

# --- Shape builder (drives package geometry) ---
st.markdown("**Shape**")
sc1, sc2, sc3, sc4 = st.columns(4)
with sc1:
    st.selectbox(
        "Structure",
        TEMPLATES,
        format_func=lambda x: STRUCTURE_LABELS.get(x, x),
        key="rg_structure",
    )
with sc2:
    st.radio(
        "Direction",
        ["below", "above", "both"],
        format_func=lambda x: BODY_SIDE_LABELS.get(x, x),
        horizontal=True,
        key="rg_body_side",
    )
with sc3:
    st.slider(
        "Wing width ($)",
        min_value=float(_wing_p_rg["min_value"]),
        max_value=float(_wing_p_rg["max_value"]),
        step=float(_wing_p_rg["step"]),
        key="rg_wing",
    )
with sc4:
    st.number_input("Positions", 1, 20, key="rg_contracts")

sc5, sc6 = st.columns(2)
with sc5:
    if mode == "basic":
        st.session_state["rg_strike_mode"] = "atm"
        st.info("Basic = ATM strikes. Switch to Pro for OTM.")
    else:
        st.radio(
            "ATM / OTM",
            ["atm", "otm"],
            format_func=lambda x: STRIKE_MODE_LABELS.get(x, x),
            horizontal=True,
            key="rg_strike_mode",
        )
with sc6:
    st.caption("View")
    if st.button(
        "Autofit",
        width="stretch",
        key="rg_autofit_btn",
        help="Center the chart on the structure. Does not change the Spec.",
    ):
        st.session_state["rg_autofit_seq"] = int(
            st.session_state.get("rg_autofit_seq") or 0
        ) + 1
        st.session_state["rg_force_autofit"] = True
        st.session_state["rg_viewport_seq"] = int(
            st.session_state.get("rg_viewport_seq") or 0
        ) + 1
        st.rerun()
    st.caption("Pan · scroll zoom · Shift+scroll = height")

# --- What-If (details drawer) ---
with st.sidebar:
    with st.expander("What-If (view only)", expanded=False):
        if "rg_hours" not in st.session_state:
            st.session_state["rg_hours"] = 0.0
        st.slider(
            "Hours elapsed",
            min_value=0.0,
            max_value=8.0,
            step=0.25,
            key="rg_hours",
            help="Burns remaining life on the real-time curve (T+0).",
        )
        if "rg_vol_shift" not in st.session_state:
            st.session_state["rg_vol_shift"] = 0.0
        st.slider(
            "Vol shift %",
            min_value=-50.0,
            max_value=50.0,
            step=1.0,
            key="rg_vol_shift",
        )
        if "rg_spot_pct" not in st.session_state:
            st.session_state["rg_spot_pct"] = 0.0
        st.slider(
            "Spot what-if %",
            min_value=-5.0,
            max_value=5.0,
            step=0.1,
            key="rg_spot_pct",
            help="Moves the green marker along the real-time curve (does not reprice shape).",
        )

if "rg_body_offset" not in st.session_state:
    st.session_state["rg_body_offset"] = float(getattr(spec, "body_offset", 0.0) or 0.0)

shape = {
    "structure": st.session_state["rg_structure"],
    "body_side": st.session_state["rg_body_side"],
    "wing_width": float(st.session_state["rg_wing"]),
    "strike_mode": (
        "atm" if mode == "basic" else st.session_state.get("rg_strike_mode") or "atm"
    ),
    "body_offset": float(st.session_state.get("rg_body_offset") or 0.0),
    "contracts": int(st.session_state["rg_contracts"]),
}
st.session_state["rg_shape"] = shape

# Draft Spec for rendering = saved Spec with shape overrides
draft_rg = StrategySpec.from_dict(spec.to_dict())
draft_rg.underlying = underlying
draft_rg.structure = shape["structure"]  # type: ignore[assignment]
draft_rg.body_side = shape["body_side"]  # type: ignore[assignment]
draft_rg.wing_width = float(uni.snap_wing_width(underlying, float(shape["wing_width"])))
draft_rg.strike_mode = shape["strike_mode"]  # type: ignore[assignment]
draft_rg.body_offset = float(shape.get("body_offset") or 0.0)
draft_rg.contracts = int(shape["contracts"])


try:
    gsum = geometry_summary(
        draft_rg,
        hours_elapsed=float(st.session_state.get("rg_hours") or 0),
        vol_shift_pct=float(st.session_state.get("rg_vol_shift") or 0),
    )
    # Echo/Tango: risk first (stop-the-bleeding), not profit hero
    m1, m2, m3, m4, m5 = st.columns(5)
    _max_loss = gsum.get("est_max_loss")
    _max_profit = gsum.get("est_max_profit")
    with m1:
        st.metric(
            "Max risk",
            f"${_max_loss:,.0f}" if _max_loss is not None else "—",
        )
    with m2:
        st.metric(
            "Best case at expiry",
            f"${_max_profit:,.0f}" if _max_profit is not None else "—",
        )
    with m3:
        # Risk-to-reward = max profit ÷ max risk (one decimal)
        if (
            _max_loss is not None
            and _max_profit is not None
            and float(_max_loss) > 1e-9
        ):
            _r2r = float(_max_profit) / float(_max_loss)
            st.metric("Risk-to-reward", f"{_r2r:.1f}")
        else:
            st.metric("Risk-to-reward", "—")
    with m4:
        st.metric("Spot", f"${gsum['spot_ref']:.0f}" if gsum.get("spot_ref") else "—")
    with m5:
        iv = gsum.get("single_iv")
        st.metric("IV", f"{iv * 100:.0f}%" if iv is not None else "—")

    # MSC viewState: sticky box unless Autofit was just requested
    _force_fit = bool(st.session_state.pop("rg_force_autofit", False))
    if st.session_state.get("rg_view_box") is None:
        _force_fit = True
    if "rg_viewport_seq" not in st.session_state:
        st.session_state["rg_viewport_seq"] = 0
    if "rg_viewport_mode" not in st.session_state:
        st.session_state["rg_viewport_mode"] = "autofit"

    chart_data = interactive_chart_data(
        draft_rg,
        viewport_mode=st.session_state.get("rg_viewport_mode") or "autofit",
        hours_elapsed=float(st.session_state.get("rg_hours") or 0),
        vol_shift_pct=float(st.session_state.get("rg_vol_shift") or 0),
        sticky_viewport=st.session_state.get("rg_view_box"),
        force_autofit=_force_fit,
        viewport_seq=int(st.session_state.get("rg_viewport_seq") or 0),
    )
    st.session_state["rg_view_box"] = dict(chart_data["viewport"])

    # Real MSC PnLChart (vendored) via Vite UI + CCv2 bridge
    _rg_key = f"rg_handles_{sid}"
    msc_payload = to_msc_chart_payload(
        chart_data,
        symbol=underlying,
        dte=int(getattr(draft_rg, "dte", 0) or 0),
        structure=str(draft_rg.structure),
        credit=float(chart_data.get("credit") or 0),
    )
    # Write chart for MSC UI poller + open tall iframe (no nested CCv2 shadow)
    write_live_chart(msc_payload)
    risk_handles_chart(
        {"chart": msc_payload},
        key=_rg_key,
        ui_url=st.session_state.get("rg_msc_ui_url") or "http://127.0.0.1:5174/",
        autofit_seq=int(st.session_state.get("rg_autofit_seq") or 0),
        height=900,
    )
    with st.expander("Chart not loading?", expanded=False):
        st.caption(
            "Ops: risk-graph UI should be on http://127.0.0.1:5174 "
            "(`cd msc-risk-graph-ui && npm run preview`)."
        )

    # Drag commits land in live-drag.json; pick up on next interaction/rerun
    # (also handled at top of this section via consume_live_drag)

    toast_msg = st.session_state.pop("rg_pending_toast", None)
    if toast_msg:
        st.toast(toast_msg)

    # Lightweight poll: refresh when a drag file appears
    @st.fragment(run_every=1)
    def _rg_poll_drag() -> None:
        ev = consume_live_drag()
        if not isinstance(ev, dict):
            return
        if abs(float(ev.get("offset") or 0)) < 1e-12:
            return
        ts = ev.get("ts")
        if ts is not None and st.session_state.get("rg_last_drag_ts") == ts:
            return
        st.session_state["rg_last_drag_ts"] = ts
        cur = dict(st.session_state.get("rg_shape") or shape)
        try:
            sp = StrategySpec.from_dict(spec.to_dict())
            sp.underlying = underlying
            sp.structure = cur["structure"]  # type: ignore[assignment]
            sp.body_side = cur["body_side"]  # type: ignore[assignment]
            sp.wing_width = float(
                uni.snap_wing_width(underlying, float(cur["wing_width"]))
            )
            sp.strike_mode = cur.get("strike_mode") or "atm"  # type: ignore[assignment]
            sp.body_offset = float(cur.get("body_offset") or 0.0)
            sp.contracts = int(cur.get("contracts") or 1)
            new_shape = apply_handle_drag(
                structure=cur["structure"],
                body_side=cur["body_side"],
                wing_width=float(cur["wing_width"]),
                strike_mode=str(cur.get("strike_mode") or "atm"),
                body_offset=float(cur.get("body_offset") or 0.0),
                symbol=underlying,
                package=build_package(sp),
                event=ev,
            )
            st.session_state["rg_pending_shape"] = {
                **cur,
                **new_shape,
                "contracts": int(cur.get("contracts") or 1),
            }
            _bo = float(new_shape.get("body_offset") or 0)
            _bo0 = float(cur.get("body_offset") or 0)
            if abs(_bo - _bo0) > 1e-9:
                st.session_state["rg_pending_toast"] = (
                    f"Design Spec updated · body {_bo:+g} vs ATM · wing ${new_shape['wing_width']:g}"
                )
            else:
                st.session_state["rg_pending_toast"] = (
                    f"Design Spec updated · wing ${new_shape['wing_width']:g}"
                )
            st.rerun()
        except Exception:  # noqa: BLE001
            return

    _rg_poll_drag()

    be_txt = ", ".join(f"${b:.2f}" for b in (gsum.get("breakevens") or []))
    bo = float(shape.get("body_offset") or 0.0)
    bo_txt = f" · body {bo:+g} vs ATM" if abs(bo) > 1e-9 else ""
    st.caption(
        f"**{gsum.get('labels', ['—'])[0]}** · wing ${gsum.get('wing')}{bo_txt} · "
        f"debit ≈ ${gsum.get('est_debit_per_share') or gsum.get('est_credit_per_share') or 0:.2f}/sh · "
        f"BEs: {be_txt or '—'}"
    )

    st.caption(
        "**Spec law:** handles auto-save shape. "
        "Left-edge **Details** → Save Spec → Run backtest → Gate. "
        "Force save only if a toast did not fire."
    )
    apply_c1, apply_c2, apply_c3 = st.columns([2, 2, 2])
    with apply_c1:
        if st.button(
            "What next? (Details path)",
            type="primary",
            width="stretch",
            key="rg_open_details_hint",
            help="Opens a reminder: use the left-edge control for the Details drawer.",
        ):
            st.info(
                "Open **Details** with the **left-edge button**, then: "
                "Save Spec → Run backtest → Gate."
            )
    with apply_c2:
        if st.button("Force save shape", width="stretch", key="rg_apply"):
            updated = StrategySpec.from_dict(spec.to_dict())
            updated.underlying = underlying
            updated.structure = shape["structure"]  # type: ignore[assignment]
            updated.body_side = shape["body_side"]  # type: ignore[assignment]
            updated.wing_width = float(uni.snap_wing_width(underlying, float(shape["wing_width"])))
            updated.strike_mode = (
                "atm" if mode == "basic" else shape["strike_mode"]
            )  # type: ignore[assignment]
            updated.body_offset = float(shape.get("body_offset") or 0.0)
            updated.contracts = int(shape["contracts"])
            blocked = updated.honesty_errors()
            if blocked:
                for e in blocked:
                    st.error(f"Honesty block: {e}")
            else:
                store.save_spec(sid, updated)
                clear_lab_unsaved()
                st.session_state["rg_shape"] = _rg_seed_from_spec(updated)
                st.session_state["rg_body_offset"] = float(updated.body_offset or 0.0)
                push_notice("success", "Spec updated from risk graph. Phase switch OK.")
                st.success(
                    f"Spec updated: {STRUCTURE_LABELS.get(updated.structure, updated.structure)} · "
                    f"{BODY_SIDE_LABELS.get(updated.body_side, updated.body_side)} · "
                    f"wing ${updated.wing_width:g}"
                    + (
                        f" · body {updated.body_offset:+g}"
                        if abs(float(updated.body_offset or 0)) > 1e-9
                        else ""
                    )
                )
                st.rerun()
    with apply_c3:
        if st.button("Reset shape from Spec", width="stretch", key="rg_reset"):
            st.session_state["rg_pending_shape"] = _rg_seed_from_spec(spec)
            st.session_state["rg_hours"] = 0.0
            st.session_state["rg_vol_shift"] = 0.0
            st.session_state["rg_spot_pct"] = 0.0
            st.rerun()
except Exception as exc:  # noqa: BLE001
    st.error(f"Risk graph failed: {exc}")
    st.code(traceback.format_exc())

# ---------------------------------------------------------------------------
# Backtest + lifecycle (details drawer)
# ---------------------------------------------------------------------------
with st.sidebar:
    st.divider()
    st.subheader("Run backtest")
    st.caption(
        "Daily proxies + friction always on — not live fills. "
        "Save Spec first. Sample path, not a performance promise."
    )

    d0, d1 = default_date_window(40)
    start = st.date_input("Start", date.fromisoformat(d0), key="bt_start")
    end = st.date_input("End", date.fromisoformat(d1), key="bt_end")
    max_days = st.slider(
        "Max sessions to test",
        min_value=5,
        max_value=40,
        value=12 if mode == "basic" else 20,
        help="Each session can call Massive several times. Start small.",
    )
    run_clicked = st.button("Run backtest", type="primary", width="stretch")

with st.sidebar:
    if run_clicked:
        client = get_client()
        blocked = spec.honesty_errors()
        if blocked:
            for e in blocked:
                st.error(f"Honesty block: {e}")
        elif not client:
            st.error("No Massive client — fix .env and ping first.")
        else:
            progress = st.progress(0, text="Starting…")
            status = st.empty()
            try:
                status.info(
                    f"Fetching {spec.underlying} bars {start} → {end}, "
                    f"then up to {max_days} sessions of option data…"
                )
                progress.progress(10, text="Loading underlying bars…")
                result = run_backtest(
                    client,
                    spec,
                    start=start.isoformat(),
                    end=end.isoformat(),
                    max_days=int(max_days),
                )
                progress.progress(100, text="Done")
                st.session_state["last_result"] = result
                st.session_state["last_result_sid"] = sid
                m = result.metrics()
                store.update(sid, last_metrics=m, last_verdict=result.verdict())
                if result.errors:
                    for e in result.errors:
                        st.error(e)
                elif result.trades:
                    st.success(
                        f"Finished — {len(result.trades)} trades, {len(result.skips)} skips"
                    )
                else:
                    st.warning(
                        f"Finished with 0 trades and {len(result.skips)} skips. "
                        "Expand Skipped days — often contracts/API plan limits."
                    )
            except Exception as exc:  # noqa: BLE001
                st.error(f"Backtest crashed: {exc}")
                st.code(traceback.format_exc())
            finally:
                progress.empty()

    result: BacktestResult | None = st.session_state.get("last_result")
    if result and st.session_state.get("last_result_sid") == sid:
        m = result.metrics()
        st.markdown("**Results**")
        st.metric("Total P/L", f"${m['total_pnl']}")
        st.metric("Max drawdown", f"${m['max_drawdown']}")
        st.metric("Win rate", f"{100 * m['win_rate']:.1f}%")
        st.metric("Trades", str(m["n_trades"]))
        st.metric("Holdout", str(m["holdout"]))
        st.markdown(f"**Verdict:** {result.verdict()}")

        if mode == "pro":
            st.caption(
                f"IS P/L ${m['is_pnl']} · OOS P/L ${m['oos_pnl']} · "
                f"PF {m['profit_factor']} · skips {m['n_skips']}"
            )

        for n in result.notes:
            st.caption(n)

        if result.trades:
            df = pd.DataFrame(
                [
                    {
                        "day": t.day,
                        "pnl": t.pnl,
                        "pnl_before_costs": t.pnl_before_costs,
                        "commission": t.commissions,
                        "fees": t.fees,
                        "debit": t.credit,  # open debit premium
                        "exit": t.exit_reason,
                        "spot_open": t.spot_open,
                        "spot_close": t.spot_close,
                    }
                    for t in result.trades
                ]
            )
            st.dataframe(df, width="stretch")
            eq = df[["day", "pnl"]].copy()
            eq["equity"] = eq["pnl"].cumsum()
            st.line_chart(eq.set_index("day")["equity"], height=200)

        if result.skips:
            with st.expander(
                f"Skipped days ({len(result.skips)})", expanded=not result.trades
            ):
                st.dataframe(pd.DataFrame(result.skips), width="stretch")

        st.markdown("**Gate**")
        st.caption(
            "Only after a backtest you trust. "
            "Close Details to edit graph/Spec, then run again — that *is* keep designing."
        )
        if st.button("Send to Curation", type="primary", width="stretch", key="gate_curate"):
            if m["holdout"] == "broken":
                st.error(
                    "Train and holdout disagreed — don't advance; redesign or kill with a reason."
                )
            elif m["n_trades"] < 3:
                st.error("Need more trades before curation.")
            elif (
                mode == "basic"
                and len(store.by_stage("curation")) >= 1
                and row["stage"] != "curation"
            ):
                st.error(
                    "Basic: one strategy in Curation at a time — finish or kill before adding another."
                )
            elif (
                mode == "pro"
                and len(store.by_stage("curation")) >= 3
                and row["stage"] != "curation"
            ):
                st.error(
                    "Pro: up to three in Curation — finish or kill one before adding another."
                )
            else:
                store.update(sid, stage="curation", health="in_process")
                st.success("Moved to Curation.")
                st.rerun()
        kill_reason = st.text_input(
            "Kill reason",
            placeholder="e.g. holdout weak / not my style",
            key="kill_reason",
            help="Kills are process wins — write why.",
        )
        if st.button("Kill strategy", width="stretch", key="gate_kill"):
            if not (kill_reason or "").strip():
                st.error("Write a reason — kills are process wins.")
            else:
                store.update(
                    sid,
                    stage="killed",
                    health="sick",
                    kill_reason=kill_reason.strip(),
                )
                st.warning("Killed.")
                st.rerun()

    if row["stage"] == "curation":
        st.divider()
        st.subheader("Curation")
        cs = st.date_input("Campaign start", date.today(), key="camp_s")
        ce = st.date_input("Campaign end", date.today() + timedelta(days=14), key="camp_e")
        if st.button("Start paper Deployment", type="primary", width="stretch"):
            store.update(
                sid,
                stage="deployment",
                health="mature",
                campaign={"start": cs.isoformat(), "end": ce.isoformat(), "paper": True},
            )
            st.success("Now in Deployment.")
            st.rerun()

    if row["stage"] == "deployment":
        st.divider()
        st.subheader("Deployment")
        st.json(row.get("campaign") or {})
        lesson = st.text_area("Retrospective — one process lesson", key="retro")
        if st.button("End campaign → Design", width="stretch"):
            store.update(
                sid,
                stage="design",
                health="in_process",
                last_verdict=f"Retro: {lesson.strip() or '(none)'}",
            )
            st.success("Campaign closed.")
            st.rerun()

    with st.expander("About this prototype"):
        st.markdown(
            """
- **Life cycle:** Design → Curation → Deployment  
- **Modes:** Basic / Pro  
- **Data:** Massive REST (daily bars + 0DTE option day bars)  
- **Limit:** fills use daily open/close proxies  
- State: `strategy-lab-proto/data/lab_state.json`
"""
        )
