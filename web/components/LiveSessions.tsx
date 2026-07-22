"use client";

// /live (Live Sessions Spec v1.2): month calendar of one-off + recurring
// sessions with gated Join, replays, admin session + recurrence managers.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Session = {
  id: number | string;
  recurring: boolean;
  recurrence_id?: number;
  occurrence_date?: string;
  modified?: boolean;
  title: string;
  kind: "trading_room" | "workshop" | "show";
  starts_at: string;
  category: "public" | "members" | "coaching";
  join_url?: string | null;
  join_locked?: "sign_in" | "role" | "too_early" | "ended" | null;
  replay_course_slug: string | null;
  replay_course_title: string | null;
};

type Recurrence = {
  id: number;
  title: string;
  kind: Session["kind"];
  days: string[];
  start_time: string;
  duration_minutes: number;
  join_url: string | null;
  category: Session["category"];
  active: boolean;
  start_date: string | null;
  until_date: string | null;
};

const KIND_LABELS = {
  trading_room: "Live Trading Room",
  workshop: "Workshop",
  show: "Live Show",
};
const KIND_CHIP = {
  trading_room:
    "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900",
  workshop:
    "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900",
  show: "bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900",
};
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};
const CATEGORY_OPTIONS = [
  ["coaching", "Coaching — Observer & Navigator"],
  ["members", "All members — Observer, Activator, Navigator"],
  ["public", "Public — no sign-in"],
] as const;
const ENDED_AFTER_MS = 4 * 3_600_000; // mirrors server JOIN_CLOSES_AFTER

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shortTime(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    .replace(" ", " ");
}

function Countdown({ iso }: { iso: string }) {
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

function JoinControl({ s }: { s: Session }) {
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

const SCOPE_OPTIONS = [
  ["one", "This event only"],
  ["future", "This event, and all future events"],
  ["all", "All events in this sequence"],
] as const;
type Scope = (typeof SCOPE_OPTIONS)[number][0];

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Recurring Event Viewer (spec v1.4 §5): scope-aware editor for occurrences,
// same form minus the scope radio for single events.
function EventEditor({
  s,
  onDone,
  onClose,
}: {
  s: Session;
  onDone: () => void;
  onClose: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Session["kind"]>("workshop");
  const [category, setCategory] = useState<Session["category"]>("members");
  const [time, setTime] = useState("12:00"); // ET (recurring)
  const [when, setWhen] = useState(""); // local datetime (single)
  const [duration, setDuration] = useState(60);
  const [joinUrl, setJoinUrl] = useState("");
  const [scope, setScope] = useState<Scope>("one");
  const [busy, setBusy] = useState(false);

  const prefillUrl = s.recurring
    ? `/api/admin/live-recurrences/${s.recurrence_id}/occurrences/${s.occurrence_date}`
    : `/api/admin/live-sessions/${s.id}`;

  useEffect(() => {
    fetch(prefillUrl, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setTitle(d.title);
        setKind(d.kind);
        setCategory(d.category);
        setJoinUrl(d.join_url ?? "");
        if (s.recurring) {
          setTime(d.start_time);
          setDuration(d.duration_minutes);
        } else {
          setWhen(toLocalInput(d.starts_at));
        }
        setLoaded(true);
      })
      .catch(() => {});
  }, [prefillUrl, s.recurring]);

  async function save() {
    setBusy(true);
    const r = s.recurring
      ? await fetch(prefillUrl, {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scope,
            title,
            kind,
            category,
            start_time: time,
            duration_minutes: duration,
            join_url: joinUrl,
          }),
        })
      : await fetch(`/api/admin/live-sessions/${s.id}`, {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            kind,
            category,
            starts_at: new Date(when).toISOString(),
            join_url: joinUrl,
          }),
        });
    setBusy(false);
    if (r.ok) {
      onDone();
      onClose();
    } else alert(`Save failed: ${await r.text()}`);
  }

  async function removeEvent() {
    const what = s.recurring
      ? SCOPE_OPTIONS.find(([v]) => v === scope)?.[1]
      : "this event";
    if (!confirm(`Delete — ${what}?`)) return;
    setBusy(true);
    const r = s.recurring
      ? await fetch(`${prefillUrl}?scope=${scope}`, {
          method: "DELETE",
          credentials: "same-origin",
        })
      : await fetch(`/api/admin/live-sessions/${s.id}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
    setBusy(false);
    if (r.ok) {
      onDone();
      onClose();
    } else alert(`Delete failed: ${await r.text()}`);
  }

  const field =
    "rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950";

  if (!loaded) return <p className="mt-3 text-sm text-zinc-400">Loading event…</p>;

  return (
    <div className="mt-3 w-full border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`${field} w-56`}
        />
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={field}>
          <option value="workshop">Workshop</option>
          <option value="trading_room">Trading Room</option>
          <option value="show">Live Show</option>
        </select>
        {s.recurring ? (
          <>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={field}
              title="Start time (Eastern)"
            />
            <span className="text-xs text-zinc-400">ET</span>
            <input
              type="number"
              min={5}
              max={480}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={`${field} w-20`}
              title="Duration (minutes)"
            />
          </>
        ) : (
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className={field}
          />
        )}
        <input
          value={joinUrl}
          onChange={(e) => setJoinUrl(e.target.value)}
          placeholder="Join URL"
          className={`${field} w-48`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Session["category"])}
          className={field}
        >
          {CATEGORY_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      {s.recurring && (
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Apply to
          </span>
          {SCOPE_OPTIONS.map(([v, l]) => (
            <label key={v} className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="edit-scope"
                checked={scope === v}
                onChange={() => setScope(v)}
                className="accent-emerald-500"
              />
              {l}
            </label>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={save}
          disabled={busy || !title.trim()}
          className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={onClose}
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium dark:border-zinc-700"
        >
          Cancel
        </button>
        <button
          onClick={removeEvent}
          disabled={busy}
          className="ml-auto rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-500 disabled:opacity-50 dark:border-red-900"
        >
          Delete…
        </button>
      </div>
    </div>
  );
}

function SessionDetail({
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

function MonthCalendar({
  cursor,
  sessions,
  selectedId,
  onSelect,
}: {
  cursor: Date;
  sessions: Session[];
  selectedId: number | string | null;
  onSelect: (s: Session) => void;
}) {
  const byDay = new Map<number, Session[]>();
  for (const s of sessions) {
    const d = new Date(s.starts_at);
    if (d.getFullYear() !== cursor.getFullYear() || d.getMonth() !== cursor.getMonth())
      continue; // UTC↔local edge spill
    const list = byDay.get(d.getDate()) ?? [];
    list.push(s);
    byDay.set(d.getDate(), list);
  }
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const leading = (new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay() + 6) % 7; // Mon-first
  const today = new Date();
  const isThisMonth =
    today.getFullYear() === cursor.getFullYear() && today.getMonth() === cursor.getMonth();
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {DAY_KEYS.map((d) => (
            <div key={d} className="pb-2">{DAY_LABELS[d]}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          {cells.map((day, i) => {
            const isToday = isThisMonth && day === today.getDate();
            const isPastDay =
              day !== null &&
              new Date(cursor.getFullYear(), cursor.getMonth(), day + 1) <= today &&
              !isToday;
            return (
              <div
                key={i}
                className={`min-h-24 border-zinc-200 p-1.5 dark:border-zinc-800 ${
                  i % 7 !== 0 ? "border-l" : ""
                } ${i >= 7 ? "border-t" : ""} ${
                  day === null ? "bg-zinc-50 dark:bg-zinc-900/40" : ""
                }`}
              >
                {day !== null && (
                  <>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        isToday
                          ? "bg-emerald-500 text-white"
                          : isPastDay
                            ? "text-zinc-400"
                            : "text-zinc-600 dark:text-zinc-300"
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {(byDay.get(day) ?? []).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => onSelect(s)}
                          title={`${KIND_LABELS[s.kind]} — ${s.title}`}
                          className={`block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium leading-tight transition-colors ${
                            KIND_CHIP[s.kind]
                          } ${isPastDay ? "opacity-45" : ""} ${
                            selectedId === s.id
                              ? "ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-zinc-950"
                              : ""
                          }`}
                        >
                          {shortTime(s.starts_at)} {s.title}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AdminManager({ onChanged }: { onChanged: () => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Session["kind"]>("workshop");
  const [when, setWhen] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [category, setCategory] = useState<Session["category"]>("members");

  const field =
    "rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950";

  async function create() {
    const r = await fetch("/api/admin/live-sessions", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        kind,
        starts_at: new Date(when).toISOString(),
        join_url: joinUrl,
        category,
      }),
    });
    if (r.ok) {
      setTitle("");
      setWhen("");
      setJoinUrl("");
      onChanged();
    } else alert(`Create failed: ${await r.text()}`);
  }

  return (
    <div className="mt-8 rounded-2xl border-2 border-dashed border-emerald-300 p-5 dark:border-emerald-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
        Schedule a one-off session (admin)
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className={`${field} w-56`}
        />
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={field}>
          <option value="workshop">Workshop</option>
          <option value="trading_room">Trading Room</option>
          <option value="show">Live Show</option>
        </select>
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className={field}
        />
        <input
          value={joinUrl}
          onChange={(e) => setJoinUrl(e.target.value)}
          placeholder="Join URL (Zoom etc.)"
          className={`${field} w-56`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Session["category"])}
          className={field}
        >
          {CATEGORY_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <button
          onClick={create}
          disabled={!title.trim() || !when}
          className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function RecurrenceManager({ onChanged }: { onChanged: () => void }) {
  const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Session["kind"]>("workshop");
  const [days, setDays] = useState<string[]>([]);
  const [time, setTime] = useState("11:00");
  const [duration, setDuration] = useState(60);
  const [joinUrl, setJoinUrl] = useState("");
  const [category, setCategory] = useState<Session["category"]>("coaching");
  const [endMode, setEndMode] = useState<"never" | "date" | "days">("never");
  const [endDate, setEndDate] = useState("");
  const [endDays, setEndDays] = useState(30);

  const field =
    "rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950";

  const load = useCallback(() => {
    fetch("/api/admin/live-recurrences", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setRecurrences(d.recurrences))
      .catch(() => {});
  }, []);
  useEffect(load, [load]);

  function toggleDay(d: string) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  async function create() {
    const ends =
      endMode === "date"
        ? { until_date: endDate }
        : endMode === "days"
          ? { until_days: endDays }
          : {};
    const r = await fetch("/api/admin/live-recurrences", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        kind,
        days,
        start_time: time,
        duration_minutes: duration,
        join_url: joinUrl,
        category,
        ...ends,
      }),
    });
    if (r.ok) {
      setTitle("");
      setDays([]);
      setJoinUrl("");
      setEndMode("never");
      load();
      onChanged();
    } else alert(`Create failed: ${await r.text()}`);
  }

  async function remove(rec: Recurrence) {
    if (!confirm(`Delete the recurring session "${rec.title}"? All its upcoming occurrences disappear.`)) return;
    await fetch(`/api/admin/live-recurrences/${rec.id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    load();
    onChanged();
  }

  return (
    <div className="mt-6 rounded-2xl border-2 border-dashed border-indigo-300 p-5 dark:border-indigo-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
        Recurring schedule (admin) — times are Eastern
      </p>
      {recurrences.length > 0 && (
        <ul className="mt-3 space-y-2">
          {recurrences.map((rec) => (
            <li
              key={rec.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm dark:border-zinc-800"
            >
              <span className="font-medium">{rec.title}</span>
              <span className="text-xs text-zinc-500">
                {rec.days.map((d) => DAY_LABELS[d]).join(" ")} · {rec.start_time} ET
                · {rec.duration_minutes}m
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                {CATEGORY_OPTIONS.find(([v]) => v === rec.category)?.[1] ?? rec.category}
              </span>
              {rec.until_date && (
                <span className="text-xs text-zinc-500">
                  until {new Date(`${rec.until_date}T12:00:00`).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
              {!rec.active && (
                <span className="text-xs text-amber-600">inactive</span>
              )}
              <button
                onClick={() => remove(rec)}
                className="ml-auto text-zinc-400 hover:text-red-500"
                title="Delete recurring session"
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className={`${field} w-48`}
        />
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={field}>
          <option value="workshop">Workshop</option>
          <option value="trading_room">Trading Room</option>
          <option value="show">Live Show</option>
        </select>
        <span className="flex items-center gap-1">
          {DAY_KEYS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDay(d)}
              className={`rounded-md px-1.5 py-1 text-xs font-medium ${
                days.includes(d)
                  ? "bg-indigo-500 text-white"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              }`}
            >
              {DAY_LABELS[d]}
            </button>
          ))}
        </span>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={field}
        />
        <input
          type="number"
          min={5}
          max={480}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className={`${field} w-20`}
          title="Duration (minutes)"
        />
        <input
          value={joinUrl}
          onChange={(e) => setJoinUrl(e.target.value)}
          placeholder="Join URL"
          className={`${field} w-48`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Session["category"])}
          className={field}
        >
          {CATEGORY_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={endMode}
          onChange={(e) => setEndMode(e.target.value as typeof endMode)}
          className={field}
          title="When the series ends"
        >
          <option value="never">Ends: never</option>
          <option value="date">Ends: on date</option>
          <option value="days">Ends: after N days</option>
        </select>
        {endMode === "date" && (
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={field}
          />
        )}
        {endMode === "days" && (
          <input
            type="number"
            min={1}
            max={730}
            value={endDays}
            onChange={(e) => setEndDays(Number(e.target.value))}
            className={`${field} w-20`}
            title="Days from today"
          />
        )}
        <button
          onClick={create}
          disabled={!title.trim() || days.length === 0 || !time || (endMode === "date" && !endDate)}
          className="rounded-full bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function LiveSessions() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [data, setData] = useState<{ sessions: Session[]; past: Session[] } | null>(null);
  const [selected, setSelected] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/live/sessions?month=${monthKey(cursor)}`, {
      credentials: "same-origin",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {});
  }, [cursor]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => me?.role === "administrator" && setIsAdmin(true))
      .catch(() => {});
  }, []);

  // Default selection: the next session that hasn't ended, once per load.
  useEffect(() => {
    if (!data) return;
    setSelected((prev) => {
      if (prev && data.sessions.some((s) => s.id === prev.id)) {
        return data.sessions.find((s) => s.id === prev.id) ?? null;
      }
      const cut = Date.now() - ENDED_AFTER_MS;
      return data.sessions.find((s) => new Date(s.starts_at).getTime() >= cut) ?? null;
    });
  }, [data]);

  if (!data) return <p className="text-sm text-zinc-400">Loading…</p>;

  async function remove(id: number | string) {
    if (!confirm("Delete this session?")) return;
    await fetch(`/api/admin/live-sessions/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    setSelected(null);
    load();
  }

  function shiftMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
    setSelected(null);
  }

  const navBtn =
    "flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <div>
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">
            {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h2>
          <span className="ml-auto flex items-center gap-2">
            <button onClick={() => shiftMonth(-1)} className={navBtn} title="Previous month">
              ‹
            </button>
            <button
              onClick={() => {
                const d = new Date();
                setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                setSelected(null);
              }}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Today
            </button>
            <button onClick={() => shiftMonth(1)} className={navBtn} title="Next month">
              ›
            </button>
          </span>
        </div>

        <MonthCalendar
          cursor={cursor}
          sessions={data.sessions}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
        />

        {selected && (
          <SessionDetail s={selected} isAdmin={isAdmin} onChanged={load} />
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Replays</h2>
        {data.past.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No past sessions yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.past.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
              >
                <span className="font-medium">{s.title}</span>
                <span className="text-xs text-zinc-500">
                  {new Date(s.starts_at).toLocaleDateString()}
                </span>
                {s.replay_course_slug ? (
                  <Link
                    href={`/courses/${s.replay_course_slug}`}
                    className="ml-auto rounded-full border border-zinc-300 px-4 py-1 text-xs font-medium dark:border-zinc-700"
                  >
                    Watch replay
                  </Link>
                ) : (
                  <span className="ml-auto text-xs text-zinc-400">
                    Replay coming soon
                  </span>
                )}
                {isAdmin && (
                  <button
                    onClick={() => remove(s.id)}
                    className="text-zinc-400 hover:text-red-500"
                  >
                    🗑
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin && (
        <>
          <RecurrenceManager onChanged={load} />
          <AdminManager onChanged={load} />
        </>
      )}
    </div>
  );
}
