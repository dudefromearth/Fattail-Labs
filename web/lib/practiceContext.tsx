"use client";

/**
 * Practice Context Spec v0.2 — shared Account + Date for Practice suite only.
 *
 * Persistence is per identity (SSO / password session). Browser-global prefs
 * would let the next member inherit a foreign account_id and get an empty book.
 *
 * "All" date scope = no date filter on Trade Log / Reports (full book).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Account } from "@/lib/tradeLog";
import { fetchAccounts } from "@/lib/tradeLogApi";
import {
  fetchCampaigns,
  type PracticeCampaign,
} from "@/lib/practiceSpineApi";

/**
 * Standing home for Practice: prefer the active account with the most trades,
 * then provisioned Default/Primary label, then first active.
 * Avoids empty "Default" hiding a book full of fills after retire/un-retire.
 */
function pickDefaultAccountId(accounts: Account[]): AccountScope {
  const active = accounts.filter((a) => a.status === "active");
  if (!active.length) return "all";
  const byTrades = active
    .slice()
    .sort((a, b) => (b.trade_count ?? 0) - (a.trade_count ?? 0));
  if ((byTrades[0]?.trade_count ?? 0) > 0) {
    return byTrades[0].id;
  }
  const standing =
    active.find((a) => a.label === "Default") ||
    active.find((a) => a.label === "Primary") ||
    byTrades[0];
  return standing?.id ?? "all";
}

export function isStandingDefaultAccountLabel(label: string | undefined): boolean {
  return label === "Default" || label === "Primary";
}

/** Resolve saved scope: keep valid account (active or retired for viewing). */
function resolveAccountPref(
  saved: AccountScope,
  accounts: Account[],
): AccountScope {
  const fallback = pickDefaultAccountId(accounts);
  if (saved === "all") return fallback;
  const acct = accounts.find((a) => a.id === saved);
  if (!acct) return fallback;
  // Prefer active; retired still selectable if it was last used and has fills
  if (acct.status === "active") return saved;
  if ((acct.trade_count ?? 0) > 0) return saved;
  return fallback;
}
import {
  addDays,
  formatDayTitle,
  monthTitle,
  startOfDay,
  startOfMonth,
  startOfWeek,
  weekTitle,
  ymd,
} from "@/components/journal/dateUtils";

/** "all" = no date filter (full book). Surfaces that need a calendar day still use selectedDate. */
export type DateGranularity = "all" | "year" | "month" | "week" | "day";
export type AccountScope = number | "all";

/** Legacy keys (v1) — browser-global; cleared once after identity-scoped migrate. */
const LEGACY_ACCOUNT = "ft_labs_practice_account_id";
const LEGACY_DATE = "ft_labs_practice_date";
const LEGACY_GRANULARITY = "ft_labs_practice_granularity";
const LEGACY_CLEARED = "ft_labs_practice_v2_cleared_legacy";
/** One-time: recover from empty Primary / day-filter prefs that blanked Reports. */
const FULLBOOK_MIGRATE = "ft_labs_practice_v2_fullbook_2026_07_31";
/** One-time: stop defaulting account scope to "All" — home is default account (Primary). */
const DEFAULT_ACCOUNT_HOME = "ft_labs_practice_v2_default_account_home_2026_08_08";

const STORAGE_PREFIX = "ft_labs_practice_v2";

const GRANULARITIES: DateGranularity[] = [
  "all",
  "year",
  "month",
  "week",
  "day",
];

type StoredPrefs = {
  accountId: AccountScope;
  /** Practice campaign id for suite chrome (ledger = default book). */
  campaignId: number | null;
  dateYmd: string;
  granularity: DateGranularity;
};

/** Default campaign for an account: ledger (first-trade book), else is_default. */
export function pickDefaultCampaignId(
  campaigns: PracticeCampaign[],
  accountId: AccountScope,
): number | null {
  if (accountId === "all") return null;
  const forAcct = campaigns.filter(
    (c) => c.account_id == null || c.account_id === accountId,
  );
  if (!forAcct.length) return null;
  const ledger = forAcct.find((c) => c.is_ledger);
  if (ledger) return ledger.id;
  const def = forAcct.find((c) => c.is_default);
  if (def) return def.id;
  return forAcct[0]?.id ?? null;
}

function storageKey(identityId: number): string {
  return `${STORAGE_PREFIX}:${identityId}`;
}

function parseYmd(s: string | null | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  return startOfDay(dt);
}

function clearLegacyKeys(): void {
  try {
    if (localStorage.getItem(LEGACY_CLEARED) === "1") return;
    localStorage.removeItem(LEGACY_ACCOUNT);
    localStorage.removeItem(LEGACY_DATE);
    localStorage.removeItem(LEGACY_GRANULARITY);
    localStorage.setItem(LEGACY_CLEARED, "1");
  } catch {
    /* ignore */
  }
}

function loadPrefs(identityId: number | null): StoredPrefs {
  const fallback: StoredPrefs = {
    // Concrete account is applied after accounts load (pickDefaultAccountId).
    accountId: "all",
    campaignId: null,
    dateYmd: ymd(startOfDay(new Date())),
    // Full book by default — multi-year imports must not hide behind "this month".
    granularity: "all",
  };
  if (typeof window === "undefined" || identityId == null) return fallback;
  try {
    clearLegacyKeys();
    const raw = localStorage.getItem(storageKey(identityId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
    let accountId: AccountScope = "all";
    if (parsed.accountId === "all" || parsed.accountId == null) {
      accountId = "all"; // resolveAccountPref maps to default account
    } else {
      const n = Number(parsed.accountId);
      accountId = Number.isFinite(n) && n > 0 ? n : "all";
    }
    const cn = Number(parsed.campaignId);
    const campaignId =
      Number.isFinite(cn) && cn > 0 ? cn : null;
    const g = parsed.granularity;
    const granularity: DateGranularity =
      g && (GRANULARITIES as string[]).includes(g) ? g : "all";
    const dateYmd =
      parseYmd(parsed.dateYmd) != null
        ? (parsed.dateYmd as string)
        : fallback.dateYmd;
    return { accountId, campaignId, dateYmd, granularity };
  } catch {
    return fallback;
  }
}

function savePrefs(identityId: number | null, prefs: StoredPrefs): void {
  if (typeof window === "undefined" || identityId == null) return;
  try {
    localStorage.setItem(storageKey(identityId), JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

/** Persist Practice account scope from outside chrome (e.g. Profile un-retire). */
export function rememberPracticeAccountId(accountId: number): void {
  if (typeof window === "undefined" || !accountId) return;
  void fetchSessionIdentityId().then((iid) => {
    if (iid == null) return;
    const prev = loadPrefs(iid);
    savePrefs(iid, {
      ...prev,
      accountId,
      // Campaign re-resolved on next hydrate for the new account
      campaignId: null,
    });
  });
}

/** Inclusive range for the active date + granularity. */
export function rangeFor(
  selected: Date,
  granularity: DateGranularity,
): { start: Date; end: Date } {
  if (granularity === "all") {
    return {
      start: startOfDay(new Date(1970, 0, 1)),
      end: startOfDay(new Date(2100, 11, 31)),
    };
  }
  const d = startOfDay(selected);
  if (granularity === "day") {
    return { start: d, end: d };
  }
  if (granularity === "week") {
    const start = startOfWeek(d);
    return { start, end: addDays(start, 6) };
  }
  if (granularity === "month") {
    const start = startOfMonth(d);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { start: startOfDay(start), end: startOfDay(end) };
  }
  const start = new Date(d.getFullYear(), 0, 1);
  const end = new Date(d.getFullYear(), 11, 31);
  return { start: startOfDay(start), end: startOfDay(end) };
}

export function periodTitle(
  selected: Date,
  granularity: DateGranularity,
): string {
  if (granularity === "all") return "All time";
  if (granularity === "year") return String(selected.getFullYear());
  if (granularity === "month") return monthTitle(startOfMonth(selected));
  if (granularity === "week") return weekTitle(startOfWeek(selected));
  return formatDayTitle(selected);
}

export type PracticeContextValue = {
  identityId: number | null;
  /**
   * False until session + accounts + localStorage prefs are applied.
   * Consumers must not fetch filtered data until true — otherwise they flash
   * full-book data then re-fetch empty under saved Primary/day scope.
   */
  prefsReady: boolean;
  accountId: AccountScope;
  setAccountId: (id: AccountScope) => void;
  /** Active Practice campaign (ledger = default continuous book). */
  campaignId: number | null;
  setCampaignId: (id: number | null) => void;
  campaigns: PracticeCampaign[];
  /** Campaigns for the current account (ledger first). */
  selectableCampaigns: PracticeCampaign[];
  campaignLabel: string;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  granularity: DateGranularity;
  setGranularity: (g: DateGranularity) => void;
  rangeStart: Date;
  rangeEnd: Date;
  rangeFromYmd: string;
  rangeToYmd: string;
  periodLabel: string;
  /** False when granularity is All — no date filter on outcome surfaces. */
  dateFilterActive: boolean;
  accounts: Account[];
  activeAccounts: Account[];
  /** Active first, then retired — for picker reachability after retire. */
  selectableAccounts: Account[];
  accountsReady: boolean;
  refreshAccounts: () => void;
  accountLabel: string;
  /** Numeric id for API, or null when All. */
  accountIdParam: number | null;
  shiftPeriod: (delta: number) => void;
  goToday: () => void;
};

const PracticeContext = createContext<PracticeContextValue | null>(null);

async function fetchSessionIdentityId(): Promise<number | null> {
  try {
    const r = await fetch("/api/auth/me", { credentials: "same-origin" });
    if (!r.ok) return null;
    const d = (await r.json()) as { identity_id?: number; id?: number };
    const n = Number(d.identity_id ?? d.id);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function PracticeContextProvider({ children }: { children: ReactNode }) {
  const [identityId, setIdentityId] = useState<number | null>(null);
  const [accountId, setAccountIdState] = useState<AccountScope>("all");
  const [campaignId, setCampaignIdState] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<PracticeCampaign[]>([]);
  const [selectedDate, setSelectedDateState] = useState<Date>(() =>
    startOfDay(new Date()),
  );
  const [granularity, setGranularityState] =
    useState<DateGranularity>("all");
  const [hydrated, setHydrated] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsReady, setAccountsReady] = useState(false);
  /** Pref campaign id until campaigns list loads (then resolved). */
  const [pendingCampaignId, setPendingCampaignId] = useState<number | null>(
    null,
  );

  // Resolve session + accounts, then apply prefs **once** before consumers fetch.
  // Order matters: first paint must NOT fetch until this finishes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      clearLegacyKeys();
      const iid = await fetchSessionIdentityId();
      if (cancelled) return;
      setIdentityId(iid);

      let accts: Account[] = [];
      try {
        const res = await fetchAccounts();
        if (res.ok) accts = res.data.accounts || [];
      } catch {
        accts = [];
      }
      if (cancelled) return;
      setAccounts(accts);
      setAccountsReady(true);

      const prefs = loadPrefs(iid);
      let account = resolveAccountPref(prefs.accountId, accts);
      let gran = prefs.granularity;
      let dateYmd = prefs.dateYmd;
      let campPref = prefs.campaignId;

      // One-time: leave forced "All accounts" home — default is named account (Primary).
      try {
        if (localStorage.getItem(DEFAULT_ACCOUNT_HOME) !== "1") {
          account = pickDefaultAccountId(accts);
          localStorage.setItem(DEFAULT_ACCOUNT_HOME, "1");
          if (iid != null) {
            savePrefs(iid, {
              accountId: account,
              campaignId: campPref,
              dateYmd,
              granularity: gran,
            });
          }
        }
        // Prior fullbook migrate may have set all — still remapped by resolveAccountPref
        if (localStorage.getItem(FULLBOOK_MIGRATE) !== "1") {
          gran = "all";
          dateYmd = ymd(startOfDay(new Date()));
          localStorage.setItem(FULLBOOK_MIGRATE, "1");
          if (iid != null) {
            savePrefs(iid, {
              accountId: account,
              campaignId: campPref,
              dateYmd,
              granularity: gran,
            });
          }
        }
      } catch {
        /* ignore */
      }

      // Home quick-nav / deep links: ?date=today|YYYY-MM-DD&view=day|week|…
      // Override stored prefs when present so Journal always opens on today
      // from the home chip without fighting last-used calendar state.
      try {
        const sp = new URLSearchParams(window.location.search);
        const dRaw = sp.get("date");
        const gRaw = sp.get("view") || sp.get("g") || sp.get("granularity");
        if (dRaw) {
          if (dRaw === "today") {
            dateYmd = ymd(startOfDay(new Date()));
          } else {
            const parsed = parseYmd(dRaw);
            if (parsed) dateYmd = ymd(parsed);
          }
        }
        if (gRaw && GRANULARITIES.includes(gRaw as DateGranularity)) {
          gran = gRaw as DateGranularity;
        }
      } catch {
        /* ignore */
      }

      setAccountIdState(account);
      setPendingCampaignId(campPref);
      setSelectedDateState(parseYmd(dateYmd) ?? startOfDay(new Date()));
      setGranularityState(gran);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load campaigns whenever account suite is ready (list ensures ledgers).
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    void fetchCampaigns()
      .then((d) => {
        if (cancelled) return;
        setCampaigns(d.campaigns || []);
      })
      .catch(() => {
        if (!cancelled) setCampaigns([]);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, accountId]);

  // Resolve campaign for account: keep valid pref, else ledger / default.
  useEffect(() => {
    if (!hydrated || !campaigns.length) return;
    if (accountId === "all") {
      setCampaignIdState(null);
      return;
    }
    const forAcct = campaigns.filter(
      (c) => c.account_id == null || c.account_id === accountId,
    );
    const preferred =
      (pendingCampaignId != null &&
        forAcct.some((c) => c.id === pendingCampaignId) &&
        pendingCampaignId) ||
      (campaignId != null &&
        forAcct.some((c) => c.id === campaignId) &&
        campaignId) ||
      pickDefaultCampaignId(campaigns, accountId);
    if (preferred !== campaignId) {
      setCampaignIdState(preferred);
    }
    if (pendingCampaignId != null) setPendingCampaignId(null);
  }, [hydrated, campaigns, accountId, campaignId, pendingCampaignId]);

  // Persist prefs under this identity only.
  useEffect(() => {
    if (!hydrated) return;
    savePrefs(identityId, {
      accountId,
      campaignId,
      dateYmd: ymd(selectedDate),
      granularity,
    });
  }, [accountId, campaignId, selectedDate, granularity, identityId, hydrated]);

  const refreshAccounts = useCallback(() => {
    fetchAccounts()
      .then((res) => {
        if (res.ok) {
          setAccounts(res.data.accounts || []);
        } else {
          setAccounts([]);
        }
        setAccountsReady(true);
      })
      .catch(() => {
        setAccounts([]);
        setAccountsReady(true);
      });
  }, []);

  // Missing account id only → busiest active book.
  useEffect(() => {
    if (!hydrated || !accountsReady || accountId === "all") return;
    const ok = accounts.some((a) => a.id === accountId);
    if (!ok) setAccountIdState(pickDefaultAccountId(accounts));
  }, [accounts, accountsReady, accountId, hydrated]);

  // Empty book while another has fills → hop to the fuller book (active preferred).
  useEffect(() => {
    if (!hydrated || !accountsReady || accountId === "all") return;
    const cur = accounts.find((a) => a.id === accountId);
    if (!cur) return;
    const countsKnown = accounts.some((a) => typeof a.trade_count === "number");
    if (!countsKnown) return;
    if ((cur.trade_count ?? 0) > 0) return;
    const richer = accounts
      .filter((a) => (a.trade_count ?? 0) > 0)
      .sort((a, b) => {
        // Active first, then by fill count
        if (a.status === "active" && b.status !== "active") return -1;
        if (b.status === "active" && a.status !== "active") return 1;
        return (b.trade_count ?? 0) - (a.trade_count ?? 0);
      })[0];
    if (richer && richer.id !== accountId) {
      setAccountIdState(richer.id);
    }
  }, [accounts, accountsReady, accountId, hydrated]);

  const setAccountId = useCallback((id: AccountScope) => {
    setAccountIdState(id);
    // Force re-pick of default campaign (ledger) for the new account
    setPendingCampaignId(null);
    setCampaignIdState(null);
  }, []);

  const setCampaignId = useCallback((id: number | null) => {
    setCampaignIdState(id);
    setPendingCampaignId(id);
  }, []);

  const setSelectedDate = useCallback((d: Date) => {
    setSelectedDateState(startOfDay(d));
  }, []);

  const setGranularity = useCallback((g: DateGranularity) => {
    setGranularityState(g);
  }, []);

  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => rangeFor(selectedDate, granularity),
    [selectedDate, granularity],
  );

  const rangeFromYmd = ymd(rangeStart);
  const rangeToYmd = ymd(rangeEnd);
  const periodLabel = periodTitle(selectedDate, granularity);
  const dateFilterActive = granularity !== "all";

  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.status === "active"),
    [accounts],
  );

  const selectableAccounts = useMemo(() => {
    const active = accounts.filter((a) => a.status === "active");
    const retired = accounts.filter((a) => a.status === "archived");
    // Active first (busiest), then retired (busiest) so data is always pickable
    const byTrades = (xs: Account[]) =>
      xs
        .slice()
        .sort((a, b) => (b.trade_count ?? 0) - (a.trade_count ?? 0));
    return [...byTrades(active), ...byTrades(retired)];
  }, [accounts]);

  const accountLabel = useMemo(() => {
    if (accountId === "all") return "All accounts";
    const a = accounts.find((x) => x.id === accountId);
    if (!a) return "All accounts";
    // Name only — venue (thinkorswim, etc.) is in Profile → Trade accounts
    if (a.status === "archived") return `${a.label} · retired`;
    return a.label;
  }, [accountId, accounts]);

  const selectableCampaigns = useMemo(() => {
    if (accountId === "all") return campaigns;
    const scoped = campaigns.filter(
      (c) => c.account_id == null || c.account_id === accountId,
    );
    // Ledger first (default continuous book), then active charters, then rest
    return scoped.slice().sort((a, b) => {
      if (a.is_ledger && !b.is_ledger) return -1;
      if (b.is_ledger && !a.is_ledger) return 1;
      if (a.status === "active" && b.status !== "active") return -1;
      if (b.status === "active" && a.status !== "active") return 1;
      return (a.title || "").localeCompare(b.title || "");
    });
  }, [campaigns, accountId]);

  const campaignLabel = useMemo(() => {
    if (campaignId == null) return "All campaigns";
    const c = campaigns.find((x) => x.id === campaignId);
    if (!c) return "Campaign";
    if (c.is_ledger) return `${c.title} · default`;
    return c.title;
  }, [campaignId, campaigns]);

  const accountIdParam = accountId === "all" ? null : accountId;

  const shiftPeriod = useCallback(
    (delta: number) => {
      if (granularity === "all") return;
      setSelectedDateState((prev) => {
        if (granularity === "year") {
          return startOfDay(
            new Date(
              prev.getFullYear() + delta,
              prev.getMonth(),
              prev.getDate(),
            ),
          );
        }
        if (granularity === "month") {
          return startOfMonth(
            new Date(prev.getFullYear(), prev.getMonth() + delta, 1),
          );
        }
        if (granularity === "week") {
          return addDays(prev, delta * 7);
        }
        return addDays(prev, delta);
      });
    },
    [granularity],
  );

  const goToday = useCallback(() => {
    setSelectedDateState(startOfDay(new Date()));
  }, []);

  const value = useMemo<PracticeContextValue>(
    () => ({
      identityId,
      prefsReady: hydrated,
      accountId,
      setAccountId,
      campaignId,
      setCampaignId,
      campaigns,
      selectableCampaigns,
      campaignLabel,
      selectedDate,
      setSelectedDate,
      granularity,
      setGranularity,
      rangeStart,
      rangeEnd,
      rangeFromYmd,
      rangeToYmd,
      periodLabel,
      dateFilterActive,
      accounts,
      activeAccounts,
      selectableAccounts,
      accountsReady,
      refreshAccounts,
      accountLabel,
      accountIdParam,
      shiftPeriod,
      goToday,
    }),
    [
      identityId,
      hydrated,
      accountId,
      setAccountId,
      campaignId,
      setCampaignId,
      campaigns,
      selectableCampaigns,
      campaignLabel,
      selectedDate,
      setSelectedDate,
      granularity,
      setGranularity,
      rangeStart,
      rangeEnd,
      rangeFromYmd,
      rangeToYmd,
      periodLabel,
      dateFilterActive,
      accounts,
      activeAccounts,
      selectableAccounts,
      accountsReady,
      refreshAccounts,
      accountLabel,
      accountIdParam,
      shiftPeriod,
      goToday,
    ],
  );

  return (
    <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>
  );
}

export function usePracticeContext(): PracticeContextValue {
  const ctx = useContext(PracticeContext);
  if (!ctx) {
    throw new Error(
      "usePracticeContext must be used within PracticeContextProvider",
    );
  }
  return ctx;
}

/** Optional hook when a component may render outside Practice chrome. */
export function usePracticeContextOptional(): PracticeContextValue | null {
  return useContext(PracticeContext);
}

export const PRACTICE_GRANULARITIES: {
  id: DateGranularity;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "year", label: "Year" },
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
];

/** True when trade exec_at (ISO) falls in inclusive YMD range. */
export function tradeInDateRange(
  execAt: string | null | undefined,
  fromYmd: string,
  toYmd: string,
): boolean {
  if (!execAt) return false;
  const day = execAt.slice(0, 10);
  if (day.length < 10) return false;
  return day >= fromYmd && day <= toYmd;
}
