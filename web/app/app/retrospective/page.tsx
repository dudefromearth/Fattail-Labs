"use client";

/**
 * Retrospective library — Spec v0.2 + list paging (10 / page).
 * Create starts from Journal type = Retrospective.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import RetroCadenceNudge from "@/components/RetroCadenceNudge";
import RetroMaterialNotice from "@/components/RetroMaterialNotice";
import { Button } from "@/components/ui";
import type { ProcessPayload } from "@/components/ProcessMeter";
import {
  createRetrospective,
  listRetrospectives,
  previewRetroScope,
  RETRO_LIST_PAGE_SIZE,
  type Retrospective,
  type RetroScopePreview,
} from "@/lib/retrospectiveApi";
import { confirmStartRetrospective } from "@/lib/retroCreateGuard";

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return iso.slice(0, 10);
  }
}

/**
 * Page buttons: current page plus the next three pages (when they exist),
 * plus End (last page). Previous when not on page 1.
 */
function pageWindow(current: number, totalPages: number): number[] {
  if (totalPages < 1) return [];
  const start = Math.max(1, Math.min(current, totalPages));
  const end = Math.min(start + 3, totalPages);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

export default function RetrospectivePage() {
  const router = useRouter();
  const [items, setItems] = useState<Retrospective[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [scope, setScope] = useState<RetroScopePreview | null>(null);
  const [process, setProcess] = useState<ProcessPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [listBusy, setListBusy] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / RETRO_LIST_PAGE_SIZE) || 1),
    [total],
  );

  const loadList = useCallback(async (pageNum: number) => {
    setListBusy(true);
    setErr(null);
    try {
      const offset = (pageNum - 1) * RETRO_LIST_PAGE_SIZE;
      const pageData = await listRetrospectives({
        limit: RETRO_LIST_PAGE_SIZE,
        offset,
      });
      setItems(pageData.retrospectives);
      setTotal(pageData.total);
      // Clamp page if total shrank (e.g. after complete elsewhere).
      const pages = Math.max(1, Math.ceil(pageData.total / RETRO_LIST_PAGE_SIZE) || 1);
      if (pageNum > pages) {
        setPage(pages);
        if (pages !== pageNum) {
          const again = await listRetrospectives({
            limit: RETRO_LIST_PAGE_SIZE,
            offset: (pages - 1) * RETRO_LIST_PAGE_SIZE,
          });
          setItems(again.retrospectives);
          setTotal(again.total);
        }
      } else {
        setPage(pageNum);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
      setItems([]);
      setTotal(0);
    } finally {
      setListBusy(false);
    }
  }, []);

  const loadShell = useCallback(() => {
    Promise.all([
      previewRetroScope().catch(() => null),
      fetch("/api/me/journey/scores", { credentials: "same-origin" })
        .then(async (r) => {
          if (!r.ok) return null;
          const d = await r.json();
          return (d.process as ProcessPayload) || null;
        })
        .catch(() => null),
    ])
      .then(([sc, proc]) => {
        setScope(sc);
        setProcess(proc);
      })
      .catch(() => {
        /* non-fatal for library */
      });
  }, []);

  useEffect(() => {
    loadShell();
    void loadList(1);
  }, [loadShell, loadList]);

  async function startFromHere() {
    setErr(null);
    // Scope dates + lock warning before any create (Journal uses the same guard).
    try {
      const { ok } = await confirmStartRetrospective();
      if (!ok) return;
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "Could not prepare retrospective",
      );
      return;
    }
    setBusy(true);
    try {
      const r = await createRetrospective({ gather: true });
      router.push(`/app/retrospective/${r.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not start");
      setBusy(false);
    }
  }

  const goToPage = (p: number) => {
    const next = Math.max(1, Math.min(p, totalPages));
    if (next === page && items !== null) return;
    void loadList(next);
  };

  const windowPages = pageWindow(page, totalPages);
  const rangeStart = total === 0 ? 0 : (page - 1) * RETRO_LIST_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * RETRO_LIST_PAGE_SIZE, total);
  const showPager = total > RETRO_LIST_PAGE_SIZE;

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6 pb-24 sm:px-6">
      <PracticeSuiteChrome
        active="retrospective"
        subtitle="Periodic look-back: gather since last retrospective, dual report, integrity."
      >
        <div className="mt-6 space-y-6" data-testid="retrospective-library">
          <RetroMaterialNotice />
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
              and process performance — plus Process Flow, and comparison to
              prior retros when they exist.
            </p>
            {scope && (
              <div
                className="mt-4 rounded-[var(--radius-md)] border border-amber-300/80 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/40"
                data-testid="retro-scope-warning"
                role="status"
              >
                <p className="text-sm font-medium text-[var(--color-label)]">
                  Next scope: {scope.label}
                </p>
                <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
                  <span className="font-medium text-[var(--color-label)]">
                    {fmtDate(scope.scope_start)} → {fmtDate(scope.scope_end)}
                  </span>
                  {" — "}
                  journal and trades in this window are included.
                </p>
                <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
                  Once you complete the retrospective, those journal dates
                  close — you will not be able to modify those journal entries
                  or attachments. The trade sample for the review is fixed at
                  gather.
                </p>
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                disabled={busy}
                onClick={() => void startFromHere()}
                data-testid="retro-start-button"
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
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-[var(--color-label)]">
                Your retrospectives
              </h2>
              {total > 0 && (
                <p
                  className="text-xs text-[var(--color-label-tertiary)]"
                  data-testid="retro-list-range"
                >
                  {rangeStart}–{rangeEnd} of {total}
                  {listBusy ? " · Loading…" : ""}
                </p>
              )}
            </div>
            {items === null && (
              <p className="mt-3 text-sm text-[var(--color-label-tertiary)]">
                Loading…
              </p>
            )}
            {items && items.length === 0 && total === 0 && (
              <p className="mt-3 text-sm text-[var(--color-label-secondary)]">
                No retrospectives yet. Start one to create your maiden journey
                baseline.
              </p>
            )}
            {items && items.length > 0 && (
              <ul
                className="mt-4 divide-y divide-[var(--color-separator)]"
                data-testid="retro-list"
              >
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

            {showPager && (
              <nav
                className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--color-separator)] pt-4"
                aria-label="Retrospective list pages"
                data-testid="retro-list-pager"
              >
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page <= 1 || listBusy}
                  onClick={() => goToPage(page - 1)}
                  aria-label="Previous page"
                >
                  Previous
                </Button>
                {windowPages.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={p === page ? "primary" : "secondary"}
                    disabled={listBusy}
                    onClick={() => goToPage(p)}
                    aria-label={
                      p === page ? `Page ${p}, current` : `Go to page ${p}`
                    }
                    aria-current={p === page ? "page" : undefined}
                    data-testid={`retro-page-${p}`}
                  >
                    {p}
                  </Button>
                ))}
                {page < totalPages && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={listBusy}
                    onClick={() => goToPage(totalPages)}
                    aria-label={`Go to last page, page ${totalPages}`}
                    data-testid="retro-page-end"
                  >
                    End
                    <span className="ml-1 text-[var(--color-label-tertiary)]">
                      ({totalPages})
                    </span>
                  </Button>
                )}
                <span className="ml-auto text-xs text-[var(--color-label-tertiary)]">
                  Page {page} of {totalPages}
                </span>
              </nav>
            )}
          </section>
        </div>
      </PracticeSuiteChrome>
    </main>
  );
}
