"use client";

// The selected-session card under the calendar: kind badge, countdown, ICS,
// gated Join, and (admins) the Recurring Event Viewer.

import Link from "next/link";
import { useEffect, useState } from "react";
import EventEditor from "./EventEditor";
import { ENDED_AFTER_MS, KIND_CHIP, KIND_LABELS, type Session } from "./types";

export function Countdown({ iso }: { iso: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const ms = new Date(iso).getTime() - now;
  if (ms <= -ENDED_AFTER_MS) return <span className="text-zinc-400">ended</span>;
  if (ms <= 0) return <span className="font-medium text-emerald-600">Live now</span>;
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return (
    <span className="text-zinc-500">
      in {d > 0 ? `${d}d ` : ""}{h}h {m}m
    </span>
  );
}

export function CheckInControl({ s }: { s: Session }) {
  const [state, setState] = useState<"load" | "out" | "in" | "err" | "busy">("load");
  const key = String(s.id);
  const starts = new Date(s.starts_at).getTime();
  const now = Date.now();
  const open = starts - 15 * 60_000;
  const close = starts + ENDED_AFTER_MS;
  const inWindow = now >= open && now <= close;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/live/check-in?session_key=${encodeURIComponent(key)}`, {
      credentials: "same-origin",
    })
      .then(async (r) => {
        if (r.status === 401) return "out" as const;
        if (!r.ok) return "err" as const;
        const d = await r.json();
        return d.checked_in ? ("in" as const) : ("out" as const);
      })
      .then((st) => {
        if (!cancelled) setState(st);
      })
      .catch(() => {
        if (!cancelled) setState("err");
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  async function checkIn() {
    setState("busy");
    try {
      const r = await fetch("/api/live/check-in", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_key: key, starts_at: s.starts_at }),
      });
      if (!r.ok) {
        setState("err");
        return;
      }
      setState("in");
    } catch {
      setState("err");
    }
  }

  if (!inWindow && state !== "in") return null;
  if (state === "in") {
    return (
      <span className="text-sm font-medium text-emerald-600">Checked in ✓</span>
    );
  }
  if (!inWindow) return null;
  return (
    <button
      type="button"
      disabled={state === "busy" || state === "load"}
      onClick={checkIn}
      className="rounded-full border border-emerald-400 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950"
      title="Counts toward your Journey attendance streak"
    >
      {state === "busy" ? "Checking in…" : "Check in"}
    </button>
  );
}

export function JoinControl({ s }: { s: Session }) {
  if (new Date(s.starts_at).getTime() < Date.now() - ENDED_AFTER_MS) {
    return <span className="text-sm text-zinc-400">Session ended</span>;
  }
  if (s.join_url) {
    return (
      <a
        href={s.join_url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600"
      >
        Join Session
      </a>
    );
  }
  switch (s.join_locked) {
    case "sign_in":
      return (
        <Link
          href="/login"
          className="chip font-medium"
        >
          Sign in to join
        </Link>
      );
    case "role":
      return (
        <Link
          href="/membership"
          className="rounded-full border border-emerald-300 px-5 py-2 text-sm font-medium text-emerald-600 dark:border-emerald-800"
        >
          {s.category === "coaching" ? "Coaching members" : "Members"} only —
          upgrade
        </Link>
      );
    case "too_early":
      return (
        <span className="text-sm text-zinc-500">
          Join opens 15 minutes before start
        </span>
      );
    default:
      return null;
  }
}

export default function SessionDetail({
  s,
  isAdmin,
  onChanged,
}: {
  s: Session;
  isAdmin: boolean;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  useEffect(() => setEditing(false), [s.id]);
  return (
    <div className="surface-card mt-4 border border-[var(--color-separator)] p-5">
      <div className="flex flex-wrap items-center gap-4">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${KIND_CHIP[s.kind]}`}
        >
          {KIND_LABELS[s.kind]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-semibold text-[var(--color-label)]">
            {s.title}
            {s.recurring && (
              <span
                className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-label-secondary)]"
                title="Recurring weekly session"
              >
                ↻ Weekly
              </span>
            )}
            {s.modified && (
              <span
                className="rounded-full bg-[var(--color-warning)]/15 px-2 py-0.5 text-[11px] font-medium text-[var(--color-warning)]"
                title="This occurrence differs from its series"
              >
                edited
              </span>
            )}
          </span>
          <span className="block text-sm text-[var(--color-label-secondary)]">
            {new Date(s.starts_at).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            · <Countdown iso={s.starts_at} />
          </span>
        </span>
        <a
          href={
            s.recurring
              ? `/api/live/recurrences/${s.recurrence_id}/ics`
              : `/api/live/sessions/${s.id}/ics`
          }
          className="text-sm text-[var(--color-label-secondary)] hover:underline"
        >
          Add to Calendar
        </a>
        <CheckInControl s={s} />
        <JoinControl s={s} />
        {isAdmin && (
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="rounded-full border border-[var(--color-separator)] bg-[var(--color-surface-secondary)] px-4 py-1.5 text-sm font-medium text-[var(--color-label)]"
          >
            {editing ? "Close" : "Edit"}
          </button>
        )}
      </div>
      {editing && (
        <EventEditor s={s} onDone={onChanged} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
