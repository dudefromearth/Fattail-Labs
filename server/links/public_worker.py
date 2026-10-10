"""Loopback redirect worker on 127.0.0.1:4017.

decide and log_after read slug, ua, and referrer. They take no session.
The /log body may include a peer address. It is used for one GeoLite2
lookup and then dropped. It is not stored and not logged.
A logging failure does not raise.
"""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

import db
from links.events import classify, record_miss, record_pass
from links.geo import locate
from links.store import get_link

_BIND = ("127.0.0.1", 4017)
_INACTIVE = "The link is no longer active."


def decide(slug, ua, referrer) -> dict:
    """Read the link and choose the response. No write."""
    conn = db.connect()
    try:
        with conn.cursor() as cur:
            link = get_link(cur, slug if isinstance(slug, str) else "")
        conn.rollback()
    finally:
        db.get_pool().put(conn)
    return _decision(link)


def log_after(slug, ua, referrer) -> None:
    """Record a pass or a miss. Swallows every failure. No peer address."""
    try:
        _log_after(slug, ua, referrer)
    except Exception:
        return


def _decision(link: dict | None) -> dict:
    if link is None:
        return {"status": 404, "location": None, "body": "Not found"}
    if not link["active"]:
        return {"status": 200, "location": None, "body": _INACTIVE}
    destination = link["destination"]
    if not _scheme_is_https(destination):
        return {"status": 404, "location": None, "body": "Not found"}
    return {"status": 302, "location": destination, "body": ""}


def _scheme_is_https(url: str) -> bool:
    if not isinstance(url, str):
        return False
    parts = urlsplit(url.strip())
    return parts.scheme.lower() == "https" and bool(parts.hostname)


def _log_after(slug, ua, referrer, peer: str = "") -> None:
    attempted = slug if isinstance(slug, str) else ""
    if not isinstance(peer, str):
        peer = ""
    conn = db.connect()
    try:
        with conn.cursor() as cur:
            link = get_link(cur, attempted)
            if link is None or not link["active"]:
                peer = ""
                record_miss(cur, attempted=attempted)
            elif link["static"] or not _scheme_is_https(link["destination"]):
                peer = ""
            else:
                info = classify(ua, referrer)
                country = info["country"]
                region = info["region"]
                if peer:
                    place = locate(peer)
                    country = place["country"]
                    region = place["region"]
                peer = ""
                record_pass(
                    cur,
                    slug=link["slug"],
                    kind=info["kind"],
                    device_class=info["device_class"],
                    os_family=info["os_family"],
                    referrer=info["referrer"],
                    country=country,
                    region=region,
                    bot=info["bot"],
                )
        conn.commit()
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    finally:
        db.get_pool().put(conn)


class _Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, format, *args):
        return

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        if path not in ("/decide", "/log"):
            self._send(404, {"error": "not found"})
            return
        try:
            payload = self._read_json()
            peer = _take_peer(payload)
            slug, ua, referrer = _only_fields(payload)
        except (ValueError, json.JSONDecodeError):
            self._send(400, {"error": "bad request"})
            return
        if path == "/decide":
            peer = ""
            self.close_connection = True
            self._send(200, decide(slug, ua, referrer))
            return
        try:
            _log_after(slug, ua, referrer, peer)
        except Exception:
            pass
        peer = ""
        self.close_connection = True
        self._send(200, {"ok": True})

    def _read_json(self) -> dict:
        raw_length = self.headers.get("Content-Length", "0")
        try:
            length = int(raw_length)
        except ValueError as exc:
            raise ValueError("length") from exc
        if length < 0 or length > 65536:
            raise ValueError("length")
        raw = self.rfile.read(length) if length else b""
        data = json.loads(raw.decode("utf-8"))
        if not isinstance(data, dict):
            raise ValueError("object")
        return data

    def _send(self, status: int, obj: dict) -> None:
        body = json.dumps(obj).encode("utf-8")
        self.send_response_only(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Connection", "close")
        self.end_headers()
        if body:
            self.wfile.write(body)


class _Server(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True

    def handle_error(self, *args):
        return


def _take_peer(payload: dict) -> str:
    """Remove the peer address from the body. Empty when it was not sent."""
    if "peer" not in payload:
        return ""
    raw = payload.pop("peer")
    if raw is None:
        return ""
    if not isinstance(raw, str):
        raise ValueError("peer")
    return raw.strip()


def _only_fields(payload: dict) -> tuple[str, str, str]:
    slug = payload.get("slug")
    ua = payload.get("ua")
    referrer = payload.get("referrer")
    if not isinstance(slug, str):
        raise ValueError("slug")
    if ua is None:
        ua = ""
    if referrer is None:
        referrer = ""
    if not isinstance(ua, str) or not isinstance(referrer, str):
        raise ValueError("fields")
    return slug, ua, referrer


def main() -> None:
    server = _Server(_BIND, _Handler)
    server.serve_forever()


if __name__ == "__main__":
    main()
