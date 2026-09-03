"use client";

import { useEffect, useState } from "react";
import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { ALGO_REASON_HOUSE_BASE } from "@/lib/options-lab/algoReasonFeed";

type Stats = {
  armed: number;
  active_now: number;
  unbound: number;
  by_suite: Record<string, number>;
  by_class: Record<string, number>;
};

type AlertRow = {
  alert_id: string;
  suite: string;
  source_system: string;
  title: string;
  unbound: boolean;
  deep_link: string | null;
};

export default function AlertsManagerPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<AlertRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const isAdmin = useIsAdmin();
  const [houseBase, setHouseBase] = useState(ALGO_REASON_HOUSE_BASE);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const [s, a] = await Promise.all([
        fetch("/api/me/alerts/stats", { credentials: "include" }),
        fetch("/api/me/alerts", { credentials: "include" }),
      ]);
      if (cancel) return;
      if (s.status === 503 || a.status === 503) {
        setErr("Alerts Manager is not live yet.");
        return;
      }
      if (!s.ok || !a.ok) {
        setErr("Could not load alerts.");
        return;
      }
      setStats(await s.json());
      const body = await a.json();
      setRows(body.alerts || []);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-[720px] px-4 py-6">
      <h1 className="text-[length:var(--text-title-2)] font-semibold text-[var(--color-label)]">
        Alerts
      </h1>
      <p className="mt-1 text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]">
        Settings and stats. Create and edit alerts in the app they belong to.
      </p>
      <div className="mt-4">
        <Banner tone="info">
          Destinations are saved. Delivery is not live yet.
        </Banner>
      </div>
      {isAdmin ? (
        <section className="mt-6 rounded-[var(--radius-lg)] bg-[var(--color-surface-secondary)] p-4">
          <h2 className="text-[length:var(--text-headline)] font-semibold">
            Algo Reason house base
          </h2>
          <textarea
            className="mt-3 min-h-[8rem] w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-3 text-[length:var(--text-subheadline)]"
            value={houseBase}
            onChange={(e) => setHouseBase(e.target.value)}
            data-testid="algo-reason-house-base"
          />
        </section>
      ) : null}
      {err ? (
        <p className="mt-4 text-sm text-[var(--color-label-secondary)]">{err}</p>
      ) : null}

      {stats ? (
        <section className="mt-6 rounded-[var(--radius-lg)] bg-[var(--color-surface-secondary)] p-4">
          <h2 className="text-[length:var(--text-headline)] font-semibold">
            Overview
          </h2>
          <ul className="mt-3 divide-y divide-[var(--color-separator)]">
            <li className="flex min-h-[var(--hit-min)] items-center justify-between">
              <span>Armed</span>
              <span className="tabular-nums">{stats.armed}</span>
            </li>
            <li className="flex min-h-[var(--hit-min)] items-center justify-between">
              <span>Active now</span>
              <span className="tabular-nums">{stats.active_now}</span>
            </li>
            <li className="flex min-h-[var(--hit-min)] items-center justify-between">
              <span>Unbound</span>
              <span className="tabular-nums">{stats.unbound}</span>
            </li>
          </ul>
          <p className="mt-3 text-[length:var(--text-footnote)] text-[var(--color-label-tertiary)]">
            By suite:{" "}
            {Object.entries(stats.by_suite)
              .map(([k, n]) => `${k} ${n}`)
              .join(" · ") || "—"}
          </p>
          <p className="text-[length:var(--text-footnote)] text-[var(--color-label-tertiary)]">
            By class:{" "}
            {Object.entries(stats.by_class)
              .map(([k, n]) => `${k} ${n}`)
              .join(" · ") || "—"}
          </p>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="text-[length:var(--text-headline)] font-semibold">Index</h2>
        <ul className="mt-2 divide-y divide-[var(--color-separator)] rounded-[var(--radius-lg)] bg-[var(--color-surface-secondary)]">
          {rows.map((row) => (
            <li
              key={row.alert_id}
              className="flex min-h-[var(--hit-min)] items-center justify-between gap-3 px-3"
            >
              <div className="min-w-0">
                <div className="truncate text-[length:var(--text-subheadline)]">
                  {row.title}
                </div>
                <div className="text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
                  {row.suite}
                  {row.unbound ? " · Unbound" : ""}
                </div>
              </div>
              {row.deep_link ? (
                <Button variant="plain" onClick={() => { window.location.href = row.deep_link!; }}>
                  Open in app
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-6">
        <a
          href="/settings?section=alerts"
          className="text-[var(--color-tint)] underline-offset-2 hover:underline"
        >
          Delivery settings
        </a>
      </p>
    </main>
  );
}
