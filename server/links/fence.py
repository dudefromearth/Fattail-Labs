"""Destination fence (RD-L6).

assert_destination_storable does no name resolution and no connect.
reachability runs only after that fence passes.
"""

from __future__ import annotations

import ipaddress
import socket
import ssl
import time
from urllib.parse import urlsplit

class FenceError(Exception):
    """The destination is not storable, or an answer is not public unicast."""


_LABS_HOSTS = frozenset({"labs.fattail.ai", "localhost", "studiotwo", "studiotwo.local"})

_CGNAT = ipaddress.ip_network("100.64.0.0/10")
_RFC1918 = (
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
)
_ULA = ipaddress.ip_network("fc00::/7")
_LINK_LOCAL_V4 = ipaddress.ip_network("169.254.0.0/16")
_LINK_LOCAL_V6 = ipaddress.ip_network("fe80::/10")
_LOOPBACK_V4 = ipaddress.ip_network("127.0.0.0/8")
_MULTICAST_V4 = ipaddress.ip_network("224.0.0.0/4")
_MULTICAST_V6 = ipaddress.ip_network("ff00::/8")

_PROBE_TIMEOUT_S = 5.0


def assert_destination_storable(url: str) -> None:
    """Refuse a destination that must not be stored. No network."""
    if not isinstance(url, str) or not url or url != url.strip():
        raise FenceError("https only")
    if any(ch.isspace() or ord(ch) < 32 for ch in url):
        raise FenceError("https only")
    parts = urlsplit(url)
    if parts.scheme.lower() != "https":
        raise FenceError("https only")
    if parts.fragment:
        raise FenceError("fragment")
    if parts.username is not None or parts.password is not None or "@" in parts.netloc:
        raise FenceError("credentials")
    host = parts.hostname
    if not host:
        raise FenceError("https only")
    bare = host.lower().rstrip(".")
    if bare in _LABS_HOSTS or bare == "labs.fattail.ai" or bare.endswith(".labs.fattail.ai"):
        raise FenceError("labs host")
    if _is_bare_ip(bare):
        raise FenceError("bare IP")


def assert_public_answers(addresses) -> None:
    """Refuse when any answer is not public unicast. No network."""
    if not addresses:
        raise FenceError("non-public answer")
    for item in addresses:
        if _answer_refused(item):
            raise FenceError("non-public answer")


def reachability(url: str) -> str | None:
    """Probe a destination that already passed the store fence.

    Re-resolves immediately before connect. A non-public second answer is
    refused and not connected. Follows no redirect, sends no body, 5 s cap.
    Returns a warning, or None when the host answered.
    """
    assert_destination_storable(url)
    parts = urlsplit(url.strip())
    host = parts.hostname
    if host is None:
        raise FenceError("https only")
    port = parts.port or 443
    path = parts.path or "/"
    if parts.query:
        path = f"{path}?{parts.query}"
    try:
        first = _resolve(host, port)
    except OSError:
        return "resolve failed"
    try:
        assert_public_answers(first)
    except FenceError:
        return "non-public answer"
    try:
        second = _resolve(host, port)
    except OSError:
        return "resolve failed"
    try:
        assert_public_answers(second)
    except FenceError:
        return "non-public answer"
    if not second:
        return "non-public answer"
    try:
        _probe(host, second[0], port, path)
    except Exception:
        return "unreachable"
    return None


def _is_bare_ip(host: str) -> bool:
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        pass
    labels = host.split(".")
    return bool(labels) and all(_numeric_label(label) for label in labels)


def _numeric_label(label: str) -> bool:
    if not label:
        return False
    if label.isdigit():
        return True
    lowered = label.lower()
    return lowered.startswith("0x") and all(ch in "0123456789abcdef" for ch in lowered[2:]) and len(lowered) > 2


def _answer_refused(item) -> bool:
    if isinstance(item, str):
        text = item.strip().lower().rstrip(".")
        if text.startswith("[") and text.endswith("]"):
            text = text[1:-1]
        if text in _LABS_HOSTS or text.endswith(".labs.fattail.ai"):
            return True
    ip = _parse_ip(item)
    if ip is None:
        return True
    return _non_public(ip)


def _parse_ip(item) -> ipaddress.IPv4Address | ipaddress.IPv6Address | None:
    if isinstance(item, (ipaddress.IPv4Address, ipaddress.IPv6Address)):
        return item
    if not isinstance(item, str):
        return None
    text = item.strip()
    if text.startswith("[") and text.endswith("]"):
        text = text[1:-1]
    if "%" in text:
        text = text.split("%", 1)[0]
    try:
        return ipaddress.ip_address(text)
    except ValueError:
        return None


def _non_public(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped is not None:
        return _non_public(ip.ipv4_mapped)
    if (
        ip.is_multicast
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_unspecified
        or ip.is_reserved
        or ip.is_private
        or not ip.is_global
    ):
        return True
    if isinstance(ip, ipaddress.IPv4Address):
        if ip in _CGNAT or ip in _LOOPBACK_V4 or ip in _LINK_LOCAL_V4 or ip in _MULTICAST_V4:
            return True
        if any(ip in net for net in _RFC1918):
            return True
        return False
    if ip in _ULA or ip in _LINK_LOCAL_V6 or ip in _MULTICAST_V6:
        return True
    return False


def _resolve(host: str, port: int) -> list[str]:
    infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    found: list[str] = []
    for *_, sockaddr in infos:
        addr = sockaddr[0]
        if addr not in found:
            found.append(addr)
    return found


def _probe(host: str, ip: str, port: int, path: str) -> None:
    """One TCP connect to the second answer, then one request with an empty body."""
    deadline = time.monotonic() + _PROBE_TIMEOUT_S
    parsed = ipaddress.ip_address(ip.split("%", 1)[0])
    family = socket.AF_INET6 if isinstance(parsed, ipaddress.IPv6Address) else socket.AF_INET
    sock = socket.socket(family, socket.SOCK_STREAM)
    sock.settimeout(_remaining(deadline))
    try:
        sock.connect((ip, port))
        context = ssl.create_default_context()
        wrapped = context.wrap_socket(sock, server_hostname=host.rstrip("."))
        try:
            wrapped.settimeout(_remaining(deadline))
            host_header = host.rstrip(".")
            if port != 443:
                host_header = f"{host_header}:{port}"
            request = (
                f"GET {path} HTTP/1.1\r\n"
                f"Host: {host_header}\r\n"
                "User-Agent: FatTailLinksReachability\r\n"
                "Accept: */*\r\n"
                "Connection: close\r\n"
                "\r\n"
            )
            wrapped.sendall(request.encode("ascii"))
            first = wrapped.recv(8)
            if not first.startswith(b"HTTP/"):
                raise OSError("no http status")
        finally:
            wrapped.close()
    finally:
        try:
            sock.close()
        except OSError:
            pass


def _remaining(deadline: float) -> float:
    left = deadline - time.monotonic()
    if left <= 0:
        raise TimeoutError("timeout")
    return left
