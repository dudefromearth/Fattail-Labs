"use client";

/**
 * Campaign editor — dedicated focus surface (same pattern as Playbook book page).
 * Path: /app/practice/campaign/[campaignId]
 * Cover is library-only; not edited here.
 * Lifecycle: Signed / Amendments / Lineage / Renew (Concept Spec §4.5).
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import CampaignPanel from "@/components/practice/CampaignPanel";
import CampaignTaggedTrades from "@/components/practice/CampaignTaggedTrades";
import { Button } from "@/components/ui";
import {
  fetchCampaign,
  fetchCampaignAmendments,
  fetchCampaignPhaseReport,
  patchCampaign,
  renewCampaign,
  type CampaignAmendment,
  type CampaignPhaseReport,
  type PracticeCampaign,
} from "@/lib/practiceSpineApi";
import { fetchAccounts } from "@/lib/tradeLogAnalytics";
import type { Account } from "@/lib/tradeLog";
import { campaignTitleLooksLikeBook } from "@/lib/campaignName";
import { usePracticeContext } from "@/lib/practiceContext";
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
      // Storage: abandoned. Member-facing: early end (not Complete, not Pause).
      return "Ended early";
    default:
      return c.status;
  }
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fieldLabel(field: string): string {
  switch (field) {
    case "title":
      return "Title";
    case "goals_md":
      return "Goals";
    case "starting_capital":
      return "Capital allocation";
    case "max_drawdown_pct":
      return "Max drawdown %";
    case "capital_allocation_mode":
      return "Allocation mode";
    case "capital_allocation_note":
      return "Allocation note";
    case "strategy_codes":
      return "Strategies";
    case "same_bet":
      return "Same-bet";
    case "retrospective_id":
      return "Retrospective";
    case "account_id":
      return "Account";
    case "starts_at":
      return "Starts";
    case "ends_at":
      return "Ends";
    case "status":
      return "Status";
    default:
      return field;
  }
}

function formatAmendValue(field: string, raw: string | null | undefined): string {
  if (raw == null || raw === "") return "—";
  if (field === "starting_capital") {
    const n = Number(raw);
    if (Number.isFinite(n)) {
      return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
  }
  if (field === "starts_at" || field === "ends_at") {
    return formatWhen(raw) || raw;
  }
  if (field === "status") {
    if (raw === "planned") return "Paused / not started";
    if (raw === "active") return "Active";
    if (raw === "completed") return "Completed";
    if (raw === "abandoned") return "Ended early";
  }
  const s = String(raw);
  return s.length > 120 ? `${s.slice(0, 117)}…` : s;
}

function signatureChrome(c: PracticeCampaign): {
  kind: "signed" | "terms_as_of" | "never";
  label: string;
  date: string;
} {
  if (!c.signed_at) {
    return { kind: "never", label: "Never signed", date: "" };
  }
  const date = formatWhen(c.signed_at);
  if (c.signed_terms_backfilled) {
    return {
      kind: "terms_as_of",
      label: date ? `Terms as of ${date}` : "Terms as of activation",
      date,
    };
  }
  return {
    kind: "signed",
    label: date ? `Signed · ${date}` : "Signed",
    date,
  };
}

export default function CampaignEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { refreshCampaigns, campaigns: ctxCampaigns } = usePracticeContext();
  const campaignId = Number(params?.campaignId);

  const [campaign, setCampaign] = useState<PracticeCampaign | null>(null);
  const [amendments, setAmendments] = useState<CampaignAmendment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const [title, setTitle] = useState("");
  const [badgeColor, setBadgeColor] = useState("#1D4ED8");
  const [accountId, setAccountId] = useState<number | "">("");
  const [capital, setCapital] = useState("");
  const [maxDdPct, setMaxDdPct] = useState("");
  const [allocMode, setAllocMode] = useState("fixed");
  const [allocNote, setAllocNote] = useState("");
  const [goals, setGoals] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [strategiesText, setStrategiesText] = useState("");
  const [sameBetWhat, setSameBetWhat] = useState("");
  const [sameBetLean, setSameBetLean] = useState("");
  const [sameBetRegime, setSameBetRegime] = useState("");
  const [sameBetKills, setSameBetKills] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [phaseReport, setPhaseReport] = useState<CampaignPhaseReport | null>(
    null,
  );

  const load = useCallback(async () => {
    if (!campaignId || Number.isNaN(campaignId)) return;
    setLoading(true);
    setError(null);
    try {
      const [c, acctRes, amends] = await Promise.all([
        fetchCampaign(campaignId),
        fetchAccounts(),
        fetchCampaignAmendments(campaignId).catch(() => [] as CampaignAmendment[]),
      ]);
      setCampaign(c);
      setAmendments(amends);
      setTitle(c.title || "");
      setBadgeColor(normalizeCampaignHex(c.badge_color) || "#1D4ED8");
      setAccountId(c.account_id ?? "");
      setCapital(
        c.starting_capital != null && Number.isFinite(Number(c.starting_capital))
          ? String(c.starting_capital)
          : "",
      );
      setMaxDdPct(
        c.max_drawdown_pct != null && Number.isFinite(Number(c.max_drawdown_pct))
          ? String(c.max_drawdown_pct)
          : "",
      );
      setAllocMode(c.capital_allocation_mode || "fixed");
      setAllocNote(c.capital_allocation_note || "");
      setGoals(c.goals_md || "");
      setStartsAt((c.starts_at || "").slice(0, 10));
      setEndsAt((c.ends_at || "").slice(0, 10));
      setStrategiesText((c.strategy_codes || []).join(", "));
      const sb = c.same_bet || {};
      setSameBetWhat(String(sb.what ?? sb.trading ?? ""));
      setSameBetLean(String(sb.leaning ?? ""));
      setSameBetRegime(String(sb.regime ?? ""));
      setSameBetKills(String(sb.kills ?? ""));
      if (
        c.goals_md ||
        c.ends_at ||
        (c.strategy_codes && c.strategy_codes.length) ||
        c.capital_allocation_note
      ) {
        setMoreOpen(true);
      }
      setDirty(false);
      if (acctRes.ok) {
        setAccounts(
          (acctRes.data.accounts || []).filter((a) => a.status === "active"),
        );
      }
      if (!c.is_ledger) {
        try {
          setPhaseReport(await fetchCampaignPhaseReport(campaignId));
        } catch {
          setPhaseReport(null);
        }
      } else {
        setPhaseReport(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load campaign");
      setCampaign(null);
      setAmendments([]);
      setPhaseReport(null);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void load();
  }, [load]);

  function markDirty() {
    setDirty(true);
  }

  function parseCapital(): number | null {
    if (!capital.trim()) return null;
    const cap = Number(capital);
    if (!Number.isFinite(cap) || cap < 0) {
      throw new Error("Capital allocation must be a non-negative number");
    }
    return cap;
  }

  function parseMaxDd(): number | null {
    if (!maxDdPct.trim()) return null;
    const m = Number(maxDdPct);
    if (!Number.isFinite(m) || m <= 0 || m > 100) {
      throw new Error("Max drawdown must be a percent between 0 exclusive and 100");
    }
    return m;
  }

  function sameBetPayload(): Record<string, string> | null {
    const o: Record<string, string> = {};
    if (sameBetWhat.trim()) o.what = sameBetWhat.trim();
    if (sameBetLean.trim()) o.leaning = sameBetLean.trim();
    if (sameBetRegime.trim()) o.regime = sameBetRegime.trim();
    if (sameBetKills.trim()) o.kills = sameBetKills.trim();
    return Object.keys(o).length ? o : null;
  }

  function strategyCodesPayload(): string[] | null {
    const parts = strategiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length ? parts : null;
  }

  function charterBody() {
    const acct =
      accountId === ""
        ? campaign?.is_default
          ? (campaign.account_id ?? null)
          : null
        : accountId;
    return {
      title: title.trim(),
      badge_color: badgeColor,
      account_id: acct as number | null,
      starting_capital: parseCapital(),
      max_drawdown_pct: parseMaxDd(),
      capital_allocation_mode: allocMode || "fixed",
      capital_allocation_note: allocNote.trim() || null,
      goals_md: goals.trim() || null,
      starts_at: startsAt || null,
      ends_at: endsAt || null,
      strategy_codes: strategyCodesPayload(),
      same_bet: sameBetPayload(),
    };
  }

  async function refreshAmendments(id: number) {
    try {
      setAmendments(await fetchCampaignAmendments(id));
    } catch {
      /* keep prior list */
    }
  }

  async function refreshPhaseReport(id: number) {
    try {
      setPhaseReport(await fetchCampaignPhaseReport(id));
    } catch {
      setPhaseReport(null);
    }
  }

  async function save() {
    if (!campaign || busy || !title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await patchCampaign(campaign.id, charterBody());
      setCampaign(updated);
      setDirty(false);
      await refreshCampaigns();
      await refreshAmendments(updated.id);
      if (!updated.is_ledger) await refreshPhaseReport(updated.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: string) {
    if (!campaign || busy) return;
    setBusy(true);
    setError(null);
    try {
      // Activate needs Big Three; complete/abandon needs end date
      const body: Parameters<typeof patchCampaign>[1] = { status };
      if (status === "active") {
        Object.assign(body, {
          starting_capital: parseCapital(),
          max_drawdown_pct: parseMaxDd(),
          starts_at: startsAt || null,
        });
      }
      if (status === "completed" || status === "abandoned") {
        if (!endsAt) {
          throw new Error("Set an end date before completing or ending early");
        }
        body.ends_at = endsAt;
      }
      const updated = await patchCampaign(campaign.id, body);
      setCampaign(updated);
      await refreshCampaigns();
      await refreshAmendments(updated.id);
      if (!updated.is_ledger) await refreshPhaseReport(updated.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function setDefault(asDefault: boolean) {
    if (!campaign || busy) return;
    const acct =
      accountId === ""
        ? null
        : typeof accountId === "number"
          ? accountId
          : campaign.account_id ?? null;
    if (asDefault && acct == null) {
      setError("Default requires a trade account — set one and save first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await patchCampaign(campaign.id, {
        ...(dirty ? charterBody() : {}),
        is_default: asDefault,
        account_id: acct,
      });
      setCampaign(updated);
      setDirty(false);
      if (updated.account_id != null) setAccountId(updated.account_id);
      await refreshAmendments(updated.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update default");
    } finally {
      setBusy(false);
    }
  }

  async function onRenew() {
    if (!campaign || busy) return;
    setBusy(true);
    setError(null);
    try {
      const next = await renewCampaign(campaign.id);
      router.push(`/app/practice/campaign/${next.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Renew failed");
      setBusy(false);
    }
  }

  if (!campaignId || Number.isNaN(campaignId)) {
    return (
      <main className="p-6">
        <p>Invalid campaign.</p>
        <Link href="/app/practice/campaign">← Campaigns</Link>
      </main>
    );
  }

  const isActive = campaign?.status === "active";
  const isOpen =
    campaign?.status === "active" || campaign?.status === "planned";
  const isTerminal =
    campaign?.status === "completed" || campaign?.status === "abandoned";
  const neverSigned = campaign ? !campaign.signed_at : true;
  const wasPaused = Boolean(campaign?.activated_at);
  const sig = campaign ? signatureChrome(campaign) : null;

  const termAmends = amendments.filter((a) => a.field !== "status");
  const statusAmends = amendments.filter((a) => a.field === "status");

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-4 pb-20 sm:px-6">
      <PracticeSuiteChrome
        active="campaign"
        hideStoryStrip
        hideToughness
        hideTitle
        breadcrumbUnderTitle
      >
        <div className="mt-4 space-y-4" data-testid="campaign-editor">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/app/practice/campaign"
              className="text-sm text-[var(--color-label-secondary)] hover:underline"
            >
              ← Campaigns
            </Link>
            {campaign && (
              <>
                <h1 className="text-lg font-semibold sm:text-xl">
                  <CampaignBadge
                    title={campaign.title}
                    color={campaign.badge_color}
                    className="max-w-[18rem] px-2.5 py-1 text-sm font-semibold"
                  />
                </h1>
                <span className="rounded-full bg-[var(--color-tint-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label)]">
                  {statusLabel(campaign)}
                </span>
                {!campaign.is_ledger && (
                  <span
                    className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-[var(--color-label-secondary)]"
                    data-testid="campaign-charter-version"
                  >
                    v{campaign.charter_version ?? 1}
                  </span>
                )}
                {campaign.is_ledger && (
                  <span
                    className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]"
                    data-testid="campaign-ledger-badge"
                  >
                    Ledger
                  </span>
                )}
                {campaign.is_default && !campaign.is_ledger && (
                  <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
                    Default
                  </span>
                )}
                {campaign.cycle_number != null &&
                  campaign.cycle_number > 1 && (
                    <span
                      className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]"
                      data-testid="campaign-cycle-chip"
                    >
                      Cycle {campaign.cycle_number}
                    </span>
                  )}
              </>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {dirty && isOpen && (
                <span className="text-xs text-[var(--color-label-tertiary)]">
                  Unsaved changes
                </span>
              )}
              {isOpen && (
                <Button
                  type="button"
                  variant="primary"
                  disabled={
                    busy ||
                    !dirty ||
                    !title.trim() ||
                    ctxCampaigns.some(
                      (c) =>
                        c.id !== campaign.id &&
                        normalizeCampaignHex(c.badge_color) ===
                          normalizeCampaignHex(badgeColor),
                    )
                  }
                  onClick={() => void save()}
                  data-testid="campaign-editor-save"
                >
                  {busy ? "Saving…" : "Save"}
                </Button>
              )}
            </div>
          </div>

          {campaign && isOpen && (
            <div className="max-w-md">
              <CampaignColorPicker
                value={badgeColor}
                onChange={(hex) => {
                  setBadgeColor(hex);
                  markDirty();
                }}
                taken={ctxCampaigns
                  .filter((c) => c.id !== campaign.id)
                  .map((c) => c.badge_color || "")
                  .filter(Boolean)}
              />
            </div>
          )}

          {loading && (
            <p className="text-sm text-[var(--color-label-tertiary)]">
              Loading…
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {!loading && !campaign && !error && (
            <p className="text-sm text-[var(--color-label-secondary)]">
              Campaign not found.{" "}
              <Link
                href="/app/practice/campaign"
                className="text-[var(--color-tint)] hover:underline"
              >
                Back to library
              </Link>
            </p>
          )}

          {campaign && (
            <>
              {/* Lineage */}
              {(campaign.predecessor ||
                (campaign.cycle_number != null &&
                  campaign.cycle_number > 1)) && (
                <p
                  className="text-sm text-[var(--color-label-secondary)]"
                  data-testid="campaign-lineage"
                >
                  {campaign.cycle_number != null && campaign.cycle_number > 1
                    ? `Cycle ${campaign.cycle_number}`
                    : "Renewed"}
                  {campaign.predecessor ? (
                    <>
                      {" · renewed from "}
                      <Link
                        href={`/app/practice/campaign/${campaign.predecessor.id}`}
                        className="font-medium text-[var(--color-tint)] hover:underline"
                      >
                        {campaign.predecessor.title || "prior campaign"}
                      </Link>
                    </>
                  ) : null}
                </p>
              )}

              {/* Signature state — honest labels only (§4.5.9) */}
              <div
                className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-3 py-2 text-sm text-[var(--color-label-secondary)]"
                data-testid="campaign-signature"
                data-kind={sig?.kind}
              >
                {sig?.kind === "never" && (
                  <span data-testid="campaign-never-signed">Never signed</span>
                )}
                {sig?.kind === "signed" && (
                  <span data-testid="campaign-signed-label">{sig.label}</span>
                )}
                {sig?.kind === "terms_as_of" && (
                  <span data-testid="campaign-terms-as-of">{sig.label}</span>
                )}
              </div>

              {/* Definition (tiered) above panel / radar — Spec §2 · §4 */}
              <div
                className="surface-card space-y-5 border border-[var(--color-separator)] p-4 sm:p-6"
                data-testid="campaign-definition"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  Definition
                </p>

                {/* Tier 1 — Big Three (large) */}
                <div
                  className="grid gap-4 sm:grid-cols-3"
                  data-testid="campaign-big-three"
                >
                  <label className="block text-sm font-semibold text-[var(--color-label)]">
                    Capital allocation
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={capital}
                      onChange={(e) => {
                        setCapital(e.target.value);
                        markDirty();
                      }}
                      className="mt-1.5 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-3 text-lg tabular-nums font-medium"
                      data-testid="campaign-editor-capital"
                      disabled={!isOpen}
                      placeholder="Required to activate"
                    />
                    <span className="mt-1 block text-[11px] font-normal text-[var(--color-label-tertiary)]">
                      Amount claimed from the pool (Big Three)
                    </span>
                  </label>
                  <label className="block text-sm font-semibold text-[var(--color-label)]">
                    Max drawdown %
                    <input
                      type="number"
                      min={0.01}
                      max={100}
                      step={0.5}
                      value={maxDdPct}
                      onChange={(e) => {
                        setMaxDdPct(e.target.value);
                        markDirty();
                      }}
                      className="mt-1.5 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-3 text-lg tabular-nums font-medium"
                      data-testid="campaign-editor-max-dd"
                      disabled={!isOpen}
                      placeholder="% of allocation"
                    />
                    <span className="mt-1 block text-[11px] font-normal text-[var(--color-label-tertiary)]">
                      Percent of this campaign’s allocation only
                    </span>
                  </label>
                  <label className="block text-sm font-semibold text-[var(--color-label)]">
                    Starts
                    <input
                      type="date"
                      value={startsAt}
                      onChange={(e) => {
                        setStartsAt(e.target.value);
                        markDirty();
                      }}
                      className="mt-1.5 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-3 text-lg"
                      data-testid="campaign-editor-starts"
                      disabled={!isOpen}
                    />
                    <span className="mt-1 block text-[11px] font-normal text-[var(--color-label-tertiary)]">
                      Window open — required to activate
                    </span>
                  </label>
                </div>

                {/* Tier 2 — Same-bet (inline, skippable) */}
                {!campaign.is_ledger && (
                  <div
                    className="rounded-lg border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)]/30 p-3 space-y-2"
                    data-testid="campaign-same-bet"
                  >
                    <p className="text-xs font-medium text-[var(--color-label-secondary)]">
                      Same-bet answers{" "}
                      <span className="font-normal text-[var(--color-label-tertiary)]">
                        (optional — skip is fine)
                      </span>
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(
                        [
                          ["What are you trading?", sameBetWhat, setSameBetWhat, "what"],
                          ["Leaning?", sameBetLean, setSameBetLean, "lean"],
                          ["Calm or wild?", sameBetRegime, setSameBetRegime, "regime"],
                          ["What kills it?", sameBetKills, setSameBetKills, "kills"],
                        ] as const
                      ).map(([label, val, setVal, key]) => (
                        <label
                          key={key}
                          className="block text-[11px] font-medium text-[var(--color-label-tertiary)]"
                        >
                          {label}
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => {
                              setVal(e.target.value);
                              markDirty();
                            }}
                            className="mt-0.5 w-full rounded-md border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1.5 text-sm font-normal text-[var(--color-label)]"
                            disabled={!isOpen}
                            data-testid={`campaign-same-bet-${key}`}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tier 3 — More options */}
                <div>
                  <button
                    type="button"
                    className="text-xs font-medium text-[var(--color-label-secondary)] hover:underline"
                    onClick={() => setMoreOpen((v) => !v)}
                    data-testid="campaign-more-options"
                  >
                    {moreOpen ? "▾ More options" : "▸ More options"}
                  </button>
                  {moreOpen && (
                    <div className="mt-3 space-y-3" data-testid="campaign-more-options-body">
                      <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                        Title
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => {
                            setTitle(e.target.value);
                            markDirty();
                          }}
                          className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-sm"
                          data-testid="campaign-editor-title"
                          disabled={!isOpen || !!campaign.is_ledger}
                        />
                        {campaignTitleLooksLikeBook(title) ? (
                          <span className="mt-1 block text-[11px] font-normal text-[var(--color-label-secondary)]">
                            A book is an account. This name is a campaign badge,
                            not a book. Rename if you want that to stay obvious.
                          </span>
                        ) : null}
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <label className="block min-w-[10rem] flex-1 text-xs font-medium text-[var(--color-label-secondary)]">
                          Trade account
                          <select
                            className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-2 text-sm text-[var(--color-label)]"
                            value={accountId === "" ? "" : String(accountId)}
                            onChange={(e) => {
                              setAccountId(
                                e.target.value ? Number(e.target.value) : "",
                              );
                              markDirty();
                            }}
                            data-testid="campaign-editor-account"
                            disabled={!isOpen}
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
                          Ends
                          <input
                            type="date"
                            value={endsAt}
                            onChange={(e) => {
                              setEndsAt(e.target.value);
                              markDirty();
                            }}
                            className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-2 text-sm"
                            data-testid="campaign-editor-ends"
                            disabled={!isOpen}
                          />
                          <span className="mt-0.5 block text-[10px] font-normal text-[var(--color-label-tertiary)]">
                            Optional until complete / end early
                          </span>
                        </label>
                        <label className="block min-w-[8rem] text-xs font-medium text-[var(--color-label-secondary)]">
                          Allocation mode
                          <select
                            className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-2 text-sm"
                            value={allocMode}
                            onChange={(e) => {
                              setAllocMode(e.target.value);
                              markDirty();
                            }}
                            disabled={!isOpen}
                            data-testid="campaign-alloc-mode"
                          >
                            <option value="fixed">Fixed</option>
                            <option value="dynamic">Dynamic</option>
                            <option value="wrap">Wrap</option>
                            <option value="proportion">Proportion</option>
                          </select>
                        </label>
                      </div>
                      <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                        Allocation note
                        <input
                          type="text"
                          value={allocNote}
                          onChange={(e) => {
                            setAllocNote(e.target.value);
                            markDirty();
                          }}
                          className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-sm"
                          disabled={!isOpen}
                          data-testid="campaign-alloc-note"
                        />
                      </label>
                      <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                        Strategy allow-list{" "}
                        <span className="font-normal text-[var(--color-label-tertiary)]">
                          (comma-separated; leave blank = no list rule)
                        </span>
                        <input
                          type="text"
                          value={strategiesText}
                          onChange={(e) => {
                            setStrategiesText(e.target.value);
                            markDirty();
                          }}
                          className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-sm"
                          disabled={!isOpen}
                          data-testid="campaign-strategy-codes"
                          placeholder="iron_condor, butterfly"
                        />
                      </label>
                      <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                        Goals
                        <textarea
                          value={goals}
                          onChange={(e) => {
                            setGoals(e.target.value);
                            markDirty();
                          }}
                          rows={6}
                          className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-sm"
                          data-testid="campaign-editor-goals"
                          disabled={!isOpen}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Phase report strip — under definition, above radar */}
              {!campaign.is_ledger && phaseReport && (
                <div
                  className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--color-separator)] bg-[var(--color-fill)]/25 p-3 sm:grid-cols-4"
                  data-testid="campaign-phase-report"
                >
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                      Free cash
                    </p>
                    <p className="mt-0.5 text-sm tabular-nums text-[var(--color-label)]">
                      {phaseReport.free_cash == null
                        ? "—"
                        : phaseReport.free_cash.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                      Free margin
                    </p>
                    <p className="mt-0.5 text-sm tabular-nums text-[var(--color-label)]">
                      {phaseReport.free_margin == null
                        ? "—"
                        : phaseReport.free_margin.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                      Realized DD %
                    </p>
                    <p className="mt-0.5 text-sm tabular-nums text-[var(--color-label)]">
                      {phaseReport.realized_max_drawdown_pct == null
                        ? "—"
                        : `${phaseReport.realized_max_drawdown_pct.toFixed(1)}%`}
                      {phaseReport.declared_max_drawdown_pct != null && (
                        <span className="text-[var(--color-label-tertiary)]">
                          {" "}
                          / {phaseReport.declared_max_drawdown_pct}%
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                      Strategy mix
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-label-secondary)] line-clamp-2">
                      {(phaseReport.strategy_mix || []).length === 0
                        ? "No stamps yet"
                        : phaseReport.strategy_mix
                            .slice(0, 3)
                            .map((m) => `${m.strategy} (${m.count})`)
                            .join(" · ")}
                    </p>
                  </div>
                </div>
              )}

              {!campaign.is_ledger && (
                <CampaignTaggedTrades campaign={campaign} />
              )}

              {campaign.is_ledger ? (
                <p
                  className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-3 py-2 text-sm text-[var(--color-label-secondary)]"
                  data-testid="campaign-ledger-notice"
                >
                  This is the account <strong>ledger</strong> — furniture, not a
                  signed charter. No Campaign Panel and no radar. Open a member
                  campaign for deliberate seasons.
                </p>
              ) : (
                <CampaignPanel
                  campaignId={campaign.id}
                  isLedger={false}
                />
              )}

              {/* Amendments — neutral history, no judgment chrome */}
              {(termAmends.length > 0 || statusAmends.length > 0) && (
                <section
                  className="space-y-3"
                  data-testid="campaign-amendments"
                >
                  {termAmends.length > 0 && (
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                        Change log
                      </h2>
                      <ul className="mt-2 space-y-1.5">
                        {termAmends.map((a) => (
                          <li
                            key={a.id}
                            className="text-sm text-[var(--color-label-secondary)]"
                            data-testid={`campaign-amend-${a.id}`}
                          >
                            <span className="text-[var(--color-label-tertiary)]">
                              {formatWhen(a.amended_at)}
                            </span>
                            {" · "}
                            {fieldLabel(a.field)}:{" "}
                            {formatAmendValue(a.field, a.old_value)} →{" "}
                            {formatAmendValue(a.field, a.new_value)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {statusAmends.length > 0 && (
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                        Status timeline
                      </h2>
                      <ul className="mt-2 space-y-1.5">
                        {statusAmends.map((a) => (
                          <li
                            key={a.id}
                            className="text-sm text-[var(--color-label-secondary)]"
                          >
                            <span className="text-[var(--color-label-tertiary)]">
                              {formatWhen(a.amended_at)}
                            </span>
                            {" · "}
                            {formatAmendValue("status", a.old_value)} →{" "}
                            {formatAmendValue("status", a.new_value)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {/* Open lifecycle toolbar */}
              {isOpen && (
                <div
                  className="flex flex-wrap items-center gap-2 border-t border-[var(--color-separator)] pt-4"
                  role="toolbar"
                  aria-label="Campaign lifecycle"
                >
                  {campaign.status === "planned" && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void setStatus("active")}
                      data-testid={
                        neverSigned && !wasPaused
                          ? "campaign-activate"
                          : "campaign-resume"
                      }
                    >
                      {neverSigned && !wasPaused ? "Activate" : "Resume"}
                    </Button>
                  )}
                  {isActive && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void setStatus("planned")}
                      data-testid="campaign-pause"
                    >
                      Pause
                    </Button>
                  )}
                  {isActive && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void setStatus("completed")}
                      data-testid="campaign-complete"
                    >
                      Complete
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => {
                      if (
                        !window.confirm(
                          [
                            "End this campaign early?",
                            "",
                            "This closes the campaign incomplete — not the same as Complete (finished) or Pause (you can resume).",
                            "",
                            "After you confirm:",
                            "• The campaign becomes read-only and moves to Archive",
                            "• You cannot resume this campaign (use Renew later for a new cycle)",
                            "• Trades, journal stamps, and signature history stay",
                            "",
                            "OK to end campaign, Cancel to keep it open.",
                          ].join("\n"),
                        )
                      ) {
                        return;
                      }
                      void setStatus("abandoned");
                    }}
                    data-testid="campaign-end"
                  >
                    End campaign
                  </Button>
                  {isActive &&
                    (accountId !== "" || campaign.account_id != null) && (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => void setDefault(!campaign.is_default)}
                        data-testid={
                          campaign.is_default
                            ? "campaign-clear-default"
                            : "campaign-set-default"
                        }
                      >
                        {campaign.is_default
                          ? "Clear default"
                          : "Set as default"}
                      </Button>
                    )}
                  <button
                    type="button"
                    className="ml-auto text-sm text-[var(--color-label-tertiary)] hover:underline"
                    onClick={() => router.push("/app/practice/campaign")}
                  >
                    Back to library
                  </button>
                </div>
              )}

              {/* Terminal: Renew only */}
              {isTerminal && (
                <div
                  className="flex flex-wrap items-center gap-2 border-t border-[var(--color-separator)] pt-4"
                  role="toolbar"
                  aria-label="Closed campaign"
                >
                  <Button
                    type="button"
                    variant="primary"
                    disabled={busy}
                    onClick={() => void onRenew()}
                    data-testid="campaign-renew"
                  >
                    {busy ? "Renewing…" : "Renew"}
                  </Button>
                  <button
                    type="button"
                    className="ml-auto text-sm text-[var(--color-label-tertiary)] hover:underline"
                    onClick={() => router.push("/app/practice/campaign")}
                  >
                    Back to library
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </PracticeSuiteChrome>
    </main>
  );
}
