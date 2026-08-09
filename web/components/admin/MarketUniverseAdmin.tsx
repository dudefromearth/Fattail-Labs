"use client";

/**
 * Admin CRUD for shared mark universe (Practice + Strategy Lab).
 * Create/enable validates symbol via Massive.
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";

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

      <section className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800">
              <th className="px-3 py-2 font-medium">Symbol</th>
              <th className="px-2 py-2 font-medium">Kind</th>
              <th className="px-2 py-2 font-medium">Feed</th>
              <th className="px-2 py-2 font-medium">Proxy</th>
              <th className="px-2 py-2 font-medium">On</th>
              <th className="px-2 py-2 font-medium">Sort</th>
              <th className="px-2 py-2 font-medium">Note</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.symbol}
                className="border-b border-zinc-100 dark:border-zinc-800"
                data-testid={`universe-row-${row.symbol}`}
              >
                <td className="px-3 py-2 font-medium tabular-nums">{row.symbol}</td>
                <td className="px-2 py-2 text-zinc-600">{row.kind}</td>
                <td className="px-2 py-2 text-xs text-zinc-500">
                  {row.feed_symbol || "—"}
                </td>
                <td className="px-2 py-2 text-xs text-zinc-500">
                  {row.proxy_symbol || "—"}
                </td>
                <td className="px-2 py-2">
                  {row.enabled ? (
                    <span className="text-emerald-600">yes</span>
                  ) : (
                    <span className="text-zinc-400">no</span>
                  )}
                </td>
                <td className="px-2 py-2 tabular-nums text-zinc-500">
                  {row.sort_order}
                </td>
                <td className="max-w-[12rem] truncate px-2 py-2 text-xs text-zinc-500">
                  {row.note || "—"}
                </td>
                <td className="px-3 py-2">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-4 text-sm text-zinc-500">No symbols in universe.</p>
        )}
      </section>
    </div>
  );
}
