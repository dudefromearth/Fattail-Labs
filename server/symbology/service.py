"""Registry rows, strip, resolve, telemetry, plane fences (SYM-1…13).

Initial rows are COMING: no PP-1 artifact is in-repo, so nothing is ACTIVE.
Model-kind ACTIVE is not granted (blocked on VPS Q1). metadata_ref is a named
join only — this package does not write VPS symbol-metadata (D7 open).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from threading import Lock
from typing import Any

from symbology import catalog, reasons

ROLES = frozenset({"options", "price-structure", "volume-source"})
MEMBER_FACING_ROLES = frozenset({"options", "price-structure"})
ROW_TYPES = frozenset(
    {"root", "contract", "continuity-alias", "cash", "stock", "index"}
)
STATES = frozenset({"ACTIVE", "COMING", "INELIGIBLE", "STALE"})
FUTURES_ROOTS = ("MES", "ES")  # longest first for token parse
INDEX_ROOTS = ("XSP", "SPX")
STOCK_ROOTS = ("SPY",)
ALL_ROOTS = FUTURES_ROOTS + INDEX_ROOTS + STOCK_ROOTS
# Picker group order (hashed four, then volume-source).
GROUP_ORDER = ("SPX", "XSP", "ES", "MES", "SPY")

# Frozen intake generation (SYM-4). Not date.today() — tests stay deterministic.
INITIAL_AS_OF = date(2026, 9, 19)
INITIAL_GENERATION_ID = "sg-20260919-001"
STRIP_CONTRACTS_PER_ROOT = 6

# Cached recognition set (SYM-13). Not a live Massive scrape.
RECOGNIZED_UNSUPPORTED: dict[str, str] = {
    "NQ": "not-supported-yet",
    "MNQ": "not-supported-yet",
    "RTY": "not-supported-yet",
    "M2K": "not-supported-yet",
    "YM": "not-supported-yet",
    "MYM": "not-supported-yet",
    "NDX": "not-supported-yet",
    "RUT": "not-supported-yet",
    "DJX": "not-supported-yet",
    "VIX": "not-supported-yet",
    "QQQ": "not-supported-yet",
    "IWM": "not-supported-yet",
    "DIA": "not-supported-yet",
    "AAPL": "not-supported-yet",
    "TSLA": "not-supported-yet",
    "NVDA": "not-supported-yet",
    "AMZN": "not-supported-yet",
    "MSFT": "not-supported-yet",
    "META": "not-supported-yet",
    "GOOG": "not-supported-yet",
}

class AliasIngestRefused(Exception):
    """SYM-3 / SYM-AT-2: continuity-alias is never an ingest or C1 key."""


class AdjustmentRefused(Exception):
    """SYM-4.2 / SYM-AT-10: structure/VP/C1 lock adjustment to none."""


class NamedNotBuiltPreset(Exception):
    """SYM-AT-13: picker cannot apply a named-not-built catalog row."""


class StripWriteRefused(Exception):
    """SYM-4: strip is written only outside RTH."""


class UnknownPreset(Exception):
    pass


@dataclass(frozen=True)
class Row:
    type: str
    symbol: str
    root: str
    roles: frozenset[str]
    state: str | None
    member_visible: bool
    has_chains: bool
    metadata_ref: str | None
    may_be_active: bool

    def as_dict(self) -> dict[str, Any]:
        roles = sorted(self.roles)
        out: dict[str, Any] = {
            "type": self.type,
            "symbol": self.symbol,
            "root": self.root,
            "roles": roles,
            "state": self.state,
            "member_visible": self.member_visible,
            "has_chains": self.has_chains,
            "may_be_active": self.may_be_active,
            "metadata_ref": self.metadata_ref,
        }
        if self.state == "COMING":
            out["gray"] = reasons.payload(reasons.COMING_REASON)
        elif self.type in {"root", "continuity-alias"}:
            out["gray"] = None
        return out


@dataclass
class Strip:
    generation_id: str
    as_of: date
    house_preset_id: str
    contracts_by_root: dict[str, list[str]]
    front_by_root: dict[str, str]
    seq: int


@dataclass
class Runtime:
    strip: Strip
    telemetry: dict[tuple[str, str], int] = field(default_factory=dict)


def _contracts_for_root(root: str, as_of: date) -> list[str]:
    return [
        catalog.contract_symbol(root, y, code)
        for y, _m, code in catalog.quarterly_from(as_of, count=STRIP_CONTRACTS_PER_ROOT)
    ]


def _initial_strip() -> Strip:
    contracts = {root: _contracts_for_root(root, INITIAL_AS_OF) for root in FUTURES_ROOTS}
    fronts = {}
    for root, clist in contracts.items():
        front = catalog.pick_front(
            clist, as_of=INITIAL_AS_OF, preset_id=catalog.HOUSE_PRESET_ID
        )
        if not front:
            raise RuntimeError(f"no house front for {root}")
        fronts[root] = front
    return Strip(
        generation_id=INITIAL_GENERATION_ID,
        as_of=INITIAL_AS_OF,
        house_preset_id=catalog.HOUSE_PRESET_ID,
        contracts_by_root=contracts,
        front_by_root=fronts,
        seq=1,
    )


_lock = Lock()
_runtime = Runtime(strip=_initial_strip())


def reset_runtime_for_tests() -> None:
    global _runtime
    with _lock:
        _runtime = Runtime(strip=_initial_strip())


def current_strip() -> Strip:
    with _lock:
        s = _runtime.strip
        return Strip(
            generation_id=s.generation_id,
            as_of=s.as_of,
            house_preset_id=s.house_preset_id,
            contracts_by_root={k: list(v) for k, v in s.contracts_by_root.items()},
            front_by_root=dict(s.front_by_root),
            seq=s.seq,
        )


def write_strip_after_close(*, as_of: date, session_open: bool) -> Strip:
    if session_open:
        raise StripWriteRefused("strip is written only outside RTH")
    with _lock:
        prev = _runtime.strip
        contracts = {root: _contracts_for_root(root, as_of) for root in FUTURES_ROOTS}
        fronts = {}
        for root, clist in contracts.items():
            front = catalog.pick_front(
                clist, as_of=as_of, preset_id=catalog.HOUSE_PRESET_ID
            )
            if not front:
                raise RuntimeError(f"no front for {root}")
            exp = catalog.expiration_for_contract(front)
            preset = catalog.preset_row(catalog.HOUSE_PRESET_ID)
            assert preset is not None and exp is not None
            trig = catalog.trigger_date(exp, preset)
            if as_of >= trig:
                nxt = catalog.pick_nth(
                    clist,
                    as_of=as_of,
                    preset_id=catalog.HOUSE_PRESET_ID,
                    n=2,
                )
                if nxt:
                    front = nxt
            fronts[root] = front
        seq = prev.seq + 1
        new = Strip(
            generation_id=f"sg-{as_of:%Y%m%d}-{seq:03d}",
            as_of=as_of,
            house_preset_id=catalog.HOUSE_PRESET_ID,
            contracts_by_root=contracts,
            front_by_root=fronts,
            seq=seq,
        )
        _runtime.strip = new
        return new


def _alias_tokens(root: str) -> tuple[str, ...]:
    return (f"{root}1!", f"{root}2!", f"/{root}", f"@{root}")


def _metadata_ref(symbol: str) -> str:
    return f"vps:symbol-metadata:{symbol}"


def _static_rows() -> list[Row]:
    rows: list[Row] = [
        Row(
            type="index",
            symbol="SPX",
            root="SPX",
            roles=frozenset({"options"}),
            state="COMING",
            member_visible=True,
            has_chains=False,
            metadata_ref=_metadata_ref("SPX"),
            may_be_active=True,
        ),
        Row(
            type="index",
            symbol="XSP",
            root="XSP",
            roles=frozenset({"options"}),
            state="COMING",
            member_visible=True,
            has_chains=False,
            metadata_ref=_metadata_ref("XSP"),
            may_be_active=True,
        ),
        Row(
            type="stock",
            symbol="SPY",
            root="SPY",
            roles=frozenset({"volume-source"}),
            state="COMING",
            member_visible=False,
            has_chains=False,
            metadata_ref=_metadata_ref("SPY"),
            may_be_active=True,
        ),
    ]
    for root in FUTURES_ROOTS:
        rows.append(
            Row(
                type="root",
                symbol=root,
                root=root,
                roles=frozenset({"price-structure"}),
                state=None,
                member_visible=True,
                has_chains=False,
                metadata_ref=_metadata_ref(root),
                may_be_active=False,
            )
        )
        for tok in _alias_tokens(root):
            rows.append(
                Row(
                    type="continuity-alias",
                    symbol=tok,
                    root=root,
                    roles=frozenset({"price-structure"}),
                    state=None,
                    member_visible=True,
                    has_chains=False,
                    metadata_ref=None,
                    may_be_active=False,
                )
            )
    return rows


_STATIC = _static_rows()


def _contract_row(symbol: str, root: str) -> Row:
    return Row(
        type="contract",
        symbol=symbol,
        root=root,
        roles=frozenset({"price-structure"}),
        state="COMING",
        member_visible=True,
        has_chains=False,
        metadata_ref=_metadata_ref(symbol),
        may_be_active=True,
    )


def _all_rows(strip: Strip) -> list[Row]:
    rows = list(_STATIC)
    for root, contracts in strip.contracts_by_root.items():
        for sym in contracts:
            rows.append(_contract_row(sym, root))
    return rows


def _parse_roles(raw: str | None) -> frozenset[str]:
    if raw is None or not str(raw).strip():
        return MEMBER_FACING_ROLES
    parts = [p.strip() for p in str(raw).replace(" ", ",").split(",") if p.strip()]
    if not parts:
        return MEMBER_FACING_ROLES
    unknown = [p for p in parts if p not in ROLES]
    if unknown:
        raise ValueError(f"unknown role: {unknown[0]}")
    return frozenset(parts)


def _row_matches_roles(row: Row, wanted: frozenset[str]) -> bool:
    return bool(row.roles & wanted)


def _envelope(strip: Strip, extra: dict[str, Any]) -> dict[str, Any]:
    body = {
        "strip_generation_id": strip.generation_id,
        "house_preset_id": strip.house_preset_id,
    }
    body.update(extra)
    return body


def universe(roles_raw: str | None = None) -> dict[str, Any]:
    wanted = _parse_roles(roles_raw)
    strip = current_strip()
    rows = [r for r in _all_rows(strip) if _row_matches_roles(r, wanted)]
    # Default picker omits volume-source-only (SPY).
    if "volume-source" not in wanted:
        rows = [r for r in rows if r.member_visible]
    groups: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        groups.setdefault(row.root, []).append(row.as_dict())
    order = [root for root in GROUP_ORDER if root in groups]
    order.extend(root for root in groups if root not in GROUP_ORDER)
    grouped = [{"root": root, "rows": groups[root]} for root in order]
    return _envelope(
        strip,
        {
            "roles": sorted(wanted),
            "groups": grouped,
        },
    )


def roll_catalog() -> dict[str, Any]:
    return catalog.catalog_public()


def _normalize_q(q: str) -> str:
    s = q.strip()
    if not s:
        raise ValueError("q is required")
    if len(s) > 64:
        raise ValueError("q is too long")
    # Keep leading / @ and trailing !; letters/digits uppercased.
    prefix = ""
    if s[0] in "/@":
        prefix = s[0]
        s = s[1:]
    suffix = ""
    if s.endswith("!"):
        suffix = "!"
        s = s[:-1]
    return prefix + s.upper() + suffix


def _is_alias(token: str) -> bool:
    if not token:
        return False
    if token[0] in "/@" and token[1:] in ALL_ROOTS:
        return True
    if token.endswith("!") and len(token) >= 3:
        body, bang_n = token[:-1], None
        # ES1! / MES2!
        if body and body[-1].isdigit():
            n = body[-1]
            root = body[:-1]
            if root in FUTURES_ROOTS and n in {"1", "2"}:
                return True
    return False


def _alias_n(token: str) -> tuple[str, int] | None:
    """Return (root, n) for ES1! / /ES / @ES. /ES and @ES are n=1."""
    if token[0] in "/@" and token[1:] in FUTURES_ROOTS:
        return token[1:], 1
    if token.endswith("!") and token[-2].isdigit():
        n = int(token[-2])
        root = token[:-2]
        if root in FUTURES_ROOTS and n in (1, 2):
            return root, n
    return None


def _decade_form(token: str) -> tuple[str, str, int] | None:
    """ROOT + month-code + single digit year (ESZ6) — always ambiguous."""
    if len(token) < 3 or not token[-1].isdigit():
        return None
    if token[-2] in catalog.CODE_TO_MONTH and token[:-2].isalpha():
        # Distinguish from 2-digit / 4-digit by length after root+code.
        root = token[:-2]
        code = token[-2]
        digit = int(token[-1])
        if root in FUTURES_ROOTS:
            return root, code, digit
    return None


def _two_digit_form(token: str) -> tuple[str, str, int] | None:
    if len(token) < 4 or not token[-2:].isdigit():
        return None
    if token[-3] in catalog.CODE_TO_MONTH and token[:-3].isalpha():
        root = token[:-3]
        if root in FUTURES_ROOTS:
            return root, token[-3], int(token[-2:])
    return None


def _month_name_query(token: str) -> int | None:
    return catalog.MONTH_NAMES.get(token.lower())


def _row_by_symbol(strip: Strip, symbol: str) -> Row | None:
    for row in _all_rows(strip):
        if row.symbol == symbol:
            return row
    return None


def _matches_payload(strip: Strip, q: str, rows: list[Row]) -> dict[str, Any]:
    return _envelope(
        strip,
        {
            "type": "matches",
            "q": q,
            "matches": [r.as_dict() for r in rows],
            "binding": None,
        },
    )


def _miss_payload(strip: Strip, q: str, code: str) -> dict[str, Any]:
    return _envelope(
        strip,
        {
            "type": "miss",
            "q": q,
            "miss": reasons.payload(code),
            "binding": None,
        },
    )


def _binding_payload(
    strip: Strip,
    q: str,
    row: Row,
    *,
    bound_symbol: str,
    preset_applied: str,
    queried_type: str,
    queried_symbol: str,
) -> dict[str, Any]:
    body = row.as_dict()
    body["type"] = queried_type
    body["symbol"] = queried_symbol
    body["bound_symbol"] = bound_symbol
    if queried_type == "continuity-alias":
        body["state"] = None
        body["may_be_active"] = False
        body["gray"] = None
        body["metadata_ref"] = _metadata_ref(bound_symbol)
    return _envelope(
        strip,
        {
            "type": "binding",
            "q": q,
            "preset_applied": preset_applied,
            "binding": body,
        },
    )


def _live_preset_or_raise(preset_id: str | None) -> str:
    if not preset_id:
        return catalog.HOUSE_PRESET_ID
    row = catalog.preset_row(preset_id)
    if row is None:
        raise UnknownPreset(preset_id)
    if row["status"] != "live" or not row["applyable"]:
        raise NamedNotBuiltPreset(preset_id)
    return preset_id


def _bind_alias(
    strip: Strip,
    root: str,
    n: int,
    *,
    preset_id: str,
) -> str | None:
    contracts = [c for c in strip.contracts_by_root.get(root, [])]
    if preset_id == strip.house_preset_id:
        front = strip.front_by_root.get(root)
        if n == 1:
            return front
        return catalog.pick_nth(
            contracts,
            as_of=strip.as_of,
            preset_id=preset_id,
            n=n,
        )
    return catalog.pick_nth(
        contracts,
        as_of=strip.as_of,
        preset_id=preset_id,
        n=n,
    )


def resolve(
    q: str,
    *,
    roles_raw: str | None = None,
    preset: str | None = None,
) -> dict[str, Any]:
    token = _normalize_q(q)
    wanted = _parse_roles(roles_raw)
    strip = current_strip()
    preset_id = _live_preset_or_raise(preset)

    # Decade-digit futures form: matches, never bind (even if only one decade listed).
    decade = _decade_form(token)
    if decade:
        root, code, digit = decade
        matches = [
            _contract_row(sym, root)
            for sym in strip.contracts_by_root.get(root, [])
            if len(sym) >= 6 and sym[len(root) : len(root) + 1] == code and int(sym[-4:]) % 10 == digit
        ]
        # Always matches-list, never a bind — SYM-AT-1.
        if not matches:
            # Still show the long-form candidates we would recognize.
            for year in (2020 + digit, 2030 + digit):
                matches.append(
                    _contract_row(catalog.contract_symbol(root, year, code), root)
                )
        return _matches_payload(strip, token, matches)

    month = _month_name_query(token)
    if month is not None:
        code = catalog.MONTH_TO_CODE[month]
        found: list[Row] = []
        for root, contracts in strip.contracts_by_root.items():
            if not (frozenset({"price-structure"}) & wanted):
                continue
            for sym in contracts:
                if len(sym) > len(root) and sym[len(root)] == code:
                    found.append(_contract_row(sym, root))
        if found:
            return _matches_payload(strip, token, found)
        return _miss_payload(strip, token, "not-supported-yet")

    alias = _alias_n(token)
    if alias:
        root, n = alias
        if "price-structure" not in wanted:
            return _miss_payload(strip, token, "stack-carries-no-futures-options")
        bound = _bind_alias(strip, root, n, preset_id=preset_id)
        if not bound:
            return _miss_payload(strip, token, "path-not-yet-verified")
        bound_row = _row_by_symbol(strip, bound) or _contract_row(bound, root)
        return _binding_payload(
            strip,
            token,
            bound_row,
            bound_symbol=bound,
            preset_applied=preset_id,
            queried_type="continuity-alias",
            queried_symbol=token,
        )

    long_form = catalog.parse_long_form(token)
    if long_form:
        root, year, month_n = long_form
        # Dated tokens ignore preset (SYM-4.1 / SYM-AT-14).
        if root in FUTURES_ROOTS:
            if "price-structure" not in wanted:
                return _miss_payload(strip, token, "stack-carries-no-futures-options")
            code = catalog.MONTH_TO_CODE[month_n]
            want = catalog.contract_symbol(root, year, code)
            row = _row_by_symbol(strip, want)
            if row is None:
                return _miss_payload(strip, token, "not-supported-yet")
            return _binding_payload(
                strip,
                token,
                row,
                bound_symbol=want,
                preset_applied=strip.house_preset_id,
                queried_type="contract",
                queried_symbol=want,
            )

    two = _two_digit_form(token)
    if two:
        root, code, yy = two
        if "price-structure" not in wanted:
            return _miss_payload(strip, token, "stack-carries-no-futures-options")
        hits = [
            sym
            for sym in strip.contracts_by_root.get(root, [])
            if sym[len(root) : len(root) + 1] == code and int(sym[-4:]) % 100 == yy
        ]
        if len(hits) == 1:
            row = _row_by_symbol(strip, hits[0]) or _contract_row(hits[0], root)
            return _binding_payload(
                strip,
                token,
                row,
                bound_symbol=hits[0],
                preset_applied=strip.house_preset_id,
                queried_type="contract",
                queried_symbol=hits[0],
            )
        if hits:
            return _matches_payload(
                strip,
                token,
                [_contract_row(s, root) for s in hits],
            )
        return _miss_payload(strip, token, "not-supported-yet")

    # Bare root: list, do not bind.
    if token in ALL_ROOTS:
        row = _row_by_symbol(strip, token)
        if row is None:
            return _miss_payload(strip, token, "not-supported-yet")
        if not _row_matches_roles(row, wanted):
            if token in FUTURES_ROOTS and "options" in wanted and "price-structure" not in wanted:
                return _miss_payload(strip, token, "stack-carries-no-futures-options")
            return _miss_payload(strip, token, "not-available-in-this-app")
        if not row.member_visible and "volume-source" not in wanted:
            return _miss_payload(strip, token, "not-available-in-this-app")
        if row.type == "root":
            listed = [
                r
                for r in _all_rows(strip)
                if r.root == token and r.symbol != token
            ]
            return _matches_payload(strip, token, listed)
        # cash/index/stock unique bind
        return _binding_payload(
            strip,
            token,
            row,
            bound_symbol=row.symbol,
            preset_applied=strip.house_preset_id,
            queried_type=row.type,
            queried_symbol=row.symbol,
        )

    # Recognized unsupported (including alias/root forms of those names).
    rec = token.lstrip("/@")
    rec = rec[:-1] if rec.endswith("!") else rec
    rec_root = rec
    for root in ("MNQ", "MYM", "M2K", "NDX", "QQQ", "IWM", "DIA", "NQ", "RTY", "YM"):
        if rec == root or rec.startswith(root):
            rec_root = root
            break
    if rec_root in RECOGNIZED_UNSUPPORTED:
        return _miss_payload(strip, token, RECOGNIZED_UNSUPPORTED[rec_root])
    if rec in RECOGNIZED_UNSUPPORTED:
        return _miss_payload(strip, token, RECOGNIZED_UNSUPPORTED[rec])

    # Never empty — unknown token is still a miss with copy.
    return _miss_payload(strip, token, "not-supported-yet")


def assert_plane_key(symbol: str) -> str:
    """Refuse alias / root / 1! as ingest or C1 key. Return dated long form."""
    token = _normalize_q(symbol)
    if token in {"1!", "2!"} or token.endswith("1!") or token.endswith("2!"):
        raise AliasIngestRefused(f"{token} is never an ingest or C1 key")
    if token[0:1] in {"/", "@"}:
        raise AliasIngestRefused(f"{token} is never an ingest or C1 key")
    if _is_alias(token):
        raise AliasIngestRefused(f"{token} is never an ingest or C1 key")
    if token in FUTURES_ROOTS:
        raise AliasIngestRefused(f"{token} is a root container, never an ingest key")
    long_form = catalog.parse_long_form(token)
    if long_form:
        root, year, month_n = long_form
        return catalog.contract_symbol(root, year, catalog.MONTH_TO_CODE[month_n])
    # cash/index/stock product keys
    if token in {"SPX", "XSP", "SPY"}:
        return token
    decade = _decade_form(token)
    if decade:
        raise AliasIngestRefused(f"{token} is ambiguous and never an ingest key")
    raise AliasIngestRefused(f"{token} is not a native ingest key")


def assert_adjustment_none(mode: str | None) -> None:
    raw = (mode or "none").strip()
    if not raw:
        raw = "none"
    key = raw.replace("-", "_").replace(" ", "_").upper()
    if key in {"NONE", "N"}:
        return
    if key in {
        "B_ADJ",
        "BADJ",
        "CONSTANT",
        "RATIO",
        "C",
        "R",
        "ADJUST_FOR_CONTRACT_CHANGES",
        "BACK_ADJUST",
        "BACKADJUSTED",
    }:
        raise AdjustmentRefused(
            f"adjustment {mode!r} is refused on structure, volume-profile, C1, and model paths"
        )
    raise AdjustmentRefused(f"adjustment {mode!r} is refused; locked to none")


def pair_badge(declared: list[str]) -> dict[str, Any]:
    """SYM-8: pair ends are frozen-front contract + cash/options, never the root."""
    strip = current_strip()
    ends: list[dict[str, Any]] = []
    rank = {"ACTIVE": 0, "COMING": 1, "STALE": 2, "INELIGIBLE": 3}
    for raw in declared:
        token = _normalize_q(str(raw))
        if token in FUTURES_ROOTS:
            front = strip.front_by_root[token]
            row = _row_by_symbol(strip, front) or _contract_row(front, token)
            ends.append(
                {
                    "declared": token,
                    "symbol": front,
                    "type": "contract",
                    "state": row.state or "COMING",
                }
            )
            continue
        row = _row_by_symbol(strip, token)
        if row is None:
            ends.append(
                {
                    "declared": token,
                    "symbol": token,
                    "type": "miss",
                    "state": "COMING",
                }
            )
            continue
        if row.type == "root":
            front = strip.front_by_root[row.root]
            ends.append(
                {
                    "declared": token,
                    "symbol": front,
                    "type": "contract",
                    "state": "COMING",
                }
            )
            continue
        ends.append(
            {
                "declared": token,
                "symbol": row.symbol,
                "type": row.type,
                "state": row.state or "COMING",
            }
        )
    worst = max(ends, key=lambda e: rank.get(str(e["state"]), 1)) if ends else None
    active = bool(ends) and all(e["state"] == "ACTIVE" for e in ends)
    return {
        "active": active,
        "state": "ACTIVE" if active else (worst["state"] if worst else "COMING"),
        "worst_end": worst["symbol"] if worst and not active else None,
        "ends": ends,
        "strip_generation_id": strip.generation_id,
    }


def row_state_from_artifact(
    artifact: dict[str, Any] | None,
    *,
    now_iso: str,
) -> str:
    """SYM-9 / SYM-AT-7. No artifact → COMING. Past max-age → STALE.

    Does not grant model-kind ACTIVE (VPS Q1). Chart-kind ACTIVE only when a
    real PP-1 artifact is supplied — tests may inject one; live rows have none.
    """
    if not artifact:
        return "COMING"
    kind = str(artifact.get("kind") or "")
    if kind == "prints":
        # Model-grade remains blocked on VPS Q1.
        return "COMING"
    max_age = artifact.get("max_age")
    as_of = str(artifact.get("as_of") or "")
    if not as_of or max_age is None:
        return "COMING"
    # Compare ISO dates only (YYYY-MM-DD) — sufficient for STALE vs ACTIVE.
    try:
        as_of_d = date.fromisoformat(as_of[:10])
        now_d = date.fromisoformat(now_iso[:10])
        max_days = int(max_age)
    except (TypeError, ValueError):
        return "COMING"
    if (now_d - as_of_d).days > max_days:
        return "STALE"
    return "ACTIVE"


def record_telemetry(*, q: str, reason_code: str) -> dict[str, Any]:
    if reason_code not in reasons.REASONS:
        raise ValueError(f"unknown gray reason: {reason_code}")
    token = _normalize_q(q)
    with _lock:
        key = (token, reason_code)
        _runtime.telemetry[key] = _runtime.telemetry.get(key, 0) + 1
        count = _runtime.telemetry[key]
    return {"ok": True, "q": token, "reason_code": reason_code, "count": count}


def eligibility_report() -> dict[str, Any]:
    strip = current_strip()
    option_rows = [
        r.as_dict()
        for r in _all_rows(strip)
        if "options" in r.roles and r.type != "root"
    ]
    measured = []
    for row in option_rows:
        measured.append(
            {
                "symbol": row["symbol"],
                "type": row["type"],
                "roles": row["roles"],
                "state": row["state"],
                "measured_expirations_per_week": None,
                "eligible": None,
                "artifact": None,
                "note": "no PP-1 artifact",
            }
        )
    with _lock:
        tel = [
            {"q": q, "reason_code": code, "count": n}
            for (q, code), n in sorted(_runtime.telemetry.items())
        ]
    return {
        "gate": {
            "min_expirations_per_week": 3,
            "window": "rolling-4-week-median",
            "help_copy": reasons.ELIGIBILITY_HELP_COPY,
        },
        "expansion_target": 20,
        "coach_selects": "from measured results only",
        "rows": measured,
        "telemetry": tel,
        "strip_generation_id": strip.generation_id,
    }



