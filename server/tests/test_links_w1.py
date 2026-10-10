"""Links Phase 1 W1 fixtures. AT-1, AT-4, AT-5, AT-6, AT-10, AT-11a.

Laws under test: RD-L1, RD-L2, RD-L6, LK-L2, LK-L3, LK-L6.
Imports the frozen W1 functions. Does not implement them.
"""

from __future__ import annotations

import errno
import inspect
import io
import json
import socket
import subprocess
import time
from pathlib import Path
from types import SimpleNamespace

import pytest

import db
import pymysql
from config import get_config

FIXTURES = Path(__file__).resolve().parents[1] / "links" / "fixtures"
D4_PATH = FIXTURES / "d4_bots.txt"
FENCE_PATH = FIXTURES / "fence_cases.json"
UA_PATH = FIXTURES / "user_agents.json"
ROUTE_FILE = Path(__file__).resolve().parents[2] / "web" / "app" / "q" / "[slug]" / "route.ts"

D4_BYTES = (
    b"iMessage preview\n"
    b"Slackbot-LinkExpanding\n"
    b"Discordbot\n"
    b"bot|crawler|spider|preview\n"
)

GOOD = "https://example.com/zztest-w1"
GOOD_EDITED = "https://example.com/zztest-w1-edited"
HTTP_ABSENT = "HTTP check could not run"
PROBE_SLUG = "0zztes"

_CACHE = {
    "cache-control": "no-store, no-cache, max-age=0, must-revalidate",
    "pragma": "no-cache",
    "expires": "0",
    "vary": "*",
}

_REDIRECTS = {301, 302, 303, 307, 308}


def _load_fence() -> dict:
    return json.loads(FENCE_PATH.read_text(encoding="utf-8"))


def _load_uas() -> dict:
    return json.loads(UA_PATH.read_text(encoding="utf-8"))


def _cases() -> list[dict]:
    return list(_load_fence()["cases"])


class _DummySock:
    """Stand-in for a TCP connect that must not leave the machine."""

    def __enter__(self):
        return self

    def __exit__(self, *_exc):
        self.close()
        return False

    def close(self):
        return None

    def settimeout(self, _timeout):
        return None

    def setsockopt(self, *_args, **_kwargs):
        return None

    def send(self, data, *_args):
        return len(data) if data else 0

    def sendall(self, data, *_args):
        return None

    def recv(self, _n=0, *_args):
        return b""

    def makefile(self, mode="r", *_args, **_kwargs):
        body = b"HTTP/1.1 200 OK\r\nContent-Length: 0\r\nConnection: close\r\n\r\n"
        if "b" in mode:
            return io.BytesIO(body)
        return io.StringIO(body.decode("ascii"))

    def shutdown(self, _how):
        return None


class NetGuard:
    """Watch socket connect. Fence failures must not open an outbound socket.

    The dev database port is allowed through. Every other connect is recorded.
    """

    def __init__(self) -> None:
        cfg = get_config()
        self.db_host = str(cfg.db_host)
        self.db_port = int(cfg.db_port)
        self.connects: list = []
        self.dns_hosts: list[str] = []
        self.block_connect = True
        self.sequence: list[list[str]] | None = None
        self._real_getaddrinfo = socket.getaddrinfo
        self._real_create_connection = socket.create_connection
        self._real_connect = socket.socket.connect

    def install(self, monkeypatch) -> None:
        guard = self

        def fake_getaddrinfo(host, port, *args, **kwargs):
            host_s = host.decode() if isinstance(host, bytes) else str(host)
            guard.dns_hosts.append(host_s)
            if guard._pass_through_dns(host_s):
                return guard._real_getaddrinfo(host, port, *args, **kwargs)
            rows = []
            for ip in guard._next_ips():
                rows.extend(guard._real_getaddrinfo(ip, port, *args, **kwargs))
            return rows

        def fake_connect(sock, address):
            if isinstance(address, str) or guard._is_db(address):
                return guard._real_connect(sock, address)
            guard.connects.append(address)
            if guard.block_connect:
                raise OSError(errno.ENETUNREACH, "outbound connect blocked")
            return None

        def fake_create_connection(address, *args, **kwargs):
            if guard._is_db(address):
                return guard._real_create_connection(address, *args, **kwargs)
            guard.connects.append(address)
            if guard.block_connect:
                raise OSError(errno.ENETUNREACH, "outbound connect blocked")
            return _DummySock()

        monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)
        monkeypatch.setattr(socket.socket, "connect", fake_connect)
        monkeypatch.setattr(socket, "create_connection", fake_create_connection)

    def _pass_through_dns(self, host: str) -> bool:
        if host == self.db_host:
            return True
        if host.rstrip(".").lower() == "localhost":
            return True
        try:
            import ipaddress

            ipaddress.ip_address(host)
            return True
        except ValueError:
            return False

    def _next_ips(self) -> list[str]:
        if not self.sequence:
            return ["1.1.1.1"]
        if len(self.sequence) > 1:
            return list(self.sequence.pop(0))
        return list(self.sequence[0])

    def _is_db(self, address) -> bool:
        if not isinstance(address, tuple) or len(address) < 2:
            return False
        host, port = address[0], address[1]
        try:
            port_n = int(port)
        except (TypeError, ValueError):
            return False
        if port_n != self.db_port:
            return False
        host_s = host.decode() if isinstance(host, bytes) else str(host)
        aliases = {self.db_host}
        if self.db_host in {"localhost", "127.0.0.1", "::1"}:
            aliases.update({"localhost", "127.0.0.1", "::1"})
        return host_s in aliases


@pytest.fixture
def net(monkeypatch):
    guard = NetGuard()
    guard.install(monkeypatch)
    return guard


@pytest.fixture
def api():
    try:
        from links import events, fence, public_worker, slug, store
    except ImportError as exc:
        pytest.fail(f"Alpha W1 modules are not importable: {exc}")
    mods = {
        "fence": fence,
        "slug": slug,
        "store": store,
        "events": events,
        "public_worker": public_worker,
    }
    needed = {
        fence: (
            "assert_destination_storable",
            "assert_public_answers",
            "reachability",
            "FenceError",
        ),
        slug: ("ALPHABET",),
        store: ("create_link", "update_link", "get_link"),
        events: ("record_pass", "record_miss", "classify"),
        public_worker: ("decide", "log_after"),
    }
    missing = [
        f"{mod.__name__}.{name}"
        for mod, names in needed.items()
        for name in names
        if not hasattr(mod, name)
    ]
    if missing:
        pytest.fail("missing frozen names: " + ", ".join(missing))
    return SimpleNamespace(**mods)


@pytest.fixture(autouse=True)
def _sweep_zztest_rows():
    yield
    _sweep_zztest()


def _sweep_zztest() -> None:
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT slug FROM links WHERE label LIKE 'zztest-%'")
                slugs = [row["slug"] for row in cur.fetchall()]
                if slugs:
                    marks = ",".join(["%s"] * len(slugs))
                    cur.execute(
                        f"DELETE FROM link_events WHERE slug IN ({marks})",
                        slugs,
                    )
                    paths = [f"/q/{slug}" for slug in slugs]
                    cur.execute(
                        f"DELETE FROM link_misses WHERE attempted IN ({marks})",
                        slugs,
                    )
                    cur.execute(
                        f"DELETE FROM link_misses WHERE attempted IN ({marks})",
                        paths,
                    )
                cur.execute("DELETE FROM links WHERE label LIKE 'zztest-%'")
                cur.execute(
                    """
                    DELETE FROM link_misses
                    WHERE attempted LIKE 'zztest%%'
                       OR attempted = %s
                       OR attempted = %s
                       OR attempted LIKE %s
                    """,
                    (PROBE_SLUG, f"/q/{PROBE_SLUG}", f"%/{PROBE_SLUG}%"),
                )
    except pymysql.err.ProgrammingError as exc:
        if exc.args and exc.args[0] == 1146:
            return
        raise
    except pymysql.err.OperationalError as exc:
        if exc.args and exc.args[0] == 1146:
            return
        raise


def _phone() -> str:
    return _load_uas()["phone"]["ua"]


def _desktop() -> str:
    return _load_uas()["desktop"]["ua"]


def _as_bool(value) -> bool:
    if isinstance(value, (bytes, bytearray)):
        return value not in (b"", b"\x00")
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes"}
    return bool(value)


def count_events_excluding_bots(rows: list[dict]) -> int:
    """RD-L2 — bot rows are stored and excluded from counts."""
    return sum(1 for row in rows if not _as_bool(row.get("bot")))


def _header_map(decision: dict) -> dict[str, str]:
    raw = decision.get("headers") or {}
    if isinstance(raw, dict):
        items = raw.items()
    elif isinstance(raw, list):
        items = raw
    else:
        raise AssertionError("decide() headers are not a mapping")
    found = {str(key).lower(): str(value) for key, value in items}
    for key, value in decision.items():
        lowered = str(key).lower()
        if lowered in _CACHE and lowered not in found:
            found[lowered] = str(value)
    return found


def _status(decision: dict) -> int:
    for key in ("status", "status_code"):
        if key in decision:
            return int(decision[key])
    raise AssertionError(f"decide() dict has no status; keys={sorted(decision)}")


def _location(decision: dict) -> str:
    for key in ("location", "Location"):
        value = decision.get(key)
        if isinstance(value, str) and value:
            return value
    loc = _header_map(decision).get("location")
    if loc:
        return loc
    raise AssertionError(f"decide() dict has no location; keys={sorted(decision)}")


def _assert_cache_if_present(decision: dict) -> None:
    """decide() may omit RD-L1 headers; the Next response carries them.

    Any cache header the dict does include must be the verbatim value.
    """
    found = _header_map(decision)
    for key, value in _CACHE.items():
        if key in found:
            assert found[key] == value


def _assert_no_set_cookie(decision: dict) -> None:
    def walk(obj: object) -> None:
        if isinstance(obj, dict):
            for key, value in obj.items():
                lowered = str(key).lower()
                assert lowered not in {"set-cookie", "set_cookie"}
                walk(value)
        elif isinstance(obj, list):
            for item in obj:
                walk(item)

    walk(decision)


def _text_blob(obj: object) -> str:
    parts: list[str] = []

    def walk(value: object) -> None:
        if isinstance(value, str):
            parts.append(value)
        elif isinstance(value, dict):
            for item in value.values():
                walk(item)
        elif isinstance(value, list):
            for item in value:
                walk(item)

    walk(obj)
    return "\n".join(parts)


def _require_slug(row: dict, alphabet: str) -> str:
    assert isinstance(row, dict)
    slug = row["slug"]
    assert isinstance(slug, str)
    assert len(slug) == 6
    assert set(slug) <= set(alphabet)
    return slug


def _create(api, *, destination: str, label: str, static: bool = False) -> dict:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = api.store.create_link(
                cur,
                destination=destination,
                label=label,
                static=static,
            )
    assert isinstance(row, dict)
    _require_slug(row, api.slug.ALPHABET)
    return row


def _events(slug: str) -> list[dict]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM link_events WHERE slug = %s", (slug,))
            return list(cur.fetchall())


def _misses(slug: str) -> list[dict]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT * FROM link_misses
                WHERE attempted = %s
                   OR attempted = %s
                   OR attempted = %s
                   OR attempted LIKE %s
                """,
                (slug, f"/q/{slug}", f"/q/{slug}/", f"%/{slug}%"),
            )
            return list(cur.fetchall())


def _forbid_reachability(api):
    import links.store as store_mod

    real = api.fence.reachability
    saved = {}

    def wrapped(url):
        raise AssertionError(f"reachability called for a fence failure: {url}")

    api.fence.reachability = wrapped
    for key, value in list(vars(store_mod).items()):
        if value is real:
            saved[key] = value
            setattr(store_mod, key, wrapped)
    return real, saved, store_mod


def _restore_reachability(api, real, saved, store_mod) -> None:
    api.fence.reachability = real
    for key, value in saved.items():
        setattr(store_mod, key, value)


def _route_absent_reason() -> str | None:
    if not ROUTE_FILE.is_file():
        return f"{HTTP_ABSENT}: web/app/q/[slug]/route.ts is not present"
    return None


def _curl(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, capture_output=True, text=True, check=False)


def _curl_unavailable(proc: subprocess.CompletedProcess[str]) -> bool:
    if proc.returncode in {7, 28, 52}:
        return True
    stdout = proc.stdout or ""
    return not stdout.lstrip().startswith("HTTP/")


def _parse_status_headers(text: str) -> tuple[int, dict[str, str]]:
    status = None
    headers: dict[str, str] = {}
    for line in text.replace("\r\n", "\n").split("\n"):
        if not line.strip():
            if status is not None:
                break
            continue
        if line.startswith("HTTP/"):
            status = int(line.split()[1])
            headers = {}
            continue
        if status is not None and ":" in line:
            name, value = line.split(":", 1)
            headers[name.strip()] = value.strip()
    if status is None:
        raise AssertionError("curl response had no HTTP status")
    return status, headers


def test_d4_bots_file_is_the_four_pinned_lines():
    assert D4_PATH.read_bytes() == D4_BYTES
    lines = D4_BYTES.decode("ascii").splitlines()
    assert lines == [
        "iMessage preview",
        "Slackbot-LinkExpanding",
        "Discordbot",
        "bot|crawler|spider|preview",
    ]


def test_user_agents_fixture_has_phone_desktop_and_pinned_bots():
    data = _load_uas()
    assert data["phone"]["class"] == "phone"
    assert data["desktop"]["class"] == "desktop"
    assert "iPhone" in data["phone"]["ua"]
    assert "Windows NT" in data["desktop"]["ua"]
    pinned = data["pinned_bots"]
    assert [row["match"] for row in pinned] == [
        "iMessage preview",
        "Slackbot-LinkExpanding",
        "Discordbot",
    ]
    for row in pinned:
        assert row["match"] in row["ua"]
    generic = D4_BYTES.decode("ascii").splitlines()[-1]
    for ua in (data["phone"]["ua"], data["desktop"]["ua"]):
        assert not any(part in ua for part in generic.split("|"))


def test_fence_cases_fixture_covers_the_spec():
    data = _load_fence()
    blob = json.dumps(data)
    for needle in (
        "http://",
        "8.8.8.8",
        "localhost",
        "127.0.0.1",
        "10.1.2.3",
        "172.16.0.1",
        "172.31.255.254",
        "192.168.1.10",
        "100.64.1.1",
        "169.254.169.254",
        "fd00::1",
        "::1",
        "labs.fattail.ai",
        "user:pass@",
    ):
        assert needle in blob
    flip = data["flip_resolution"]
    note = flip["note"]
    assert "public" in note.lower()
    assert "private" in note.lower()
    assert flip["first_answers"] == ["1.1.1.1"]
    assert "10.9.8.7" in flip["second_answers"]
    assert "1.1.1.1" in flip["second_answers"]


def test_lk_l2_slug_alphabet_and_length(api, net):
    assert api.slug.ALPHABET == "23456789abcdefghjkmnpqrstuvwxyz"
    assert len(api.slug.ALPHABET) == 31
    for ch in "01ilo":
        assert ch not in api.slug.ALPHABET
    net.block_connect = False
    first = _create(api, destination=GOOD, label="zztest-slug-a")
    second = _create(api, destination=GOOD, label="zztest-slug-b")
    assert first["slug"] != second["slug"]
    for row in (first, second):
        _require_slug(row, api.slug.ALPHABET)


def test_owner_is_settable_as_of_lk_phase_3b(api, net):
    """owner was inert through Phase 1 (LK-L1). LK Phase 3b (AF-L3/D13,
    Specs/Links-Attribution-Affiliates-Spec-v0_2.md) activates it: an
    identities.identity_id, never free text, never **kwargs passthrough.
    owner=None (the default — no owner given) must succeed, not raise:
    a real regression this test caught once (owner=None raised TypeError
    unconditionally in create_link, breaking every ordinary link create
    for several deploys until fixed)."""
    create_sig = inspect.signature(api.store.create_link)
    assert list(create_sig.parameters) == [
        "cur",
        "destination",
        "label",
        "static",
        "design",
        "placement",
        "owner",
    ]
    assert not any(
        param.kind is inspect.Parameter.VAR_KEYWORD
        for param in create_sig.parameters.values()
    )
    for name in ("destination", "label", "static", "design", "placement", "owner"):
        assert create_sig.parameters[name].kind is inspect.Parameter.KEYWORD_ONLY

    # A non-int owner is still refused.
    with pytest.raises(TypeError):
        api.store.create_link(
            None,
            destination=GOOD,
            label="zztest-owner-bad",
            owner="zztest-owner",
        )

    net.block_connect = False
    # owner=None (the default) must succeed — the no-owner case is the
    # common case, not an edge case.
    no_owner = _create(api, destination=GOOD, label="zztest-owner-none")
    assert no_owner["owner"] is None

    # A valid identity_id is stored and read back as given.
    with db.transaction() as conn:
        with conn.cursor() as cur:
            owned = api.store.create_link(
                cur, destination=GOOD, label="zztest-owner-set", owner=1
            )
    assert owned["owner"] == "1"

    update_sig = inspect.signature(api.store.update_link)
    assert list(update_sig.parameters) == [
        "cur",
        "slug",
        "destination",
        "label",
        "active",
        "design",
        "placement",
        "owner",
    ]
    for name in ("destination", "label", "active", "design", "placement", "owner"):
        assert update_sig.parameters[name].kind is inspect.Parameter.KEYWORD_ONLY
    # update_link() reads the current row before validating fields, so the
    # TypeError check needs a real cursor (not None) to reach _owner().
    with pytest.raises(TypeError):
        with db.transaction() as conn:
            with conn.cursor() as cur:
                api.store.update_link(cur, no_owner["slug"], owner="zztest-owner")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            updated = api.store.update_link(cur, no_owner["slug"], owner=2)
    assert updated["owner"] == "2"


def test_at1_decide_is_uncached_302_and_follows_edit(api, net):
    """AT-1 / RD-L1. 302, verbatim cache headers, no Set-Cookie, edit sticks."""
    net.block_connect = False
    created = _create(api, destination=GOOD, label="zztest-at1")
    slug = created["slug"]
    ua = _desktop()

    net.block_connect = True
    net.connects.clear()
    api.public_worker.decide(slug, ua, None)
    started = time.perf_counter()
    decision = api.public_worker.decide(slug, ua, None)
    elapsed = time.perf_counter() - started
    assert net.connects == []
    assert _events(slug) == []
    status = _status(decision)
    assert status == 302
    assert status not in (301, 308)
    _assert_no_set_cookie(decision)
    _assert_cache_if_present(decision)
    assert _location(decision) == GOOD
    assert elapsed < 0.5, f"decide() latency {elapsed:.4f}s is not under 0.5s"

    net.block_connect = False
    with db.transaction() as conn:
        with conn.cursor() as cur:
            updated = api.store.update_link(cur, slug, destination=GOOD_EDITED)
    assert updated["destination"] == GOOD_EDITED
    net.block_connect = True
    net.connects.clear()
    rescanned = api.public_worker.decide(slug, ua, None)
    assert net.connects == []
    assert _status(rescanned) == 302
    assert _status(rescanned) not in (301, 308)
    _assert_no_set_cookie(rescanned)
    _assert_cache_if_present(rescanned)
    assert _location(rescanned) == GOOD_EDITED


def test_at1_http_when_next_route_is_up(api, net):
    absent = _route_absent_reason()
    if absent:
        pytest.skip(absent)
    net.block_connect = False
    created = _create(api, destination=GOOD, label="zztest-at1-http")
    slug = created["slug"]
    url = f"http://127.0.0.1:3000/q/{slug}"
    try:
        proc = _curl(["curl", "-sI", "--max-time", "2", url])
    except FileNotFoundError:
        pytest.skip(f"{HTTP_ABSENT}: curl is not available")
    if _curl_unavailable(proc):
        pytest.skip(f"{HTTP_ABSENT}: Next is not accepting on 127.0.0.1:3000")
    status, headers = _parse_status_headers(proc.stdout)
    lowered = {key.lower(): value for key, value in headers.items()}
    assert status == 302
    assert status not in (301, 308)
    for key, value in _CACHE.items():
        assert lowered.get(key) == value
    # AF-L1/AF-L2 legitimately sets a marker cookie (ftl_mkr) when the
    # request carries none; the frozen property is no Labs SESSION cookie.
    assert "ft_session" not in lowered.get("set-cookie", "")
    assert lowered.get("location") == GOOD


def test_at4_device_referrer_kind_and_bots_excluded(api, net):
    """AT-4 / RD-L2. Phone and desktop, direct, scan heuristic, bots stored out of counts."""
    uas = _load_uas()
    phone = uas["phone"]["ua"]
    desktop = uas["desktop"]["ua"]
    net.block_connect = False
    created = _create(api, destination=GOOD, label="zztest-at4")
    slug = created["slug"]
    referrer = "https://news.example/zztest-story"

    phone_absent = api.events.classify(phone, None)
    desktop_absent = api.events.classify(desktop, None)
    phone_ref = api.events.classify(phone, referrer)
    desktop_ref = api.events.classify(desktop, referrer)
    assert phone_absent["device_class"] == "phone"
    assert desktop_absent["device_class"] == "desktop"
    assert phone_absent["kind"] == "scan"
    assert phone_absent["referrer"] == "direct"
    assert desktop_absent["kind"] == "click"
    assert desktop_absent["referrer"] == "direct"
    assert phone_ref["kind"] == "click"
    assert phone_ref["referrer"] == referrer
    assert desktop_ref["kind"] == "click"
    assert isinstance(phone_absent["os_family"], str) and phone_absent["os_family"]
    assert isinstance(desktop_absent["os_family"], str) and desktop_absent["os_family"]
    assert _as_bool(phone_absent["bot"]) is False
    assert _as_bool(desktop_absent["bot"]) is False

    spider = api.events.classify("zztest-spider/1.0", referrer)
    assert _as_bool(spider["bot"]) is True
    for pinned in uas["pinned_bots"]:
        classified = api.events.classify(pinned["ua"], None)
        assert _as_bool(classified["bot"]) is True

    api.public_worker.log_after(slug, phone, None)
    api.public_worker.log_after(slug, desktop, None)
    api.public_worker.log_after(slug, phone, referrer)
    api.public_worker.log_after(slug, "zztest-spider/1.0", referrer)
    for pinned in uas["pinned_bots"]:
        api.public_worker.log_after(slug, pinned["ua"], None)

    rows = _events(slug)
    humans = [row for row in rows if not _as_bool(row.get("bot"))]
    bots = [row for row in rows if _as_bool(row.get("bot"))]
    assert len(bots) == 4
    assert count_events_excluding_bots(rows) == len(humans) == 3
    assert count_events_excluding_bots(rows) < len(rows)
    kinds = {(row["device_class"], row["kind"], row["referrer"]) for row in humans}
    assert ("phone", "scan", "direct") in kinds
    assert ("desktop", "click", "direct") in kinds
    assert ("phone", "click", referrer) in kinds
    assert all(row["kind"] != "scan" or row["device_class"] == "phone" for row in humans)
    assert all(row["kind"] != "scan" or row["referrer"] == "direct" for row in rows)
    for row in rows:
        assert row["country"] == "unknown"
        assert row["region"] == "unknown"
        assert row["occurred_at"] is not None
        assert row["member_id"] is None
        assert row["marker_id"] is None


def test_at5_unknown_and_inactive(api, net):
    """AT-5 / LK-L6 / RD-L4. Unknown is 404. Inactive keeps history and is not an event."""
    ua = _desktop()
    assert _events(PROBE_SLUG) == []
    misses_before = len(_misses(PROBE_SLUG))
    unknown = api.public_worker.decide(PROBE_SLUG, ua, None)
    assert _status(unknown) == 404
    assert "no longer active" not in _text_blob(unknown).lower()
    assert _events(PROBE_SLUG) == []
    assert len(_misses(PROBE_SLUG)) == misses_before
    api.public_worker.log_after(PROBE_SLUG, ua, None)
    assert _events(PROBE_SLUG) == []
    assert len(_misses(PROBE_SLUG)) == misses_before + 1

    net.block_connect = False
    created = _create(api, destination=GOOD, label="zztest-at5")
    slug = created["slug"]
    api.public_worker.log_after(slug, ua, "https://ref.example/zztest")
    assert len(_events(slug)) == 1
    with db.transaction() as conn:
        with conn.cursor() as cur:
            updated = api.store.update_link(cur, slug, active=False)
            kept = api.store.get_link(cur, slug)
    assert _as_bool(updated["active"]) is False
    assert kept is not None
    assert kept["destination"] == GOOD
    misses_before = len(_misses(slug))
    events_before = len(_events(slug))
    inactive = api.public_worker.decide(slug, ua, None)
    assert _status(inactive) not in _REDIRECTS
    assert "no longer active" in _text_blob(inactive).lower()
    assert len(_events(slug)) == events_before
    assert len(_misses(slug)) == misses_before
    api.public_worker.log_after(slug, ua, None)
    assert len(_events(slug)) == events_before
    assert len(_misses(slug)) == misses_before + 1
    with db.transaction() as conn:
        with conn.cursor() as cur:
            still = api.store.get_link(cur, slug)
    assert still is not None
    assert still["destination"] == GOOD


def test_at6_request_destination_is_not_a_decide_parameter(api, net):
    # has_marker (LK Phase 3a, AF-L1/AF-L2 — Specs/Links-Attribution-
    # Affiliates-Spec-v0_1.md) was added after W1 froze; destination was
    # not and still is not accepted, which is the actual property AT-6
    # protects.
    sig = inspect.signature(api.public_worker.decide)
    assert list(sig.parameters) == ["slug", "ua", "referrer", "has_marker"]
    assert "destination" not in sig.parameters
    assert not any(
        param.kind in (inspect.Parameter.VAR_KEYWORD, inspect.Parameter.VAR_POSITIONAL)
        for param in sig.parameters.values()
    )
    decoy = "https://evil.example/zztest-decoy"
    with pytest.raises(TypeError):
        api.public_worker.decide(PROBE_SLUG, _desktop(), None, destination=decoy)
    net.block_connect = False
    created = _create(api, destination=GOOD, label="zztest-at6")
    net.block_connect = True
    decision = api.public_worker.decide(created["slug"], _phone(), decoy)
    assert _location(decision) == GOOD
    assert _location(decision) != decoy


@pytest.mark.parametrize("case", _cases(), ids=[case["id"] for case in _cases()])
def test_at10_fence_case_refuses_and_stores_nothing(case, api, net):
    """AT-10 / RD-L6. Create and edit refuse, store nothing, and do not connect."""
    url = case["url"]
    net.block_connect = True
    net.connects.clear()
    held = _forbid_reachability(api)
    try:
        with pytest.raises(api.fence.FenceError):
            api.fence.assert_destination_storable(url)
        assert net.connects == []
        if case.get("address"):
            with pytest.raises(api.fence.FenceError):
                api.fence.assert_public_answers([case["address"]])
            with pytest.raises(api.fence.FenceError):
                api.fence.assert_public_answers(["1.1.1.1", case["address"]])
        label = f"zztest-deny-{case['id']}"
        net.connects.clear()
        with pytest.raises(api.fence.FenceError):
            with db.transaction() as conn:
                with conn.cursor() as cur:
                    api.store.create_link(cur, destination=url, label=label)
        assert net.connects == []
    finally:
        _restore_reachability(api, *held)

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS n FROM links WHERE label = %s", (label,))
            assert cur.fetchone()["n"] == 0

    net.block_connect = False
    created = _create(api, destination=GOOD, label=f"zztest-edit-{case['id']}")
    slug = created["slug"]
    net.block_connect = True
    net.connects.clear()
    held = _forbid_reachability(api)
    try:
        with pytest.raises(api.fence.FenceError):
            with db.transaction() as conn:
                with conn.cursor() as cur:
                    api.store.update_link(cur, slug, destination=url)
        assert net.connects == []
    finally:
        _restore_reachability(api, *held)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            kept = api.store.get_link(cur, slug)
            cur.execute(
                "SELECT COUNT(*) AS n FROM links WHERE destination = %s AND label LIKE 'zztest-%%'",
                (url,),
            )
            stored = cur.fetchone()["n"]
    assert kept["destination"] == GOOD
    assert stored == 0


def test_at10_public_unicast_is_not_an_address_fence(api):
    api.fence.assert_public_answers(["1.1.1.1"])
    api.fence.assert_public_answers(["8.8.8.8"])


def test_at10_flip_resolution_refuses_before_connect(api, net):
    """First answer is public. The second answer includes a private address.

    The store fence does not resolve. reachability resolves twice and refuses
    the private second answer without connecting. The row is still stored.
    """
    flip = _load_fence()["flip_resolution"]
    url = flip["url"]
    note = flip["note"]
    assert "private" in note.lower() and "public" in note.lower()
    api.fence.assert_public_answers(list(flip["first_answers"]))
    with pytest.raises(api.fence.FenceError):
        api.fence.assert_public_answers(list(flip["second_answers"]))

    net.block_connect = True
    net.connects.clear()
    net.dns_hosts.clear()
    api.fence.assert_destination_storable(url)
    assert not [host for host in net.dns_hosts if "flip-resolution.example" in host]

    net.sequence = [list(flip["first_answers"]), list(flip["second_answers"])]
    net.dns_hosts.clear()
    warning = api.fence.reachability(url)
    looked_up = [host for host in net.dns_hosts if "flip-resolution.example" in host]
    assert len(looked_up) >= 2
    assert isinstance(warning, str) and warning
    assert net.connects == []

    net.sequence = [list(flip["first_answers"]), list(flip["second_answers"])]
    net.connects.clear()
    created = _create(api, destination=url, label="zztest-flip")
    assert created["destination"] == url
    assert isinstance(created.get("warning"), str) and created["warning"]
    assert net.connects == []


def test_rd_l6_serve_time_refuses_non_https(api, net):
    net.block_connect = False
    created = _create(api, destination=GOOD, label="zztest-scheme")
    slug = created["slug"]
    downgraded = "http://example.com/zztest-scheme"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE links SET destination = %s WHERE slug = %s",
                (downgraded, slug),
            )
    net.block_connect = True
    net.connects.clear()
    decision = api.public_worker.decide(slug, _desktop(), None)
    assert net.connects == []
    assert _status(decision) not in _REDIRECTS


def test_at11a_reserved_identity_columns_stay_null(api, net):
    """AT-11a. record_pass takes no identity. Stored member_id and marker_id are NULL."""
    pass_sig = inspect.signature(api.events.record_pass)
    assert list(pass_sig.parameters) == [
        "cur",
        "slug",
        "kind",
        "device_class",
        "os_family",
        "referrer",
        "country",
        "region",
        "bot",
    ]
    for name, param in pass_sig.parameters.items():
        if name == "cur":
            continue
        assert param.kind is inspect.Parameter.KEYWORD_ONLY
    forbidden = {
        "owner",
        "member_id",
        "marker_id",
        "identity",
        "identity_id",
        "cookie",
        "ip",
    }
    assert forbidden.isdisjoint(pass_sig.parameters)
    with pytest.raises(TypeError):
        api.events.record_pass(
            None,
            slug=PROBE_SLUG,
            kind="click",
            device_class="desktop",
            os_family="Windows",
            referrer="direct",
            country="unknown",
            region="unknown",
            bot=False,
            member_id=1,
        )
    log_sig = inspect.signature(api.public_worker.log_after)
    assert list(log_sig.parameters) == ["slug", "ua", "referrer"]
    assert forbidden.isdisjoint(log_sig.parameters)

    net.block_connect = False
    created = _create(api, destination=GOOD, label="zztest-at11a")
    slug = created["slug"]
    with db.transaction() as conn:
        with conn.cursor() as cur:
            api.events.record_pass(
                cur,
                slug=slug,
                kind="click",
                device_class="desktop",
                os_family="Windows",
                referrer="direct",
                country="unknown",
                region="unknown",
                bot=False,
            )
    rows = _events(slug)
    assert rows
    for row in rows:
        assert "member_id" in row
        assert "marker_id" in row
        assert row["member_id"] is None
        assert row["marker_id"] is None


def test_lk_l3_static_link_writes_no_event(api, net):
    net.block_connect = False
    created = _create(api, destination=GOOD, label="zztest-static", static=True)
    slug = created["slug"]
    with db.transaction() as conn:
        with conn.cursor() as cur:
            stored = api.store.get_link(cur, slug)
    static_flag = None
    for key in ("static", "is_static", "static_flag"):
        if key in stored:
            static_flag = stored[key]
            break
    assert static_flag is not None
    assert _as_bool(static_flag) is True
    net.block_connect = True
    decision = api.public_worker.decide(slug, _phone(), None)
    assert _status(decision) == 302
    assert _location(decision) == GOOD
    assert _events(slug) == []
    api.public_worker.log_after(slug, _phone(), None)
    assert _events(slug) == []
    assert _misses(slug) == []


def test_at11a_http_cookie_does_not_fill_identity(api, net):
    absent = _route_absent_reason()
    if absent:
        pytest.skip(absent)
    net.block_connect = False
    created = _create(api, destination=GOOD, label="zztest-at11a-http")
    slug = created["slug"]
    url = f"http://127.0.0.1:3000/q/{slug}"
    try:
        proc = _curl(
            [
                "curl",
                "-sS",
                "-D",
                "-",
                "-o",
                "/dev/null",
                "--max-time",
                "3",
                "-H",
                "Cookie: ft_session=present",
                url,
            ]
        )
    except FileNotFoundError:
        pytest.skip(f"{HTTP_ABSENT}: curl is not available")
    if _curl_unavailable(proc):
        pytest.skip(f"{HTTP_ABSENT}: Next is not accepting on 127.0.0.1:3000")
    status, headers = _parse_status_headers(proc.stdout)
    assert status == 302
    lowered = {key.lower(): value for key, value in headers.items()}
    # AF-L1/AF-L2 legitimately sets a marker cookie (ftl_mkr) when the
    # request carries none; the frozen property is no Labs SESSION cookie.
    assert "ft_session" not in lowered.get("set-cookie", "")
    deadline = time.time() + 1.5
    rows: list[dict] = []
    while time.time() < deadline:
        rows = _events(slug)
        if rows:
            break
        time.sleep(0.05)
    assert rows, "Next route wrote no link_events row"
    for row in rows:
        assert row["member_id"] is None
        assert row["marker_id"] is None
