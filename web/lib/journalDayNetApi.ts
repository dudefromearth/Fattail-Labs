/**
 * Journal Day Net Calendar — Spec v0.2 exposure map client.
 */

export type DayNetTone = "credit" | "debit" | "flat" | "none";

export type DayNetDay = {
  date: string;
  net: number | null;
  outcome_count: number;
  tone: DayNetTone;
  intensity_step: number;
  day_r2r: number | null;
  day_r2r_sample_n: number;
};

export type DayNetCalendar = {
  timezone: string;
  from: string;
  to: string;
  scope: {
    account_id: number | null;
    practice_campaign_id: number | null;
    undirected: boolean;
  };
  period: {
    net: number;
    outcome_days: number;
    credit_days: number;
    debit_days: number;
  };
  days: DayNetDay[];
};

export async function fetchDayNetCalendar(opts: {
  fromDay: string;
  toDay: string;
  accountId?: number | null;
  practiceCampaignId?: number | null;
  undirected?: boolean;
}): Promise<DayNetCalendar | null> {
  const q = new URLSearchParams({
    from_day: opts.fromDay.slice(0, 10),
    to_day: opts.toDay.slice(0, 10),
  });
  if (opts.accountId != null && opts.accountId > 0) {
    q.set("account_id", String(opts.accountId));
  }
  if (opts.practiceCampaignId != null && opts.practiceCampaignId > 0) {
    q.set("practice_campaign_id", String(opts.practiceCampaignId));
  }
  if (opts.undirected) q.set("undirected", "true");
  const r = await fetch(`/api/me/journal/day-net-calendar?${q}`, {
    credentials: "same-origin",
  });
  if (!r.ok) return null;
  return (await r.json()) as DayNetCalendar;
}

export async function fetchDayNetMapEnabled(): Promise<boolean> {
  try {
    const r = await fetch("/api/me/journal/preferences", {
      credentials: "same-origin",
    });
    if (!r.ok) return true;
    const d = (await r.json()) as { day_net_map_enabled?: boolean };
    return d.day_net_map_enabled !== false;
  } catch {
    return true;
  }
}

export async function patchDayNetMapEnabled(enabled: boolean): Promise<boolean> {
  const r = await fetch("/api/me/journal/preferences", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ day_net_map_enabled: enabled }),
  });
  if (!r.ok) return enabled;
  const d = (await r.json()) as { day_net_map_enabled?: boolean };
  return d.day_net_map_enabled !== false;
}

/** Compact money for month cells. */
export function formatDayNet(net: number | null | undefined): string {
  if (net == null || Number.isNaN(net)) return "—";
  const abs = Math.abs(net);
  const body =
    abs >= 1000
      ? abs.toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })
      : abs.toLocaleString(undefined, {
          minimumFractionDigits: abs < 100 ? 2 : 0,
          maximumFractionDigits: 2,
        });
  if (net > 0) return `+$${body}`;
  if (net < 0) return `−$${body}`;
  return "$0.00";
}

export function formatPeriodNet(net: number): string {
  return formatDayNet(net);
}

/** CSS background for intensity 1..5 credit/debit. */
export function dayNetFillClass(
  tone: DayNetTone,
  step: number,
): string {
  if (tone === "none" || step <= 0) return "";
  const n = Math.min(5, Math.max(1, step));
  if (tone === "credit") {
    return [
      "",
      "bg-emerald-50 dark:bg-emerald-950/40",
      "bg-emerald-100 dark:bg-emerald-900/50",
      "bg-emerald-200/90 dark:bg-emerald-800/55",
      "bg-emerald-300/90 dark:bg-emerald-700/60",
      "bg-emerald-400/80 dark:bg-emerald-600/65",
    ][n];
  }
  if (tone === "debit") {
    return [
      "",
      "bg-red-50 dark:bg-red-950/40",
      "bg-red-100 dark:bg-red-900/50",
      "bg-red-200/90 dark:bg-red-800/55",
      "bg-red-300/90 dark:bg-red-700/60",
      "bg-red-400/80 dark:bg-red-600/65",
    ][n];
  }
  return "bg-[var(--color-fill)]";
}

export function dayNetTextClass(tone: DayNetTone): string {
  if (tone === "credit") return "text-emerald-800 dark:text-emerald-200";
  if (tone === "debit") return "text-red-800 dark:text-red-200";
  return "text-[var(--color-label-secondary)]";
}
