"""Links Phase 1 W2. AT-2 (QR) and AT-3 (geo, IP discarded)."""

from __future__ import annotations

import contextlib
import inspect
import io
import json
import socket
import subprocess
import threading
import time
import xml.etree.ElementTree as ET
from pathlib import Path

import pytest
import zxingcpp
from PIL import Image

import db
import pymysql
from links import geo, qr
from links.public_worker import _Handler, _Server

FIXTURE = Path(__file__).resolve().parents[1] / "links" / "fixtures" / "geolite2-test.mmdb"
ROUTE = Path(__file__).resolve().parents[2] / "web" / "app" / "q" / "[slug]" / "route.ts"
CLIENT = Path(__file__).resolve().parents[2] / "web" / "lib" / "links" / "publicRedirect.ts"
WORKER = "http://127.0.0.1:4017"

SHORT = "https://labs.fattail.ai/q/234567"
RESOLVABLE = "198.51.100.10"
UNRESOLVABLE = "203.0.113.10"
CITY = "W2CityMustNotAppear"
COUNTRY = "United States"
REGION = "California"
GOOD = "https://example.com/zztest-w2"
LEVELS = ("L", "M", "Q", "H")
FORMATS = ("svg", "png")


@pytest.fixture(autouse=True)
def _sweep_zztest_w2_rows():
    _sweep()
    yield
    _sweep()


def _sweep() -> None:
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT slug FROM links WHERE label LIKE 'zztest-w2%'")
                slugs = [row["slug"] for row in cur.fetchall()]
                if slugs:
                    marks = ",".join(["%s"] * len(slugs))
                    cur.execute(
                        f"DELETE FROM link_events WHERE slug IN ({marks})",
                        slugs,
                    )
                cur.execute("DELETE FROM links WHERE label LIKE 'zztest-w2%'")
    except pymysql.err.ProgrammingError as exc:
        if exc.args and exc.args[0] == 1146:
            return
        raise
    except pymysql.err.OperationalError as exc:
        if exc.args and exc.args[0] == 1146:
            return
        raise


def _create(label: str) -> str:
    from links.store import create_link

    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = create_link(cur, destination=GOOD, label=label)
    assert isinstance(row.get("slug"), str) and len(row["slug"]) == 6
    return row["slug"]


def _events(slug: str) -> list[dict]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM link_events WHERE slug = %s ORDER BY id",
                (slug,),
            )
            return list(cur.fetchall())


def _blob(row: dict) -> str:
    return " ".join(str(value) for value in row.values())


def _assert_no_ip_or_city(row: dict, ip: str) -> None:
    keys = {str(key).lower() for key in row}
    assert "ip" not in keys
    assert "city" not in keys
    assert "peer" not in keys
    blob = _blob(row)
    assert ip not in blob
    assert CITY not in blob


def _post(port: int, path: str, body: dict) -> tuple[int, bytes]:
    raw = json.dumps(body).encode("utf-8")
    request = (
        f"POST {path} HTTP/1.1\r\n"
        f"Host: 127.0.0.1\r\n"
        f"Content-Type: application/json\r\n"
        f"Content-Length: {len(raw)}\r\n"
        f"Connection: close\r\n\r\n"
    ).encode("ascii") + raw
    with socket.create_connection(("127.0.0.1", port), timeout=5) as sock:
        sock.sendall(request)
        chunks = []
        while True:
            chunk = sock.recv(65536)
            if not chunk:
                break
            chunks.append(chunk)
    data = b"".join(chunks)
    head, _, rest = data.partition(b"\r\n\r\n")
    status = int(head.split(b" ", 2)[1])
    return status, rest


def _post_retry(port: int, path: str, body: dict) -> tuple[int, bytes]:
    last = None
    for _ in range(25):
        try:
            return _post(port, path, body)
        except (ConnectionRefusedError, ConnectionResetError) as exc:
            last = exc
            time.sleep(0.02)
    raise AssertionError(f"worker did not accept on {port}: {last}")


def _log_body(slug: str, peer: str) -> dict:
    return {
        "slug": slug,
        "ua": "zztest-w2",
        "referrer": "https://example.com/zztest-w2-ref",
        "peer": peer,
    }


@pytest.mark.parametrize("fmt", FORMATS)
@pytest.mark.parametrize("level", LEVELS)
@pytest.mark.parametrize("logo", (False, True))
def test_at2_every_level_format_and_logo_decodes(fmt, level, logo):
    """AT-2. SVG and PNG, every EC level, with and without the mark, decoder agrees."""
    image = qr.render(SHORT, fmt=fmt, error=level, logo=logo)
    text, got = qr.decode_image(image, fmt)
    expect = "H" if logo else level
    assert text == SHORT
    assert got == expect
    if fmt == "png":
        with Image.open(io.BytesIO(image)) as src:
            view = src.convert("RGB")
        found = zxingcpp.read_barcodes(
            view,
            formats=zxingcpp.BarcodeFormat.QRCode,
            try_rotate=False,
            try_invert=False,
        )
        assert len(found) == 1 and found[0].valid
        assert found[0].text == SHORT
        assert found[0].ec_level == expect
    else:
        assert (b"<image " in image) is logo
        assert b'href="http' not in image


def test_at2_default_has_no_logo():
    image = qr.render(SHORT, fmt="svg")
    text, got = qr.decode_image(image, "svg")
    assert text == SHORT
    assert got == "M"
    assert b"<image " not in image
    plain = qr.render(SHORT, fmt="png", error="H", logo=False)
    marked = qr.render(SHORT, fmt="png", error="H", logo=True)
    assert plain != marked


def test_at2_logo_forces_h():
    """A center logo is H even when the caller asked for L, M, or Q."""
    for level in ("L", "M", "Q"):
        for fmt in FORMATS:
            image = qr.render(SHORT, fmt=fmt, error=level, logo=True)
            text, got = qr.decode_image(image, fmt)
            assert text == SHORT
            assert got == "H"


def test_at2_failing_contrast_is_refused():
    for fmt in FORMATS:
        for dark, light in (("#ffff00", "#ffffff"), ("#ffffff", "#000000"), ("#222222", "#333333")):
            with pytest.raises(qr.QrRefused) as caught:
                qr.render(SHORT, fmt=fmt, error="M", dark=dark, light=light)
            assert "contrast" in str(caught.value).lower()


def test_at2_quiet_zone_is_four_modules():
    for logo in (False, True):
        raw = qr.render(SHORT, fmt="svg", error="H", logo=logo)
        root = ET.fromstring(raw)
        size = int(float(root.get("width")))
        dark = []
        for elem in root.iter():
            if elem.tag.split("}")[-1] != "rect":
                continue
            fill = (elem.get("fill") or "").lower()
            if fill in ("#000000", "#000"):
                dark.append(
                    (
                        int(float(elem.get("x"))),
                        int(float(elem.get("y"))),
                        int(float(elem.get("width"))),
                        int(float(elem.get("height"))),
                    )
                )
        assert dark
        module = dark[0][2]
        assert module > 0
        assert all(item[2] == module and item[3] == module for item in dark)
        assert min(item[0] for item in dark) == 4 * module
        assert min(item[1] for item in dark) == 4 * module
        assert max(item[0] + item[2] for item in dark) == size - 4 * module
        assert max(item[1] + item[3] for item in dark) == size - 4 * module


def test_at3_fixture_resolves_country_and_region_not_city():
    import geoip2.database
    import geoip2.errors

    assert FIXTURE.is_file()
    with geoip2.database.Reader(str(FIXTURE)) as reader:
        assert "City" in reader.metadata().database_type
        record = reader.city(RESOLVABLE)
        assert record.country.name == COUNTRY
        assert record.subdivisions.most_specific.name == REGION
        assert record.city.name == CITY
        with pytest.raises(geoip2.errors.AddressNotFoundError):
            reader.city(UNRESOLVABLE)
    found = geo.locate(RESOLVABLE)
    assert set(found) == {"country", "region"}
    assert found["country"] == COUNTRY
    assert found["region"] == REGION
    assert CITY not in json.dumps(found)
    assert RESOLVABLE not in json.dumps(found)
    mapped = geo.locate("::ffff:" + RESOLVABLE)
    assert mapped == {"country": COUNTRY, "region": REGION}
    assert geo.locate(UNRESOLVABLE) == {"country": "unknown", "region": "unknown"}
    assert geo.locate("not-an-ip") == {"country": "unknown", "region": "unknown"}
    assert geo.locate("") == {"country": "unknown", "region": "unknown"}
    assert geo.locate(None) == {"country": "unknown", "region": "unknown"}


def test_at3_missing_database_is_unknown(monkeypatch):
    monkeypatch.setenv("LABS_GEOLITE2_PATH", "/tmp/links-w2-missing.mmdb")
    assert geo.locate(RESOLVABLE) == {"country": "unknown", "region": "unknown"}


def test_at3_worker_stores_country_region_and_drops_the_address():
    """AT-3. Resolvable country and region, city absent, unresolvable unknown, IP not stored or logged."""
    from links import public_worker

    # has_marker (LK Phase 3a) was added after W2 froze; the forbidden set
    # below is the property that actually matters and is unchanged.
    assert list(inspect.signature(public_worker.decide).parameters) == [
        "slug",
        "ua",
        "referrer",
        "has_marker",
    ]
    assert list(inspect.signature(public_worker.log_after).parameters) == ["slug", "ua", "referrer"]
    forbidden = {"ip", "cookie", "peer", "city"}
    assert forbidden.isdisjoint(inspect.signature(public_worker.decide).parameters)
    assert forbidden.isdisjoint(inspect.signature(public_worker.log_after).parameters)

    route = ROUTE.read_text(encoding="utf-8")
    client = CLIENT.read_text(encoding="utf-8")
    assert "x-forwarded-for" in route.lower()
    # RD-L1's actual property: no Labs SESSION cookie is ever read or
    # forwarded. LK Phase 3a legitimately adds a non-session marker
    # cookie (ftl_mkr, AF-L1) — "cookie" the word is no longer forbidden,
    # the real Labs session cookie name is.
    assert "ft_session" not in route
    assert ":4000" not in route and "/api" not in route
    assert "ft_session" not in client
    assert ":4000" not in client and "/api" not in client
    assert "peer" in client

    slug = _create("zztest-w2-live")
    found_before, before = _listener_logs()
    assert found_before >= 1, "worker log was not captured"
    status, body = _post_retry(4017, "/log", _log_body(slug, RESOLVABLE))
    assert status == 200
    assert RESOLVABLE.encode() not in body
    status, body = _post_retry(4017, "/log", _log_body(slug, UNRESOLVABLE))
    assert status == 200
    assert UNRESOLVABLE.encode() not in body
    rows = _events(slug)
    assert len(rows) == 2
    assert rows[0]["country"] == COUNTRY
    assert rows[0]["region"] == REGION
    assert rows[1]["country"] == "unknown"
    assert rows[1]["region"] == "unknown"
    _assert_no_ip_or_city(rows[0], RESOLVABLE)
    _assert_no_ip_or_city(rows[1], UNRESOLVABLE)
    _assert_no_ip_or_city(rows[1], RESOLVABLE)
    found_after, after = _listener_logs()
    assert found_after >= 1, "worker log was not captured"
    assert RESOLVABLE not in before
    assert RESOLVABLE not in after
    assert UNRESOLVABLE not in after
    assert CITY not in after

    captured = _capture_worker_log()
    assert RESOLVABLE not in captured
    assert UNRESOLVABLE not in captured
    assert CITY not in captured


def _capture_worker_log() -> str:
    slug = _create("zztest-w2-capture")
    server = _Server(("127.0.0.1", 0), _Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    port = int(server.server_address[1])
    out = io.StringIO()
    err = io.StringIO()
    try:
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            status, body = _post_retry(port, "/log", _log_body(slug, RESOLVABLE))
            assert status == 200
            assert RESOLVABLE.encode() not in body
            status, body = _post_retry(port, "/log", _log_body(slug, UNRESOLVABLE))
            assert status == 200
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)
    rows = _events(slug)
    assert len(rows) == 2
    assert rows[0]["country"] == COUNTRY and rows[0]["region"] == REGION
    assert rows[1]["country"] == "unknown" and rows[1]["region"] == "unknown"
    _assert_no_ip_or_city(rows[0], RESOLVABLE)
    _assert_no_ip_or_city(rows[1], UNRESOLVABLE)
    return out.getvalue() + err.getvalue()


def _listener_logs() -> tuple[int, str]:
    try:
        listed = subprocess.check_output(
            ["lsof", "-nP", "-iTCP:4017", "-sTCP:LISTEN", "-t"],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return 0, ""
    pids = [line.strip() for line in listed.splitlines() if line.strip()]
    if not pids:
        return 0, ""
    chunks = []
    for pid in pids:
        for fd in ("1", "2"):
            path = _fd_path(pid, fd)
            if path is None:
                continue
            file = Path(path)
            if file.is_file():
                chunks.append(file.read_text(encoding="utf-8", errors="replace"))
    return len(chunks), "\n".join(chunks)


def _fd_path(pid: str, fd: str) -> str | None:
    proc = subprocess.run(
        ["lsof", "-nP", "-a", "-p", pid, "-d", fd],
        capture_output=True,
        text=True,
        check=False,
    )
    for line in proc.stdout.splitlines():
        if line.startswith("COMMAND"):
            continue
        parts = line.split(None, 8)
        if len(parts) < 9:
            continue
        name = parts[8].strip()
        if name.startswith("/"):
            return name
    return None
