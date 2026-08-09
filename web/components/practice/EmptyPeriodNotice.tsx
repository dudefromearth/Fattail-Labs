"use client";

/**
 * Shared empty-period callout for Practice outcome surfaces (Hardening D1).
 * Trade Log + Reports both use Practice chrome date range.
 */

type Props = {
  periodLabel: string;
  accountLabel?: string | null;
  /** reports vs trade-log wording */
  variant?: "outcomes" | "trades";
  onShowAllTime: () => void;
  testId?: string;
};

export default function EmptyPeriodNotice({
  periodLabel,
  accountLabel,
  variant = "outcomes",
  onShowAllTime,
  testId = "practice-empty-period",
}: Props) {
  const what =
    variant === "trades" ? "No trades" : "No closed outcomes";
  return (
    <div
      className="mt-4 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-fill)]/50 px-3 py-2 text-xs text-[var(--color-label-secondary)]"
      role="status"
      data-testid={testId}
    >
      {what} in{" "}
      <span className="font-medium text-[var(--color-label)]">
        {periodLabel}
      </span>
      {accountLabel ? (
        <>
          {" "}
          for{" "}
          <span className="font-medium text-[var(--color-label)]">
            {accountLabel}
          </span>
        </>
      ) : null}
      . The account may still have activity outside this window — choose{" "}
      <button
        type="button"
        className="font-medium text-[var(--color-tint)] hover:underline"
        onClick={onShowAllTime}
      >
        All
      </button>{" "}
      (full book) or another period.
    </div>
  );
}
