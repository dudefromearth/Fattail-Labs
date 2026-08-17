"""Trade Log import/export — canonical document + broker adapters.

Format: fattail.labs.trade_log (Spec v1.1 §7)
Adapters: native, csv_generic, thinkorswim
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import re
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any

import trade_log_catalog as cat

FORMAT = "fattail.labs.trade_log"
MODEL_VERSION = "1.0"

ADAPTERS = [
    {
        "id": "native",
        "label": "FatTail canonical (.tradlog.json)",
        "extensions": [".tradlog.json", ".json"],
        "direction": "import_export",
    },
    {
        "id": "csv_generic",
        "label": "FatTail flat CSV (legs)",
        "extensions": [".csv"],
        "direction": "import_export",
    },
    {
        "id": "thinkorswim",
        "label": "thinkorswim / ToS Account Trade History CSV",
        "extensions": [".csv"],
        "direction": "import_export",
    },
    {
        "id": "tradier",
        "label": "Tradier Account History CSV",
        "extensions": [".csv"],
        "direction": "import_export",
    },
    {
        "id": "tradestation",
        "label": "TradeStation Trades CSV",
        "extensions": [".csv"],
        "direction": "import_export",
    },
]

# Account venue → preferred "native" export adapter (import origin / platform format)
VENUE_NATIVE_EXPORT = {
    "thinkorswim": "thinkorswim",
    "schwab": "thinkorswim",
    "thinkorswim_paper": "thinkorswim",
    "tradier": "tradier",
    "tradestation": "tradestation",
    "fattail": "native",
    "unset": "native",
}


def resolve_export_format(fmt: str, account_broker: str | None = None) -> str:
    """Map user-facing format to serializer key.

    - ``canonical`` / ``json`` / ``fattail`` → FatTail tradlog JSON
    - ``native`` → account venue's native format (ToS CSV, or canonical if FatTail)
    - ``thinkorswim`` / ``tos`` → ToS Account Trade History CSV
    - ``csv`` / ``csv_generic`` → flat legs CSV
    """
    f = (fmt or "canonical").strip().lower()
    if f in ("canonical", "json", "fattail", "tradlog"):
        return "canonical"
    if f in ("thinkorswim", "tos", "schwab"):
        return "thinkorswim"
    if f in ("tradier",):
        return "tradier"
    if f in ("tradestation", "ts"):
        return "tradestation"
    if f in ("csv", "csv_generic", "flat"):
        return "csv_generic"
    if f == "native":
        venue = (account_broker or "fattail").strip().lower()
        return VENUE_NATIVE_EXPORT.get(venue, "canonical")
    return "canonical"


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _dec(v: Any) -> float | None:
    if v is None or v == "":
        return None
    s = str(v).replace(",", "").replace("$", "").strip()
    # ToS often puts DEBIT/CREDIT in the Net Price column on leg 2
    if s.upper() in ("DEBIT", "CREDIT"):
        return None
    # Leading-dot decimals: ".60" → "0.60"
    if s.startswith("."):
        s = "0" + s
    if s.startswith("-."):
        s = "-0" + s[1:]
    try:
        return float(Decimal(s))
    except (InvalidOperation, ValueError):
        return None


def _extract_net_side(v: Any) -> str | None:
    s = str(v or "").strip().upper()
    if s in cat.NET_SIDES:
        return s
    m = re.search(r"\b(DEBIT|CREDIT)\b", s)
    return m.group(1) if m else None


def _parse_dt(raw: str) -> str | None:
    raw = (raw or "").strip()
    if not raw:
        return None
    # Normalize common ToS / US formats
    candidates = [
        raw,
        raw.replace("/", "-"),
    ]
    fmts = [
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%m/%d/%y %H:%M:%S",
        "%m/%d/%Y %H:%M:%S",
        "%m/%d/%y %H:%M",
        "%m/%d/%Y %H:%M",
        "%m/%d/%y",
        "%m/%d/%Y",
    ]
    for c in candidates:
        c2 = c.replace("Z", "")
        for fmt in fmts:
            try:
                dt = datetime.strptime(c2[:19] if len(c2) >= 19 else c2, fmt)
                if fmt in ("%Y-%m-%d", "%m/%d/%y", "%m/%d/%Y"):
                    dt = dt.replace(hour=12, minute=0, second=0)
                return dt.strftime("%Y-%m-%dT%H:%M:%S")
            except ValueError:
                continue
    return None


def _parse_expiry(raw: str) -> str | None:
    raw = (raw or "").strip()
    if not raw:
        return None
    # "21 APR 26 (Weeklys)" or "4/21/26" or ISO
    m = re.match(
        r"(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})",
        raw,
    )
    if m:
        day, mon, yr = m.group(1), m.group(2).title(), m.group(3)
        if len(yr) == 2:
            yr = "20" + yr
        try:
            dt = datetime.strptime(f"{day} {mon} {yr}", "%d %b %Y")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass
    iso = _parse_dt(raw.split("(")[0].strip())
    return iso[:10] if iso else None


def _norm_header(h: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (h or "").lower())


# Map normalized headers → field
_HEADER_MAP = {
    "exectime": "exec_at",
    "time": "exec_at",
    "datetime": "exec_at",
    "filltime": "exec_at",
    "spread": "strategy",
    "strategy": "strategy",
    "side": "side",
    "qty": "quantity",
    "quantity": "quantity",
    "qtyposeffect": "qty_effect",
    "poseffect": "pos_effect",
    "positioneffect": "pos_effect",
    "symbol": "symbol",
    "underlier": "underlier",
    "underlying": "underlier",
    "exp": "expiry",
    "expiry": "expiry",
    "expiration": "expiry",
    "strike": "strike",
    "type": "right",
    "callput": "right",
    "putcall": "right",
    "price": "fill_price",
    "fillprice": "fill_price",
    "avgprice": "fill_price",
    "netprice": "net_price",
    "net": "net_price",
    "ordertype": "order_type",
    "order": "order_type",
    "debitcredit": "net_side",
    "netsides": "net_side",
    "account": "account_label",
    "accountlabel": "account_label",
    "broker": "broker",
    "setup": "setup_md",
    "setupmd": "setup_md",
    "plan": "plan_md",
    "planmd": "plan_md",
    "adherence": "adherence",
    "lesson": "lesson_md",
    "lessonmd": "lesson_md",
    "pnl": "pnl_amount",
    "pnlamount": "pnl_amount",
    "assetclass": "asset_class",
}


def _map_row(headers: list[str], row: list[str]) -> dict[str, str]:
    out: dict[str, str] = {}
    for h, v in zip(headers, row):
        key = _HEADER_MAP.get(_norm_header(h))
        if key:
            out[key] = (v or "").strip()
    # Combined qty + effect e.g. "+1 TO OPEN"
    if "qty_effect" in out and "quantity" not in out:
        m = re.match(
            r"([+\-]?\d+)\s*(TO\s+OPEN|TO\s+CLOSE|OPEN|CLOSE)?",
            out["qty_effect"],
            re.I,
        )
        if m:
            out["quantity"] = m.group(1).lstrip("+")
            pe = (m.group(2) or "").upper().replace(" ", "_")
            if pe in ("OPEN", "TO_OPEN"):
                out["pos_effect"] = "TO_OPEN"
            elif pe in ("CLOSE", "TO_CLOSE"):
                out["pos_effect"] = "TO_CLOSE"
    # Strike type combined "7080 PUT"
    if "strike" in out and "right" not in out:
        m = re.match(r"([\d.]+)\s*(PUT|CALL)?", out["strike"], re.I)
        if m:
            out["strike"] = m.group(1)
            if m.group(2):
                out["right"] = m.group(2).upper()
    # Net may include DEBIT/CREDIT
    if "net_price" in out:
        m = re.match(
            r"([+\-]?[\d.]+)\s*(DEBIT|CREDIT)?",
            out["net_price"],
            re.I,
        )
        if m:
            out["net_price"] = m.group(1)
            if m.group(2) and "net_side" not in out:
                out["net_side"] = m.group(2).upper()
    return out


def _strategy_code(raw: str) -> str:
    s = re.sub(r"[^A-Z0-9]+", "_", (raw or "CUSTOM").upper()).strip("_")
    aliases = {
        "FLY": "BUTTERFLY",
        "BF": "BUTTERFLY",
        "BWF": "BROKEN_WING_FLY",
        "BROKEN_WING": "BROKEN_WING_FLY",
        "BROKEN_WING_BUTTERFLY": "BROKEN_WING_FLY",
        "BROKENWING": "BROKEN_WING_FLY",
        "BROKENWINGFLY": "BROKEN_WING_FLY",
        "IRONCONDOR": "IRON_CONDOR",
        "IRONFLY": "IRON_FLY",
        "VERT": "VERTICAL",
        "CALL_VERTICAL": "VERTICAL",
        "PUT_VERTICAL": "VERTICAL",
        "SINGLE_LEG": "SINGLE",
        "STOCK": "STOCK",
        "EQUITY": "STOCK",
    }
    s = aliases.get(s, s)
    if s in cat.STRATEGY_CODES:
        return s
    return "CUSTOM"


def _leg_from_mapped(m: dict[str, str], index: int) -> dict:
    side = (m.get("side") or "BUY").upper()
    if side not in ("BUY", "SELL"):
        side = "BUY"
    qty_raw = (m.get("quantity") or "1").replace("+", "").strip()
    try:
        qty = abs(int(float(qty_raw)))
    except ValueError:
        qty = 1
    pe = (m.get("pos_effect") or "").upper().replace(" ", "_")
    if pe in ("OPEN",):
        pe = "TO_OPEN"
    if pe in ("CLOSE",):
        pe = "TO_CLOSE"
    if pe not in ("TO_OPEN", "TO_CLOSE"):
        pe = "TO_OPEN" if side == "BUY" else "TO_CLOSE"
    right = (m.get("right") or "").upper() or None
    if right and right not in ("PUT", "CALL"):
        right = None
    underlier = m.get("underlier") or m.get("symbol") or "SPX"
    # OCC-style symbol often is underlier for index options in ToS export
    if underlier and len(underlier) > 8 and not m.get("underlier"):
        underlier = underlier[:6]
    ac = (m.get("asset_class") or "equity_option").strip().lower()
    # Normalize aliases seen in broker books / older exports
    ac_aliases = {
        "futures": "future",
        "futures_option": "future_option",
        "fut_opt": "future_option",
        "option": "equity_option",
        "options": "equity_option",
        "stock": "equity",
        "etf": "equity",
    }
    ac = ac_aliases.get(ac, ac)
    if ac not in cat.ASSET_CLASSES:
        ac = "equity_option"
    return {
        "leg_index": index,
        "side": side,
        "quantity": max(1, qty),
        "pos_effect": pe,
        "asset_class": ac,
        "underlier": underlier[:64] if underlier else None,
        "symbol": m.get("symbol"),
        "expiry": _parse_expiry(m.get("expiry") or ""),
        "strike": _dec(m.get("strike")),
        "right": right,
        "fill_price": _dec(m.get("fill_price")) or 0.0,
        "fees": _dec(m.get("fees")) if m.get("fees") not in (None, "") else None,
    }


def _trade_hash(exec_at: str, strategy: str, legs: list[dict]) -> str:
    blob = json.dumps(
        {"e": exec_at, "s": strategy, "l": legs},
        sort_keys=True,
        default=str,
    )
    return hashlib.sha256(blob.encode()).hexdigest()[:24]


def _group_tos_rows(rows: list[dict[str, str]]) -> list[dict]:
    """Group consecutive ToS rows into multi-leg trades by exec time + strategy.

    Net price / debit-credit often appear only on the first leg of a block — do
    not include them in the group key.
    """
    trades: list[dict] = []
    current: dict | None = None
    leg_i = 0
    for m in rows:
        # Blank exec on continuation rows → inherit current trade time
        raw_exec = (m.get("exec_at") or "").strip()
        if raw_exec:
            exec_at = _parse_dt(raw_exec) or _now_iso()[:19]
        elif current is not None:
            exec_at = current["exec_at"]
        else:
            exec_at = _now_iso()[:19]
        raw_strat = (m.get("strategy") or "").strip()
        if raw_strat:
            strategy = _strategy_code(raw_strat)
        elif current is not None:
            strategy = current["strategy"]
        else:
            strategy = "CUSTOM"
        key = (exec_at, strategy)
        if current is None or current["_key"] != key:
            if current:
                del current["_key"]
                trades.append(current)
            leg_i = 0
            net_side = (m.get("net_side") or "").upper() or None
            if net_side and net_side not in cat.NET_SIDES:
                net_side = None
            current = {
                "_key": key,
                "exec_at": exec_at,
                "strategy": strategy,
                "asset_class": "equity_option",
                "order_type": (m.get("order_type") or "LMT").upper()[:32] or "LMT",
                "net_price": _dec(m.get("net_price")),
                "net_side": net_side,
                "setup_md": m.get("setup_md") or "",
                "plan_md": m.get("plan_md") or "",
                "rules_md": "",
                "adherence": m.get("adherence") or "unknown",
                "deviation_md": "",
                "lesson_md": m.get("lesson_md") or "",
                "pnl_amount": _dec(m.get("pnl_amount")),
                "legs": [],
                "external_order_id": None,
            }
        assert current is not None
        current["legs"].append(_leg_from_mapped(m, leg_i))
        leg_i += 1
        # Fill net from first row that has it
        if current["net_price"] is None and m.get("net_price"):
            current["net_price"] = _dec(m.get("net_price"))
        if not current["net_side"] and m.get("net_side"):
            ns = m["net_side"].upper()
            if ns in cat.NET_SIDES:
                current["net_side"] = ns
        if not current.get("order_type") and m.get("order_type"):
            current["order_type"] = m["order_type"].upper()[:32]
    if current:
        del current["_key"]
        trades.append(current)
    for t in trades:
        t["external_order_id"] = _trade_hash(t["exec_at"], t["strategy"], t["legs"])
    return trades


# --- Public API --------------------------------------------------------------


def detect(sample: str) -> list[dict]:
    """Return adapters with confidence 0..1.

    Important: do **not** require a full-file JSON parse for native detection —
    large ``.tradlog.json`` files were truncated in the client detect probe and
    then misclassified as thinkorswim because conversion metadata mentioned
    \"Account Trade History\".
    """
    s = sample or ""
    scores: list[dict] = []
    head = s.lstrip()[:8000]
    head_low = head.lower()

    # --- FatTail canonical (prefer early format marker) ---
    if (
        '"format"' in head
        and "fattail.labs.trade_log" in head_low
        and head.lstrip().startswith("{")
    ):
        scores.append({"id": "native", "confidence": 0.995})
    else:
        # Full parse only when reasonably sized (or already looks like JSON object)
        try_body = s if len(s) <= 2_000_000 else s[:2_000_000]
        try:
            data = json.loads(try_body)
            if isinstance(data, dict) and (
                data.get("format") == FORMAT
                or "trades" in data
                or "accounts" in data
            ):
                scores.append({"id": "native", "confidence": 0.99})
        except json.JSONDecodeError:
            pass

    is_native = any(x["id"] == "native" and x["confidence"] >= 0.9 for x in scores)

    # --- thinkorswim Account Statement / Trade History ---
    # Only when not already identified as canonical JSON (metadata may mention ToS).
    if not is_native:
        # Prefer structural CSV signals over free-text (avoids false positives)
        lines = s.splitlines()
        for line in lines[:40]:
            header = _norm_header(line)
            if not header:
                continue
            if "spread" in header and "side" in header and (
                "exectime" in header or "poseffect" in header
            ):
                scores.append({"id": "thinkorswim", "confidence": 0.95})
                break
        low_prefix = s[:20000].lower()
        # Title lines of real ToS exports (not JSON)
        if not any(x["id"] == "thinkorswim" for x in scores):
            if low_prefix.lstrip().startswith("account statement") or (
                "\naccount trade history\n" in low_prefix
                or low_prefix.startswith("account trade history")
            ):
                scores.append({"id": "thinkorswim", "confidence": 0.93})
        # TradeStation Trades CSV: symbol + side + quantity + cusip/principal/other fees.
        if not any(x["id"] == "thinkorswim" for x in scores):
            for line in lines[:40]:
                header = _norm_header(line)
                if (
                    "symbol" in header
                    and "side" in header
                    and "quantity" in header
                    and ("cusip" in header or "principal" in header or "otherfees" in header)
                ):
                    scores.append({"id": "tradestation", "confidence": 0.92})
                    break
        # Tradier account-history CSV: date + symbol + quantity + commission/amount.
        if not any(x["id"] in ("thinkorswim", "tradestation") for x in scores):
            for line in lines[:10]:
                header = _norm_header(line)
                if (
                    "date" in header
                    and "symbol" in header
                    and "quantity" in header
                    and ("commission" in header or "amount" in header)
                ):
                    scores.append({"id": "tradier", "confidence": 0.9})
                    break
        is_tradier = any(x["id"] in ("tradier", "tradestation") for x in scores)
        for line in lines[:30]:
            header = _norm_header(line)
            if is_tradier:
                break
            if "strategy" in header and "strike" in header:
                scores.append({"id": "csv_generic", "confidence": 0.75})
            elif "side" in header and ("qty" in header or "quantity" in header):
                if not any(x["id"] == "thinkorswim" for x in scores):
                    scores.append({"id": "csv_generic", "confidence": 0.55})

    # de-dupe by id keeping max confidence
    by_id: dict[str, float] = {}
    for x in scores:
        by_id[x["id"]] = max(by_id.get(x["id"], 0), x["confidence"])
    scores = [{"id": k, "confidence": v} for k, v in by_id.items()]
    scores.sort(key=lambda x: -x["confidence"])
    return scores


def _tos_trade_history_slice(text: str) -> tuple[str, list[str]]:
    """Return (csv_text, warnings) for the Account Trade History block.

    Real ToS Account Statement exports interleave Cash Balance, Futures, Order
    History, then **Account Trade History** — that last block is the blotter
    pattern (see Coach sample `/Users/ernie/tos-log.csv`).
    """
    warnings: list[str] = []
    lines = text.splitlines()
    start = None
    for i, line in enumerate(lines):
        if line.strip() == "Account Trade History":
            # Next non-empty line is the header
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            start = j
            warnings.append("extracted Account Trade History section from Account Statement")
            break
        # Standalone trade history file (header already on first rows)
        nh = _norm_header(line)
        if "exectime" in nh and "spread" in nh and "side" in nh:
            start = i
            break
    if start is None:
        return text, warnings

    end = len(lines)
    for j in range(start + 1, len(lines)):
        line = lines[j].strip()
        if not line:
            continue
        # New section title: no leading digit, not a CSV data row starting with comma
        if "," not in line and not line[0].isdigit():
            end = j
            break
        # Known following sections
        if line in (
            "Equities",
            "Profits and Losses",
            "Account Summary",
            "Forex Account Summary",
            "Cash Balance",
            "Account Order History",
        ):
            end = j
            break
    return "\n".join(lines[start:end]), warnings


def parse_native(text: str) -> dict:
    data = json.loads(text)
    if not isinstance(data, dict):
        raise ValueError("native document must be a JSON object")
    warnings: list[str] = []
    trades: list[dict] = []
    # Multi-account envelope
    accounts = data.get("accounts")
    if isinstance(accounts, list) and accounts:
        for acct in accounts:
            if not isinstance(acct, dict):
                continue
            for t in acct.get("trades") or []:
                if isinstance(t, dict):
                    t = dict(t)
                    t.setdefault("_account_label", acct.get("label"))
                    trades.append(t)
    elif isinstance(data.get("trades"), list):
        trades = [t for t in data["trades"] if isinstance(t, dict)]
    else:
        # Single trade document
        if data.get("strategy") or data.get("legs"):
            trades = [data]
    normalized = []
    for t in trades:
        nt = _normalize_trade(t, warnings)
        if nt:
            normalized.append(nt)
    return {
        "adapter": "native",
        "trades": normalized,
        "warnings": warnings,
        "errors": [],
    }


def parse_csv_generic(text: str) -> dict:
    warnings: list[str] = []
    f = io.StringIO(text)
    try:
        reader = csv.reader(f)
        rows = list(reader)
    except csv.Error as exc:
        return {"adapter": "csv_generic", "trades": [], "warnings": [], "errors": [str(exc)]}
    if not rows:
        return {
            "adapter": "csv_generic",
            "trades": [],
            "warnings": [],
            "errors": ["empty CSV"],
        }
    headers, body = rows[0], rows[1:]
    mapped = [_map_row(headers, r) for r in body if any(c.strip() for c in r)]
    # Group by exec + strategy like ToS (flat legs)
    trades = _group_tos_rows(mapped)
    for t in trades:
        if t["strategy"] not in cat.STRATEGY_CODES:
            t["strategy"] = "CUSTOM"
            warnings.append("mapped unknown strategy to CUSTOM")
    return {
        "adapter": "csv_generic",
        "trades": trades,
        "warnings": warnings,
        "errors": [],
    }


def parse_thinkorswim(text: str) -> dict:
    """thinkorswim / Schwab Account Statement or Trade History CSV.

    Pattern (Coach sample `tos-log.csv` — Account Trade History section)::

        ,Exec Time,Spread,Side,Qty,Pos Effect,Symbol,Exp,Strike,Type,Price,Net Price,Order Type
        ,4/21/26 14:33:52,BUTTERFLY,BUY,+1,TO OPEN,SPX,21 APR 26,7080,PUT,6.57,.60,LMT
        ,,,,SELL,-2,TO OPEN,SPX,21 APR 26,7075,PUT,4.54,DEBIT,
        ,,,,BUY,+1,TO OPEN,SPX,21 APR 26,7070,PUT,3.11,,

    - Leading blank column is ignored.
    - Continuation legs leave Exec Time / Spread empty (inherit).
    - Net Price on leg 1 is the average (``.60``); leg 2 may hold ``DEBIT``/``CREDIT``.
    - Qty and Pos Effect are separate columns.
    """
    warnings: list[str] = []
    if text.startswith("\ufeff"):
        text = text[1:]
    slice_text, slice_warn = _tos_trade_history_slice(text)
    warnings.extend(slice_warn)
    try:
        reader = csv.reader(io.StringIO(slice_text))
        rows = list(reader)
    except csv.Error as exc:
        return {
            "adapter": "thinkorswim",
            "trades": [],
            "warnings": warnings,
            "errors": [str(exc)],
        }
    if not rows:
        return {
            "adapter": "thinkorswim",
            "trades": [],
            "warnings": warnings,
            "errors": ["empty CSV"],
        }
    # Header row: find Exec Time + Spread + Side
    start = 0
    for i, row in enumerate(rows[:20]):
        joined = " ".join(row).lower()
        if "exec time" in joined and "spread" in joined and "side" in joined:
            start = i
            break
        if "spread" in joined and "pos effect" in joined:
            start = i
            break
    headers = [h.strip() for h in rows[start]]
    # Drop leading empty header cells but keep alignment via _map_row zip
    body = rows[start + 1 :]
    mapped: list[dict[str, str]] = []
    for r in body:
        if not any((c or "").strip() for c in r):
            continue
        if any((x or "").lower() in ("total", "subtotal") for x in r[:3]):
            continue
        m = _map_row(headers, r)
        # Net Price column may be ".60" or "DEBIT"
        raw_net = m.get("net_price") or ""
        ns = _extract_net_side(raw_net)
        if ns:
            m["net_side"] = ns
            # clear fake price
            if _dec(raw_net) is None:
                m.pop("net_price", None)
        # Qty may be "+1" / "-2"
        if m.get("quantity"):
            m["quantity"] = m["quantity"].replace("+", "").strip()
            if m["quantity"].startswith("-"):
                # sign is informational; side already SELL/BUY
                m["quantity"] = m["quantity"].lstrip("-")
        # Pos Effect "TO OPEN" → TO_OPEN
        if m.get("pos_effect"):
            pe = m["pos_effect"].upper().replace(" ", "_")
            if pe in ("OPEN", "TO_OPEN"):
                m["pos_effect"] = "TO_OPEN"
            elif pe in ("CLOSE", "TO_CLOSE"):
                m["pos_effect"] = "TO_CLOSE"
        # Type column → right for options; STOCK/ETF keep as type hint
        if m.get("right"):
            rt = m["right"].upper()
            if rt in ("PUT", "CALL"):
                m["right"] = rt
            elif rt in ("ETF", "STOCK", "EQUITY"):
                m["asset_class"] = "equity"
                m["right"] = ""
                m.setdefault("symbol", m.get("underlier") or m.get("symbol"))
        # Futures-style symbol: "/ESU25 1/50 …" → underlier /ES
        sym = m.get("symbol") or m.get("underlier") or ""
        if sym.startswith("/"):
            m["underlier"] = sym.split()[0][:16]
            m["symbol"] = sym[:64]
            m["asset_class"] = m.get("asset_class") or "equity_option"
        elif m.get("strategy", "").upper() == "STOCK":
            m["asset_class"] = "equity"
            m["symbol"] = sym
            m["underlier"] = sym
        if not m.get("side") and not m.get("symbol") and not m.get("underlier"):
            continue
        if not m.get("side"):
            continue
        mapped.append(m)

    trades = _group_tos_rows(mapped)
    if not trades:
        warnings.append(
            "no trade rows detected — expected Account Trade History "
            "(Exec Time, Spread, Side, Qty, Pos Effect, …)"
        )
    for t in trades:
        t["order_type"] = t.get("order_type") or "LMT"
        # STOCK strategy
        if t["strategy"] == "STOCK":
            t["asset_class"] = "equity"
            for leg in t["legs"]:
                leg["asset_class"] = "equity"
        if not t.get("net_side") and t.get("net_price") is not None:
            if all(leg.get("pos_effect") == "TO_OPEN" for leg in t["legs"]):
                buys = sum(
                    1 for leg in t["legs"] if leg.get("side") == "BUY"
                )
                sells = sum(
                    1 for leg in t["legs"] if leg.get("side") == "SELL"
                )
                # Long fly: more buy qty at wings vs mid — default DEBIT for opens
                t["net_side"] = "DEBIT" if buys >= sells else "CREDIT"
            elif all(leg.get("pos_effect") == "TO_CLOSE" for leg in t["legs"]):
                t["net_side"] = "CREDIT"
    return {
        "adapter": "thinkorswim",
        "trades": trades,
        "warnings": warnings,
        "errors": [],
    }


def _normalize_trade(t: dict, warnings: list[str]) -> dict | None:
    strategy = _strategy_code(str(t.get("strategy") or "CUSTOM"))
    exec_at = t.get("exec_at")
    if exec_at:
        parsed = _parse_dt(str(exec_at))
        exec_at = parsed or str(exec_at)[:19]
    else:
        exec_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    legs_in = t.get("legs") or []
    legs = []
    for i, leg in enumerate(legs_in):
        if not isinstance(leg, dict):
            continue
        m = {
            "side": leg.get("side"),
            "quantity": str(leg.get("quantity", 1)),
            "pos_effect": leg.get("pos_effect"),
            "underlier": leg.get("underlier"),
            "symbol": leg.get("symbol"),
            "expiry": str(leg.get("expiry") or ""),
            "strike": str(leg.get("strike") or ""),
            "right": leg.get("right") or leg.get("option_right"),
            "fill_price": str(leg.get("fill_price") if leg.get("fill_price") is not None else 0),
            "fees": str(leg.get("fees")) if leg.get("fees") not in (None, "") else "",
            "asset_class": leg.get("asset_class") or "equity_option",
        }
        legs.append(_leg_from_mapped(m, i))
    proc = t.get("process") if isinstance(t.get("process"), dict) else {}
    tac = (t.get("asset_class") or "equity_option").strip().lower()
    tac_aliases = {
        "futures": "future",
        "futures_option": "future_option",
        "fut_opt": "future_option",
        "option": "equity_option",
        "options": "equity_option",
        "stock": "equity",
        "etf": "equity",
    }
    tac = tac_aliases.get(tac, tac)
    if tac not in cat.ASSET_CLASSES:
        # Prefer majority leg class when trade-level class is unknown
        from collections import Counter

        leg_acs = [lg.get("asset_class") for lg in legs if lg.get("asset_class")]
        if leg_acs:
            tac = Counter(leg_acs).most_common(1)[0][0]
        else:
            tac = "equity_option"
    # Refine butterfly vs broken wing from strikes (create/import geometry).
    from trade_log_domain.strategy_infer import refine_strategy_from_legs

    strategy = refine_strategy_from_legs(strategy, legs)

    out = {
        "exec_at": exec_at,
        "strategy": strategy,
        "asset_class": tac,
        "order_type": (t.get("order_type") or "LMT").upper()[:32],
        "net_price": _dec(t.get("net_price")),
        "net_side": (str(t["net_side"]).upper() if t.get("net_side") else None),
        "setup_md": t.get("setup_md") or proc.get("setup_md") or "",
        "plan_md": t.get("plan_md") or proc.get("plan_md") or "",
        "rules_md": t.get("rules_md") or proc.get("rules_md") or "",
        "adherence": t.get("adherence") or proc.get("adherence") or "unknown",
        "deviation_md": t.get("deviation_md") or proc.get("deviation_md") or "",
        "lesson_md": t.get("lesson_md") or proc.get("lesson_md") or "",
        "pnl_amount": _dec(t.get("pnl_amount") if t.get("pnl_amount") is not None else proc.get("pnl_amount")),
        "legs": legs,
        "external_order_id": (
            (t.get("external_refs") or {}).get("broker_order_id")
            if isinstance(t.get("external_refs"), dict)
            else None
        )
        or t.get("external_order_id")
        or t.get("id")
        or _trade_hash(exec_at, strategy, legs),
        "entry_source": t.get("entry_source") or "import",
        "_account_label": t.get("_account_label"),
    }
    # Portable spine links (export_key strings; row ids never leave the member)
    pb_key = t.get("playbook_export_key")
    if pb_key:
        out["playbook_export_key"] = str(pb_key).strip()[:64]
    camp_key = t.get("practice_campaign_export_key")
    if camp_key:
        out["practice_campaign_export_key"] = str(camp_key).strip()[:64]
    if out["net_side"] and out["net_side"] not in cat.NET_SIDES:
        out["net_side"] = None
    if out["adherence"] not in cat.ADHERENCE:
        out["adherence"] = "unknown"
    return out


def parse(adapter: str, text: str) -> dict:
    adapter = (adapter or "").strip().lower()
    if adapter == "native":
        return parse_native(text)
    if adapter == "thinkorswim":
        return parse_thinkorswim(text)
    if adapter == "tradier":
        return parse_tradier(text)
    if adapter == "tradestation":
        return parse_tradestation(text)
    if adapter in ("csv_generic", "csv"):
        return parse_csv_generic(text)
    # auto
    det = detect(text)
    if not det:
        return {
            "adapter": "unknown",
            "trades": [],
            "warnings": [],
            "errors": ["could not detect format"],
        }
    return parse(det[0]["id"], text)


def _json_scalar(v: Any) -> Any:
    """Coerce DB values (datetime, Decimal, date) to JSON-safe scalars."""
    if v is None:
        return None
    if isinstance(v, datetime):
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        return v.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    if isinstance(v, Decimal):
        # Prefer string for money fidelity; parse_native/_dec accept both
        return format(v, "f")
    if hasattr(v, "isoformat") and not isinstance(v, str):
        # date / time
        return v.isoformat()
    return v


def export_canonical(
    accounts: list[dict],
    trades_by_account: dict[int, list[dict]],
) -> dict:
    """Build fattail.labs.trade_log document from DB-shaped rows."""
    out_accounts = []
    for acct in accounts:
        aid = acct["id"]
        tlist = []
        for t in trades_by_account.get(aid, []):
            tlist.append(
                {
                    "id": str(t["id"]),
                    "exec_at": _json_scalar(t.get("exec_at")),
                    "asset_class": t.get("asset_class"),
                    "strategy": t.get("strategy"),
                    "order_type": t.get("order_type"),
                    "net_price": _json_scalar(t.get("net_price")),
                    "net_side": t.get("net_side"),
                    "process": {
                        "setup_md": t.get("setup_md") or "",
                        "plan_md": t.get("plan_md") or "",
                        "rules_md": t.get("rules_md") or "",
                        "adherence": t.get("adherence") or "unknown",
                        "deviation_md": t.get("deviation_md") or "",
                        "lesson_md": t.get("lesson_md") or "",
                        "pnl_amount": _json_scalar(t.get("pnl_amount")),
                    },
                    "legs": [
                        {
                            "leg_index": leg.get("leg_index", i),
                            "side": leg.get("side"),
                            "quantity": int(leg["quantity"])
                            if leg.get("quantity") is not None
                            else 1,
                            "pos_effect": leg.get("pos_effect"),
                            "asset_class": leg.get("asset_class"),
                            "underlier": leg.get("underlier"),
                            "symbol": leg.get("symbol"),
                            "expiry": _json_scalar(leg.get("expiry")),
                            "strike": _json_scalar(leg.get("strike")),
                            # DB column is option_right; accept either shape on re-export
                            "right": leg.get("right") or leg.get("option_right"),
                            "fill_price": _json_scalar(leg.get("fill_price")),
                            "fees": _json_scalar(leg.get("fees")),
                        }
                        for i, leg in enumerate(t.get("legs") or [])
                    ],
                    "external_refs": {
                        "broker_order_id": t.get("external_order_id"),
                    },
                    "entry_source": t.get("entry_source") or "import",
                    **(
                        {"playbook_export_key": t["playbook_export_key"]}
                        if t.get("playbook_export_key")
                        else {}
                    ),
                    **(
                        {
                            "practice_campaign_export_key": t[
                                "practice_campaign_export_key"
                            ]
                        }
                        if t.get("practice_campaign_export_key")
                        else {}
                    ),
                }
            )
        out_accounts.append(
            {
                "id": f"acct-{aid}",
                "label": acct.get("label"),
                "broker": acct.get("broker"),
                "broker_label": acct.get("broker_label"),
                "currency": acct.get("currency") or "USD",
                "status": acct.get("status") or "active",
                "trades": tlist,
            }
        )
    return {
        "format": FORMAT,
        "model_version": MODEL_VERSION,
        "exported_at": _now_iso(),
        "source": {"adapter": "native", "adapter_version": "1.0"},
        "accounts": out_accounts,
    }


def export_csv_flat(trades: list[dict]) -> str:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        [
            "exec_at",
            "strategy",
            "side",
            "quantity",
            "pos_effect",
            "symbol",
            "underlier",
            "expiry",
            "strike",
            "type",
            "price",
            "net_price",
            "net_side",
            "order_type",
            "account_id",
            "adherence",
            "setup",
            "pnl",
        ]
    )
    for t in trades:
        legs = t.get("legs") or [{}]
        for i, leg in enumerate(legs):
            w.writerow(
                [
                    t.get("exec_at") if i == 0 else "",
                    t.get("strategy") if i == 0 else "",
                    leg.get("side"),
                    leg.get("quantity"),
                    leg.get("pos_effect"),
                    leg.get("symbol") or leg.get("underlier"),
                    leg.get("underlier"),
                    leg.get("expiry"),
                    leg.get("strike"),
                    leg.get("right"),
                    leg.get("fill_price"),
                    t.get("net_price") if i == 0 else "",
                    t.get("net_side") if i == 0 else "",
                    t.get("order_type") if i == 0 else "",
                    t.get("account_id") if i == 0 else "",
                    t.get("adherence") if i == 0 else "",
                    (t.get("setup_md") or "")[:200] if i == 0 else "",
                    t.get("pnl_amount") if i == 0 else "",
                ]
            )
    return buf.getvalue()


def _fmt_tos_exec(exec_at: str | None) -> str:
    """ToS style: 4/21/26 14:33:52"""
    if not exec_at:
        return ""
    raw = str(exec_at).replace("T", " ").replace("Z", "")[:19]
    for fmt, n in (
        ("%Y-%m-%d %H:%M:%S", 19),
        ("%Y-%m-%d %H:%M", 16),
        ("%Y-%m-%d", 10),
    ):
        try:
            dt = datetime.strptime(raw[:n], fmt)
            return (
                f"{dt.month}/{dt.day}/{str(dt.year)[2:]} "
                f"{dt.hour:02d}:{dt.minute:02d}:{dt.second:02d}"
            )
        except ValueError:
            continue
    return raw


def _fmt_tos_expiry(expiry: str | None) -> str:
    """ToS style: 21 APR 26"""
    if not expiry:
        return ""
    months = (
        "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
        "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
    )
    try:
        dt = datetime.strptime(str(expiry)[:10], "%Y-%m-%d")
        return f"{dt.day} {months[dt.month - 1]} {str(dt.year)[2:]}"
    except ValueError:
        return str(expiry)


def _fmt_tos_price(price: Any) -> str:
    if price is None or price == "":
        return ""
    try:
        f = float(price)
    except (TypeError, ValueError):
        return str(price)
    if 0 < abs(f) < 1:
        # ToS style ".60"
        s = f"{f:.2f}".lstrip("0") if f >= 0 else f"-{abs(f):.2f}".replace("0.", ".")
        if s.startswith("."):
            return s
        if s.startswith("-0."):
            return "-" + s[2:]
        return s
    return f"{f:.2f}".rstrip("0").rstrip(".") if f == int(f) else f"{f:.2f}"


def _fmt_tos_qty(side: str, qty: int) -> str:
    q = abs(int(qty or 0))
    if (side or "").upper() == "SELL":
        return f"-{q}"
    return f"+{q}"


def _fmt_tos_pos_effect(pe: str | None) -> str:
    if not pe:
        return ""
    pe = pe.upper().replace(" ", "_")
    if pe in ("TO_OPEN", "OPEN"):
        return "TO OPEN"
    if pe in ("TO_CLOSE", "CLOSE"):
        return "TO CLOSE"
    return pe.replace("_", " ")


def export_thinkorswim(trades: list[dict], *, account_label: str = "") -> str:
    """Serialize trades as ToS Account Trade History CSV (import-compatible).

    Matches Coach sample pattern: leading blank column; multi-leg blocks with
    blank Exec/Spread on continuation; Net Price + DEBIT/CREDIT on legs 1–2.
    """
    buf = io.StringIO()
    # Optional title line for Account Statement kinship
    if account_label:
        buf.write(f"Account Trade History\n")
    else:
        buf.write("Account Trade History\n")
    w = csv.writer(buf)
    w.writerow(
        [
            "",
            "Exec Time",
            "Spread",
            "Side",
            "Qty",
            "Pos Effect",
            "Symbol",
            "Exp",
            "Strike",
            "Type",
            "Price",
            "Net Price",
            "Order Type",
        ]
    )
    for t in trades:
        legs = t.get("legs") or []
        if not legs:
            # NOTE / empty — skip or single blank row; skip for blotter purity
            continue
        strategy = (t.get("strategy") or "CUSTOM").upper()
        exec_s = _fmt_tos_exec(t.get("exec_at"))
        order = (t.get("order_type") or "LMT").upper()
        net_price = t.get("net_price")
        net_side = (t.get("net_side") or "").upper()
        for i, leg in enumerate(legs):
            side = (leg.get("side") or "BUY").upper()
            qty = _fmt_tos_qty(side, int(leg.get("quantity") or 1))
            pe = _fmt_tos_pos_effect(leg.get("pos_effect"))
            # Real ToS puts the UNDERLIER in the Symbol column for options (Exp / Strike
            # / Type carry the rest); only equity/other uses the raw symbol.
            _is_opt = bool(leg.get("right")) or (leg.get("asset_class") or "").lower() in (
                "equity_option", "future_option"
            )
            symbol = (
                (leg.get("underlier") or leg.get("symbol"))
                if _is_opt
                else (leg.get("symbol") or leg.get("underlier"))
            ) or ""
            exp = _fmt_tos_expiry(leg.get("expiry"))
            strike = leg.get("strike")
            strike_s = (
                str(int(strike))
                if strike is not None and float(strike) == int(float(strike))
                else (str(strike) if strike is not None else "")
            )
            typ = (leg.get("right") or "").upper()
            if (leg.get("asset_class") or "").lower() == "equity" or strategy == "STOCK":
                typ = typ or "STOCK"
            price_s = _fmt_tos_price(leg.get("fill_price"))
            if i == 0:
                net_s = _fmt_tos_price(net_price) if net_price is not None else ""
                order_s = order
                exec_cell, spread_cell = exec_s, strategy
            elif i == 1 and net_side in ("DEBIT", "CREDIT"):
                net_s = net_side
                order_s = ""
                exec_cell, spread_cell = "", ""
            else:
                net_s = ""
                order_s = ""
                exec_cell, spread_cell = "", ""
            w.writerow(
                [
                    "",
                    exec_cell,
                    spread_cell,
                    side,
                    qty,
                    pe,
                    symbol,
                    exp,
                    strike_s,
                    typ,
                    price_s,
                    net_s,
                    order_s,
                ]
            )
    return buf.getvalue()


# --- Tradier -----------------------------------------------------------------
#
# Tradier is API-first; its account history is a flat, per-FILL feed. Fields mirror
# the Get Account History endpoint (docs.tradier.com): date, type ('trade'|'option'),
# symbol (OCC for options), quantity, price, amount (signed cash flow), commission,
# description ("Bought/Sold N SYM @ price"). There is no order id and no open/close
# effect in Tradier's data — so multi-leg spreads are represented as separate rows
# and open/close is inferred from side. Round-trip note: our export stamps every leg
# of a trade with the same `date`, and the importer regroups rows by identical date,
# so FatTail→Tradier→FatTail reconstructs multi-leg trades; direction (open/close)
# follows Tradier's own limitation (inferred from buy/sell).

_OCC_RE_IO = re.compile(r"^([A-Z0-9./]{1,6})\s?(\d{2})(\d{2})(\d{2})([CP])(\d{8})$")


def _occ_build(underlier, expiry, strike, right) -> str:
    """underlier + YYMMDD + C/P + strike*1000 (8 digits). Falls back to underlier."""
    root = (str(underlier or "").upper().lstrip("/"))[:6]
    try:
        dt = datetime.strptime(str(expiry)[:10], "%Y-%m-%d")
        k = int(round(float(strike) * 1000))
    except (TypeError, ValueError):
        return str(underlier or "")
    cp = "C" if str(right or "").upper().startswith("C") else "P"
    return f"{root}{dt:%y%m%d}{cp}{k:08d}"


def _occ_parse(sym) -> dict | None:
    """Parse an OCC option symbol → {underlier, expiry, strike, right}, else None."""
    m = _OCC_RE_IO.match(str(sym or "").strip().upper())
    if not m:
        return None
    root, yy, mm, dd, cp, strike8 = m.groups()
    return {
        "underlier": root,
        "expiry": f"20{yy}-{mm}-{dd}",
        "strike": "%g" % (int(strike8) / 1000.0),
        "right": "CALL" if cp == "C" else "PUT",
    }


def _fmt_tradier_date(exec_at) -> str:
    """Tradier ISO-ish stamp, e.g. 2026-08-08T15:10:00Z (identical per trade)."""
    if not exec_at:
        return ""
    raw = str(exec_at).replace("T", " ").replace("Z", "")[:19]
    for fmt, n in (("%Y-%m-%d %H:%M:%S", 19), ("%Y-%m-%d %H:%M", 16), ("%Y-%m-%d", 10)):
        try:
            dt = datetime.strptime(raw[:n], fmt)
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        except ValueError:
            continue
    return str(exec_at)


def export_tradier(trades: list[dict]) -> str:
    """Serialize trades as a Tradier Account-History CSV (one row per fill)."""
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        ["date", "type", "symbol", "quantity", "price", "amount", "commission", "description"]
    )
    for t in trades:
        legs = t.get("legs") or []
        date_s = _fmt_tradier_date(t.get("exec_at"))
        for leg in legs:
            side = (leg.get("side") or "BUY").upper()
            qty = abs(int(leg.get("quantity") or 1))
            ac = (leg.get("asset_class") or "equity_option").lower()
            is_opt = bool(leg.get("right")) or ac in ("equity_option", "future_option")
            if is_opt:
                sym = _occ_build(
                    leg.get("underlier"), leg.get("expiry"), leg.get("strike"), leg.get("right")
                )
                ev_type = "option"
                mult = 100
            else:
                sym = leg.get("underlier") or leg.get("symbol") or ""
                ev_type = "trade"
                mult = 1
            try:
                price = float(leg.get("fill_price") or 0)
            except (TypeError, ValueError):
                price = 0.0
            gross = price * qty * mult
            amount = -gross if side == "BUY" else gross  # buy = cash out
            try:
                commission = float(leg.get("fees") or 0)
            except (TypeError, ValueError):
                commission = 0.0
            verb = "Bought" if side == "BUY" else "Sold"
            signed_qty = qty if side == "BUY" else -qty
            desc = f"{verb} {qty} {sym} @ {price:g}"
            w.writerow([
                date_s, ev_type, sym, signed_qty, f"{price:g}",
                f"{amount:.2f}", f"{commission:g}", desc,
            ])
    return buf.getvalue()


def parse_tradier(text: str) -> dict:
    """Parse a Tradier Account-History CSV → canonical trades.

    Per-fill rows (no order id); consecutive rows with the same `date` are grouped
    into one (multi-leg) trade. Options carry OCC symbols; equity rows are plain.
    Open/close is inferred from side (Tradier data omits position effect).
    """
    warnings: list[str] = []
    if text.startswith("﻿"):
        text = text[1:]
    try:
        rows = list(csv.reader(io.StringIO(text)))
    except csv.Error as exc:
        return {"adapter": "tradier", "trades": [], "warnings": warnings, "errors": [str(exc)]}
    if not rows:
        return {"adapter": "tradier", "trades": [], "warnings": warnings, "errors": ["empty CSV"]}

    start = 0
    for i, row in enumerate(rows[:10]):
        joined = " ".join(row).lower()
        if "date" in joined and "symbol" in joined and "quantity" in joined:
            start = i
            break
    # Read Tradier's own columns by header name (its `type` / `date` / `commission`
    # collide with the shared ToS header map, so map directly here).
    norm = [_norm_header(h) for h in rows[start]]

    def _col(r: list[str], *names: str) -> str:
        for n in names:
            if n in norm:
                idx = norm.index(n)
                if idx < len(r):
                    return (r[idx] or "").strip()
        return ""

    mapped: list[dict[str, str]] = []
    for r in rows[start + 1 :]:
        if not any((c or "").strip() for c in r):
            continue
        raw_sym = _col(r, "symbol")
        desc = _col(r, "description", "memo").lower()
        qty_raw = _col(r, "quantity", "qty")
        # Direction: description verb wins, else quantity sign.
        if desc.startswith("bought") or desc.startswith("buy"):
            side = "BUY"
        elif desc.startswith("sold") or desc.startswith("sell"):
            side = "SELL"
        elif qty_raw.startswith("-"):
            side = "SELL"
        else:
            side = "BUY"
        occ = _occ_parse(raw_sym)
        row_type = _col(r, "type").lower()
        leg = {
            "side": side,
            "quantity": qty_raw.lstrip("+-") or "1",
            "pos_effect": "",  # Tradier omits open/close — inferred from side downstream
            "fill_price": _col(r, "price", "fillprice", "avgprice") or "0",
            "fees": _col(r, "commission", "fees", "fee"),
            "exec_at": _col(r, "date", "time", "datetime", "tradedate", "transactiondate"),
        }
        if occ:
            leg.update({
                "underlier": occ["underlier"], "symbol": raw_sym,
                "expiry": occ["expiry"], "strike": occ["strike"],
                "right": occ["right"], "asset_class": "equity_option",
            })
        else:
            leg.update({
                "underlier": raw_sym, "symbol": raw_sym,
                "asset_class": "equity" if row_type in ("trade", "", "equity") else "equity_option",
            })
        if not raw_sym:
            continue
        mapped.append(leg)

    # Group consecutive rows by identical exec date into trades.
    trades: list[dict] = []
    current: dict | None = None
    leg_i = 0
    for m in mapped:
        exec_at = _parse_dt(m.get("exec_at") or "") or _now_iso()[:19]
        if current is None or current["exec_at"] != exec_at:
            if current:
                trades.append(current)
            leg_i = 0
            current = {
                "exec_at": exec_at, "strategy": "CUSTOM", "asset_class": "equity_option",
                "order_type": "LMT", "net_price": None, "net_side": None,
                "setup_md": "", "plan_md": "", "rules_md": "", "adherence": "unknown",
                "deviation_md": "", "lesson_md": "", "pnl_amount": None,
                "legs": [], "external_order_id": None,
            }
        current["legs"].append(_leg_from_mapped(m, leg_i))
        leg_i += 1
    if current:
        trades.append(current)

    from trade_log_domain.strategy_infer import refine_strategy_from_legs

    for t in trades:
        t["strategy"] = refine_strategy_from_legs(t["strategy"], t["legs"])
        leg_acs = {lg.get("asset_class") for lg in t["legs"]}
        t["asset_class"] = "equity" if leg_acs == {"equity"} else "equity_option"
        t["external_order_id"] = _trade_hash(t["exec_at"], t["strategy"], t["legs"])
    if not trades:
        warnings.append("no Tradier rows detected — expected date, type, symbol, quantity, price columns")
    return {"adapter": "tradier", "trades": trades, "warnings": warnings, "errors": []}


# --- TradeStation ------------------------------------------------------------
#
# TradeStation's "Historical Activity Report → Trades" CSV (the trade-history export
# journaling tools import). Columns: Date, Symbol, CUSIP, Side, Quantity, Price,
# Principal, ... Commission, Other Fees. Options use a compact symbol like
# "COIN 261016C287.5" = underlier + YYMMDD + C/P + decimal strike. The Side codes
# carry open/close (BTO/STC/STO/BTC), which we preserve on round-trip. Extra columns
# (CUSIP, Principal, account, etc.) are tolerated and ignored on import.

_TS_OPT_RE = re.compile(r"^([A-Z][A-Z.]*)\s+(\d{2})(\d{2})(\d{2})([CP])([0-9]+(?:\.[0-9]+)?)$")


def _ts_opt_build(underlier, expiry, strike, right) -> str:
    root = (str(underlier or "").upper().lstrip("/"))[:6]
    try:
        dt = datetime.strptime(str(expiry)[:10], "%Y-%m-%d")
        k = float(strike)
    except (TypeError, ValueError):
        return str(underlier or "")
    cp = "C" if str(right or "").upper().startswith("C") else "P"
    return f"{root} {dt:%y%m%d}{cp}{k:g}"


def _ts_opt_parse(sym) -> dict | None:
    m = _TS_OPT_RE.match(str(sym or "").strip().upper())
    if not m:
        return None
    root, yy, mm, dd, cp, strike = m.groups()
    return {
        "underlier": root,
        "expiry": f"20{yy}-{mm}-{dd}",
        "strike": strike,
        "right": "CALL" if cp == "C" else "PUT",
    }


def _ts_side(side: str, pos_effect, is_opt: bool) -> str:
    """FatTail side + pos_effect → TradeStation Side code (BTO/STC/STO/BTC or Buy/Sell)."""
    s = (side or "BUY").upper()
    pe = (pos_effect or "").upper()
    if is_opt and pe in ("TO_OPEN", "TO_CLOSE"):
        return {
            ("BUY", "TO_OPEN"): "BTO", ("SELL", "TO_CLOSE"): "STC",
            ("SELL", "TO_OPEN"): "STO", ("BUY", "TO_CLOSE"): "BTC",
        }.get((s, pe), "Buy" if s == "BUY" else "Sell")
    return "Buy" if s == "BUY" else "Sell"


def _ts_side_parse(raw: str) -> tuple[str, str]:
    """TradeStation Side → (BUY|SELL, pos_effect-or-'')."""
    s = (raw or "").upper().replace(" ", "")
    mapping = {
        "BTO": ("BUY", "TO_OPEN"), "STC": ("SELL", "TO_CLOSE"),
        "STO": ("SELL", "TO_OPEN"), "BTC": ("BUY", "TO_CLOSE"),
    }
    if s in mapping:
        return mapping[s]
    if s.startswith("B"):
        return ("BUY", "")
    if s.startswith("S"):
        return ("SELL", "")
    return ("BUY", "")


def _fmt_ts_date(exec_at) -> str:
    """TradeStation MM/DD/YYYY HH:MM:SS (identical per trade so import regroups legs)."""
    if not exec_at:
        return ""
    raw = str(exec_at).replace("T", " ").replace("Z", "")[:19]
    for fmt, n in (("%Y-%m-%d %H:%M:%S", 19), ("%Y-%m-%d %H:%M", 16), ("%Y-%m-%d", 10)):
        try:
            dt = datetime.strptime(raw[:n], fmt)
            return dt.strftime("%m/%d/%Y %H:%M:%S")
        except ValueError:
            continue
    return str(exec_at)


def export_tradestation(trades: list[dict]) -> str:
    """Serialize as a TradeStation Historical Activity 'Trades' CSV (one row per fill)."""
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        ["Date", "Symbol", "CUSIP", "Side", "Quantity", "Price", "Principal",
         "Commission", "Other Fees"]
    )
    for t in trades:
        legs = t.get("legs") or []
        date_s = _fmt_ts_date(t.get("exec_at"))
        for leg in legs:
            side = (leg.get("side") or "BUY").upper()
            qty = abs(int(leg.get("quantity") or 1))
            ac = (leg.get("asset_class") or "equity_option").lower()
            is_opt = bool(leg.get("right")) or ac in ("equity_option", "future_option")
            if is_opt:
                sym = _ts_opt_build(
                    leg.get("underlier"), leg.get("expiry"), leg.get("strike"), leg.get("right")
                )
                mult = 100
            else:
                sym = leg.get("underlier") or leg.get("symbol") or ""
                mult = 1
            try:
                price = float(leg.get("fill_price") or 0)
            except (TypeError, ValueError):
                price = 0.0
            try:
                commission = float(leg.get("fees") or 0)
            except (TypeError, ValueError):
                commission = 0.0
            principal = price * qty * mult
            w.writerow([
                date_s, sym, "", _ts_side(side, leg.get("pos_effect"), is_opt),
                qty, f"{price:g}", f"{principal:.2f}", f"{commission:g}", "0",
            ])
    return buf.getvalue()


def parse_tradestation(text: str) -> dict:
    """Parse a TradeStation 'Trades' CSV → canonical trades.

    Tolerates the leading comment block and extra columns (CUSIP, Principal, …).
    Options carry the TradeStation compact symbol; Side codes (BTO/STC/…) give
    open/close. Rows are grouped into trades by shared trade date.
    """
    warnings: list[str] = []
    if text.startswith("﻿"):
        text = text[1:]
    try:
        rows = list(csv.reader(io.StringIO(text)))
    except csv.Error as exc:
        return {"adapter": "tradestation", "trades": [], "warnings": warnings, "errors": [str(exc)]}
    if not rows:
        return {"adapter": "tradestation", "trades": [], "warnings": warnings, "errors": ["empty CSV"]}

    start = None
    for i, row in enumerate(rows[:40]):
        joined = " ".join(row).lower()
        if "symbol" in joined and "side" in joined and "quantity" in joined and "date" in joined:
            start = i
            break
    if start is None:
        return {"adapter": "tradestation", "trades": [], "warnings": warnings,
                "errors": ["no TradeStation header (Date, Symbol, Side, Quantity, …) found"]}
    norm = [_norm_header(h) for h in rows[start]]

    def _col(r: list[str], *names: str) -> str:
        for n in names:
            if n in norm:
                idx = norm.index(n)
                if idx < len(r):
                    return (r[idx] or "").strip()
        return ""

    mapped: list[dict[str, str]] = []
    for r in rows[start + 1 :]:
        if not any((c or "").strip() for c in r):
            continue
        raw_sym = _col(r, "symbol")
        if not raw_sym:
            continue
        side, pe = _ts_side_parse(_col(r, "side", "action", "buysell"))
        occ = _ts_opt_parse(raw_sym)
        try:
            comm = float(_col(r, "commission") or 0)
            other = float(_col(r, "otherfees", "fees", "fee") or 0)
            fees = f"{comm + other:g}"
        except ValueError:
            fees = _col(r, "commission")
        leg = {
            "side": side,
            "quantity": (_col(r, "quantity", "qty") or "1").lstrip("+-") or "1",
            "pos_effect": pe,
            "fill_price": _col(r, "price", "fillprice", "avgprice") or "0",
            "fees": fees,
            "exec_at": _col(r, "date", "tradedate", "datetime", "time"),
        }
        if occ:
            leg.update({
                "underlier": occ["underlier"], "symbol": raw_sym, "expiry": occ["expiry"],
                "strike": occ["strike"], "right": occ["right"], "asset_class": "equity_option",
            })
        else:
            leg.update({"underlier": raw_sym, "symbol": raw_sym, "asset_class": "equity"})
        mapped.append(leg)

    trades: list[dict] = []
    current: dict | None = None
    leg_i = 0
    for m in mapped:
        exec_at = _parse_dt(m.get("exec_at") or "") or _now_iso()[:19]
        if current is None or current["exec_at"] != exec_at:
            if current:
                trades.append(current)
            leg_i = 0
            current = {
                "exec_at": exec_at, "strategy": "CUSTOM", "asset_class": "equity_option",
                "order_type": "LMT", "net_price": None, "net_side": None,
                "setup_md": "", "plan_md": "", "rules_md": "", "adherence": "unknown",
                "deviation_md": "", "lesson_md": "", "pnl_amount": None,
                "legs": [], "external_order_id": None,
            }
        current["legs"].append(_leg_from_mapped(m, leg_i))
        leg_i += 1
    if current:
        trades.append(current)

    from trade_log_domain.strategy_infer import refine_strategy_from_legs

    for t in trades:
        t["strategy"] = refine_strategy_from_legs(t["strategy"], t["legs"])
        leg_acs = {lg.get("asset_class") for lg in t["legs"]}
        t["asset_class"] = "equity" if leg_acs == {"equity"} else "equity_option"
        t["external_order_id"] = _trade_hash(t["exec_at"], t["strategy"], t["legs"])
    if not trades:
        warnings.append("no TradeStation rows detected")
    return {"adapter": "tradestation", "trades": trades, "warnings": warnings, "errors": []}
