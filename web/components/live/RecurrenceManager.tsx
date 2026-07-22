"use client";

// Recurring schedule manager (specs v1.1/v1.3/v1.5): list + create with
// day-picker, ET time, audience category, and series end limit.

import { useCallback, useEffect, useState } from "react";
import { del, getJSON, postJSON } from "@/lib/client";
import { FIELD } from "@/lib/ui";
import {
  CATEGORY_OPTIONS,
  DAY_KEYS,
  DAY_LABELS,
  type Recurrence,
  type Session,
} from "./types";

export default function RecurrenceManager({ onChanged }: { onChanged: () => void }) {
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

  const load = useCallback(() => {
    getJSON<{ recurrences: Recurrence[] }>("/api/admin/live-recurrences").then(
      (d) => d && setRecurrences(d.recurrences),
    );
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
    const r = await postJSON("/api/admin/live-recurrences", {
      title,
      kind,
      days,
      start_time: time,
      duration_minutes: duration,
      join_url: joinUrl,
      category,
      ...ends,
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
    await del(`/api/admin/live-recurrences/${rec.id}`);
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
          className={`${FIELD} w-48`}
        />
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={FIELD}>
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
          className={FIELD}
        />
        <input
          type="number"
          min={5}
          max={480}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className={`${FIELD} w-20`}
          title="Duration (minutes)"
        />
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
        <select
          value={endMode}
          onChange={(e) => setEndMode(e.target.value as typeof endMode)}
          className={FIELD}
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
            className={FIELD}
          />
        )}
        {endMode === "days" && (
          <input
            type="number"
            min={1}
            max={730}
            value={endDays}
            onChange={(e) => setEndDays(Number(e.target.value))}
            className={`${FIELD} w-20`}
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
