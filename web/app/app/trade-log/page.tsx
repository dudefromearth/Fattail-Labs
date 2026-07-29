"use client";

// Trade Log v1.1 P1 — table-first blotter, right sheet, accounts (broker|sim).

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TradeLogTable from "@/components/trade-log/TradeLogTable";
import TradeLogToolbar from "@/components/trade-log/TradeLogToolbar";
import TradeSheet from "@/components/trade-log/TradeSheet";
import ImportSheet from "@/components/trade-log/ImportSheet";
import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import { Button } from "@/components/ui";
import type { Account, Catalog, Trade } from "@/lib/tradeLog";
import {
  exportUrl,
  fetchCatalog,
  fetchTrades,
} from "@/lib/tradeLogApi";

type LoadState = "loading" | "ok" | "anon" | "forbidden" | "err";

function TradeLogClient() {
  const searchParams = useSearchParams();
  const deepLinkId = Number(searchParams.get("id") || "");
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [accountId, setAccountId] = useState<number | "all">("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Trade | null>(null);
  const [acctOpen, setAcctOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newBroker, setNewBroker] = useState("thinkorswim");
  const [acctBusy, setAcctBusy] = useState(false);
  const [deepLinked, setDeepLinked] = useState(false);

  const load = useCallback(() => {
    setError(null);
    const aid = accountId !== "all" ? accountId : null;
    Promise.all([fetchTrades(aid), fetchCatalog()])
      .then(async ([tr, vn]) => {
        if (!tr.ok) {
          setState(tr.error.kind === "err" ? "err" : tr.error.kind);
          if (tr.error.kind === "err") setError(tr.error.message);
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
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  // Journal (and other) deep-link: ?id= → select trade, open sheet, scroll into view
  useEffect(() => {
    if (state !== "ok" || !deepLinkId || deepLinked) return;
    const t = trades.find((x) => x.id === deepLinkId);
    if (!t) return;
    setSelected(t);
    setSheetMode("edit");
    setSheetOpen(true);
    setDeepLinked(true);
    // Wait a frame for paint, then scroll the blotter row into view
    requestAnimationFrame(() => {
      const el = document.getElementById(`trade-row-${t.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [state, trades, deepLinkId, deepLinked]);

  useEffect(() => {
    // New deep-link id → allow re-select
    setDeepLinked(false);
  }, [deepLinkId]);

  async function createAccount() {
    if (!newLabel.trim()) return;
    setAcctBusy(true);
    const r = await fetch("/api/me/trade-log/accounts", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel.trim(), broker: newBroker }),
    });
    setAcctBusy(false);
    if (!r.ok) {
      setError(await r.text());
      return;
    }
    const a = await r.json();
    setNewLabel("");
    setAcctOpen(false);
    setAccountId(a.id);
    load();
  }

  const activeAccounts = accounts.filter((a) => a.status === "active");
  const primary =
    activeAccounts.find((a) => a.label === "Primary") || activeAccounts[0];
  const defaultAcct =
    accountId !== "all" ? accountId : primary?.id ?? null;
  const exportAccount =
    accountId !== "all"
      ? accounts.find((a) => a.id === accountId)
      : primary;
  const nativeVenueLabel =
    exportAccount?.broker && exportAccount.broker !== "unset"
      ? exportAccount.broker
      : "FatTail if unset";

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 pb-24 sm:px-6">
      <PracticeSuiteChrome active="trade-log" hideTitle>
      <TradeLogToolbar
        activeAccounts={activeAccounts}
        accountId={accountId}
        onAccountId={setAccountId}
        accountsOpen={acctOpen}
        onToggleAccounts={() => setAcctOpen((o) => !o)}
        onImport={() => setImportOpen(true)}
        onNewTrade={() => {
          setSheetMode("create");
          setSelected(null);
          setSheetOpen(true);
        }}
        nativeVenueLabel={nativeVenueLabel}
        onExport={(fmt) => {
          let aid: number | null =
            accountId !== "all" ? accountId : null;
          if (fmt === "native" && accountId === "all" && primary?.id) {
            aid = primary.id;
          }
          window.location.href = exportUrl({ accountId: aid, format: fmt });
        }}
      />

      {acctOpen && state === "ok" && (
        <div className="surface-card mt-4 border border-[var(--color-separator)] p-4">
          <h2
            className="font-semibold text-[var(--color-label)]"
            style={{ fontSize: "var(--text-headline)" }}
          >
            Accounts
          </h2>
          <p
            className="mt-1 text-[var(--color-label-tertiary)]"
            style={{ fontSize: "var(--text-footnote)" }}
          >
            Broker or sim · max 10 active. Default{" "}
            <strong className="font-medium text-[var(--color-label-secondary)]">
              Primary
            </strong>{" "}
            is provisioned automatically. Venue is set on first import or first
            trade — not assumed.
          </p>
          <ul className="mt-3 divide-y divide-[var(--color-separator)] rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)]">
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2.5 text-sm"
              >
                <span className="font-medium text-[var(--color-label)]">
                  {a.label}
                </span>
                <span className="text-[var(--color-label-secondary)]">
                  {a.broker && a.broker !== "unset"
                    ? a.broker
                    : "Venue not set"}
                  <span className="text-[var(--color-label-tertiary)]">
                    {" "}
                    · {a.status}
                    {a.broker && a.broker !== "unset"
                      ? ` · ${a.venue_kind}`
                      : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              className="min-h-[var(--hit-min)] min-w-[8rem] flex-1 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 text-sm text-[var(--color-label)]"
              placeholder="Label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              aria-label="New account label"
            />
            <select
              className="min-h-[var(--hit-min)] rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 text-sm text-[var(--color-label)]"
              value={newBroker}
              onChange={(e) => setNewBroker(e.target.value)}
              aria-label="Venue"
            >
              {(catalog?.venues || []).map((v) => (
                <option key={v.code} value={v.code}>
                  {v.kind === "sim" ? "Sim" : "Live"}: {v.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="primary"
              disabled={acctBusy || !newLabel.trim()}
              onClick={() => void createAccount()}
            >
              Create
            </Button>
          </div>
        </div>
      )}

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
        accounts={accounts}
        catalog={catalog}
        defaultAccountId={defaultAcct}
        onClose={() => setSheetOpen(false)}
        onSaved={() => load()}
      />
      <ImportSheet
        open={importOpen && state === "ok"}
        accounts={accounts}
        defaultAccountId={defaultAcct}
        onClose={() => setImportOpen(false)}
        onImported={() => load()}
      />
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
