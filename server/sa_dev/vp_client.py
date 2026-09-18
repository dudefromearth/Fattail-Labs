"""Computing-consumer client for VP API Contract v1.1.

Path after base is exactly the contract. No field rename, no merge, no shim.
Mismatch → ContractMismatch (report to Coach), never coerce.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from sa_dev.vp_contract_mock import (
    ENVELOPE_KEYS,
    MAPPING_KEYS,
    f8_range,
    health as mock_health,
    resolve_profile,
)

DEFAULT_BASE = "mock://"
FIXTURE_BASE = "mock://"


class ContractMismatch(RuntimeError):
    """Envelope does not match VP-API-Contract-v1.1. Do not work around it."""


def _dotenv_base() -> str:
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.is_file():
        return ""
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        if k.strip() == "LABS_SA_DEV_VP_API_BASE":
            return v.strip().strip('"').strip("'")
    return ""


def api_base() -> str:
    raw = (os.environ.get("LABS_SA_DEV_VP_API_BASE") or "").strip()
    if not raw:
        raw = _dotenv_base()
    return raw or DEFAULT_BASE


def _use_mock(base: str) -> bool:
    return base.startswith("mock:")


def live_coverage(health_body: dict[str, Any] | None) -> bool:
    """v1.1 flip signal: coverage.sessions_binned > 0 on any source. Mock never counts."""
    if not health_body or health_body.get("mock") is True:
        return False
    block = health_body.get("coverage")
    if isinstance(block, dict):
        for rec in block.values():
            if isinstance(rec, dict) and int(rec.get("sessions_binned") or 0) > 0:
                return True
    collectors = health_body.get("collectors")
    if isinstance(collectors, dict):
        for rec in collectors.values():
            if not isinstance(rec, dict):
                continue
            cov = rec.get("coverage")
            if isinstance(cov, dict) and int(cov.get("sessions_binned") or 0) > 0:
                return True
            if rec.get("live") is True:
                return True
    return False


def _validate_envelope(body: dict[str, Any]) -> dict[str, Any]:
    missing = [k for k in ENVELOPE_KEYS if k not in body]
    if missing:
        raise ContractMismatch(f"envelope missing keys: {missing}")
    flags = body["flags"]
    if not isinstance(flags, dict) or "mapping" not in flags or "approximation" not in flags:
        raise ContractMismatch("flags.mapping / flags.approximation required")
    if flags["mapping"] not in ("OK", "STALE", "FAILED"):
        raise ContractMismatch(f"flags.mapping not in OK|STALE|FAILED: {flags['mapping']!r}")
    if body["status"] not in ("UNAVAILABLE", "GAPPED", "COMPLETE"):
        raise ContractMismatch(f"status not in UNAVAILABLE|GAPPED|COMPLETE: {body['status']!r}")
    mapping = body["mapping"]
    if not isinstance(mapping, dict):
        raise ContractMismatch("mapping must be an object")
    miss_m = [k for k in MAPPING_KEYS if k not in mapping]
    if miss_m:
        raise ContractMismatch(f"mapping missing keys: {miss_m}")
    bins = body["bins"]
    if not isinstance(bins, list):
        raise ContractMismatch("bins must be a list")
    for i, b in enumerate(bins):
        if not isinstance(b, dict) or "price" not in b or "volume" not in b:
            raise ContractMismatch(f"bins[{i}] must be {{price, volume}}")
    return body


def is_coverage_response(body: dict[str, Any]) -> bool:
    """Explicit /range coverage object — not a histogram. Do not invent bins."""
    if not isinstance(body, dict):
        return False
    if "coverage" in body and "bins" not in body:
        return True
    if body.get("error") in ("coverage", "range_below_coverage"):
        return True
    if body.get("named_state") == "COVERAGE":
        return True
    return False


def _http_json(url: str, headers: dict[str, str] | None = None) -> tuple[int, dict[str, Any]]:
    import json
    import urllib.error
    import urllib.request

    req = urllib.request.Request(url, method="GET", headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode("utf-8")
            status = int(resp.status)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8") if exc.fp else ""
        status = int(exc.code)
        try:
            body = json.loads(raw) if raw else {"error": "http_error"}
        except json.JSONDecodeError as je:
            raise ContractMismatch(f"HTTP {status} non-JSON: {raw[:180]}") from je
        if not isinstance(body, dict):
            raise ContractMismatch(f"HTTP {status} body is not an object")
        return status, body
    try:
        body = json.loads(raw) if raw else {}
    except json.JSONDecodeError as je:
        raise ContractMismatch(f"HTTP {status} non-JSON") from je
    if not isinstance(body, dict):
        raise ContractMismatch("response is not an object")
    return status, body


def _validate_body(body: dict[str, Any]) -> dict[str, Any]:
    if "entries" in body:
        if "bins" in body:
            raise ContractMismatch("dual-source envelope must not also carry bins")
        entries = body["entries"]
        if not isinstance(entries, list) or not entries:
            raise ContractMismatch("entries must be a non-empty list")
        for e in entries:
            _validate_envelope(e)
        return body
    return _validate_envelope(body)


def get_profile(
    target_symbol: str,
    kind: str,
    *,
    source: str | None = None,
    session_date: str | None = None,
    as_of: str | None = None,
    row: float | None = None,
    base: str | None = None,
    headers: dict[str, str] | None = None,
) -> dict[str, Any]:
    use = (base or api_base()).rstrip("/")
    if _use_mock(use):
        resolved = resolve_profile(
            target_symbol, kind, source=source, session_date=session_date
        )
        if isinstance(resolved, tuple):
            status, err = resolved
            raise ContractMismatch(f"mock HTTP {status}: {err}")
        return _validate_body(resolved)

    import urllib.parse

    q: dict[str, str] = {}
    if source:
        q["source"] = source
    if session_date:
        q["session_date"] = session_date
    if as_of:
        q["as_of"] = as_of
    if row is not None:
        q["row"] = str(row)
    qs = ("?" + urllib.parse.urlencode(q)) if q else ""
    url = f"{use}/v1/profile/{target_symbol}/{kind}{qs}"
    status, body = _http_json(url, headers=headers)
    if is_coverage_response(body):
        return body
    if status == 503 or body.get("status") == "UNAVAILABLE":
        return body
    if status == 403:
        raise ContractMismatch("403 computing_consumers_only")
    if status >= 400:
        raise ContractMismatch(f"HTTP {status}: {body}")
    return _validate_body(body)


def get_range(
    target_symbol: str,
    *,
    from_date: str,
    to_date: str,
    source: str | None = None,
    price_lo: float | None = None,
    price_hi: float | None = None,
    row: float | None = None,
    base: str | None = None,
    headers: dict[str, str] | None = None,
    allow_partial: bool = False,
) -> dict[str, Any]:
    use = (base or api_base()).rstrip("/")
    if _use_mock(use):
        from sa_dev.vp_contract_mock import MOCK_SPY_FLOOR, range_below_coverage

        if target_symbol.upper() != "XSP":
            raise ContractMismatch("mock range only serves XSP (F8)")
        if from_date < MOCK_SPY_FLOOR:
            _status, err = range_below_coverage(from_date)
            return err
        return _validate_envelope(f8_range(price_lo, price_hi))
    import urllib.parse

    q: dict[str, str] = {"from": from_date, "to": to_date}
    if source:
        q["source"] = source
    if price_lo is not None:
        q["price_lo"] = str(price_lo)
    if price_hi is not None:
        q["price_hi"] = str(price_hi)
    if row is not None:
        q["row"] = str(row)
    if allow_partial:
        q["allow_partial"] = "true"
    url = f"{use}/v1/profile/{target_symbol}/range?{urllib.parse.urlencode(q)}"
    status, body = _http_json(url, headers=headers)
    if is_coverage_response(body):
        return body
    if status == 503 or body.get("status") == "UNAVAILABLE":
        return body
    if status >= 400:
        raise ContractMismatch(f"HTTP {status}: {body}")
    return _validate_envelope(body)


def get_health(*, base: str | None = None, headers: dict[str, str] | None = None) -> dict[str, Any]:
    use = (base or api_base()).rstrip("/")
    if _use_mock(use):
        return mock_health()
    status, body = _http_json(f"{use}/v1/health", headers=headers)
    if status >= 400:
        raise ContractMismatch(f"HTTP {status}: {body}")
    return body
