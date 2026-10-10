"""Country and region from a local GeoLite2 database (RD-L3).

The address is looked up once and is not returned. City is not read.
A missing file or an unresolvable address yields unknown.
"""

from __future__ import annotations

import os
from pathlib import Path

import geoip2.database
import geoip2.errors

_FIXTURE = Path(__file__).resolve().parent / "fixtures" / "geolite2-test.mmdb"
_ENV = "LABS_GEOLITE2_PATH"
_UNKNOWN = "unknown"


def locate(address) -> dict[str, str]:
    """Return country and region only. The address is not part of the result."""
    try:
        country, region = _country_region(address)
    except Exception:
        country, region = _UNKNOWN, _UNKNOWN
    return {"country": country, "region": region}


def _country_region(address) -> tuple[str, str]:
    text = _plain(address)
    path = _database_file()
    if text is None or path is None:
        return _UNKNOWN, _UNKNOWN
    with geoip2.database.Reader(str(path)) as reader:
        try:
            record = reader.city(text)
        except geoip2.errors.AddressNotFoundError:
            return _UNKNOWN, _UNKNOWN
        country = _place_name(record.country) or _UNKNOWN
        region = _region_name(record) or _UNKNOWN
        return country, region


def _plain(address) -> str | None:
    if not isinstance(address, str):
        return None
    text = address.strip()
    if not text:
        return None
    if text.lower().startswith("::ffff:"):
        text = text[7:]
    return text or None


def _database_file() -> Path | None:
    override = os.environ.get(_ENV)
    if override is None:
        path = _FIXTURE
    else:
        text = override.strip()
        if not text:
            return None
        path = Path(text)
    if path.is_file():
        return path
    return None


def _place_name(place) -> str:
    name = getattr(place, "name", None)
    if isinstance(name, str) and name.strip():
        return name.strip()
    code = getattr(place, "iso_code", None)
    if isinstance(code, str) and code.strip():
        return code.strip()
    return ""


def _region_name(record) -> str:
    subs = record.subdivisions
    specific = subs.most_specific if subs is not None else None
    if specific is None:
        return ""
    return _place_name(specific)
