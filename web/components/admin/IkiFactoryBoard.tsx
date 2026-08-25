"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import IkiFactoryItemPanel, { type Card } from "./IkiFactoryItemPanel";

type Lane = "ideas" | "research" | "spec" | "build" | "live";

const LANES: { id: Lane; label: string }[] = [
  { id: "ideas", label: "Backlog" }, // display label only — key stays "ideas" until IF-7 (spec v1.0 §2.1)
  { id: "research", label: "Research" },
  { id: "spec", label: "Spec" },
  { id: "build", label: "Build" },
  { id: "live", label: "Live" },
];

const ORIGINATOR_BADGE: Record<Card["originator_kind"], string> = {
  coach: "Coach",
  system: "System",
  agent: "Agent",
  outside: "Outside",
};

function detailReason(body: unknown): string {
  if (!body || typeof body !== "object") return "Move rejected.";
  const d = (body as { detail?: unknown }).detail;
  if (d && typeof d === "object" && d !== null && "reason" in d) {
    return String((d as { reason: string }).reason);
  }
  if (typeof d === "string") return d;
  return "Move rejected.";
}

export default function IkiFactoryBoard() {
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fromOutside, setFromOutside] = useState(false);
  const [originatorLabel, setOriginatorLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/iki-factory/cards", {
      credentials: "same-origin",
    });
    if (!r.ok) {
      setError(r.status === 403 ? "Administrator role required." : "Could not load Factory.");
      return;
    }
    const data = (await r.json()) as { cards: Card[] };
    setCards(data.cards);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byLane = useMemo(() => {
    const m: Record<Lane, Card[]> = {
      ideas: [],
      research: [],
      spec: [],
      build: [],
      live: [],
    };
    for (const c of cards) {
      if (m[c.lane]) m[c.lane].push(c);
    }
    return m;
  }, [cards]);

  const openCard = openId != null ? cards.find((c) => c.id === openId) ?? null : null;

  async function createIdea(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    if (fromOutside && !originatorLabel.trim()) {
      setError("Say where this came from — that's the legal record, not bookkeeping.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/iki-factory/cards", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          originator_kind: fromOutside ? "outside" : "coach",
          originator_label: fromOutside ? originatorLabel.trim() : null,
        }),
      });
      if (!r.ok) {
        setError("Could not add to the backlog.");
        return;
      }
      setTitle("");
      setDescription("");
      setFromOutside(false);
      setOriginatorLabel("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function move(id: number, toLane: Lane) {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/iki-factory/cards/${id}/move`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_lane: toLane }),
      });
      const body = await r.json().catch(() => null);
      if (!r.ok) {
        setError(detailReason(body));
        await load();
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: number, body: Record<string, unknown>) {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/iki-factory/cards/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        setError("Could not update card.");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function rework(id: number, destLane: Lane) {
    setBusy(true);
    try {
      await fetch(`/api/admin/iki-factory/cards/${id}/status`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_status: "rework", rework_lane: destLane }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="min-h-0 flex-1 space-y-6 overflow-auto bg-transparent p-6"
      data-testid="iki-factory-board"
    >
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-label)]">IKI Factory</h1>
        <p
          className="mt-1 max-w-2xl text-sm text-[var(--color-label-secondary)]"
          data-testid="iki-factory-subhead"
        >
          Admin floor only. Nothing advances itself — work moves when someone takes it.
        </p>
      </header>

      <form
        onSubmit={createIdea}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 shadow-[var(--elevation-1)]"
        data-testid="iki-factory-deposit"
      >
        <label className="flex min-w-[16rem] flex-1 flex-col gap-1 text-sm">
          <span className="text-[var(--color-label-secondary)]">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-h-[var(--hit-min)] rounded-md border border-zinc-300 bg-white px-3 text-[var(--color-label)] dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="What should the next piece of work be?"
            data-testid="iki-factory-title"
          />
        </label>
        <label className="flex min-w-[16rem] flex-1 flex-col gap-1 text-sm">
          <span className="text-[var(--color-label-secondary)]">Description (optional)</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[var(--hit-min)] rounded-md border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="What it is, why it matters, constraints."
            data-testid="iki-factory-description"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--color-label-secondary)]">
          <input
            type="checkbox"
            checked={fromOutside}
            onChange={(e) => setFromOutside(e.target.checked)}
            className="h-4 w-4"
            data-testid="iki-factory-from-outside"
          />
          From an outside source
        </label>
        {fromOutside ? (
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">
            <span className="text-[var(--color-label-secondary)]">Origin (required)</span>
            <input
              value={originatorLabel}
              onChange={(e) => setOriginatorLabel(e.target.value)}
              className="min-h-[var(--hit-min)] rounded-md border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Who, and where this came from"
              data-testid="iki-factory-originator-label"
            />
          </label>
        ) : null}
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="min-h-[var(--hit-min)] min-w-[7rem] rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          data-testid="iki-factory-deposit-btn"
        >
          Add
        </button>
      </form>

      {error ? (
        <p className="text-sm text-red-700 dark:text-red-400" role="status" data-testid="iki-factory-error">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-5" data-testid="iki-factory-lanes">
        {LANES.map((lane) => (
          <section
            key={lane.id}
            className="flex min-h-[24rem] flex-col rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] p-3 shadow-[var(--elevation-1)]"
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId != null) void move(dragId, lane.id);
              setDragId(null);
            }}
            data-testid={`iki-factory-lane-${lane.id}`}
          >
            <h2 className="mb-2 text-sm font-semibold tracking-wide text-[var(--color-label)]">
              {lane.label}
              <span className="ml-2 font-normal text-[var(--color-label-tertiary)]">
                {byLane[lane.id].length}
              </span>
            </h2>
            {lane.id === "ideas" && byLane.ideas.length === 0 ? (
              <p className="text-sm text-[var(--color-label-secondary)]" data-testid="iki-factory-empty-ideas">
                Nothing in the backlog yet. It moves when someone takes it — not
                on its own.
              </p>
            ) : null}
            <ul className="flex flex-1 flex-col gap-2">
              {byLane[lane.id].map((c) => (
                <li
                  key={c.id}
                  draggable
                  onDragStart={() => setDragId(c.id)}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => setOpenId(c.id)}
                  className="cursor-pointer rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] p-3 shadow-[var(--elevation-1)]"
                  data-testid={`iki-factory-card-${c.id}`}
                >
                  {/* Card is for scanning (v1.0 §2.4): title + originator only.
                      Everything else — reasons, plan, product spec, attachments,
                      the four controls — lives behind this card, in the panel. */}
                  <p className="font-medium text-[var(--color-label)]">{c.title}</p>
                  <p
                    className="mt-1 text-xs text-[var(--color-label-tertiary)]"
                    data-testid={`iki-factory-card-originator-${c.id}`}
                  >
                    {ORIGINATOR_BADGE[c.originator_kind]}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {openCard ? (
        <IkiFactoryItemPanel
          card={openCard}
          busy={busy}
          onClose={() => setOpenId(null)}
          onMove={move}
          onPatch={patch}
          onRework={rework}
        />
      ) : null}
    </main>
  );
}
