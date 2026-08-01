"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ToughnessShell from "@/components/hard/ToughnessShell";
import {
  fetchHard,
  logHardDay,
  type HardSnapshot,
  type HardTask,
} from "@/lib/hardApi";

export default function DailyLog() {
  const [data, setData] = useState<HardSnapshot | null | "anon" | "err">(null);
  const [tasks, setTasks] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/me/hard", { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401) return "anon" as const;
        if (!r.ok) return "err" as const;
        return (await r.json()) as HardSnapshot;
      })
      .then((d) => {
        setData(d);
        if (d && typeof d === "object" && d.variant?.tasks) {
          const init: Record<string, boolean> = {};
          for (const t of d.variant.tasks) init[t.id] = false;
          setTasks(init);
        }
      })
      .catch(() => setData("err"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (data === null) {
    return (
      <ToughnessShell crumb="Today" active="today">
        <p className="mt-8 text-sm text-[var(--color-label-secondary)]">
          Loading…
        </p>
      </ToughnessShell>
    );
  }
  if (data === "anon") {
    return (
      <ToughnessShell crumb="Today" active="today">
        <p className="mt-8">
          <Link href="/login" className="text-[var(--color-tint)]">
            Log in
          </Link>{" "}
          to log Hard days.
        </p>
      </ToughnessShell>
    );
  }
  if (data === "err") {
    return (
      <ToughnessShell crumb="Today" active="today">
        <p className="mt-8 text-[var(--color-destructive)]">Load failed.</p>
      </ToughnessShell>
    );
  }

  if (!data.active_enrollment || !data.variant) {
    return (
      <ToughnessShell crumb="Today" active="today">
        <h1 className="mt-6 text-2xl font-semibold text-[var(--color-label)]">
          Today&apos;s log
        </h1>
        <p className="mt-3 text-[var(--color-label-secondary)]">
          No active challenge.{" "}
          <Link
            href="/app/toughness/fattail-hard"
            className="text-[var(--color-tint)] hover:underline"
          >
            Enroll in FatTail Hard
          </Link>{" "}
          or{" "}
          <Link
            href="/app/toughness/true-75"
            className="text-[var(--color-tint)] hover:underline"
          >
            True 75
          </Link>
          .
        </p>
      </ToughnessShell>
    );
  }

  const taskList: HardTask[] = data.variant.tasks;

  async function save() {
    if (data === null || data === "anon" || data === "err") return;
    setBusy(true);
    setMsg(null);
    const r = await logHardDay({
      tasks,
      progress_note: note.trim() || undefined,
      log_date: data.today,
    });
    setBusy(false);
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { detail?: string };
      setMsg(j.detail || `Save failed (${r.status})`);
      return;
    }
    const body = (await r.json()) as {
      log: { complete: boolean };
      compliance: { streak_days: number };
    };
    setMsg(
      body.log.complete
        ? `Day complete. Streak ${body.compliance.streak_days}d.`
        : "Saved (day not fully complete yet).",
    );
    load();
  }

  return (
    <ToughnessShell crumb="Today">
      <header className="mt-6">
        <h1 className="text-2xl font-semibold text-[var(--color-label)]">
          Today&apos;s log
        </h1>
        <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
          {data.today} · {data.variant.label}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-label-secondary)]">
          Complete <strong className="text-[var(--color-label)]">every</strong>{" "}
          required activity today — including no alcohol and no diet cheating.
          Vacations and social events still count. Miss or fail any required
          task and the program restarts at day one — that is how Mental
          Toughness is trained.
        </p>
      </header>

      <ul className="mt-8 space-y-3">
        {taskList.map((t) => (
          <li key={t.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--color-tint)]"
                checked={!!tasks[t.id]}
                onChange={(e) =>
                  setTasks((prev) => ({ ...prev, [t.id]: e.target.checked }))
                }
              />
              <span className="text-[15px] text-[var(--color-label)]">
                {t.label}
                {t.required === false ? (
                  <span className="text-[var(--color-label-secondary)]">
                    {" "}
                    (optional)
                  </span>
                ) : null}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <label className="mt-6 block">
        <span className="text-sm font-medium text-[var(--color-label)]">
          Progress record
        </span>
        <textarea
          className="mt-2 w-full rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-label)]"
          rows={3}
          placeholder="Brief process note for the day (photo upload comes later)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="button" disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Save day"}
        </Button>
        <Link
          href="/app/toughness"
          className="text-sm text-[var(--color-tint)] hover:underline"
        >
          Back to hub
        </Link>
      </div>
      {msg ? (
        <p className="mt-3 text-sm text-[var(--color-label-secondary)]" role="status">
          {msg}
        </p>
      ) : null}
      {data.compliance ? (
        <p className="mt-4 text-sm text-[var(--color-label-secondary)]">
          Streak {data.compliance.streak_days}d · window completion{" "}
          {Math.round(data.compliance.completion_rate * 100)}% · MT{" "}
          {data.mental_toughness.empty
            ? "empty"
            : `${data.mental_toughness.raw_percent}%`}
        </p>
      ) : null}
    </ToughnessShell>
  );
}
