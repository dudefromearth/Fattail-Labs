"use client";

/**
 * Practice → Campaign (human mode).
 * Path: /app/practice/campaign
 *
 * Campaign = context of work (capital, goals, group of trades) — same concept
 * as Strategy Lab campaign, separate product (manual vs automated).
 * Multiple active campaigns; optional account scope (DL-259).
 */

import { useCallback, useEffect, useState } from "react";
import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import { Button } from "@/components/ui";
import {
  createCampaign,
  fetchCampaigns,
  patchCampaign,
  type PracticeCampaign,
} from "@/lib/practiceSpineApi";
import { fetchAccounts } from "@/lib/tradeLogAnalytics";
import type { Account } from "@/lib/tradeLog";

export default function PracticeCampaignPage() {
  const [campaigns, setCampaigns] = useState<PracticeCampaign[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [accountId, setAccountId] = useState<number | "">("");
  const [capital, setCapital] = useState("");
  const [goals, setGoals] = useState("");
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, acctRes] = await Promise.all([
        fetchCampaigns(),
        fetchAccounts(),
      ]);
      setCampaigns(d.campaigns || []);
      if (acctRes.ok) {
        setAccounts((acctRes.data.accounts || []).filter((a) => a.status === "active"));
      } else {
        setAccounts([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load campaigns");
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function accountLabel(id: number | null | undefined): string {
    if (id == null) return "Any account";
    const a = accounts.find((x) => x.id === id);
    return a?.label || `Account ${id}`;
  }

  async function startCampaign() {
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      let cap: number | null = null;
      if (capital.trim()) {
        cap = Number(capital);
        if (!Number.isFinite(cap) || cap < 0) {
          throw new Error("Starting capital must be a non-negative number");
        }
      }
      await createCampaign({
        title: title.trim(),
        activate: true,
        account_id: accountId === "" ? null : accountId,
        starting_capital: cap,
        goals_md: goals.trim() || null,
      });
      setTitle("");
      setAccountId("");
      setCapital("");
      setGoals("");
      setCreating(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start campaign");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(c: PracticeCampaign, status: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await patchCampaign(c.id, { status });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6 pb-24 sm:px-6">
      <PracticeSuiteChrome active="campaign">
        <div className="mt-4 space-y-4" data-testid="practice-campaign-page">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => setCreating(true)}
              data-testid="campaign-new"
            >
              New campaign
            </Button>
          </div>

          {creating && (
            <div className="space-y-3 rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Campaign name"
                className="w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-sm"
                data-testid="campaign-title-input"
                autoFocus
              />
              <div className="flex flex-wrap gap-3">
                <label className="block min-w-[10rem] flex-1 text-xs font-medium text-[var(--color-label-secondary)]">
                  Account
                  <select
                    className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-2 text-sm text-[var(--color-label)]"
                    value={accountId === "" ? "" : String(accountId)}
                    onChange={(e) =>
                      setAccountId(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    data-testid="campaign-account"
                  >
                    <option value="">Any account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block min-w-[8rem] text-xs font-medium text-[var(--color-label-secondary)]">
                  Starting capital
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={capital}
                    onChange={(e) => setCapital(e.target.value)}
                    placeholder="Optional"
                    className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-2 text-sm tabular-nums"
                    data-testid="campaign-capital"
                  />
                </label>
              </div>
              <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                Goals
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={2}
                  placeholder="Optional — what this campaign is for"
                  className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-sm"
                  data-testid="campaign-goals"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  disabled={busy || !title.trim()}
                  onClick={() => void startCampaign()}
                  data-testid="campaign-start"
                >
                  Activate
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setCreating(false);
                    setTitle("");
                    setAccountId("");
                    setCapital("");
                    setGoals("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {loading && (
            <p className="text-sm text-[var(--color-label-tertiary)]">
              Loading…
            </p>
          )}

          {!loading && campaigns.length === 0 && (
            <p className="text-sm text-[var(--color-label-tertiary)]">
              No campaigns yet.
            </p>
          )}

          {!loading && campaigns.length > 0 && (
            <ul className="divide-y divide-[var(--color-separator)] rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)]">
              {campaigns.map((c) => {
                const isActive = c.status === "active";
                return (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                    data-testid={`campaign-row-${c.id}`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--color-label)]">
                        {c.title}
                        {isActive ? (
                          <span className="ml-2 rounded-full bg-[var(--color-tint)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-on-tint)]">
                            active
                          </span>
                        ) : (
                          <span className="ml-2 text-[10px] font-semibold uppercase text-[var(--color-label-tertiary)]">
                            {c.status}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
                        {accountLabel(c.account_id)}
                        {c.starting_capital != null
                          ? ` · capital $${Number(c.starting_capital).toLocaleString()}`
                          : ""}
                      </p>
                      {c.goals_md ? (
                        <p className="mt-1 max-w-xl text-xs text-[var(--color-label-secondary)]">
                          {c.goals_md}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!isActive && (
                        <button
                          type="button"
                          disabled={busy}
                          className="text-xs font-medium text-[var(--color-tint)] hover:underline disabled:opacity-50"
                          onClick={() => void setStatus(c, "active")}
                        >
                          Activate
                        </button>
                      )}
                      {isActive && (
                        <button
                          type="button"
                          disabled={busy}
                          className="text-xs font-medium text-[var(--color-tint)] hover:underline disabled:opacity-50"
                          onClick={() => void setStatus(c, "completed")}
                          data-testid="campaign-complete"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PracticeSuiteChrome>
    </main>
  );
}
