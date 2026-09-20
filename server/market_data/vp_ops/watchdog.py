"""Overnight watchdog: bins must advance while Globex is in session.

Halt/closed = idle is lawful. No alert. H0-6 pulled forward for this path only.
"""

from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

from market_data.vp_engine.rebuild import histogram_path
from market_data.vp_ingest.store import archive_root

STALE_S = int(os.environ.get("LABS_VP_WATCHDOG_STALE_S") or "90")
INTERVAL_S = int(os.environ.get("LABS_VP_WATCHDOG_INTERVAL_S") or "30")
PRODUCTS = ("ES", "MES")


def clock_path(root: Path) -> Path:
    return root / "vp" / "engine" / "session_clock.json"


def alert_path() -> Path:
    return Path.home() / "Library" / "Logs" / "fattail-labs" / "vp-watchdog.alert"


def load_clock(root: Path) -> dict | None:
    path = clock_path(root)
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def developing_age_s(root: Path, source: str) -> float | None:
    hist = histogram_path(root, source, __import__("datetime").date.today(), "developing")
    if not hist.is_file():
        return None
    return max(0.0, time.time() - hist.stat().st_mtime)


def fire_alert(msg: str) -> None:
    line = f"{datetime.now(timezone.utc).isoformat()} {msg}"
    print(f"vp-watchdog ALERT {line}", flush=True)
    path = alert_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")
    # Foxtrot route: SMTP if configured; never raise into the loop.
    host = (os.environ.get("LABS_SMTP_HOST") or "").strip()
    to_addr = (os.environ.get("LABS_VP_WATCHDOG_TO") or os.environ.get("LABS_SMTP_FROM") or "").strip()
    if host and to_addr:
        try:
            import smtplib
            from email.message import EmailMessage

            msg_e = EmailMessage()
            msg_e["Subject"] = "VP watchdog: bins stalled in-session"
            msg_e["From"] = os.environ.get("LABS_SMTP_FROM") or to_addr
            msg_e["To"] = to_addr
            msg_e.set_content(line)
            port = int(os.environ.get("LABS_SMTP_PORT") or "465")
            with smtplib.SMTP_SSL(host, port, timeout=15) as s:
                user = os.environ.get("LABS_SMTP_USER") or ""
                pw = os.environ.get("LABS_SMTP_PASSWORD") or ""
                if user:
                    s.login(user, pw)
                s.send_message(msg_e)
        except Exception as exc:
            print(f"vp-watchdog smtp failed {exc}", flush=True)


def check_once(root: Path | None = None) -> list[str]:
    ar = root or archive_root()
    clock = load_clock(ar)
    alerts: list[str] = []
    if not clock:
        print("vp-watchdog: no session_clock yet (collector not writing)", flush=True)
        return alerts
    for p in PRODUCTS:
        st = (clock.get("products") or {}).get(p) or {}
        reason = st.get("reason") or "unknown"
        if reason in ("closed", "halt"):
            print(f"vp-watchdog {p} idle lawful reason={reason}", flush=True)
            continue
        if reason != "in_session":
            print(f"vp-watchdog {p} skip reason={reason}", flush=True)
            continue
        age = developing_age_s(ar, p)
        if age is None:
            alerts.append(f"{p} in_session but no developing histogram")
            continue
        if age > STALE_S:
            alerts.append(f"{p} in_session developing stale {age:.0f}s > {STALE_S}s")
        else:
            print(f"vp-watchdog {p} healthy age={age:.0f}s", flush=True)
    for a in alerts:
        fire_alert(a)
    return alerts


def main() -> int:
    print(f"vp-watchdog interval={INTERVAL_S}s stale={STALE_S}s", flush=True)
    while True:
        try:
            check_once()
        except Exception as exc:
            print(f"vp-watchdog error {exc}", flush=True)
        time.sleep(max(10, INTERVAL_S))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
