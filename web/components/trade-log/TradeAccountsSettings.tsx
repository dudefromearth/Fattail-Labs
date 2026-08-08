"use client";

/**
 * Account management — Profile / settings only (Practice Context Spec v0.2 §1).
 * Selection lives in Practice chrome; create/list lives here.
 * Retire = archive (Campaign Concept §4.9 / Trade Log A-2); soft open-campaign gate.
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import type { Account, Catalog } from "@/lib/tradeLog";
import { fetchAccounts, fetchCatalog } from "@/lib/tradeLogApi";
import {
  fetchCampaigns,
  patchCampaign,
  type PracticeCampaign,
} from "@/lib/practiceSpineApi";

export default function TradeAccountsSettings() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [campaigns, setCampaigns] = useState<PracticeCampaign[]>([]);
  const [load, setLoad] = useState<"loading" | "ok" | "anon" | "err">("loading");
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newBroker, setNewBroker] = useState("thinkorswim");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  /** Account id pending retire confirmation */
  const [retireTarget, setRetireTarget] = useState<Account | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [ac, cat, camps] = await Promise.all([
        fetchAccounts(),
        fetchCatalog(),
        fetchCampaigns().catch(() => null),
      ]);
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
      setCampaigns(camps?.campaigns || []);
      setLoad("ok");
    } catch (e) {
      setLoad("err");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function openCampaignsForAccount(accountId: number): PracticeCampaign[] {
    return campaigns.filter(
      (c) =>
        c.account_id === accountId &&
        (c.status === "active" || c.status === "planned"),
    );
  }

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

  async function renameAccount(id: number, label: string) {
    const next = label.trim();
    if (!next) {
      setError("Account name is required");
      return;
    }
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const r = await fetch(`/api/me/trade-log/accounts/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: next }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        const d = (body as { detail?: unknown }).detail;
        setError(
          typeof d === "string"
            ? d
            : d && typeof d === "object" && "message" in d
              ? String((d as { message?: unknown }).message)
              : await r.text(),
        );
        return;
      }
      setRenamingId(null);
      setRenameDraft("");
      setMsg("Account renamed.");
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
    setMsg(null);
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
      setMsg(
        status === "archived"
          ? "Account retired (archived). History stays readable; you can un-retire later."
          : "Account restored to active.",
      );
      setRetireTarget(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  /** F4: complete the silent book as part of retirement when it's the only open contract. */
  async function closeBookAndRetire(account: Account, book: PracticeCampaign) {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await patchCampaign(book.id, { status: "completed" });
      const r = await fetch(`/api/me/trade-log/accounts/${account.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      if (!r.ok) {
        setError(await r.text());
        return;
      }
      setMsg("Book closed and account retired.");
      setRetireTarget(null);
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

  const openForRetire = retireTarget
    ? openCampaignsForAccount(retireTarget.id)
    : [];
  const onlySilentBook =
    openForRetire.length === 1 && openForRetire[0].is_default === true;

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
        Broker or sim · max 10 active. A{" "}
        <strong className="font-medium">Default</strong> account is provisioned
        automatically (you can rename it). Selection for day-to-day work lives
        in Practice chrome; this is where you add, rename, and retire accounts
        (archive, never delete).
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
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
            data-testid={`trade-account-row-${a.id}`}
          >
            {renamingId === a.id ? (
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <input
                  className="min-h-[var(--hit-min)] min-w-[8rem] flex-1 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 text-sm text-[var(--color-label)]"
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  aria-label="Account name"
                  data-testid={`account-rename-input-${a.id}`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void renameAccount(a.id, renameDraft);
                    }
                    if (e.key === "Escape") {
                      setRenamingId(null);
                      setRenameDraft("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="primary"
                  disabled={busy || !renameDraft.trim()}
                  onClick={() => void renameAccount(a.id, renameDraft)}
                  data-testid={`account-rename-save-${a.id}`}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    setRenamingId(null);
                    setRenameDraft("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <span className="font-medium text-[var(--color-label)]">
                  {a.label}
                  {(a.label === "Default" || a.label === "Primary") && (
                    <span className="ml-1.5 text-xs font-normal text-[var(--color-label-tertiary)]">
                      · default
                    </span>
                  )}
                </span>
                <span className="flex flex-wrap items-center gap-3 text-[var(--color-label-secondary)]">
                  <span>
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
                  <button
                    type="button"
                    disabled={busy}
                    className="text-xs font-medium text-[var(--color-tint)] hover:underline disabled:opacity-50"
                    onClick={() => {
                      setRenamingId(a.id);
                      setRenameDraft(a.label);
                    }}
                    data-testid={`account-rename-${a.id}`}
                  >
                    Rename
                  </button>
                  {a.status === "active" ? (
                    <button
                      type="button"
                      disabled={busy}
                      className="text-xs font-medium text-[var(--color-tint)] hover:underline disabled:opacity-50"
                      onClick={() => setRetireTarget(a)}
                      data-testid={`account-retire-${a.id}`}
                    >
                      Retire
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      className="text-xs font-medium text-[var(--color-tint)] hover:underline disabled:opacity-50"
                      onClick={() => void setAccountStatus(a.id, "active")}
                      data-testid={`account-unretire-${a.id}`}
                    >
                      Un-retire
                    </button>
                  )}
                </span>
              </>
            )}
          </li>
        ))}
        {accounts.length === 0 && (
          <li className="px-3 py-2.5 text-sm text-[var(--color-label-tertiary)]">
            No accounts yet.
          </li>
        )}
      </ul>

      {retireTarget && (
        <div
          className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-canvas)] p-4"
          data-testid="account-retire-panel"
        >
          <p className="text-sm font-medium text-[var(--color-label)]">
            Retire {retireTarget.label}?
          </p>
          <p className="mt-1 text-xs text-[var(--color-label-secondary)]">
            Retirement archives the account — history stays readable and
            exportable. Unstamped trades are not a gate.
          </p>
          {openForRetire.length > 0 ? (
            <div className="mt-2 text-xs text-[var(--color-label-secondary)]">
              <p className="font-medium text-[var(--color-label)]">
                Open campaigns on this account ({openForRetire.length})
              </p>
              <ul className="mt-1 list-disc pl-5">
                {openForRetire.map((c) => (
                  <li key={c.id}>
                    {c.title}
                    {c.is_default ? " · default" : ""} · {c.status}
                  </li>
                ))}
              </ul>
              <p className="mt-2">
                Clean retirement completes or ends open campaigns first. You may
                still retire with them open (soft gate — order without force).
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-[var(--color-label-tertiary)]">
              No open campaigns — clean to retire.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {onlySilentBook && (
              <Button
                type="button"
                variant="primary"
                disabled={busy}
                onClick={() =>
                  void closeBookAndRetire(retireTarget, openForRetire[0])
                }
                data-testid="account-retire-close-book"
              >
                Close the default campaign as part of retirement
              </Button>
            )}
            <Button
              type="button"
              variant={onlySilentBook ? "secondary" : "primary"}
              disabled={busy}
              onClick={() => void setAccountStatus(retireTarget.id, "archived")}
              data-testid="account-retire-confirm"
            >
              {openForRetire.length > 0
                ? "Retire anyway"
                : "Retire account"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => setRetireTarget(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

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
