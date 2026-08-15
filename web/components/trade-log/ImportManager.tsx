"use client";

// Import Manager — the red trashcan in the Trade Log toolbar opens this HIG dialog.
// Lists every import (date/time · source · account · count), previews the trades inside
// one, and deletes a specific import. Deletes are RECOVERABLE: a deleted import moves to
// a "Recently deleted" list and can be restored for 30 days, after which it's purged.
// HIG: design tokens + <Button> + useConfirm() (no hand-rolled styling).
// Spec: FatTail-Labs-Trade-Log-Import-Batches-Spec-v1.0.

import { useCallback, useEffect, useState } from "react";
import { Button, useConfirm } from "@/components/ui";
import { IconTrash } from "@/components/ui/icons";

type ImportRow = {
  id: number;
  created_at: string;
  deleted_at: string | null;
  adapter: string;
  account_label: string | null;
  source_filename: string | null;
  label: string | null;
  trade_count: number;
  skipped_count: number;
  campaign_name: string | null;
};
type PreviewTrade = {
  id: number;
  exec_at: string | null;
  strategy: string;
  net_price: number | null;
  net_side: string | null;
  legs_count: number;
  symbol: string | null;
};

function adapterLabel(a: string): string {
  switch (a) {
    case "thinkorswim": return "thinkorswim";
    case "native": return "FatTail canonical";
    case "csv_generic": return "CSV";
    default: return a;
  }
}
function fmtWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
      });
}
function daysLeft(deletedAt: string | null, recoverableDays: number): number {
  if (!deletedAt) return recoverableDays;
  const gone = new Date(deletedAt).getTime();
  if (Number.isNaN(gone)) return recoverableDays;
  const remainingMs = recoverableDays * 86400000 - (Date.now() - gone);
  return Math.max(0, Math.ceil(remainingMs / 86400000));
}

export default function ImportManager({
  onChanged,
  focusImportId = null,
  requestOpen = false,
  onDismiss,
}: {
  onChanged: () => void;
  /** Expand this batch when the blotter Import chip (or `?import=`) opens us. */
  focusImportId?: number | null;
  /** Open the existing dialog — do not add header chrome (Conor owns that). */
  requestOpen?: boolean;
  onDismiss?: () => void;
}) {
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [imports, setImports] = useState<ImportRow[] | null>(null);
  const [deleted, setDeleted] = useState<ImportRow[]>([]);
  const [recoverableDays, setRecoverableDays] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [preview, setPreview] = useState<Record<number, PreviewTrade[]>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    onDismiss?.();
  }, [onDismiss]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch("/api/me/trade-log/imports", { credentials: "same-origin" });
      if (!r.ok) { setError(await r.text()); setImports([]); setDeleted([]); return; }
      const d = await r.json();
      setImports(d.imports || []);
      setDeleted(d.deleted || []);
      if (typeof d.recoverable_days === "number") setRecoverableDays(d.recoverable_days);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setImports([]);
    }
  }, []);

  useEffect(() => {
    if (requestOpen || (focusImportId != null && focusImportId > 0)) {
      setOpen(true);
    }
  }, [requestOpen, focusImportId]);

  useEffect(() => {
    if (!open) return;
    setImports(null);
    setExpanded(null);
    setPreview({});
    void load();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, load, close]);

  useEffect(() => {
    if (!open || imports == null || focusImportId == null || focusImportId <= 0) {
      return;
    }
    setExpanded(focusImportId);
    if (preview[focusImportId]) return;
    let cancelled = false;
    void (async () => {
      const r = await fetch(`/api/me/trade-log/imports/${focusImportId}`, {
        credentials: "same-origin",
      });
      if (!r.ok || cancelled) return;
      const d = await r.json();
      setPreview((p) => ({ ...p, [focusImportId]: d.trades || [] }));
    })();
    return () => {
      cancelled = true;
    };
  }, [open, imports, focusImportId, preview]);

  async function togglePreview(id: number) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!preview[id]) {
      const r = await fetch(`/api/me/trade-log/imports/${id}`, { credentials: "same-origin" });
      if (r.ok) {
        const d = await r.json();
        setPreview((p) => ({ ...p, [id]: d.trades || [] }));
      }
    }
  }

  async function deleteImport(row: ImportRow) {
    const ok = await confirm({
      title: "Delete this import?",
      message:
        `${row.trade_count} trade${row.trade_count === 1 ? "" : "s"} from ` +
        `${adapterLabel(row.adapter)} on ${fmtWhen(row.created_at)} will be removed from ` +
        `your log. You can restore it from Recently deleted for ${recoverableDays} days.`,
      confirmLabel: "Delete import",
      destructive: true,
    });
    if (!ok) return;
    setBusyId(row.id);
    try {
      const r = await fetch(`/api/me/trade-log/imports/${row.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!r.ok) { setError(await r.text()); return; }
      setExpanded(null);
      await load();
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  async function restoreImport(row: ImportRow) {
    setBusyId(row.id);
    try {
      const r = await fetch(`/api/me/trade-log/imports/${row.id}/restore`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!r.ok) { setError(await r.text()); return; }
      await load();
      onChanged();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Manage imports"
        title="Manage imports — preview, delete or restore"
        className="inline-flex min-h-9 items-center justify-center rounded-full px-3 text-[var(--color-destructive)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-destructive)_12%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-destructive)]"
        data-testid="trade-log-manage-imports"
      >
        <IconTrash size={17} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="presentation">
          <div
            className="absolute inset-0 bg-[var(--color-overlay)]"
            aria-hidden
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Manage imports"
            className="relative flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-[var(--elevation-3)]"
          >
            <header className="flex items-center justify-between border-b border-[var(--color-separator)] px-5 py-3.5">
              <h2 className="text-[length:var(--text-headline)] font-semibold text-[var(--color-label)]">
                Manage imports
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-full px-2 py-1 text-sm text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {imports === null && (
                <p className="py-6 text-center text-sm text-[var(--color-label-tertiary)]">Loading…</p>
              )}
              {error && <p className="mb-2 text-sm text-[var(--color-destructive)]">{error}</p>}
              {imports && imports.length === 0 && deleted.length === 0 && (
                <p className="py-8 text-center text-sm text-[var(--color-label-tertiary)]">
                  No imports yet — imports you make show up here to preview or remove.
                  <br />
                  (Manually-added trades aren&apos;t part of an import.)
                </p>
              )}

              <ul className="space-y-2">
                {(imports || []).map((row) => (
                  <li
                    key={row.id}
                    className="rounded-[var(--radius-lg)] border border-[var(--color-separator)]"
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-[var(--color-label)]">
                          <span className="font-medium">{fmtWhen(row.created_at)}</span>
                          <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-xs">
                            {adapterLabel(row.adapter)}
                          </span>
                          <span className="text-[var(--color-label-secondary)]">
                            {row.trade_count} trade{row.trade_count === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-[var(--color-label-tertiary)]">
                          {row.account_label ? `${row.account_label} · ` : ""}
                          {row.source_filename || row.campaign_name || "no file name"} · #{row.id}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void togglePreview(row.id)}
                        className="shrink-0 rounded-full border border-[var(--color-separator)] px-3 py-1 text-xs font-medium text-[var(--color-label)] hover:bg-[var(--color-fill)]"
                      >
                        {expanded === row.id ? "Hide" : "Preview"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void deleteImport(row)}
                        className="shrink-0 rounded-full px-2.5 py-1 text-[var(--color-destructive)] hover:bg-[color-mix(in_srgb,var(--color-destructive)_12%,transparent)] disabled:opacity-40"
                        aria-label="Delete this import"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                    {expanded === row.id && (
                      <div className="border-t border-[var(--color-separator)] px-3 py-2">
                        {!preview[row.id] && (
                          <p className="text-xs text-[var(--color-label-tertiary)]">Loading trades…</p>
                        )}
                        {preview[row.id] && preview[row.id].length === 0 && (
                          <p className="text-xs text-[var(--color-label-tertiary)]">No trades.</p>
                        )}
                        {preview[row.id] && preview[row.id].length > 0 && (
                          <ul className="max-h-52 space-y-1 overflow-y-auto text-xs text-[var(--color-label-secondary)]">
                            {preview[row.id].map((t) => (
                              <li key={t.id} className="flex items-center justify-between gap-2">
                                <span className="truncate">
                                  {(t.exec_at || "").slice(0, 16).replace("T", " ")} · {t.strategy}
                                  {t.symbol ? ` · ${t.symbol}` : ""} · {t.legs_count} leg
                                  {t.legs_count === 1 ? "" : "s"}
                                </span>
                                {t.net_price != null && (
                                  <span className="shrink-0 tabular-nums text-[var(--color-label-tertiary)]">
                                    {t.net_price} {t.net_side || ""}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {deleted.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                    Recently deleted · restorable for {recoverableDays} days
                  </h3>
                  <ul className="space-y-2">
                    {deleted.map((row) => {
                      const left = daysLeft(row.deleted_at, recoverableDays);
                      return (
                        <li
                          key={row.id}
                          className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-separator)] px-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 text-sm text-[var(--color-label-secondary)]">
                              <span className="font-medium">{fmtWhen(row.created_at)}</span>
                              <span className="text-xs">{adapterLabel(row.adapter)}</span>
                              <span className="text-xs">{row.trade_count} trades</span>
                            </div>
                            <div className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
                              deleted {fmtWhen(row.deleted_at)} · removed in {left} day{left === 1 ? "" : "s"} · #{row.id}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => void togglePreview(row.id)}
                            className="shrink-0 rounded-full border border-[var(--color-separator)] px-3 py-1 text-xs font-medium text-[var(--color-label)] hover:bg-[var(--color-fill)]"
                          >
                            {expanded === row.id ? "Hide" : "Preview"}
                          </button>
                          <Button
                            variant="secondary"
                            disabled={busyId === row.id}
                            onClick={() => void restoreImport(row)}
                          >
                            Restore
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                  {expanded !== null && deleted.some((r) => r.id === expanded) && preview[expanded] && (
                    <ul className="mt-1 max-h-52 space-y-1 overflow-y-auto rounded-[var(--radius-md)] bg-[var(--color-fill)] px-3 py-2 text-xs text-[var(--color-label-secondary)]">
                      {preview[expanded].map((t) => (
                        <li key={t.id} className="flex items-center justify-between gap-2">
                          <span className="truncate">
                            {(t.exec_at || "").slice(0, 16).replace("T", " ")} · {t.strategy}
                            {t.symbol ? ` · ${t.symbol}` : ""} · {t.legs_count} leg{t.legs_count === 1 ? "" : "s"}
                          </span>
                          {t.net_price != null && (
                            <span className="shrink-0 tabular-nums text-[var(--color-label-tertiary)]">
                              {t.net_price} {t.net_side || ""}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <footer className="flex items-center justify-end border-t border-[var(--color-separator)] px-5 py-3">
              <Button variant="secondary" onClick={close}>Done</Button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
