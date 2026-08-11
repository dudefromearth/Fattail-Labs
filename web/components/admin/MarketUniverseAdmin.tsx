"use client";

/**
 * Admin CRUD for shared mark universe (Practice + Strategy Lab).
 * Create/enable validates symbol via Massive.
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import LiveUnderliersTable from "@/components/market/LiveUnderliersTable";

type UniverseRow = {
  symbol: string;
  feed_symbol?: string | null;
  proxy_symbol?: string | null;
  kind: string;
  role: string;
  enabled: boolean;
  sort_order: number;
  note?: string;
  options_cadence?: string;
  mid?: number | null;
  proxy_mid?: number | null;
  mark_via_proxy?: boolean;
  mark_feed_used?: string | null;
  mark_source?: string | null;
  prev_close?: number | null;
  day_change_pct?: number | null;
  mark_plane?: string | null;
  mark_age_seconds?: number | null;
  mark_stale?: boolean | null;
  validation?: {
    ok: boolean;
    mid?: number;
    feed_used?: string;
    via_proxy?: boolean;
  };
};

const KINDS = ["equity", "etf", "index", "future", "crypto", "other"];

export default function MarketUniverseAdmin() {
  const [rows, setRows] = useState<UniverseRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [load, setLoad] = useState<"loading" | "ok" | "err">("loading");

  const [symbol, setSymbol] = useState("");
  const [kind, setKind] = useState("equity");
  const [feed, setFeed] = useState("");
  const [proxy, setProxy] = useState("");
  const [note, setNote] = useState("");
  const [sortOrder, setSortOrder] = useState("300");
  const [validateOnSave, setValidateOnSave] = useState(true);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch("/api/admin/market-universe", {
        credentials: "same-origin",
      });
      if (!r.ok) {
        setLoad("err");
        setError(await r.text());
        return;
      }
      const d = await r.json();
      setRows(d.symbols || []);
      setLoad("ok");
    } catch (e) {
      setLoad("err");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function createSymbol() {
    if (!symbol.trim()) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/market-universe", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.trim().toUpperCase(),
          kind,
          feed_symbol: feed.trim() || null,
          proxy_symbol: proxy.trim() || null,
          note: note.trim() || null,
          sort_order: Number(sortOrder) || 0,
          enabled: true,
          validate: validateOnSave,
        }),
      });
      const text = await r.text();
      if (!r.ok) {
        setError(text);
        return;
      }
      const d = JSON.parse(text);
      const mid = d.symbol?.validation?.mid;
      setMsg(
        mid != null
          ? `Added ${d.symbol.symbol} · Massive mid ${mid}`
          : `Added ${d.symbol?.symbol}`,
      );
      setSymbol("");
      setFeed("");
      setProxy("");
      setNote("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function validateOnly() {
    if (!symbol.trim()) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/market-universe/validate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.trim().toUpperCase(),
          kind,
          feed_symbol: feed.trim() || null,
          proxy_symbol: proxy.trim() || null,
        }),
      });
      const text = await r.text();
      if (!r.ok) {
        setError(text);
        return;
      }
      const d = JSON.parse(text);
      setMsg(
        `Massive OK · ${d.symbol} mid=${d.mid}` +
          (d.via_proxy ? ` via proxy ${d.feed_used}` : ` feed ${d.feed_used}`),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function toggleEnabled(row: UniverseRow) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(
        `/api/admin/market-universe/${encodeURIComponent(row.symbol)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled: !row.enabled,
            validate: !row.enabled, // validate when turning on
          }),
        },
      );
      if (!r.ok) {
        setError(await r.text());
        return;
      }
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: UniverseRow) {
    if (!confirm(`Remove ${row.symbol} from the shared universe?`)) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(
        `/api/admin/market-universe/${encodeURIComponent(row.symbol)}`,
        { method: "DELETE", credentials: "same-origin" },
      );
      if (!r.ok) {
        setError(await r.text());
        return;
      }
      setMsg(`Deleted ${row.symbol}`);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (load === "loading") {
    return <p className="text-sm text-zinc-500">Loading universe…</p>;
  }

  return (
    <div className="space-y-8" data-testid="market-universe-admin">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Market universe
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Single source of truth for underliers the live stream marks. Practice
          Positions and Strategy Lab Curate both read this list. Create /
          re-enable runs a Massive availability check (unless unchecked).
        </p>
      </header>

      {error && (
        <pre
          className="overflow-x-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          {error}
        </pre>
      )}
      {msg && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400" role="status">
          {msg}
        </p>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Add symbol
        </h2>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="block text-xs text-zinc-500">
            Symbol
            <input
              className="mt-1 block min-h-9 w-28 rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="AMD"
              data-testid="universe-symbol"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            Kind
            <select
              className="mt-1 block min-h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-zinc-500">
            Feed (optional)
            <input
              className="mt-1 block min-h-9 w-28 rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              value={feed}
              onChange={(e) => setFeed(e.target.value)}
              placeholder="I:SPX"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            Proxy (optional)
            <input
              className="mt-1 block min-h-9 w-24 rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              value={proxy}
              onChange={(e) => setProxy(e.target.value.toUpperCase())}
              placeholder="SPY"
            />
          </label>
          <label className="block text-xs text-zinc-500">
            Sort
            <input
              className="mt-1 block min-h-9 w-20 rounded-md border border-zinc-300 bg-white px-2 text-sm tabular-nums dark:border-zinc-700 dark:bg-zinc-950"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </label>
          <label className="block text-xs text-zinc-500">
            Note
            <input
              className="mt-1 block min-h-9 w-40 rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={validateOnSave}
              onChange={(e) => setValidateOnSave(e.target.checked)}
            />
            Validate with Massive
          </label>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || !symbol.trim()}
            onClick={() => void validateOnly()}
            data-testid="universe-validate"
          >
            Check Massive
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={busy || !symbol.trim()}
            onClick={() => void createSymbol()}
            data-testid="universe-create"
          >
            Add
          </Button>
        </div>
      </section>

      {/* Same live-underlier pattern as Practice / Lab */}
      <LiveUnderliersTable
        variant="admin"
        enabledOnly={false}
        title="Live marks (all universe rows)"
        description={
          <>
            Mids use the site-wide live underlier pattern (HTTP ensure_fresh +
            bus). CRUD actions still use the admin API below the prices.
          </>
        }
        showActions={(sym) => {
          const row = rows.find((r) => r.symbol === sym);
          if (!row) return null;
          return (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="text-xs font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
                disabled={busy}
                onClick={() => void toggleEnabled(row)}
              >
                {row.enabled ? "Disable" : "Enable"}
              </button>
              <button
                type="button"
                className="text-xs font-medium text-red-600 underline-offset-2 hover:underline"
                disabled={busy}
                onClick={() => void remove(row)}
              >
                Delete
              </button>
            </div>
          );
        }}
      />
    </div>
  );
}
