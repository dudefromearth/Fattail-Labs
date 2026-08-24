"""GET-only HTTP helper for wiki-agent pollers (WA11 / Rider 3)."""

from __future__ import annotations


class WikiAgentHttpError(RuntimeError):
    pass


class GetOnlyClient:
    """Records every call. Refuses any method other than GET."""

    def __init__(self, get_json):
        self._get_json = get_json
        self.calls: list[tuple[str, str]] = []

    def get(self, url: str) -> dict | list:
        if not isinstance(url, str) or not url.strip():
            raise WikiAgentHttpError("GET url required")
        self.calls.append(("GET", url))
        return self._get_json(url)

    def request(self, method: str, url: str) -> dict | list:
        if str(method or "").upper() != "GET":
            raise WikiAgentHttpError("poller may only GET")
        return self.get(url)
