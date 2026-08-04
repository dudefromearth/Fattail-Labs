"""Local JSON store for Strategy Lab strategies (versionable life-cycle cards).

Foundation model:
  • Strategy = versionable unit (name, version, phase, phase_state)
  • Attributes bag empty until plugins attach data
  • Phase bins hold 0–100 strategies each
  • Bin holds retired / trashed
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from engine.lifecycle_states import (
    DEFAULT_PHASE_STATE,
    PHASES,
    default_state,
    normalize_phase,
    normalize_phase_state,
    next_state,
    ready_for_curation,
    state_label,
)
from engine.spec import StrategySpec

Phase = Literal["development", "curation", "deployment", "bin"]
Mode = Literal["basic", "pro"]

MAX_PER_PHASE = 100

# Life-cycle order for forward promotion (bin is off-ramp only)
_FORWARD: dict[str, str | None] = {
    "development": "curation",
    "curation": "deployment",
    "deployment": None,
    "bin": None,
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _blank_spec_dict() -> dict[str, Any]:
    s = StrategySpec(
        name="Untitled strategy",
        hypothesis="",
        underlying="SPY",
    )
    d = s.to_dict()
    d["name"] = "Untitled strategy"
    d["hypothesis"] = ""
    return d


def normalize_product(row: dict[str, Any]) -> dict[str, Any]:
    """Ensure rows expose phase + phase_state (with legacy migration)."""
    r = dict(row)
    r.setdefault("id", str(uuid.uuid4())[:8])
    r.setdefault("product_key", r["id"])
    r.setdefault("version", "1.0.0")
    r.setdefault("version_major", 1)
    r.setdefault("version_minor", 0)
    r.setdefault("version_patch", 0)

    raw_phase = r.get("phase") or r.get("stage") or "development"
    phase = normalize_phase(str(raw_phase))
    r["phase"] = phase
    r["stage"] = phase  # back-compat

    # Lifecycle disposition for bin; "active" when in a working phase
    if phase == "bin":
        ps = normalize_phase_state(
            phase, r.get("phase_state") or r.get("state"), legacy_row=r
        )
        r["phase_state"] = ps
        r["state"] = ps  # retired | trashed
    else:
        ps = normalize_phase_state(
            phase,
            r.get("phase_state") or r.get("design_state"),
            legacy_row=r,
        )
        r["phase_state"] = ps
        r["state"] = "active"

    r.setdefault("health", "new")
    r.setdefault("attributes", {})
    r.setdefault("name", None)
    if not r.get("name"):
        sp = r.get("spec") if isinstance(r.get("spec"), dict) else {}
        r["name"] = str(sp.get("name") or "Untitled strategy")
    if not r.get("description"):
        sp = r.get("spec") if isinstance(r.get("spec"), dict) else {}
        hyp = str(sp.get("hypothesis") or "").strip()
        r["description"] = hyp[:120] if hyp else ""
    r.setdefault("created_at", _now())
    r.setdefault("updated_at", _now())
    r.setdefault("last_metrics", None)
    r.setdefault("last_verdict", None)
    r.setdefault("bin_reason", r.get("kill_reason"))
    r.setdefault("lifecycle_log", [])
    return r


class LabStore:
    def __init__(self, path: Path | None = None) -> None:
        root = Path(__file__).resolve().parents[1] / "data"
        root.mkdir(parents=True, exist_ok=True)
        self.path = path or (root / "lab_state.json")
        if not self.path.exists():
            self._write(
                {
                    "lab_schema_version": 3,
                    "foundation_version": 1,
                    "mode": "basic",
                    "strategies": [],
                    "campaigns": [],
                    "demo_pack_version": "f1-blank-strategy",
                }
            )

    def _read(self) -> dict[str, Any]:
        return json.loads(self.path.read_text(encoding="utf-8"))

    def _write(self, data: dict[str, Any]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def get_mode(self) -> Mode:
        m = self._read().get("mode") or "basic"
        return "pro" if m == "pro" else "basic"

    def set_mode(self, mode: Mode) -> None:
        data = self._read()
        data["mode"] = mode
        self._write(data)

    def list_strategies(self) -> list[dict[str, Any]]:
        return [normalize_product(s) for s in (self._read().get("strategies") or [])]

    def get(self, sid: str) -> dict[str, Any] | None:
        for s in self.list_strategies():
            if s.get("id") == sid:
                return s
        return None

    def count_in_phase(self, phase: str) -> int:
        phase = normalize_phase(phase)
        return sum(1 for s in self.list_strategies() if s.get("phase") == phase)

    def by_phase(self, phase: str) -> list[dict[str, Any]]:
        phase = normalize_phase(phase)
        return [s for s in self.list_strategies() if s.get("phase") == phase]

    def by_stage(self, stage: str) -> list[dict[str, Any]]:
        return self.by_phase(stage)

    def create(
        self,
        spec: StrategySpec | None = None,
        *,
        stage: str = "development",
        name: str | None = None,
        attributes: dict[str, Any] | None = None,
        blank: bool = False,
        phase_state: str | None = None,
    ) -> dict[str, Any]:
        data = self._read()
        phase = normalize_phase(stage)
        if self.count_in_phase(phase) >= MAX_PER_PHASE:
            raise ValueError(f"Phase {phase!r} is full (max {MAX_PER_PHASE}).")

        if blank or spec is None:
            spec_dict = _blank_spec_dict()
            display_name = name or "Untitled strategy"
            spec_dict["name"] = display_name
            attrs: dict[str, Any] = {}
        else:
            spec_dict = spec.to_dict()
            display_name = name or str(spec_dict.get("name") or "Untitled strategy")
            attrs = dict(attributes or {})

        pid = str(uuid.uuid4())[:8]
        ps = normalize_phase_state(phase, phase_state)
        row = normalize_product(
            {
                "id": pid,
                "product_key": pid,
                "name": display_name,
                "version": "1.0.0",
                "version_major": 1,
                "version_minor": 0,
                "version_patch": 0,
                "phase": phase,
                "stage": phase,
                "phase_state": ps,
                "state": ps if phase == "bin" else "active",
                "health": "new",
                "attributes": attrs,
                "created_at": _now(),
                "updated_at": _now(),
                "spec": spec_dict,
                "last_metrics": None,
                "last_verdict": None,
                "bin_reason": None,
                "lifecycle_log": [
                    {
                        "at": _now(),
                        "event": "created",
                        "phase": phase,
                        "phase_state": ps,
                        "version": "1.0.0",
                    }
                ],
            }
        )
        data.setdefault("strategies", []).append(row)
        data["lab_schema_version"] = max(3, int(data.get("lab_schema_version") or 1))
        self._write(data)
        return row

    def ensure_f1_seed(self) -> dict[str, Any]:
        rows = self.list_strategies()
        if rows:
            return rows[0]
        return self.create(
            blank=True,
            name="Untitled strategy",
            stage="development",
            phase_state="hypothesis",
        )

    def update(self, sid: str, **fields: Any) -> dict[str, Any] | None:
        data = self._read()
        for s in data.get("strategies") or []:
            if s.get("id") == sid:
                s.update(fields)
                s["updated_at"] = _now()
                if "phase" in fields:
                    s["phase"] = normalize_phase(str(fields["phase"]))
                    s["stage"] = s["phase"]
                if "stage" in fields and "phase" not in fields:
                    s["phase"] = normalize_phase(str(fields["stage"]))
                    s["stage"] = s["phase"]
                self._write(data)
                return normalize_product(s)
        return None

    def save_spec(self, sid: str, spec: StrategySpec) -> dict[str, Any] | None:
        return self.update(sid, spec=spec.to_dict(), name=spec.name)

    def _append_log(self, row: dict[str, Any], event: str, **extra: Any) -> None:
        log = list(row.get("lifecycle_log") or [])
        log.append({"at": _now(), "event": event, **extra})
        row["lifecycle_log"] = log[-50:]

    def set_phase_state(self, sid: str, phase_state: str) -> dict[str, Any] | None:
        """Set in-phase state (logged)."""
        data = self._read()
        for s in data.get("strategies") or []:
            if s.get("id") != sid:
                continue
            cur = normalize_product(s)
            phase = cur["phase"]
            new_ps = normalize_phase_state(phase, phase_state, legacy_row=s)
            old_ps = cur["phase_state"]
            if old_ps == new_ps:
                return cur
            s["phase_state"] = new_ps
            if phase == "bin":
                s["state"] = new_ps
            s["updated_at"] = _now()
            self._append_log(
                s,
                "phase_state",
                phase=phase,
                from_state=old_ps,
                to_state=new_ps,
                from_label=state_label(phase, old_ps),
                to_label=state_label(phase, new_ps),
                version=s.get("version"),
            )
            self._write(data)
            return normalize_product(s)
        return None

    def advance_phase_state(self, sid: str) -> dict[str, Any] | None:
        """Advance to next ordered state within the current phase."""
        row = self.get(sid)
        if not row:
            return None
        nxt = next_state(row["phase"], row["phase_state"])
        if nxt is None:
            raise ValueError("Already at the last state in this phase.")
        return self.set_phase_state(sid, nxt)

    def move_phase(
        self,
        sid: str,
        to_phase: str,
        *,
        reason: str | None = None,
        state: str | None = None,
        phase_state: str | None = None,
    ) -> dict[str, Any] | None:
        """Move strategy to another phase (capacity-checked)."""
        to_phase = normalize_phase(to_phase)
        data = self._read()
        target = None
        for s in data.get("strategies") or []:
            if s.get("id") == sid:
                target = s
                break
        if target is None:
            return None
        cur = normalize_product(target)
        entry_state = phase_state or state
        if to_phase == "bin":
            entry_state = entry_state if entry_state in ("retired", "trashed") else "retired"
        else:
            entry_state = entry_state or default_state(to_phase)
        entry_state = normalize_phase_state(to_phase, entry_state)

        if cur["phase"] == to_phase and cur.get("phase_state") == entry_state:
            return cur

        n = sum(
            1
            for s in data.get("strategies") or []
            if normalize_product(s).get("phase") == to_phase and s.get("id") != sid
        )
        if n >= MAX_PER_PHASE:
            raise ValueError(f"Phase {to_phase!r} is full (max {MAX_PER_PHASE}).")

        # Soft rule: leave development for curation only when Deployed
        if (
            cur["phase"] == "development"
            and to_phase == "curation"
            and not ready_for_curation(cur["phase_state"])
        ):
            # Allow with reason, but log — coach may force; UI can warn
            pass

        from_phase = cur["phase"]
        from_ps = cur["phase_state"]
        target["phase"] = to_phase
        target["stage"] = to_phase
        target["phase_state"] = entry_state
        if to_phase == "bin":
            target["state"] = entry_state
            target["bin_reason"] = reason
            target["kill_reason"] = reason
        else:
            target["state"] = "active"
            target["bin_reason"] = None
        target["updated_at"] = _now()
        self._append_log(
            target,
            "phase_move",
            from_phase=from_phase,
            to_phase=to_phase,
            from_state=from_ps,
            to_state=entry_state,
            state=target.get("state"),
            reason=reason,
            version=target.get("version"),
        )
        self._write(data)
        return normalize_product(target)

    def promote(self, sid: str) -> dict[str, Any] | None:
        """Forward one phase step: development→curation→deployment."""
        row = self.get(sid)
        if not row:
            return None
        nxt = _FORWARD.get(row["phase"])
        if nxt is None:
            raise ValueError("Cannot promote further from this phase.")
        if row["phase"] == "development" and not ready_for_curation(row["phase_state"]):
            raise ValueError(
                "Development must reach Deployed before curation "
                f"(current: {state_label(row['phase'], row['phase_state'])})."
            )
        return self.move_phase(sid, nxt)

    def send_to_bin(
        self, sid: str, *, disposition: Literal["retired", "trashed"], reason: str
    ) -> dict[str, Any] | None:
        if not (reason or "").strip():
            raise ValueError("Bin requires a reason.")
        return self.move_phase(
            sid, "bin", reason=reason.strip(), phase_state=disposition
        )

    def restore_from_bin(
        self, sid: str, *, to_phase: str = "development"
    ) -> dict[str, Any] | None:
        to_phase = normalize_phase(to_phase)
        if to_phase == "bin":
            raise ValueError("Restore target cannot be bin.")
        return self.move_phase(sid, to_phase)

    def rename(
        self,
        sid: str,
        new_name: str,
        *,
        bump_version: bool = False,
        bump_part: Literal["major", "minor", "patch"] = "minor",
    ) -> dict[str, Any] | None:
        name = (new_name or "").strip()
        if not name:
            raise ValueError("Strategy name cannot be empty.")
        data = self._read()
        for s in data.get("strategies") or []:
            if s.get("id") != sid:
                continue
            old_name = str(s.get("name") or "")
            if old_name == name and not bump_version:
                return normalize_product(s)
            s["name"] = name
            if isinstance(s.get("spec"), dict):
                s["spec"] = dict(s["spec"])
                s["spec"]["name"] = name
            s["updated_at"] = _now()
            self._append_log(
                s,
                "rename",
                from_name=old_name,
                to_name=name,
                version=s.get("version"),
            )
            self._write(data)
            out = normalize_product(s)
            if bump_version:
                bumped = self.bump_version(
                    sid, part=bump_part, reason=f"rename: {old_name!r} → {name!r}"
                )
                return bumped or out
            return out
        return None

    def bump_version(
        self,
        sid: str,
        *,
        part: Literal["major", "minor", "patch"] = "minor",
        reason: str | None = None,
    ) -> dict[str, Any] | None:
        data = self._read()
        for s in data.get("strategies") or []:
            if s.get("id") != sid:
                continue
            old = str(s.get("version") or "1.0.0")
            maj = int(s.get("version_major") or 1)
            minor = int(s.get("version_minor") or 0)
            patch = int(s.get("version_patch") or 0)
            if part == "major":
                maj, minor, patch = maj + 1, 0, 0
            elif part == "minor":
                minor, patch = minor + 1, 0
            else:
                patch += 1
            ver = f"{maj}.{minor}.{patch}"
            s["version_major"] = maj
            s["version_minor"] = minor
            s["version_patch"] = patch
            s["version"] = ver
            s["updated_at"] = _now()
            self._append_log(
                s,
                "version_bump",
                version=ver,
                from_version=old,
                part=part,
                reason=reason,
            )
            self._write(data)
            return normalize_product(s)
        return None
