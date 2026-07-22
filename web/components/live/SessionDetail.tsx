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
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium dark:border-zinc-700"
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
    <div className="mt-4 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-4">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${KIND_CHIP[s.kind]}`}
        >
          {KIND_LABELS[s.kind]}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-semibold">
            {s.title}
            {s.recurring && (
              <span
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800"
                title="Recurring weekly session"
              >
                ↻ Weekly
              </span>
            )}
            {s.modified && (
              <span
                className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                title="This occurrence differs from its series"
              >
                edited
              </span>
            )}
          </span>
          <span className="block text-sm text-zinc-500">
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
          className="text-sm text-zinc-500 hover:underline"
        >
          Add to Calendar
        </a>
        <JoinControl s={s} />
        {isAdmin && (
          <button
            onClick={() => setEditing((e) => !e)}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium dark:border-zinc-700"
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
