"use client";

// Recurring Event Viewer (spec v1.4 §5): scope-aware editor for occurrences,
// same form minus the scope radio for single events.

import { useEffect, useState } from "react";
import { del, getJSON, putJSON } from "@/lib/client";
import { FIELD } from "@/lib/ui";
import {
  CATEGORY_OPTIONS,
  SCOPE_OPTIONS,
  type Scope,
  type Session,
  toLocalInput,
} from "./types";

type Prefill = {
  title: string;
  kind: Session["kind"];
  category: Session["category"];
  join_url: string | null;
  start_time?: string;
  duration_minutes?: number;
  starts_at?: string;
};

export default function EventEditor({
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
    getJSON<Prefill>(prefillUrl).then((d) => {
      if (!d) return;
      setTitle(d.title);
      setKind(d.kind);
      setCategory(d.category);
      setJoinUrl(d.join_url ?? "");
      if (s.recurring) {
        setTime(d.start_time ?? "12:00");
        setDuration(d.duration_minutes ?? 60);
      } else {
        setWhen(toLocalInput(d.starts_at ?? s.starts_at));
      }
      setLoaded(true);
    });
  }, [prefillUrl, s.recurring, s.starts_at]);

  async function save() {
    setBusy(true);
    const r = s.recurring
      ? await putJSON(prefillUrl, {
          scope,
          title,
          kind,
          category,
          start_time: time,
          duration_minutes: duration,
          join_url: joinUrl,
        })
      : await putJSON(`/api/admin/live-sessions/${s.id}`, {
          title,
          kind,
          category,
          starts_at: new Date(when).toISOString(),
          join_url: joinUrl,
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
      ? await del(`${prefillUrl}?scope=${scope}`)
      : await del(`/api/admin/live-sessions/${s.id}`);
    setBusy(false);
    if (r.ok) {
      onDone();
      onClose();
    } else alert(`Delete failed: ${await r.text()}`);
  }

  if (!loaded) return <p className="mt-3 text-sm text-zinc-400">Loading event…</p>;

  return (
    <div className="mt-3 w-full border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`${FIELD} w-56`}
        />
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={FIELD}>
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
              className={FIELD}
              title="Start time (Eastern)"
            />
            <span className="text-xs text-zinc-400">ET</span>
            <input
              type="number"
              min={5}
              max={480}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={`${FIELD} w-20`}
              title="Duration (minutes)"
            />
          </>
        ) : (
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className={FIELD}
          />
        )}
        <input
          value={joinUrl}
          onChange={(e) => setJoinUrl(e.target.value)}
          placeholder="Join URL"
          className={`${FIELD} w-48`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Session["category"])}
          className={FIELD}
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
