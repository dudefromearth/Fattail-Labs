"use client";

/**
 * Retrospective library — Spec v0.2.
 * Create starts from Journal type = Retrospective.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import RetroCadenceNudge from "@/components/RetroCadenceNudge";
import { Button } from "@/components/ui";
import type { ProcessPayload } from "@/components/ProcessMeter";
import {
  createRetrospective,
  listRetrospectives,
  previewRetroScope,
  type Retrospective,
  type RetroScopePreview,
} from "@/lib/retrospectiveApi";

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return iso.slice(0, 10);
  }
}

export default function RetrospectivePage() {
  const router = useRouter();
  const [items, setItems] = useState<Retrospective[] | null>(null);
  const [scope, setScope] = useState<RetroScopePreview | null>(null);
  const [process, setProcess] = useState<ProcessPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setErr(null);
    Promise.all([
      listRetrospectives(),
      previewRetroScope().catch(() => null),
      fetch("/api/me/journey/scores", { credentials: "same-origin" })
        .then(async (r) => {
          if (!r.ok) return null;
          const d = await r.json();
          return (d.process as ProcessPayload) || null;
        })
        .catch(() => null),
    ])
      .then(([list, sc, proc]) => {
        setItems(list);
        setScope(sc);
        setProcess(proc);
      })
      .catch((e) => {
        setErr(e instanceof Error ? e.message : "Failed to load");
        setItems([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function startFromHere() {
    setBusy(true);
    setErr(null);
    try {
      const r = await createRetrospective({ gather: true });
      router.push(`/app/retrospective/${r.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not start");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6 pb-24 sm:px-6">
      <PracticeSuiteChrome
        active="retrospective"
        subtitle="Periodic look-back: gather since last retrospective, dual report, integrity."
      >
        <div className="mt-6 space-y-6" data-testid="retrospective-library">
          {process && <RetroCadenceNudge process={process} />}
          <section className="surface-card border border-[var(--color-separator)] px-5 py-6 sm:px-8">
            <h1
              className="font-semibold text-[var(--color-label)]"
              style={{ fontSize: "var(--text-headline)" }}
            >
              Retrospectives
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-label-secondary)]">
              A retrospective is a journal type that tells the system to gather
              all your work since the last one (or your{" "}
              <strong className="font-medium text-[var(--color-label)]">
                maiden journey
              </strong>{" "}
              if this is the first). You get a dual report — book performance
              and process performance — plus Process Integrity, and comparison
              to prior retros when they exist.
            </p>
            {scope && (
              <p className="mt-3 text-sm text-[var(--color-label-secondary)]">
                Next scope:{" "}
                <span className="font-medium text-[var(--color-label)]">
                  {scope.label}
                </span>
                {" · "}
                {fmtDate(scope.scope_start)} → {fmtDate(scope.scope_end)}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                disabled={busy}
                onClick={startFromHere}
              >
                {busy ? "Starting…" : "Start retrospective"}
              </Button>
              <Link href="/app/journal">
                <Button type="button" variant="secondary">
                  Open Journal
                </Button>
              </Link>
              <Link href="/app/journey">
                <Button type="button" variant="plain">
                  Journey
                </Button>
              </Link>
            </div>
            <p className="mt-3 text-xs text-[var(--color-label-tertiary)]">
              Prefer Journal? Choose type <strong>Retrospective</strong> on a
              day view — same create path.
            </p>
            {err && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {err}
              </p>
            )}
          </section>

          <section className="surface-card border border-[var(--color-separator)] p-5">
            <h2 className="text-lg font-semibold text-[var(--color-label)]">
              Your retrospectives
            </h2>
            {items === null && (
              <p className="mt-3 text-sm text-[var(--color-label-tertiary)]">
                Loading…
              </p>
            )}
            {items && items.length === 0 && (
              <p className="mt-3 text-sm text-[var(--color-label-secondary)]">
                No retrospectives yet. Start one to create your maiden journey
                baseline.
              </p>
            )}
            {items && items.length > 0 && (
              <ul className="mt-4 divide-y divide-[var(--color-separator)]">
                {items.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/app/retrospective/${r.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-[var(--color-fill)]/40"
                    >
                      <div>
                        <p className="font-medium text-[var(--color-label)]">
                          {r.title || `Retrospective #${r.id}`}
                          {r.is_maiden && (
                            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-tint)]">
                              Maiden
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[var(--color-label-tertiary)]">
                          {fmtDate(r.scope_start)} → {fmtDate(r.scope_end)} ·{" "}
                          {r.status}
                        </p>
                      </div>
                      <span className="text-sm text-[var(--color-tint)]">
                        Open →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </PracticeSuiteChrome>
    </main>
  );
}
