"use client";

/**
 * Account management — Profile / settings only (Practice Context Spec v0.2 §1).
 * Selection lives in Practice chrome; create/list lives here.
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import type { Account, Catalog } from "@/lib/tradeLog";
import { fetchAccounts, fetchCatalog } from "@/lib/tradeLogApi";

export default function TradeAccountsSettings() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [load, setLoad] = useState<"loading" | "ok" | "anon" | "err">("loading");
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newBroker, setNewBroker] = useState("thinkorswim");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [ac, cat] = await Promise.all([fetchAccounts(), fetchCatalog()]);
      if (!ac.ok) {
        setLoad(ac.error.kind === "anon" ? "anon" : "err");
        if (ac.error.kind === "err") setError(ac.error.message);
        return;
      }
      setAccounts(ac.data.accounts || []);
      if (cat.ok) {
        setCatalog({
          venues: cat.data.venues || [],
          strategies: cat.data.strategies || [],
        });
      }
      setLoad("ok");
    } catch (e) {
      setLoad("err");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function createAccount() {
    if (!newLabel.trim()) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const r = await fetch("/api/me/trade-log/accounts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newLabel.trim(),
          broker: newBroker,
        }),
      });
      if (!r.ok) {
        setError(await r.text());
        return;
      }
      setNewLabel("");
      setMsg("Account created. Select it from Practice chrome when trading.");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (load === "loading") {
    return (
      <p className="text-sm text-[var(--color-label-tertiary)]">
        Loading accounts…
      </p>
    );
  }
  if (load === "anon") {
    return (
      <p className="text-sm text-[var(--color-label-secondary)]">
        Sign in to manage trade accounts.
      </p>
    );
  }

  return (
    <section
      id="trade-accounts"
      className="surface-card border border-[var(--color-separator)] p-6"
      data-testid="trade-accounts-settings"
    >
      <h2 className="text-lg font-semibold text-[var(--color-label)]">
        Trade accounts
      </h2>
      <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
        Broker or sim · max 10 active. Default{" "}
        <strong className="font-medium">Primary</strong> is provisioned
        automatically. Selection for day-to-day work lives in Practice chrome;
        this is where you add accounts.
      </p>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {msg && (
        <p className="mt-3 text-sm text-[var(--color-tint)]" role="status">
          {msg}
        </p>
      )}

      <ul className="mt-4 divide-y divide-[var(--color-separator)] rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)]">
        {accounts.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2.5 text-sm"
          >
            <span className="font-medium text-[var(--color-label)]">
              {a.label}
            </span>
            <span className="text-[var(--color-label-secondary)]">
              {a.broker && a.broker !== "unset" ? a.broker : "Venue not set"}
              <span className="text-[var(--color-label-tertiary)]">
                {" "}
                · {a.status}
                {a.broker && a.broker !== "unset" ? ` · ${a.venue_kind}` : ""}
              </span>
            </span>
          </li>
        ))}
        {accounts.length === 0 && (
          <li className="px-3 py-2.5 text-sm text-[var(--color-label-tertiary)]">
            No accounts yet.
          </li>
        )}
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
          disabled={busy || !newLabel.trim()}
          onClick={() => void createAccount()}
        >
          {busy ? "Creating…" : "Create account"}
        </Button>
      </div>
    </section>
  );
}
