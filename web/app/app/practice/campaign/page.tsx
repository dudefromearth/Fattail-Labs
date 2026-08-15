"use client";

/**
 * Practice → Campaigns library (card grid + covers).
 * Edit opens dedicated page /app/practice/campaign/[id] — same pattern as Playbook.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import CampaignCover from "@/components/practice/CampaignCover";
import { Button } from "@/components/ui";
import { CAMPAIGN_FRAMES } from "@/lib/campaignFrames";
import {
  createCampaign,
  fetchCampaigns,
  renewCampaign,
  type PracticeCampaign,
} from "@/lib/practiceSpineApi";
import { fetchAccounts } from "@/lib/tradeLogAnalytics";
import type { Account } from "@/lib/tradeLog";
import { campaignTitleLooksLikeBook } from "@/lib/campaignName";
import TradeFindTag from "@/components/trade-log/TradeFindTag";
import CampaignBadge from "@/components/practice/CampaignBadge";
import CampaignColorPicker from "@/components/practice/CampaignColorPicker";
import { normalizeCampaignHex } from "@/lib/campaignBadge";

function statusLabel(c: PracticeCampaign): string {
  switch (c.status) {
    case "active":
      return "Active";
    case "planned":
      return c.activated_at ? "Paused" : "Not started";
    case "completed":
      return "Completed";
    case "abandoned":
      return "Ended early";
    default:
      return c.status;
  }
}

export default function PracticeCampaignPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<PracticeCampaign[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [accountId, setAccountId] = useState<number | "">("");
  const [asDefault, setAsDefault] = useState(false);
  const [frameId, setFrameId] = useState<string | null>(null);
  const [goals, setGoals] = useState("");
  const [capital, setCapital] = useState("");
  const [maxDdPct, setMaxDdPct] = useState("15");
  const [startsAt, setStartsAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [badgeColor, setBadgeColor] = useState("#1D4ED8");
  const [busy, setBusy] = useState(false);
  /** Open = planned|active; Archive = completed|abandoned (status sole authority). */
  const [libraryView, setLibraryView] = useState<"open" | "archive">("open");

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
        setAccounts(
          (acctRes.data.accounts || []).filter((a) => a.status === "active"),
        );
        const used = new Set(
          (d.campaigns || [])
            .map((c) => normalizeCampaignHex(c.badge_color))
            .filter(Boolean),
        );
        const next =
          [
            "#1D4ED8",
            "#0F766E",
            "#B45309",
            "#BE123C",
            "#7C3AED",
            "#0369A1",
            "#15803D",
            "#C2410C",
          ].find((c) => !used.has(c)) || "#1D4ED8";
        setBadgeColor(next);
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

  function applyFrame(id: string) {
    const f = CAMPAIGN_FRAMES.find((x) => x.id === id);
    if (!f) return;
    setFrameId(id);
    setGoals(f.goalsScaffold);
    if (!title.trim()) setTitle(f.label);
  }

  async function createAndOpen() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (asDefault && accountId === "") {
        throw new Error("Default requires a trade account");
      }
      const cap = capital.trim() ? Number(capital) : NaN;
      const mdd = maxDdPct.trim() ? Number(maxDdPct) : NaN;
      if (!asDefault) {
        if (!Number.isFinite(cap) || cap < 0) {
          throw new Error("Capital allocation is required to activate");
        }
        if (!Number.isFinite(mdd) || mdd <= 0 || mdd > 100) {
          throw new Error("Max drawdown % is required (0 exclusive … 100]");
        }
        if (!startsAt) {
          throw new Error("Start date is required to activate");
        }
      }
      const camp = await createCampaign({
        title: title.trim() || `Campaign ${new Date().toISOString().slice(0, 10)}`,
        activate: true,
        account_id: accountId === "" ? null : accountId,
        goals_md: goals.trim() || null,
        is_default: asDefault,
        starting_capital: asDefault ? (Number.isFinite(cap) ? cap : null) : cap,
        max_drawdown_pct: asDefault ? (Number.isFinite(mdd) ? mdd : null) : mdd,
        starts_at: startsAt || null,
        badge_color: badgeColor,
      });
      router.push(`/app/practice/campaign/${camp.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create campaign");
      setBusy(false);
    }
  }

  async function renewFromArchive(c: PracticeCampaign) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const next = await renewCampaign(c.id);
      router.push(`/app/practice/campaign/${next.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not renew campaign");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 pb-24 sm:px-6">
      <PracticeSuiteChrome
        active="campaign"
        hideStoryStrip
        hideToughness
        breadcrumbUnderTitle
      >
        <div className="mt-6 space-y-4" data-testid="practice-campaign-page">
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

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {creating && (
            <div
              className="surface-card border border-[var(--color-separator)] p-4 sm:p-5"
              data-testid="campaign-create"
            >
              <div className="mb-3 flex flex-wrap gap-2">
                {CAMPAIGN_FRAMES.map((f) => {
                  const on = frameId === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        on ? setFrameId(null) : applyFrame(f.id)
                      }
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        on
                          ? "border-[var(--color-tint)] bg-[var(--color-tint)]/15 text-[var(--color-tint)]"
                          : "border-[var(--color-separator)] text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
              <p
                className="mb-3 rounded-md border border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-3 py-2 text-xs text-[var(--color-label-secondary)]"
                data-testid="campaign-cr12-banner"
              >
                Before you activate: this charter is a deliberate phase. Same-bet
                and advanced terms stay optional. Trade log stays open without a
                campaign.
              </p>
              <div className="grid gap-3 sm:grid-cols-3" data-testid="campaign-create-big-three">
                <label className="block text-sm font-semibold text-[var(--color-label)]">
                  Capital allocation
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-base tabular-nums"
                    value={capital}
                    onChange={(e) => setCapital(e.target.value)}
                    data-testid="campaign-capital-input"
                    placeholder="Required"
                  />
                </label>
                <label className="block text-sm font-semibold text-[var(--color-label)]">
                  Max drawdown %
                  <input
                    type="number"
                    min={0.01}
                    max={100}
                    step={0.5}
                    className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-base tabular-nums"
                    value={maxDdPct}
                    onChange={(e) => setMaxDdPct(e.target.value)}
                    data-testid="campaign-max-dd-input"
                  />
                </label>
                <label className="block text-sm font-semibold text-[var(--color-label)]">
                  Starts
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-base"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    data-testid="campaign-starts-input"
                  />
                </label>
              </div>
              <label className="mt-3 block text-xs font-medium text-[var(--color-label-secondary)]">
                Title
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Campaign name (optional — defaults if blank)"
                  data-testid="campaign-title-input"
                  autoFocus
                />
                {campaignTitleLooksLikeBook(title) ? (
                  <span className="mt-1 block text-[11px] font-normal text-[var(--color-label-secondary)]">
                    A book is an account. This name is a campaign badge, not a
                    book.
                  </span>
                ) : null}
              </label>
              <div className="mt-3">
                <CampaignColorPicker
                  value={badgeColor}
                  onChange={setBadgeColor}
                  taken={campaigns
                    .map((c) => c.badge_color || "")
                    .filter(Boolean)}
                />
              </div>
              <label className="mt-3 block text-xs font-medium text-[var(--color-label-secondary)]">
                Trade account
                <select
                  className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-2 text-sm"
                  value={accountId === "" ? "" : String(accountId)}
                  onChange={(e) =>
                    setAccountId(e.target.value ? Number(e.target.value) : "")
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
              <label className="mt-3 flex items-center gap-2 text-xs text-[var(--color-label-secondary)]">
                <input
                  type="checkbox"
                  checked={asDefault}
                  disabled={accountId === ""}
                  onChange={(e) => setAsDefault(e.target.checked)}
                  data-testid="campaign-as-default"
                />
                Use as default for this account
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  disabled={
                    busy ||
                    campaigns.some(
                      (c) =>
                        normalizeCampaignHex(c.badge_color) ===
                        normalizeCampaignHex(badgeColor),
                    )
                  }
                  onClick={() => void createAndOpen()}
                  data-testid="campaign-start"
                >
                  {busy ? "Creating…" : "Open campaign"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    setCreating(false);
                    setTitle("");
                    setGoals("");
                    setFrameId(null);
                    setAsDefault(false);
                    setAccountId("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <p className="text-sm text-[var(--color-label-tertiary)]">
              Loading…
            </p>
          )}

          {/* Open / Archive — status is sole authority (spec §4.5.5) */}
          {!loading && campaigns.length > 0 && (
            <div
              className="inline-flex rounded-full bg-[var(--color-fill)] p-0.5"
              role="group"
              aria-label="Campaign library view"
              data-testid="campaign-open-archive"
            >
              {(
                [
                  { id: "open" as const, label: "Open" },
                  { id: "archive" as const, label: "Archive" },
                ] as const
              ).map((v) => {
                const on = libraryView === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setLibraryView(v.id)}
                    className={
                      on
                        ? "rounded-full bg-[var(--color-surface)] px-3.5 py-1.5 text-sm font-medium text-[var(--color-label)] shadow-sm"
                        : "rounded-full px-3.5 py-1.5 text-sm font-medium text-[var(--color-label-secondary)] hover:text-[var(--color-label)]"
                    }
                    aria-pressed={on}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          )}

          {!loading &&
            !creating &&
            campaigns.length === 0 && (
              <div
                className="surface-card border border-[var(--color-separator)] px-5 py-8 text-center"
                data-testid="campaign-empty-offer"
              >
                <p className="font-semibold text-[var(--color-label)]">
                  Setting up your account…
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-label-secondary)]">
                  Your default account ledger should appear automatically. If this
                  stays empty, open Trade Log once, then return here — or create a
                  new campaign.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => void load()}
                    data-testid="campaign-empty-reload"
                  >
                    Refresh
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCreating(true)}
                    data-testid="campaign-empty-start"
                  >
                    New campaign
                  </Button>
                </div>
              </div>
            )}

          <ul
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            data-testid="campaign-library"
          >
            {campaigns
              .filter((c) => {
                // Ledger never appears in Archive (furniture, not a completed contract)
                if (libraryView === "archive") {
                  if (c.is_ledger) return false;
                  return (
                    c.status === "completed" || c.status === "abandoned"
                  );
                }
                return c.status === "active" || c.status === "planned";
              })
              .slice()
              .sort((a, b) => {
                // Ledgers first (pinned furniture)
                const la = a.is_ledger ? 0 : 1;
                const lb = b.is_ledger ? 0 : 1;
                if (la !== lb) return la - lb;
                return (a.title || "").localeCompare(b.title || "");
              })
              .map((c) => (
              <li key={c.id}>
                <article
                  className={`surface-card flex h-full flex-col border p-4 transition hover:border-[var(--color-tint)] ${
                    c.is_ledger
                      ? "border-[var(--color-tint)]/40 bg-[var(--color-fill)]/30"
                      : "border-[var(--color-separator)]"
                  }`}
                  data-testid={`campaign-row-${c.id}`}
                  data-ledger={c.is_ledger ? "1" : "0"}
                >
                  <div
                    className="mb-3"
                    onClick={(ev) => ev.stopPropagation()}
                    onKeyDown={(ev) => ev.stopPropagation()}
                  >
                    <CampaignCover
                      campaignId={c.id}
                      hasCover={!!c.has_cover}
                      coverUrl={c.cover_url}
                      disabled={busy}
                      onChange={(updated) => {
                        setCampaigns((prev) =>
                          prev.map((row) =>
                            row.id === updated.id
                              ? { ...row, ...updated }
                              : row,
                          ),
                        );
                      }}
                    />
                  </div>
                  <Link
                    href={`/app/practice/campaign/${c.id}`}
                    className="flex flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
                  >
                    <h3 className="font-semibold text-[var(--color-label)]">
                      <CampaignBadge
                        title={c.title}
                        color={c.badge_color}
                        className="max-w-full text-[13px] font-semibold"
                      />
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-[var(--color-tint-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label)]">
                        {statusLabel(c)}
                      </span>
                      {c.cycle_number != null && c.cycle_number > 1 && (
                        <span
                          className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]"
                          data-testid="campaign-cycle-chip"
                        >
                          Cycle {c.cycle_number}
                        </span>
                      )}
                      {c.is_ledger && (
                        <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
                          Ledger · {accountLabel(c.account_id)}
                        </span>
                      )}
                      {c.is_default && !c.is_ledger && (
                        <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
                          Default · {accountLabel(c.account_id)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
                      {accountLabel(c.account_id)}
                    </p>
                    {c.goals_md ? (
                      <p className="mt-2 line-clamp-3 text-xs text-[var(--color-label-tertiary)]">
                        {c.goals_md}
                      </p>
                    ) : null}
                  </Link>
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--color-separator)] pt-3">
                    <Link
                      href={`/app/practice/campaign/${c.id}`}
                      className="text-xs font-medium text-[var(--color-tint)] hover:underline"
                      data-testid="campaign-edit"
                    >
                      {libraryView === "archive" ? "View" : "Open"}
                    </Link>
                    {libraryView === "archive" && (
                      <button
                        type="button"
                        className="text-xs font-medium text-[var(--color-label-secondary)] hover:underline disabled:opacity-50"
                        disabled={busy}
                        onClick={() => void renewFromArchive(c)}
                        data-testid="campaign-library-renew"
                      >
                        Renew
                      </button>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>

          {!loading &&
            campaigns.length > 0 &&
            libraryView === "archive" &&
            campaigns.every(
              (c) => c.status !== "completed" && c.status !== "abandoned",
            ) && (
              <p
                className="text-center text-sm text-[var(--color-label-tertiary)]"
                data-testid="campaign-archive-empty"
              >
                No archived campaigns yet.
              </p>
            )}

          <div id="find-badge" className="scroll-mt-6">
            <h2
              className="cursor-help font-semibold tracking-tight text-[var(--color-label)]"
              style={{ fontSize: "var(--text-title-2)", lineHeight: 1.2 }}
              title="Search every account (each account is one book). Assign or clear campaign badges. A campaign is not a book."
            >
              Find and Badge
            </h2>
            <div className="mt-3">
              <TradeFindTag />
            </div>
          </div>
        </div>
      </PracticeSuiteChrome>
    </main>
  );
}
