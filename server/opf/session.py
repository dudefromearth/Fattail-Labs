"""OPF session/print envelope (OPF34–36 · OD-SESS-1…4 · H1–H4).

Computes ``opf_session`` from the Massive L0 Redis doc + generation marks +
product session bounds + OPF29 expiry. Does **not** call Massive. Does **not**
write ``mb:session:market_status`` (sym_feed remains that key's only writer).
"""

from __future__ import annotations

from datetime import date, datetime, time, timezone
from typing import Any, Iterable, Literal, Sequence
from zoneinfo import ZoneInfo

from opf.tau import Settlement, expiry_instant

NY = ZoneInfo("America/New_York")

MASSIVE_SESSION_KEY = "mb:session:market_status"

MarketClass = Literal["open", "extended", "closed"]
PrintQuality = Literal["live", "last_print", "none"]

# Known index products when universe kind is not passed (OD-SESS-3).
_INDEX_PRODUCTS = frozenset({"SPX", "SPXW", "NDX", "RUT", "XSP", "VIX", "VIX1D"})

_UNSET: Any = object()

_ENVELOPE_KEYS = ("market", "printing", "print_quality", "as_of", "generation_as_of")


def market_label(doc: dict[str, Any] | None) -> str:
    if not isinstance(doc, dict):
        return ""
    return str(doc.get("market") or "").strip().lower()


def open_from_massive_doc(doc: dict[str, Any]) -> bool:
    """RTH claim only. Extended hours are not Live NBBO (open=False)."""
    market = market_label(doc)
    if market == "open":
        return True
    if market in ("closed", "extended-hours", "early-close"):
        return False
    exchanges = doc.get("exchanges")
    if isinstance(exchanges, dict):
        for key in ("nyse", "NYSE", "nasdaq", "NASDAQ"):
            v = str(exchanges.get(key) or "").strip().lower()
            if v == "open":
                return True
            if v in ("closed", "extended-hours"):
                return False
    return False


def printing_from_massive_doc(doc: dict[str, Any]) -> bool:
    """Massive is still producing prints — RTH or pre/post extended hours."""
    market = market_label(doc)
    if market == "open":
        return True
    if market == "extended-hours":
        return True
    if market in ("closed", "early-close"):
        return False
    exchanges = doc.get("exchanges")
    if isinstance(exchanges, dict):
        for key in ("nyse", "NYSE", "nasdaq", "NASDAQ"):
            v = str(exchanges.get(key) or "").strip().lower()
            if v in ("open", "extended-hours"):
                return True
            if v in ("closed", "early-close"):
                return False
    return False


def session_doc_usable(doc: dict[str, Any] | None) -> bool:
    return isinstance(doc, dict) and (
        doc.get("market") is not None or isinstance(doc.get("exchanges"), dict)
    )


def read_massive_session_doc() -> dict[str, Any] | None:
    """Redis L0 only. Never calls Massive. Never writes the key (H1 / OD-SESS-2)."""
    try:
        from market_data.market_bus.config import bus_enabled
        from market_data.market_bus.store import get_store

        if not bus_enabled():
            return None
        store = get_store()
        if store is None:
            return None
        doc = store.get_json(MASSIVE_SESSION_KEY)
        if session_doc_usable(doc):
            return doc
    except Exception:
        return None
    return None


def _parse_hhmm(raw: str, *, default: time) -> time:
    s = (raw or "").strip()
    if not s:
        return default
    parts = s.split(":")
    try:
        h = int(parts[0])
        m = int(parts[1]) if len(parts) > 1 else 0
        return time(h, m)
    except (TypeError, ValueError):
        return default


def product_session_bounds(
    product: str,
    kind: str | None = None,
) -> tuple[time, time]:
    """RTH open/close for session class (OD-SESS-3). Not τ.

    Reuses ``symbol_profile.kind_defaults`` when present. Index 16:15,
    equity/ETF 16:00. Not a client cash-bell.
    """
    k = (kind or "").strip().lower()
    if not k:
        k = "index" if str(product or "").strip().upper() in _INDEX_PRODUCTS else "equity"
    open_default = time(9, 30)
    close_default = time(16, 15) if k == "index" else time(16, 0)
    try:
        from market_data.symbol_profile import kind_defaults

        d = kind_defaults(k)
        open_t = _parse_hhmm(str(d.get("rth_open") or ""), default=open_default)
        close_t = _parse_hhmm(str(d.get("rth_close") or ""), default=close_default)
        return open_t, close_t
    except Exception:
        return open_default, close_default


def _et_now(clock: datetime | None) -> datetime:
    if clock is None:
        return datetime.now(tz=NY)
    if clock.tzinfo is None:
        return clock.replace(tzinfo=timezone.utc).astimezone(NY)
    return clock.astimezone(NY)


def _iso_now(clock: datetime | None) -> str:
    now = clock if clock is not None else datetime.now(tz=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    return now.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _market_from_massive(doc: dict[str, Any]) -> tuple[MarketClass, bool]:
    label = market_label(doc)
    printing = printing_from_massive_doc(doc)
    if label == "open" or (label == "" and open_from_massive_doc(doc)):
        return "open", True
    if label == "extended-hours" or (label == "" and printing):
        return "extended", True
    return "closed", False


def _apply_product_session_class(
    market: MarketClass,
    printing: bool,
    *,
    product: str,
    product_kind: str | None,
    clock: datetime,
) -> tuple[MarketClass, bool]:
    """Index 16:15 vs equity 16:00. Never invents open from closed (no second clock)."""
    open_t, close_t = product_session_bounds(product, product_kind)
    et = _et_now(clock)
    tod = et.time().replace(tzinfo=None)
    if market == "open" and tod >= close_t:
        if printing:
            return "extended", True
        return "closed", False
    if market == "extended" and printing and open_t <= tod < close_t:
        # Massive is equity-timed; this product is still inside its RTH window.
        return "open", True
    return market, printing


def _complete_nbbo(mark_sources: Sequence[str] | None) -> bool:
    if not mark_sources:
        return False
    cleaned = [str(s or "").strip().lower() for s in mark_sources if str(s or "").strip()]
    if not cleaned:
        return False
    return all(s == "nbbo" for s in cleaned)


def _as_expiration(value: date | str | None) -> date | None:
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    s = str(value).strip()
    if not s:
        return None
    try:
        return date.fromisoformat(s[:10])
    except ValueError:
        return None


def _settlement_for(exp: date, settlement: Settlement | dict[str, Settlement]) -> Settlement:
    if isinstance(settlement, dict):
        key = exp.isoformat()
        raw = settlement.get(key) or settlement.get("default") or "pm"
        return "am" if str(raw).lower() == "am" else "pm"
    return "am" if settlement == "am" else "pm"


def past_opf29_expiry(
    *,
    expirations: Iterable[date | str] | None,
    clock: datetime,
    settlement: Settlement | dict[str, Settlement] = "pm",
) -> bool:
    """True if any contract is at/after its OPF29 expiry instant (H3)."""
    now = _et_now(clock)
    for raw in expirations or ():
        exp = _as_expiration(raw)
        if exp is None:
            continue
        inst = expiry_instant(exp, settlement=_settlement_for(exp, settlement))
        if now >= inst:
            return True
    return False


def compute_opf_session(
    *,
    massive_doc: dict[str, Any] | None,
    generation_as_of: str | None = None,
    mark_sources: Sequence[str] | None = None,
    expiration: date | str | None = None,
    expirations: Sequence[date | str] | None = None,
    settlement: Settlement | dict[str, Settlement] = "pm",
    product: str = "SPX",
    product_kind: str | None = None,
    as_of_clock: datetime | None = None,
) -> dict[str, Any]:
    """Compute the five-fact envelope. No Massive hop. No Redis write.

    H4: emits only session/print quality — never Law B HELD/RESIDUAL.
    """
    clock = as_of_clock if as_of_clock is not None else datetime.now(tz=timezone.utc)
    gen_as_of = str(generation_as_of).strip() if generation_as_of else None
    if gen_as_of == "":
        gen_as_of = None
    has_generation = bool(gen_as_of)

    exp_list: list[date | str] = []
    if expirations:
        exp_list.extend(expirations)
    if expiration is not None:
        exp_list.append(expiration)

    if not session_doc_usable(massive_doc):
        # Named incomplete session class — not a client clock (H1).
        quality: PrintQuality = "last_print" if has_generation else "none"
        return {
            "market": "closed",
            "printing": False,
            "print_quality": quality,
            "as_of": _iso_now(clock),
            "generation_as_of": gen_as_of if quality != "none" else None,
        }

    market, printing = _market_from_massive(massive_doc)  # type: ignore[arg-type]
    market, printing = _apply_product_session_class(
        market,
        printing,
        product=product,
        product_kind=product_kind,
        clock=clock,
    )

    expired = past_opf29_expiry(
        expirations=exp_list,
        clock=clock,
        settlement=settlement,
    )

    if not has_generation:
        quality = "none"
    elif expired:
        # H3: live forbidden after that contract's OPF29 instant.
        quality = "last_print"
    elif market == "open" and _complete_nbbo(mark_sources):
        quality = "live"
    else:
        quality = "last_print"

    return {
        "market": market,
        "printing": bool(printing),
        "print_quality": quality,
        "as_of": _iso_now(clock),
        "generation_as_of": gen_as_of if quality != "none" else None,
    }


def build_opf_session(
    *,
    massive_doc: Any = _UNSET,
    **kwargs: Any,
) -> dict[str, Any]:
    """Like ``compute_opf_session`` but reads Redis L0 when ``massive_doc`` omitted."""
    doc = massive_doc
    if doc is _UNSET:
        doc = read_massive_session_doc()
    return compute_opf_session(massive_doc=doc, **kwargs)


def generation_as_of_from(
    generations_used: dict[str, Any] | None = None,
    *,
    extra: Sequence[str | None] | None = None,
) -> str | None:
    as_ofs: list[str] = []
    if isinstance(generations_used, dict):
        for meta in generations_used.values():
            if isinstance(meta, dict):
                raw = meta.get("as_of")
            else:
                raw = None
            if raw:
                as_ofs.append(str(raw))
    if extra:
        as_ofs.extend(str(x) for x in extra if x)
    return max(as_ofs) if as_ofs else None


def envelope_keys_ok(doc: dict[str, Any] | None) -> bool:
    if not isinstance(doc, dict):
        return False
    return all(k in doc for k in _ENVELOPE_KEYS)
