"use client";

/**
 * Accounts & Capital — Capital v0.3 · Funding v0.2 · Staleness v0.1 · W0-6 IA.
 * Sole account write path (create / rename / retire / starting balance / movements).
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import type { Account, Catalog } from "@/lib/tradeLog";
import { fetchAccounts, fetchCatalog } from "@/lib/tradeLogApi";
import {
  addMovement,
  fetchCapitalOverview,
  fetchMovements,
  fetchPositionsValuation,
  formatMarksAsOf,
  patchAccountBuyingPower,
  patchCapitalPrefs,
  type CapitalOverview,
  type CashMovement,
  type PositionsValuation,
} from "@/lib/capitalApi";
import PositionsValuationTable from "@/components/capital/PositionsValuationTable";
import {
  rememberPracticeAccountId,
  usePracticeContextOptional,
} from "@/lib/practiceContext";

function money(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function AccountsCapitalApp() {
  const practice = usePracticeContextOptional();
  const [overview, setOverview] = useState<CapitalOverview | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [load, setLoad] = useState<"loading" | "ok" | "anon" | "err">("loading");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [newBroker, setNewBroker] = useState("fattail");
  const [newStart, setNewStart] = useState("");
  const [fundAmt, setFundAmt] = useState("");
  const [fundNote, setFundNote] = useState("");
  const [startDraft, setStartDraft] = useState("");
  const [tolDraft, setTolDraft] = useState("6");
  const [tolForm, setTolForm] = useState<"percent" | "dollars">("percent");
  const [bpValue, setBpValue] = useState("");
  const [bpPosture, setBpPosture] = useState<"arbitrary" | "self_report">(
    "arbitrary",
  );
  const [valuation, setValuation] = useState<PositionsValuation | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [ov, ac, cat, val] = await Promise.all([
        fetchCapitalOverview().catch((e) => {
          throw e;
        }),
        fetchAccounts(),
        fetchCatalog(),
        fetchPositionsValuation().catch(() => null),
      ]);
      if (!ac.ok) {
        setLoad(ac.error.kind === "anon" ? "anon" : "err");
        if (ac.error.kind === "err") setError(ac.error.message);
        return;
      }
      setOverview(ov);
      setAccounts(ac.data.accounts || []);
      setValuation(val);
      if (cat.ok) {
        setCatalog({
          venues: cat.data.venues || [],
          strategies: cat.data.strategies || [],
        });
      }
      setTolDraft(
        String(ov.prefs.tolerated_master_drawdown ?? 6),
      );
      setTolForm(
        ov.prefs.tolerated_master_drawdown_form === "dollars"
          ? "dollars"
          : "percent",
      );
      setLoad("ok");
    } catch (e) {
      const text = e instanceof Error ? e.message : String(e);
      if (text.includes("401") || text.toLowerCase().includes("sign")) {
        setLoad("anon");
      } else {
        setLoad("err");
        setError(text);
      }
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (selectedId == null) {
      setMovements([]);
      return;
    }
    void fetchMovements(selectedId)
      .then((d) => setMovements(d.movements || []))
      .catch(() => setMovements([]));
    const bal = overview?.accounts.find((a) => a.id === selectedId);
    setStartDraft(
      bal?.starting_balance != null ? String(bal.starting_balance) : "",
    );
    setBpPosture(
      bal?.buying_power_posture === "self_report" ? "self_report" : "arbitrary",
    );
    setBpValue(
      bal?.buying_power_value != null ? String(bal.buying_power_value) : "",
    );
  }, [selectedId, overview]);

  async function saveAccountBp(id: number) {
    setBusy(true);
    setError(null);
    try {
      await patchAccountBuyingPower(id, {
        buying_power_posture: bpPosture,
        buying_power_value:
          bpPosture === "self_report" && bpValue.trim() !== ""
            ? Number(bpValue)
            : null,
      });
      setMsg("Buying power saved for this account.");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function createAccount() {
    if (!newLabel.trim()) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const body: Record<string, unknown> = {
        label: newLabel.trim(),
        broker: newBroker,
      };
      if (newStart.trim() !== "") {
        body.starting_balance = Number(newStart);
      }
      const r = await fetch("/api/me/trade-log/accounts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        setError(await r.text());
        return;
      }
      setNewLabel("");
      setNewStart("");
      setMsg("Account created.");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function setAccountStatus(id: number, status: "active" | "archived") {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/me/trade-log/accounts/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) {
        setError(await r.text());
        return;
      }
      if (status === "active") {
        rememberPracticeAccountId(id);
        practice?.setAccountId(id);
        practice?.refreshAccounts();
      } else {
        practice?.refreshAccounts();
      }
      setMsg(status === "archived" ? "Account retired." : "Account restored.");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveStartingBalance(id: number) {
    setBusy(true);
    setError(null);
    try {
      const raw = startDraft.trim();
      const body = {
        starting_balance: raw === "" ? null : Number(raw),
      };
      const r = await fetch(`/api/me/trade-log/accounts/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        setError(await r.text());
        return;
      }
      setMsg("Starting balance saved.");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function submitMovement(sign: 1 | -1) {
    if (selectedId == null) return;
    const n = Number(fundAmt);
    if (!Number.isFinite(n) || n === 0) {
      setError("Enter a non-zero amount.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await addMovement(selectedId, {
        amount: sign * Math.abs(n),
        note: fundNote.trim() || null,
      });
      setOverview(res.overview);
      setFundAmt("");
      setFundNote("");
      setMsg(sign > 0 ? "Deposit recorded." : "Withdrawal recorded.");
      const mv = await fetchMovements(selectedId);
      setMovements(mv.movements || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function savePrefs(extra?: { confirm_balances?: boolean }) {
    setBusy(true);
    setError(null);
    try {
      // Portfolio prefs only — BP is per-account (PV-2)
      const body: Record<string, unknown> = {
        tolerated_master_drawdown: Number(tolDraft) || 0,
        tolerated_master_drawdown_form: tolForm,
        ...extra,
      };
      await patchCapitalPrefs(body);
      setMsg(
        extra?.confirm_balances
          ? "Balances confirmed as current."
          : "Preferences saved.",
      );
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
        Loading capital…
      </p>
    );
  }
  if (load === "anon") {
    return (
      <p className="text-sm text-[var(--color-label-secondary)]">
        Sign in to manage accounts and capital.
      </p>
    );
  }

  const md = overview?.master_drawdown;
  const selectedBal = overview?.accounts.find((a) => a.id === selectedId);

  return (
    <div className="space-y-8" data-testid="accounts-capital-app">
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {msg && (
        <p className="text-sm text-[var(--color-tint)]" role="status">
          {msg}
        </p>
      )}

      {/* Header as-of (V14 · weekend rule) */}
      <p
        className="text-right text-xs text-[var(--color-label-tertiary)]"
        data-testid="accounts-capital-marks-as-of"
      >
        {formatMarksAsOf(valuation)} · declared figures vary by row ·{" "}
        <a
          href="/app/practice/symbols"
          className="font-medium text-[var(--color-tint)] hover:underline"
        >
          Marked underliers
        </a>
      </p>

      {/* 1. Summary card — All accounts · master DD · allocations */}
      <section className="surface-card border border-[var(--color-separator)] p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-[var(--color-label-secondary)]">
            All accounts
          </h2>
          <p
            className="text-3xl font-semibold tabular-nums text-[var(--color-label)]"
            data-testid="total-net-capital"
          >
            {money(overview?.total_net_capital)}
          </p>
        </div>
        {md && (
          <p className="mt-3 border-t border-[var(--color-separator)] pt-3 text-sm text-[var(--color-label)]">
            Tolerated drawdown ·{" "}
            {overview?.prefs.tolerated_master_drawdown_form === "dollars"
              ? money(overview.prefs.tolerated_master_drawdown)
              : `${overview?.prefs.tolerated_master_drawdown ?? "—"}%`}{" "}
            of {money(overview?.total_net_capital)} base ·{" "}
            {money(md.tolerance_budget_dollars)} · realized{" "}
            {money(md.realized_dd_dollars)}
          </p>
        )}
        {md?.over_budget && overview?.witnesses.master_dd && (
          <p
            className="mt-1 text-sm text-amber-700 dark:text-amber-400"
            data-testid="master-dd-witness"
          >
            {overview.witnesses.master_dd}
          </p>
        )}
        <p className="mt-2 text-xs text-[var(--color-label-tertiary)]">
          Allocations declared: none · overcommit: none
        </p>
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void savePrefs({ confirm_balances: true })}
            data-testid="confirm-balances"
          >
            Confirm as current
          </Button>
          {overview?.prefs.balances_confirmed_at && (
            <span className="ml-3 text-xs text-[var(--color-label-tertiary)]">
              Last confirmed{" "}
              {new Date(overview.prefs.balances_confirmed_at).toLocaleString()}
            </span>
          )}
        </div>
      </section>

      {/* 2. Accounts list */}
      <section className="surface-card border border-[var(--color-separator)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-label)]">
          Accounts
        </h2>
        <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
          FatTail trade books · max 10 active. Balance = starting + fill P&amp;L
          + cash movements. Campaign direction is separate (Practice).
        </p>
        <ul className="mt-4 divide-y divide-[var(--color-separator)] rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)]">
          {(overview?.accounts || []).map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className={`flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-[var(--color-fill)] ${
                  selectedId === a.id ? "bg-[var(--color-fill)]" : ""
                }`}
                onClick={() => setSelectedId(a.id)}
                data-testid={`capital-account-row-${a.id}`}
              >
                <span>
                  <span className="font-medium text-[var(--color-label)]">
                    {a.label}
                  </span>
                  {a.status === "archived" && (
                    <span className="ml-2 text-xs text-[var(--color-label-tertiary)]">
                      retired
                    </span>
                  )}
                  {!a.starting_balance_set && (
                    <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">
                      start unset
                    </span>
                  )}
                </span>
                <span className="tabular-nums text-[var(--color-label)]">
                  {money(a.current_balance)}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
            New account
            <input
              className="mt-1 block min-h-[var(--hit-min)] w-40 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 text-sm"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label"
              data-testid="capital-new-label"
            />
          </label>
          <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
            Venue
            <select
              className="mt-1 block min-h-[var(--hit-min)] rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 text-sm"
              value={newBroker}
              onChange={(e) => setNewBroker(e.target.value)}
            >
              {(catalog?.venues || [{ code: "fattail", label: "FatTail" }]).map(
                (v) => (
                  <option key={v.code} value={v.code}>
                    {v.label}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
            Starting balance
            <input
              className="mt-1 block min-h-[var(--hit-min)] w-28 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 text-sm tabular-nums"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              placeholder="optional"
              inputMode="decimal"
            />
          </label>
          <Button
            type="button"
            variant="primary"
            disabled={busy || !newLabel.trim()}
            onClick={() => void createAccount()}
            data-testid="capital-create-account"
          >
            Create
          </Button>
        </div>
      </section>

      {/* 3. Account detail — start + movements */}
      {selectedId != null && selectedBal && (
        <section
          className="surface-card border border-[var(--color-separator)] p-6"
          data-testid="capital-account-detail"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-label)]">
                {selectedBal.label}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
                Balance {money(selectedBal.current_balance)} · fills{" "}
                {money(selectedBal.fill_pnl_sum)} · movements{" "}
                {money(selectedBal.movements_sum)}
              </p>
            </div>
            <div className="flex gap-2">
              {selectedBal.status === "active" ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void setAccountStatus(selectedId, "archived")}
                >
                  Retire
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void setAccountStatus(selectedId, "active")}
                >
                  Restore
                </Button>
              )}
            </div>
          </div>

          {/* Deployability: BP only until OD-MC (no provisional cash) */}
          <p
            className="mt-3 text-sm tabular-nums text-[var(--color-label-secondary)]"
            data-testid="deployability-pair"
          >
            Buying power{" "}
            {selectedBal.buying_power_posture === "self_report" &&
            selectedBal.buying_power_value != null
              ? money(selectedBal.buying_power_value)
              : "—"}
            {selectedBal.buying_power_as_of
              ? ` (stated ${new Date(selectedBal.buying_power_as_of).toLocaleDateString()})`
              : selectedBal.buying_power_posture === "arbitrary"
                ? " (not tracking)"
                : ""}
            <span className="ml-2 text-xs text-[var(--color-label-tertiary)]">
              · Cash omitted until match-cash calibration
            </span>
          </p>

          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
              Starting balance
              <input
                className="mt-1 block min-h-[var(--hit-min)] w-32 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 text-sm tabular-nums"
                value={startDraft}
                onChange={(e) => setStartDraft(e.target.value)}
                inputMode="decimal"
                data-testid="capital-starting-balance"
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void saveStartingBalance(selectedId)}
            >
              Save start
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
              Buying power (this account)
              <select
                className="mt-1 block min-h-[var(--hit-min)] rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 text-sm"
                value={bpPosture}
                onChange={(e) =>
                  setBpPosture(
                    e.target.value === "self_report"
                      ? "self_report"
                      : "arbitrary",
                  )
                }
              >
                <option value="arbitrary">Not tracking</option>
                <option value="self_report">Self-report</option>
              </select>
            </label>
            {bpPosture === "self_report" && (
              <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                BP $
                <input
                  className="mt-1 block min-h-[var(--hit-min)] w-28 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 text-sm tabular-nums"
                  value={bpValue}
                  onChange={(e) => setBpValue(e.target.value)}
                  inputMode="decimal"
                />
              </label>
            )}
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void saveAccountBp(selectedId)}
              data-testid="capital-save-bp"
            >
              Save BP
            </Button>
          </div>

          <h3 className="mt-6 text-sm font-semibold text-[var(--color-label)]">
            Positions
          </h3>
          <div className="mt-2">
            <PositionsValuationTable
              data={valuation}
              variant="compact"
              accountIdFilter={selectedId}
              showHeader={false}
            />
          </div>

          <h3 className="mt-6 text-sm font-semibold text-[var(--color-label)]">
            Cash movements
          </h3>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
              Amount
              <input
                className="mt-1 block min-h-[var(--hit-min)] w-28 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 text-sm tabular-nums"
                value={fundAmt}
                onChange={(e) => setFundAmt(e.target.value)}
                inputMode="decimal"
                data-testid="capital-movement-amount"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
              Note
              <input
                className="mt-1 block min-h-[var(--hit-min)] w-40 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 text-sm"
                value={fundNote}
                onChange={(e) => setFundNote(e.target.value)}
              />
            </label>
            <Button
              type="button"
              variant="primary"
              disabled={busy}
              onClick={() => void submitMovement(1)}
              data-testid="capital-fund"
            >
              Deposit
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void submitMovement(-1)}
              data-testid="capital-withdraw"
            >
              Withdraw
            </Button>
          </div>
          <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm">
            {movements.length === 0 && (
              <li className="text-[var(--color-label-tertiary)]">
                No movements yet.
              </li>
            )}
            {movements.map((m) => (
              <li
                key={m.id}
                className="flex justify-between gap-2 tabular-nums text-[var(--color-label-secondary)]"
              >
                <span>
                  {m.occurred_at
                    ? new Date(m.occurred_at).toLocaleDateString()
                    : "—"}
                  {m.note ? ` · ${m.note}` : ""}
                </span>
                <span
                  className={
                    m.amount >= 0
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-red-600"
                  }
                >
                  {m.amount >= 0 ? "+" : ""}
                  {money(m.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4–5. Buying power + tolerated master DD */}
      <section className="surface-card border border-[var(--color-separator)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-label)]">
          Preferences
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
            Tolerated master drawdown
            <div className="mt-1 flex gap-2">
              <input
                className="min-h-[var(--hit-min)] w-24 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 text-sm tabular-nums"
                value={tolDraft}
                onChange={(e) => setTolDraft(e.target.value)}
                inputMode="decimal"
                data-testid="capital-tolerance"
              />
              <select
                className="min-h-[var(--hit-min)] rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 text-sm"
                value={tolForm}
                onChange={(e) =>
                  setTolForm(e.target.value === "dollars" ? "dollars" : "percent")
                }
              >
                <option value="percent">%</option>
                <option value="dollars">$</option>
              </select>
            </div>
          </label>
          <p className="text-xs text-[var(--color-label-tertiary)]">
            Buying power is set per account (open an account above). Cash on the
            deployability line waits on match-cash (Coach OD-MC).
          </p>
        </div>
        <div className="mt-4">
          <Button
            type="button"
            variant="primary"
            disabled={busy}
            onClick={() => void savePrefs()}
            data-testid="capital-save-prefs"
          >
            Save preferences
          </Button>
        </div>
      </section>
    </div>
  );
}
