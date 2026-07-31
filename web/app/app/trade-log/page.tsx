"use client";

// Trade Log v1.1 P1 — table-first blotter, right sheet.
// Account + date scope: Practice Context Spec v0.2 (chrome).

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TradeLogTable from "@/components/trade-log/TradeLogTable";
import TradeLogToolbar from "@/components/trade-log/TradeLogToolbar";
import TradeSheet from "@/components/trade-log/TradeSheet";
import ImportSheet from "@/components/trade-log/ImportSheet";
import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import type { Account, Catalog, Trade } from "@/lib/tradeLog";
import {
  exportUrl,
  fetchCatalog,
  fetchTrades,
} from "@/lib/tradeLogApi";
import { usePracticeContext } from "@/lib/practiceContext";

type LoadState = "loading" | "ok" | "anon" | "forbidden" | "err";

function TradeLogBody() {
  const searchParams = useSearchParams();
  const deepLinkId = Number(searchParams.get("id") || "");
  const {
    accountId,
    accountIdParam,
    setAccountId,
    accountLabel,
    accounts: ctxAccounts,
    refreshAccounts,
  } = usePracticeContext();

  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Trade | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deepLinked, setDeepLinked] = useState(false);

  const load = useCallback(() => {
    setError(null);
    Promise.all([fetchTrades(accountIdParam), fetchCatalog()])
      .then(async ([tr, vn]) => {
        if (!tr.ok) {
          const msg =
            tr.error.kind === "err" ? tr.error.message : tr.error.kind;
          // Stale / foreign account id (wrong member after SSO switch) → All.
          if (
            accountIdParam != null &&
            tr.error.kind === "err" &&
            /account not found/i.test(tr.error.message || "")
          ) {
            setAccountId("all");
            setError(null);
            setState("loading");
            return;
          }
          setState(tr.error.kind === "err" ? "err" : tr.error.kind);
          if (tr.error.kind === "err") setError(msg);
          return;
        }
        if (!vn.ok) {
          if (vn.error.kind === "anon" || vn.error.kind === "forbidden") {
            setState(vn.error.kind);
            return;
          }
        }
        setTrades(tr.data.trades || []);
        setAccounts(tr.data.accounts || []);
        refreshAccounts();
        if (vn.ok) {
          setCatalog({
            venues: vn.data.venues || [],
            strategies: vn.data.strategies || [],
          });
        }
        setState("ok");
      })
      .catch((e) => {
        setState("err");
        setError(e instanceof Error ? e.message : String(e));
      });
  }, [accountIdParam, refreshAccounts, setAccountId]);

  useEffect(() => {
    load();
  }, [load]);

  // Audit fix: date chrome must NOT hide the blotter.
  // Pre-change Trade Log showed the full identity/account book with no date
  // filter. Practice Context date remains for Journal / Reports only.
  useEffect(() => {
    if (state !== "ok" || !deepLinkId || deepLinked) return;
    const t = trades.find((x) => x.id === deepLinkId);
    if (!t) return;
    setSelected(t);
    setSheetMode("edit");
    setSheetOpen(true);
    setDeepLinked(true);
    requestAnimationFrame(() => {
      const el = document.getElementById(`trade-row-${t.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [state, trades, deepLinkId, deepLinked]);

  useEffect(() => {
    setDeepLinked(false);
  }, [deepLinkId]);

  const mergedAccounts = accounts.length ? accounts : ctxAccounts;
  const activeAccounts = mergedAccounts.filter((a) => a.status === "active");
  const primary =
    activeAccounts.find((a) => a.label === "Primary") || activeAccounts[0];
  const defaultAcct =
    accountId !== "all" ? accountId : primary?.id ?? null;
  const exportAccount =
    accountId !== "all"
      ? mergedAccounts.find((a) => a.id === accountId)
      : primary;
  const nativeVenueLabel =
    exportAccount?.broker && exportAccount.broker !== "unset"
      ? exportAccount.broker
      : "FatTail if unset";

  return (
    <>
      <TradeLogToolbar
        accountLabel={accountLabel}
        onImport={() => setImportOpen(true)}
        onNewTrade={() => {
          setSheetMode("create");
          setSelected(null);
          setSheetOpen(true);
        }}
        nativeVenueLabel={nativeVenueLabel}
        onExport={(fmt) => {
          let aid: number | null = accountIdParam;
          if (fmt === "native" && accountId === "all" && primary?.id) {
            aid = primary.id;
          }
          window.location.href = exportUrl({ accountId: aid, format: fmt });
        }}
      />

      {state === "loading" && (
        <p className="mt-8 text-sm text-[var(--color-label-tertiary)]">
          Loading…
        </p>
      )}
      {state === "anon" && (
        <p className="mt-8 text-sm">
          <Link href="/login" className="font-medium text-[var(--color-tint)]">
            Sign in
          </Link>{" "}
          to use Trade Log.
        </p>
      )}
      {state === "forbidden" && (
        <div className="surface-card mt-8 border border-[var(--color-separator)] p-5 text-sm">
          <p className="font-medium text-[var(--color-label)]">
            Membership required
          </p>
          <p className="mt-2 text-[var(--color-label-secondary)]">
            Trade Log is available to Activator and above.
          </p>
          <Link
            href="/membership"
            className="mt-3 inline-block font-medium text-[var(--color-tint)]"
          >
            View membership →
          </Link>
        </div>
      )}
      {state === "err" && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <p className="font-medium">Could not load Trade Log</p>
          {error && <p className="mt-1 font-mono text-xs opacity-80">{error}</p>}
          <button type="button" onClick={() => load()} className="mt-3 underline">
            Try again
          </button>
        </div>
      )}

      {state === "ok" && (
        <TradeLogTable
          trades={trades}
          selectedId={selected?.id}
          onNewTrade={() => {
            setSheetMode("create");
            setSelected(null);
            setSheetOpen(true);
          }}
          onSelect={(t) => {
            setSelected(t);
            setSheetMode("edit");
            setSheetOpen(true);
          }}
        />
      )}

      <TradeSheet
        open={sheetOpen && state === "ok"}
        mode={sheetMode}
        trade={sheetMode === "edit" ? selected : null}
        accounts={mergedAccounts}
        catalog={catalog}
        defaultAccountId={defaultAcct}
        onClose={() => setSheetOpen(false)}
        onSaved={() => load()}
      />
      <ImportSheet
        open={importOpen && state === "ok"}
        accounts={mergedAccounts}
        defaultAccountId={defaultAcct}
        onClose={() => setImportOpen(false)}
        onImported={() => load()}
      />
    </>
  );
}

function TradeLogClient() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 pb-24 sm:px-6">
      <PracticeSuiteChrome active="trade-log" hideTitle>
        <TradeLogBody />
      </PracticeSuiteChrome>
    </main>
  );
}

export default function TradeLogPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6">
          <p className="text-sm text-[var(--color-label-tertiary)]">
            Loading Trade Log…
          </p>
        </main>
      }
    >
      <TradeLogClient />
    </Suspense>
  );
}
