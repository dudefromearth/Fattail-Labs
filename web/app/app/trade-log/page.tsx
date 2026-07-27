"use client";

// Trade Log MVP — process-first (T-D5). P&L optional/neutral.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { appConfirm } from "@/lib/dialogs";

type Entry = {
  id: number;
  traded_on: string | null;
  setup_md: string;
  plan_md: string;
  rules_md: string;
  adherence: string;
  deviation_md: string;
  lesson_md: string;
  pnl_amount: number | null;
};

const empty = {
  traded_on: "",
  setup_md: "",
  plan_md: "",
  rules_md: "",
  adherence: "unknown",
  deviation_md: "",
  lesson_md: "",
  pnl_amount: "",
};

export default function TradeLogPage() {
  const [entries, setEntries] = useState<
    Entry[] | null | "anon" | "forbidden" | "err"
  >(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    fetch("/api/me/trade-log", { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401) return "anon" as const;
        if (r.status === 403) return "forbidden" as const;
        if (r.status === 404) {
          throw new Error(
            "Trade Log API not found — restart the Labs API (uvicorn) so new routes load.",
          );
        }
        if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d === "anon" || d === "forbidden") setEntries(d);
        else setEntries(d.entries ?? []);
      })
      .catch((e) => {
        setEntries("err");
        setError(e instanceof Error ? e.message : String(e));
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      ...form,
      traded_on: form.traded_on || null,
      pnl_amount: form.pnl_amount === "" ? null : Number(form.pnl_amount),
    };
    const r = await fetch("/api/me/trade-log", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!r.ok) {
      setError(await r.text());
      return;
    }
    setForm(empty);
    load();
  }

  async function remove(id: number) {
    const ok = await appConfirm({
      title: "Delete this entry?",
      message: "This cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await fetch(`/api/me/trade-log/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    load();
  }

  const field =
    "mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-sm";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 pb-24">
      <nav className="text-sm text-[var(--color-label-secondary)]">
        <Link href="/app" className="hover:underline">
          Apps
        </Link>
        <span className="mx-2">›</span>
        <span>Trade Log</span>
      </nav>
      <h1 className="mt-4 text-3xl font-semibold text-[var(--color-label)]">
        Trade Log
      </h1>
      <p className="mt-2 text-[var(--color-label-secondary)]">
        Process first: setup, plan, rules, adherence, lesson learned. P&amp;L is
        optional and never the point.
      </p>

      {entries === null && (
        <p className="mt-8 text-sm text-[var(--color-label-tertiary)]">
          Loading…
        </p>
      )}
      {entries === "anon" && (
        <p className="mt-8 text-sm">
          <Link href="/login" className="font-medium text-[var(--color-tint)]">
            Sign in
          </Link>{" "}
          to use Trade Log. (This is a private tool — your entries stay with your
          account.)
        </p>
      )}
      {entries === "forbidden" && (
        <div className="surface-card mt-8 border border-[var(--color-separator)] p-5 text-sm text-[var(--color-label-secondary)]">
          <p className="font-medium text-[var(--color-label)]">
            Membership required
          </p>
          <p className="mt-2">
            Trade Log is available to Activator (member) role and above. Free
            accounts can use Journey; upgrade for the practice tools.
          </p>
          <Link
            href="/membership"
            className="mt-3 inline-block font-medium text-[var(--color-tint)] hover:underline"
          >
            View membership →
          </Link>
        </div>
      )}
      {entries === "err" && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <p className="font-medium">Could not load Trade Log</p>
          {error && <p className="mt-1 font-mono text-xs opacity-80">{error}</p>}
          <button
            type="button"
            onClick={() => load()}
            className="mt-3 text-sm font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {Array.isArray(entries) && (
        <>
          <form
            onSubmit={submit}
            className="surface-card mt-8 space-y-3 border border-[var(--color-separator)] p-5"
          >
            <h2 className="font-semibold text-[var(--color-label)]">
              New entry
            </h2>
            <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
              Date
              <input
                type="date"
                className={field}
                value={form.traded_on}
                onChange={(e) =>
                  setForm((f) => ({ ...f, traded_on: e.target.value }))
                }
              />
            </label>
            <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
              Setup
              <textarea
                className={field}
                rows={2}
                value={form.setup_md}
                onChange={(e) =>
                  setForm((f) => ({ ...f, setup_md: e.target.value }))
                }
                placeholder="What structure / context?"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
              Plan
              <textarea
                className={field}
                rows={2}
                value={form.plan_md}
                onChange={(e) =>
                  setForm((f) => ({ ...f, plan_md: e.target.value }))
                }
                placeholder="What did you plan to do?"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
              Rules checked
              <textarea
                className={field}
                rows={2}
                value={form.rules_md}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rules_md: e.target.value }))
                }
              />
            </label>
            <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
              Adherence
              <select
                className={field}
                value={form.adherence}
                onChange={(e) =>
                  setForm((f) => ({ ...f, adherence: e.target.value }))
                }
              >
                <option value="followed">Followed plan</option>
                <option value="partial">Partial</option>
                <option value="broke">Broke rules</option>
                <option value="unknown">Not sure</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
              Deviation
              <textarea
                className={field}
                rows={2}
                value={form.deviation_md}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deviation_md: e.target.value }))
                }
              />
            </label>
            <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
              Lesson learned
              <textarea
                className={field}
                rows={2}
                value={form.lesson_md}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lesson_md: e.target.value }))
                }
              />
            </label>
            <label className="block text-xs font-medium text-[var(--color-label-tertiary)]">
              P&amp;L (optional, neutral)
              <input
                type="number"
                step="any"
                className={field}
                value={form.pnl_amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pnl_amount: e.target.value }))
                }
              />
            </label>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-[var(--color-tint)] px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save entry"}
            </button>
          </form>

          <ul className="mt-8 space-y-3">
            {entries.length === 0 && (
              <li className="text-sm text-[var(--color-label-secondary)]">
                No entries yet. Log process, not trophies.
              </li>
            )}
            {entries.map((en) => (
              <li
                key={en.id}
                className="surface-card border border-[var(--color-separator)] p-4 text-sm"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-[var(--color-label)]">
                    {en.traded_on || "No date"} · {en.adherence}
                  </span>
                  <button
                    type="button"
                    onClick={() => void remove(en.id)}
                    className="text-xs text-red-600"
                  >
                    Delete
                  </button>
                </div>
                {en.setup_md && (
                  <p className="mt-2 text-[var(--color-label-secondary)]">
                    <strong>Setup:</strong> {en.setup_md}
                  </p>
                )}
                {en.lesson_md && (
                  <p className="mt-1 text-[var(--color-label-secondary)]">
                    <strong>Lesson:</strong> {en.lesson_md}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
