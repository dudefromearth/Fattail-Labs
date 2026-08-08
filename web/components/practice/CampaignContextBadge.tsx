"use client";

/**
 * Active practice campaign badge + quick activate/complete (Phase 1).
 * Multi-active: shows prefill campaign (§4.7) + count; manage on Campaign page.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  createCampaign,
  fetchCampaigns,
  patchCampaign,
  type PracticeCampaign,
} from "@/lib/practiceSpineApi";

export default function CampaignContextBadge() {
  const [active, setActive] = useState<PracticeCampaign | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await fetchCampaigns();
      setActive(d.active);
      const n =
        d.actives?.length ??
        (d.active ? 1 : 0);
      setActiveCount(n);
    } catch {
      setActive(null);
      setActiveCount(0);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function startCampaign() {
    if (!title.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await createCampaign({ title: title.trim(), activate: true });
      setTitle("");
      setOpen(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not start campaign");
    } finally {
      setBusy(false);
    }
  }

  async function completeCampaign() {
    if (!active || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await patchCampaign(active.id, { status: "completed" });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not complete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="campaign-context-badge"
    >
      {active ? (
        <>
          <Link
            href="/app/practice/campaign"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-tint-soft)] px-3 py-1 text-xs font-medium text-[var(--color-label)] hover:opacity-90"
            title="Manage campaigns"
          >
            Campaign: {active.title}
            {activeCount > 1 ? (
              <span className="text-[var(--color-label-tertiary)]">
                +{activeCount - 1}
              </span>
            ) : null}
          </Link>
          <Link
            href={`/app/trade-log?campaign=${active.id}`}
            className="text-xs font-medium text-[var(--color-tint)] hover:underline"
            data-testid="campaign-badge-trade-log"
          >
            Trade Log
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => void completeCampaign()}
            className="text-xs font-medium text-[var(--color-tint)] hover:underline disabled:opacity-50"
            data-testid="campaign-complete"
          >
            Complete campaign
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs font-medium text-[var(--color-tint)] hover:underline"
          data-testid="campaign-start-toggle"
        >
          Start a practice campaign
        </button>
      )}
      {open && !active && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Campaign name"
            className="min-w-[10rem] flex-1 rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1 text-xs sm:flex-none"
            data-testid="campaign-title-input"
          />
          <button
            type="button"
            disabled={busy || !title.trim()}
            onClick={() => void startCampaign()}
            className="rounded-full bg-[var(--color-tint)] px-3 py-1 text-xs font-medium text-[var(--color-on-tint)] disabled:opacity-50"
            data-testid="campaign-start"
          >
            Activate
          </button>
        </div>
      )}
      {err && (
        <p className="w-full text-xs text-red-600" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
