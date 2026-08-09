"use client";

/**
 * Practice Context Spec v0.2 — Account + Date in Practice chrome.
 * Controls only — no duplicate labels, no campaign CTAs, no wiki chrome.
 */

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { IconChevronDown } from "@/components/ui/icons";
import {
  PRACTICE_GRANULARITIES,
  isStandingDefaultAccountLabel,
  usePracticeContext,
} from "@/lib/practiceContext";

const MANAGE_ACCOUNTS = "__manage_accounts__";

const selectClass =
  "min-h-[var(--hit-min)] cursor-pointer appearance-none rounded-[var(--radius-full)] border-0 bg-[var(--color-fill)] py-2 pl-4 pr-9 text-sm font-medium text-[var(--color-label)] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]";

const navBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-label-secondary)] shadow-[var(--elevation-1)] transition-colors hover:bg-[var(--color-fill)] hover:text-[var(--color-label)] sm:min-h-9 sm:min-w-9";

export default function PracticeContextBar({
  /** When true, controls stay visible but surface should ignore them (completed retro). */
  inertHint = false,
  inertMessage,
}: {
  inertHint?: boolean;
  inertMessage?: string;
}) {
  const router = useRouter();
  const {
    accountId,
    setAccountId,
    selectableAccounts,
    campaignId,
    setCampaignId,
    selectableCampaigns,
    granularity,
    setGranularity,
    periodLabel,
    dateFilterActive,
    shiftPeriod,
    goToday,
  } = usePracticeContext();

  const prevLabel =
    granularity === "year"
      ? "Previous year"
      : granularity === "month"
        ? "Previous month"
        : granularity === "week"
          ? "Previous week"
          : "Previous day";
  const nextLabel =
    granularity === "year"
      ? "Next year"
      : granularity === "month"
        ? "Next month"
        : granularity === "week"
          ? "Next week"
          : "Next day";

  return (
    <div
      className="mt-3 space-y-2"
      data-testid="practice-context-bar"
      data-account={accountId === "all" ? "all" : String(accountId)}
      data-campaign={campaignId != null ? String(campaignId) : "none"}
      data-granularity={granularity}
      data-inert={inertHint ? "true" : "false"}
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="relative inline-flex min-h-[var(--hit-min)] items-center">
          <span className="sr-only">Account</span>
          <select
            className={selectClass}
            value={accountId === "all" ? "all" : String(accountId)}
            onChange={(e) => {
              const v = e.target.value;
              if (v === MANAGE_ACCOUNTS) {
                router.push("/accounts-capital");
                return;
              }
              setAccountId(v === "all" ? "all" : Number(v));
            }}
            aria-label="Active account"
            data-testid="practice-account-select"
          >
            {selectableAccounts.map((a) => (
              <option
                key={a.id}
                value={a.id}
                title={
                  a.broker && a.broker !== "unset"
                    ? `${a.label} · import venue ${a.broker}`
                    : a.label
                }
              >
                {a.label}
                {isStandingDefaultAccountLabel(a.label) ? " · default" : ""}
                {a.status === "archived" ? " · retired" : ""}
                {typeof a.trade_count === "number"
                  ? ` (${a.trade_count} trades)`
                  : ""}
              </option>
            ))}
            <option value="all">All accounts</option>
            <option value={MANAGE_ACCOUNTS}>Manage accounts…</option>
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-label-secondary)]">
            <IconChevronDown size={16} />
          </span>
        </label>

        <div
          className="inline-flex flex-wrap items-center gap-0.5 rounded-full bg-[var(--color-fill)] p-0.5"
          role="group"
          aria-label="Date and campaign filters"
          data-testid="practice-granularity"
        >
          {PRACTICE_GRANULARITIES.map((v) => {
            const on = granularity === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setGranularity(v.id)}
                className={[
                  "min-h-8 rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  on
                    ? "bg-[var(--color-tint)] text-[var(--color-on-tint)] shadow-sm"
                    : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
                ].join(" ")}
                aria-pressed={on}
              >
                {v.label}
              </button>
            );
          })}
          {/* Placeholder "Campaign" = no filter; pick a name to filter by that charter */}
          <label className="relative inline-flex min-h-8 items-center">
            <span className="sr-only">Campaign filter</span>
            <select
              className={[
                "min-h-8 max-w-[12rem] cursor-pointer appearance-none rounded-full border-0 bg-transparent py-1 pl-3 pr-7 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
                campaignId != null
                  ? "bg-[var(--color-tint)] text-[var(--color-on-tint)] shadow-sm"
                  : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
              ].join(" ")}
              value={campaignId != null ? String(campaignId) : ""}
              onChange={(e) => {
                const v = e.target.value;
                setCampaignId(v ? Number(v) : null);
              }}
              aria-label="Campaign filter"
              data-testid="practice-campaign-select"
            >
              <option value="">Campaign</option>
              {selectableCampaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <span
              className={[
                "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2",
                campaignId != null
                  ? "text-[var(--color-on-tint)]"
                  : "text-[var(--color-label-secondary)]",
              ].join(" ")}
            >
              <IconChevronDown size={14} />
            </span>
          </label>
        </div>

        {dateFilterActive ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              className={navBtn}
              onClick={() => shiftPeriod(-1)}
              aria-label={prevLabel}
            >
              <span className="text-lg leading-none" aria-hidden>
                ‹
              </span>
            </button>
            <p
              className="min-w-[10rem] text-center font-semibold text-[var(--color-label)]"
              style={{ fontSize: "var(--text-subheadline)" }}
              data-testid="practice-period-label"
            >
              {periodLabel}
            </p>
            <button
              type="button"
              className={navBtn}
              onClick={() => shiftPeriod(1)}
              aria-label={nextLabel}
            >
              <span className="text-lg leading-none" aria-hidden>
                ›
              </span>
            </button>
            <Button type="button" variant="secondary" onClick={goToday}>
              Today
            </Button>
          </div>
        ) : null}
      </div>

      {inertHint && (
        <p
          className="rounded-[var(--radius-md)] bg-[var(--color-fill)] px-3 py-2 text-center text-xs text-[var(--color-label-secondary)]"
          data-testid="practice-context-inert-notice"
          role="status"
        >
          {inertMessage ||
            "This completed retrospective is fixed at gather — account and date do not change what is shown."}
        </p>
      )}
    </div>
  );
}
