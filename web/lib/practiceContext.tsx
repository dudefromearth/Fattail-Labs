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

/** If saved account has 0 fills but another book has fills, use All (one-time on hydrate). */
function resolveAccountPref(
  saved: AccountScope,
  accounts: Account[],
): AccountScope {
  if (saved === "all") return "all";
  const acct = accounts.find((a) => a.id === saved && a.status === "active");
  if (!acct) return "all";
  const countsKnown = accounts.some((a) => typeof a.trade_count === "number");
  if (!countsKnown) return saved;
  if ((acct.trade_count ?? 0) > 0) return saved;
  if (accounts.some((a) => a.status === "active" && (a.trade_count ?? 0) > 0)) {
    return "all";
  }
  return saved;
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
  dateYmd: string;
  granularity: DateGranularity;
};

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
    accountId: "all",
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
      accountId = "all";
    } else {
      const n = Number(parsed.accountId);
      accountId = Number.isFinite(n) && n > 0 ? n : "all";
    }
    const g = parsed.granularity;
    const granularity: DateGranularity =
      g && (GRANULARITIES as string[]).includes(g) ? g : "all";
    const dateYmd =
      parseYmd(parsed.dateYmd) != null
        ? (parsed.dateYmd as string)
        : fallback.dateYmd;
    return { accountId, dateYmd, granularity };
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
  const [selectedDate, setSelectedDateState] = useState<Date>(() =>
    startOfDay(new Date()),
  );
  const [granularity, setGranularityState] =
    useState<DateGranularity>("all");
  const [hydrated, setHydrated] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsReady, setAccountsReady] = useState(false);

  // Resolve session + accounts, then apply prefs **once** before consumers fetch.
  // Order matters: initial React state is All/all-time → first paint must NOT fetch
  // until this finishes, or equity/trades flash full book then collapse under prefs.
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

      // One-time recovery from the empty-Primary / day-scope loop (2026-07-31).
      try {
        if (localStorage.getItem(FULLBOOK_MIGRATE) !== "1") {
          account = "all";
          gran = "all";
          dateYmd = ymd(startOfDay(new Date()));
          localStorage.setItem(FULLBOOK_MIGRATE, "1");
          if (iid != null) {
            savePrefs(iid, {
              accountId: account,
              dateYmd,
              granularity: gran,
            });
          }
        }
      } catch {
        /* ignore */
      }

      setAccountIdState(account);
      setSelectedDateState(parseYmd(dateYmd) ?? startOfDay(new Date()));
      setGranularityState(gran);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist prefs under this identity only.
  useEffect(() => {
    if (!hydrated) return;
    savePrefs(identityId, {
      accountId,
      dateYmd: ymd(selectedDate),
      granularity,
    });
  }, [accountId, selectedDate, granularity, identityId, hydrated]);

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

  // Drop account ids that are not this member's (wrong id after SSO switch / cleanup).
  useEffect(() => {
    if (!hydrated || !accountsReady || accountId === "all") return;
    const ok = accounts.some(
      (a) => a.id === accountId && a.status === "active",
    );
    if (!ok) setAccountIdState("all");
  }, [accounts, accountsReady, accountId, hydrated]);

  const setAccountId = useCallback((id: AccountScope) => {
    setAccountIdState(id);
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

  const accountLabel = useMemo(() => {
    if (accountId === "all") return "All accounts";
    const a = accounts.find((x) => x.id === accountId);
    if (!a) return "All accounts";
    return a.broker && a.broker !== "unset"
      ? `${a.label} · ${a.broker}`
      : a.label;
  }, [accountId, accounts]);

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
