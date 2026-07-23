"""MySQL access — pooled PyMySQL connections (Phase E).

Same public API: connect() / transaction(). Pool size via LABS_DB_POOL_SIZE
(default 10). Fail-loud on invalid pool size.
"""

from __future__ import annotations

import logging
import os
import queue
import threading
from contextlib import contextmanager

import pymysql

from config import ConfigError, get_config

log = logging.getLogger("labs.db")

_pool: "ConnectionPool | None" = None
_pool_lock = threading.Lock()


def _pool_size() -> int:
    raw = os.environ.get("LABS_DB_POOL_SIZE", "10").strip() or "10"
    try:
        n = int(raw)
    except ValueError as exc:
        raise ConfigError(f"LABS_DB_POOL_SIZE must be an integer, got {raw!r}") from exc
    if n < 1 or n > 100:
        raise ConfigError("LABS_DB_POOL_SIZE must be between 1 and 100")
    return n


def _new_connection() -> pymysql.connections.Connection:
    cfg = get_config()
    return pymysql.connect(
        host=cfg.db_host,
        port=cfg.db_port,
        user=cfg.db_user,
        password=cfg.db_password,
        database=cfg.db_name,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
        connect_timeout=10,
        read_timeout=60,
        write_timeout=60,
    )


class ConnectionPool:
    """Simple fixed-size pool. Thread-safe get/put with ping-on-checkout."""

    def __init__(self, size: int) -> None:
        self.size = size
        self._q: queue.Queue[pymysql.connections.Connection] = queue.Queue(maxsize=size)
        self._created = 0
        self._lock = threading.Lock()

    def get(self, timeout: float = 30.0) -> pymysql.connections.Connection:
        deadline_misses = 0
        while True:
            try:
                conn = self._q.get_nowait()
            except queue.Empty:
                with self._lock:
                    if self._created < self.size:
                        self._created += 1
                        try:
                            return _new_connection()
                        except Exception:
                            self._created -= 1
                            raise
                try:
                    conn = self._q.get(timeout=timeout)
                except queue.Empty as exc:
                    raise TimeoutError(
                        f"DB pool exhausted (size={self.size}); no connection within {timeout}s"
                    ) from exc

            if self._healthy(conn):
                return conn
            # Drop dead connection and try again
            try:
                conn.close()
            except Exception:
                pass
            with self._lock:
                self._created = max(0, self._created - 1)
            deadline_misses += 1
            if deadline_misses > self.size + 2:
                # Create a fresh one if we keep getting dead conns
                with self._lock:
                    if self._created < self.size:
                        self._created += 1
                        return _new_connection()
                raise TimeoutError("DB pool: unable to obtain a healthy connection")

    def put(self, conn: pymysql.connections.Connection) -> None:
        if conn is None:
            return
        try:
            open_ = bool(getattr(conn, "open", True))
        except Exception:
            open_ = False
        if not open_:
            with self._lock:
                self._created = max(0, self._created - 1)
            return
        try:
            # Return to a clean state for the next borrower
            conn.rollback()
        except Exception:
            try:
                conn.close()
            except Exception:
                pass
            with self._lock:
                self._created = max(0, self._created - 1)
            return
        try:
            self._q.put_nowait(conn)
        except queue.Full:
            try:
                conn.close()
            except Exception:
                pass
            with self._lock:
                self._created = max(0, self._created - 1)

    @staticmethod
    def _healthy(conn: pymysql.connections.Connection) -> bool:
        try:
            conn.ping()
            return True
        except Exception:
            return False

    def stats(self) -> dict:
        with self._lock:
            return {
                "size": self.size,
                "created": self._created,
                "idle": self._q.qsize(),
            }


def get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        with _pool_lock:
            if _pool is None:
                _pool = ConnectionPool(_pool_size())
                log.info("DB pool initialized size=%s", _pool.size)
    return _pool


def reset_pool() -> None:
    """Test helper — drain and drop the process-wide pool."""
    global _pool
    with _pool_lock:
        if _pool is not None:
            while True:
                try:
                    c = _pool._q.get_nowait()
                    try:
                        c.close()
                    except Exception:
                        pass
                except queue.Empty:
                    break
        _pool = None


def connect() -> pymysql.connections.Connection:
    """Checkout a connection from the pool (caller must return via transaction or put)."""
    return get_pool().get()


@contextmanager
def transaction():
    """Borrow a pooled connection, commit/rollback, return to pool."""
    pool = get_pool()
    conn = pool.get()
    try:
        yield conn
        conn.commit()
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    finally:
        pool.put(conn)
