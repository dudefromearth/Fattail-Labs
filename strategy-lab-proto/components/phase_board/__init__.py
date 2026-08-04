"""Phase bin board — HTML5 drag-and-drop + click-to-select (Streamlit CCv2).

Returns trigger events:
  • select { product_id }
  • move   { product_id, to_phase, from_phase }
"""

from __future__ import annotations

from typing import Any, Callable

import streamlit as st

_PHASES = ("design", "curation", "deployment", "bin")
_LABELS = {
    "design": "Design",
    "curation": "Curation",
    "deployment": "Deployment",
    "bin": "Bin",
}
_HINTS = {
    "design": "Candidates",
    "curation": "Paper self-run",
    "deployment": "Broker",
    "bin": "Retired / trashed",
}

_JS = r"""
export default function (component) {
  const { data, parentElement, setTriggerValue } = component;
  const root = parentElement;

  const phases = data?.phases || ["design", "curation", "deployment", "bin"];
  const labels = data?.labels || {};
  const hints = data?.hints || {};
  const products = Array.isArray(data?.products) ? data.products : [];
  const selectedId = data?.selected_id || null;
  const maxPer = Number(data?.max_per_phase || 100);
  const search = (data?.search || "").toLowerCase().trim();
  const filterState = data?.filter_state || "all";

  root.innerHTML = "";
  root.style.cssText = "font-family: system-ui, -apple-system, sans-serif; width:100%;";

  const style = document.createElement("style");
  style.textContent = `
    .pb-wrap { display:flex; gap:10px; width:100%; align-items:stretch; }
    .pb-col {
      flex:1 1 0; min-width:0; display:flex; flex-direction:column;
      background:#fff; border:1px solid rgba(60,60,67,0.14); border-radius:14px;
      box-shadow:0 2px 8px rgba(0,0,0,0.05); min-height:280px; max-height:360px;
    }
    .pb-col.pb-active-phase { outline:2px solid #0071e3; outline-offset:1px; }
    .pb-head { padding:10px 12px 6px; border-bottom:1px solid rgba(60,60,67,0.1); }
    .pb-title { font-weight:650; font-size:0.95rem; margin:0; color:#1d1d1f; letter-spacing:-0.02em; }
    .pb-sub { font-size:0.72rem; color:#6e6e73; margin:2px 0 0; }
    .pb-count {
      float:right; font-size:0.72rem; font-weight:650; color:#6e6e73;
      background:rgba(120,120,128,0.12); padding:2px 8px; border-radius:999px;
    }
    .pb-list {
      flex:1; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:6px;
    }
    .pb-list.pb-drag-over { background:#e8f1fc; }
    .pb-card {
      border:1px solid rgba(60,60,67,0.14); border-radius:10px; padding:8px 10px;
      background:#f5f5f7; cursor:grab; user-select:none;
    }
    .pb-card:active { cursor:grabbing; }
    .pb-card.pb-selected {
      border-color:#0071e3; background:#e8f1fc;
      box-shadow:0 0 0 2px rgba(0,113,227,0.2);
    }
    .pb-name { font-weight:600; font-size:0.85rem; color:#1d1d1f; margin:0; }
    .pb-meta { font-size:0.7rem; color:#6e6e73; margin:3px 0 0; }
    .pb-empty {
      font-size:0.8rem; color:#6e6e73; text-align:center; padding:1.5rem 0.5rem;
      border:1px dashed rgba(60,60,67,0.2); border-radius:10px; margin:4px;
    }
    .pb-badge {
      display:inline-block; font-size:0.65rem; font-weight:650; padding:1px 6px;
      border-radius:999px; background:rgba(120,120,128,0.16); color:#3a3a3c; margin-left:4px;
    }
    .pb-badge.retired { background:#fff3cd; color:#856404; }
    .pb-badge.trashed { background:#f8d7da; color:#721c24; }
  `;
  root.appendChild(style);

  const wrap = document.createElement("div");
  wrap.className = "pb-wrap";
  root.appendChild(wrap);

  function matches(p) {
    if (filterState && filterState !== "all") {
      if ((p.state || "active") !== filterState) return false;
    }
    if (!search) return true;
    const hay = `${p.name || ""} ${p.id || ""} ${p.version || ""} ${p.state || ""}`.toLowerCase();
    return hay.includes(search);
  }

  function byPhase(phase) {
    return products.filter((p) => (p.phase || p.stage) === phase && matches(p));
  }

  let dragId = null;
  let dragFrom = null;

  phases.forEach((phase) => {
    const col = document.createElement("div");
    col.className = "pb-col";
    col.dataset.phase = phase;
    if (data?.active_phase === phase) col.classList.add("pb-active-phase");

    const head = document.createElement("div");
    head.className = "pb-head";
    const items = byPhase(phase);
    head.innerHTML =
      `<span class="pb-count">${items.length}/${maxPer}</span>` +
      `<p class="pb-title">${labels[phase] || phase}</p>` +
      `<p class="pb-sub">${hints[phase] || ""}</p>`;
    col.appendChild(head);

    const list = document.createElement("div");
    list.className = "pb-list";
    list.dataset.phase = phase;

    list.addEventListener("dragover", (e) => {
      e.preventDefault();
      list.classList.add("pb-drag-over");
      e.dataTransfer.dropEffect = "move";
    });
    list.addEventListener("dragleave", () => list.classList.remove("pb-drag-over"));
    list.addEventListener("drop", (e) => {
      e.preventDefault();
      list.classList.remove("pb-drag-over");
      const pid = e.dataTransfer.getData("text/product-id") || dragId;
      const from = e.dataTransfer.getData("text/from-phase") || dragFrom;
      const to = phase;
      if (!pid || !to) return;
      if (from === to) return;
      setTriggerValue("board_event", {
        type: "move",
        product_id: pid,
        from_phase: from,
        to_phase: to,
        ts: Date.now(),
      });
    });

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "pb-empty";
      empty.textContent = "Drop a product here";
      list.appendChild(empty);
    } else {
      items.forEach((p) => {
        const card = document.createElement("div");
        card.className = "pb-card" + (p.id === selectedId ? " pb-selected" : "");
        card.draggable = true;
        card.dataset.id = p.id;
        const state = p.state || "active";
        let badge = "";
        if (state === "retired" || state === "trashed") {
          badge = `<span class="pb-badge ${state}">${state}</span>`;
        }
        card.innerHTML =
          `<p class="pb-name">${escapeHtml(p.name || "Untitled")}${badge}</p>` +
          `<p class="pb-meta">v${escapeHtml(p.version || "1.0.0")} · ${escapeHtml(p.id || "")}</p>`;

        card.addEventListener("dragstart", (e) => {
          dragId = p.id;
          dragFrom = phase;
          e.dataTransfer.setData("text/product-id", p.id);
          e.dataTransfer.setData("text/from-phase", phase);
          e.dataTransfer.effectAllowed = "move";
          card.style.opacity = "0.55";
        });
        card.addEventListener("dragend", () => {
          card.style.opacity = "1";
          dragId = null;
          dragFrom = null;
        });
        card.addEventListener("click", (e) => {
          e.stopPropagation();
          setTriggerValue("board_event", {
            type: "select",
            product_id: p.id,
            ts: Date.now(),
          });
        });
        list.appendChild(card);
      });
    }

    col.appendChild(list);
    wrap.appendChild(col);
  });

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
"""

_PHASE_BOARD = st.components.v2.component(
    "sl_phase_board",
    html="<div id='sl-phase-board-root'></div>",
    js=_JS,
)


def render_phase_board(
    products: list[dict[str, Any]],
    *,
    selected_id: str | None,
    active_phase: str | None = None,
    search: str = "",
    filter_state: str = "all",
    max_per_phase: int = 100,
    key: str = "phase_board",
    on_event: Callable[[], None] | None = None,
) -> Any:
    """Mount the DnD phase board. Read result.board_event after interaction."""
    payload = []
    for p in products:
        payload.append(
            {
                "id": p.get("id"),
                "name": p.get("name") or "Untitled product",
                "version": p.get("version") or "1.0.0",
                "phase": p.get("phase") or p.get("stage") or "design",
                "state": p.get("state") or "active",
            }
        )

    def _noop() -> None:
        return None

    return _PHASE_BOARD(
        data={
            "phases": list(_PHASES),
            "labels": _LABELS,
            "hints": _HINTS,
            "products": payload,
            "selected_id": selected_id,
            "active_phase": active_phase,
            "search": search,
            "filter_state": filter_state,
            "max_per_phase": max_per_phase,
        },
        key=key,
        height=380,
        on_board_event_change=on_event or _noop,
    )
