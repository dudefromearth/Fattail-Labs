"use client";

// One-off session scheduler (spec v1.0/v1.3).

import { useState } from "react";
import { postJSON } from "@/lib/client";
import { FIELD } from "@/lib/ui";
import { CATEGORY_OPTIONS, type Session } from "./types";
import { appAlert } from "@/lib/dialogs";

export default function AdminManager({ onChanged }: { onChanged: () => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Session["kind"]>("workshop");
  const [when, setWhen] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [category, setCategory] = useState<Session["category"]>("members");

  async function create() {
    const r = await postJSON("/api/admin/live-sessions", {
      title,
      kind,
      starts_at: new Date(when).toISOString(),
      join_url: joinUrl,
      category,
    });
    if (r.ok) {
      setTitle("");
      setWhen("");
      setJoinUrl("");
      onChanged();
    } else await appAlert({ title: "Create failed", message: await r.text() });
  }

  return (
    <div className="surface-card mt-8 border border-[var(--color-separator)] p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-tint)]">
        Schedule a one-off session (admin)
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className={`${FIELD} w-56`}
        />
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={FIELD}>
          <option value="workshop">Workshop</option>
          <option value="trading_room">Trading Room</option>
          <option value="show">Live Show</option>
        </select>
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className={FIELD}
        />
        <input
          value={joinUrl}
          onChange={(e) => setJoinUrl(e.target.value)}
          placeholder="Join URL (Zoom etc.)"
          className={`${FIELD} w-56`}
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
