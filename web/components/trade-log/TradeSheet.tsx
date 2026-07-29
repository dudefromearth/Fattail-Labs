"use client";

import { useEffect, useState } from "react";
import type { Account, Catalog, Leg, Trade } from "@/lib/tradeLog";
import { templateLegs } from "@/lib/tradeLog";

const field =
  "mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1.5 text-sm text-[var(--color-label)]";

type FormState = {
  account_id: number | "";
  exec_at: string;
  strategy: string;
  asset_class: string;
  order_type: string;
  net_price: string;
  net_side: string;
  setup_md: string;
  plan_md: string;
  rules_md: string;
  adherence: string;
  deviation_md: string;
  lesson_md: string;
  pnl_amount: string;
  legs: Leg[];
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return iso.slice(0, 16);
}

function fromTrade(t: Trade): FormState {
  return {
    account_id: t.account_id,
    exec_at: toLocalInput(t.exec_at),
    strategy: t.strategy,
    asset_class: t.asset_class || "equity_option",
    order_type: t.order_type || "LMT",
    net_price: t.net_price != null ? String(t.net_price) : "",
    net_side: t.net_side || "",
    setup_md: t.setup_md || "",
    plan_md: t.plan_md || "",
    rules_md: t.rules_md || "",
    adherence: t.adherence || "unknown",
    deviation_md: t.deviation_md || "",
    lesson_md: t.lesson_md || "",
    pnl_amount: t.pnl_amount != null ? String(t.pnl_amount) : "",
    legs: t.legs.length ? t.legs.map((l) => ({ ...l })) : [],
  };
}

function emptyForm(accountId: number | "", strategy = "BUTTERFLY"): FormState {
  return {
    account_id: accountId,
    exec_at: toLocalInput(null),
    strategy,
    asset_class: "equity_option",
    order_type: "LMT",
    net_price: "",
    net_side: "DEBIT",
    setup_md: "",
    plan_md: "",
    rules_md: "",
    adherence: "unknown",
    deviation_md: "",
    lesson_md: "",
    pnl_amount: "",
    legs: templateLegs(strategy),
  };
}

export default function TradeSheet({
  open,
  mode,
  trade,
  accounts,
  catalog,
  defaultAccountId,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: "create" | "edit";
  trade: Trade | null;
  accounts: Account[];
  catalog: Catalog | null;
  defaultAccountId: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(defaultAccountId ?? ""),
  );
  const [venue, setVenue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && trade) setForm(fromTrade(trade));
    else setForm(emptyForm(defaultAccountId ?? accounts[0]?.id ?? ""));
    setVenue("");
    setError(null);
  }, [open, mode, trade, defaultAccountId, accounts]);

  const selectedAccount = accounts.find(
    (a) => a.id === (form.account_id === "" ? defaultAccountId : form.account_id),
  );
  const needsVenue =
    !selectedAccount?.broker || selectedAccount.broker === "unset";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function setStrategy(code: string) {
    setForm((f) => ({
      ...f,
      strategy: code,
      legs: templateLegs(code),
      asset_class:
        code === "STOCK"
          ? "equity"
          : code === "FUTURE"
            ? "future"
            : code === "CRYPTO"
              ? "crypto"
              : "equity_option",
    }));
  }

  function updateLeg(i: number, patch: Partial<Leg>) {
    setForm((f) => {
      const legs = f.legs.map((l, j) => (j === i ? { ...l, ...patch } : l));
      return { ...f, legs };
    });
  }

  async function save() {
    setBusy(true);
    setError(null);
    const account_id =
      form.account_id === "" ? defaultAccountId : Number(form.account_id);
    if (!account_id) {
      setError("Select an account (broker or sim required on accounts).");
      setBusy(false);
      return;
    }
    if (needsVenue && !venue) {
      setError("Choose a venue for this account (broker, sim, or FatTail canonical).");
      setBusy(false);
      return;
    }
    const body: Record<string, unknown> = {
      account_id,
      exec_at: form.exec_at.length === 16 ? `${form.exec_at}:00` : form.exec_at,
      strategy: form.strategy,
      asset_class: form.asset_class,
      order_type: form.order_type,
      net_price: form.net_price === "" ? null : Number(form.net_price),
      net_side: form.net_side || null,
      setup_md: form.setup_md,
      plan_md: form.plan_md,
      rules_md: form.rules_md,
      adherence: form.adherence,
      deviation_md: form.deviation_md,
      lesson_md: form.lesson_md,
      pnl_amount: form.pnl_amount === "" ? null : Number(form.pnl_amount),
      legs: form.legs.map((l, i) => ({
        leg_index: i,
        side: l.side,
        quantity: Number(l.quantity),
        pos_effect: l.pos_effect || null,
        asset_class: l.asset_class || form.asset_class,
        underlier: l.underlier || null,
        symbol: l.symbol || null,
        expiry: l.expiry || null,
        strike: l.strike != null && l.strike !== ("" as unknown) ? Number(l.strike) : null,
        right: l.right || null,
        fill_price: Number(l.fill_price) || 0,
      })),
    };
    if (needsVenue && venue) body.broker = venue;
    const url =
      mode === "edit" && trade
        ? `/api/me/trade-log/trades/${trade.id}`
        : "/api/me/trade-log/trades";
    const method = mode === "edit" && trade ? "PATCH" : "POST";
    const r = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!r.ok) {
      setError(await r.text());
      return;
    }
    onSaved();
    onClose();
  }

  const strategies = catalog?.strategies || [];

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={mode === "edit" ? "Edit trade" : "New trade"}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[var(--color-separator)] bg-[var(--color-surface)] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[var(--color-separator)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--color-label)]">
            {mode === "edit" ? "Edit trade" : "New trade"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
          <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
            Account
            <select
              className={field}
              value={form.account_id}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  account_id: e.target.value ? Number(e.target.value) : "",
                }))
              }
            >
              <option value="">Select…</option>
              {accounts
                .filter((a) => a.status === "active")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                    {a.broker && a.broker !== "unset"
                      ? ` · ${a.broker}`
                      : " · venue on first use"}
                  </option>
                ))}
            </select>
          </label>
          {needsVenue && (
            <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
              Account venue (first trade)
              <select
                className={field}
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
              >
                <option value="">Choose broker, sim, or FatTail…</option>
                {(catalog?.venues || []).map((v) => (
                  <option key={v.code} value={v.code}>
                    {v.kind === "sim" ? "Sim" : "Live"}: {v.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[10px] text-[var(--color-label-tertiary)]">
                Locked in on this first trade (or set automatically on Import).
              </span>
            </label>
          )}
          <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
            Strategy
            <select
              className={field}
              value={form.strategy}
              onChange={(e) => setStrategy(e.target.value)}
            >
              {strategies.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.group}: {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
            Exec time
            <input
              type="datetime-local"
              className={field}
              value={form.exec_at}
              onChange={(e) =>
                setForm((f) => ({ ...f, exec_at: e.target.value }))
              }
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
              Order
              <input
                className={field}
                value={form.order_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, order_type: e.target.value }))
                }
              />
            </label>
            <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
              Net
              <input
                className={field}
                value={form.net_price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, net_price: e.target.value }))
                }
              />
            </label>
            <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
              Debit/Credit
              <select
                className={field}
                value={form.net_side}
                onChange={(e) =>
                  setForm((f) => ({ ...f, net_side: e.target.value }))
                }
              >
                <option value="">—</option>
                <option value="DEBIT">DEBIT</option>
                <option value="CREDIT">CREDIT</option>
              </select>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-label-secondary)]">
                Legs
              </span>
              <button
                type="button"
                className="text-xs text-[var(--color-tint)]"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    legs: [
                      ...f.legs,
                      {
                        side: "BUY",
                        quantity: 1,
                        pos_effect: "TO_OPEN",
                        asset_class: f.asset_class,
                        underlier: "SPX",
                        expiry: new Date().toISOString().slice(0, 10),
                        strike: 100,
                        right: "PUT",
                        fill_price: 0,
                      },
                    ],
                  }))
                }
              >
                + Leg
              </button>
            </div>
            <ul className="mt-2 space-y-2">
              {form.legs.map((leg, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-[var(--color-separator)] p-2"
                >
                  <div className="grid grid-cols-4 gap-1">
                    <select
                      className={field}
                      value={leg.side}
                      onChange={(e) =>
                        updateLeg(i, {
                          side: e.target.value as "BUY" | "SELL",
                        })
                      }
                    >
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                    </select>
                    <input
                      type="number"
                      className={field}
                      value={leg.quantity}
                      onChange={(e) =>
                        updateLeg(i, { quantity: Number(e.target.value) })
                      }
                    />
                    <select
                      className={field}
                      value={leg.pos_effect || ""}
                      onChange={(e) =>
                        updateLeg(i, {
                          pos_effect: (e.target.value ||
                            null) as Leg["pos_effect"],
                        })
                      }
                    >
                      <option value="">—</option>
                      <option value="TO_OPEN">TO OPEN</option>
                      <option value="TO_CLOSE">TO CLOSE</option>
                    </select>
                    <input
                      className={field}
                      placeholder="underlier"
                      value={leg.underlier || leg.symbol || ""}
                      onChange={(e) =>
                        updateLeg(i, {
                          underlier: e.target.value,
                          symbol: e.target.value,
                        })
                      }
                    />
                    <input
                      type="date"
                      className={field}
                      value={leg.expiry || ""}
                      onChange={(e) => updateLeg(i, { expiry: e.target.value })}
                    />
                    <input
                      type="number"
                      step="any"
                      className={field}
                      placeholder="strike"
                      value={leg.strike ?? ""}
                      onChange={(e) =>
                        updateLeg(i, {
                          strike:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                    />
                    <select
                      className={field}
                      value={leg.right || ""}
                      onChange={(e) =>
                        updateLeg(i, {
                          right: (e.target.value || null) as Leg["right"],
                        })
                      }
                    >
                      <option value="">—</option>
                      <option value="PUT">PUT</option>
                      <option value="CALL">CALL</option>
                    </select>
                    <input
                      type="number"
                      step="any"
                      className={field}
                      placeholder="fill"
                      value={leg.fill_price}
                      onChange={(e) =>
                        updateLeg(i, { fill_price: Number(e.target.value) })
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="mt-1 text-[10px] text-red-600"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        legs: f.legs.filter((_, j) => j !== i),
                      }))
                    }
                  >
                    Remove leg
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
            Setup
            <textarea
              className={field}
              rows={2}
              value={form.setup_md}
              onChange={(e) =>
                setForm((f) => ({ ...f, setup_md: e.target.value }))
              }
            />
          </label>
          <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
            Plan
            <textarea
              className={field}
              rows={2}
              value={form.plan_md}
              onChange={(e) =>
                setForm((f) => ({ ...f, plan_md: e.target.value }))
              }
            />
          </label>
          <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
            Adherence
            <select
              className={field}
              value={form.adherence}
              onChange={(e) =>
                setForm((f) => ({ ...f, adherence: e.target.value }))
              }
            >
              <option value="followed">Followed plan</option>
              <option value="partial">Partial</option>
              <option value="broke">Broke rules</option>
              <option value="unknown">Not sure</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
            Lesson
            <textarea
              className={field}
              rows={2}
              value={form.lesson_md}
              onChange={(e) =>
                setForm((f) => ({ ...f, lesson_md: e.target.value }))
              }
            />
          </label>
          <label className="block text-xs font-medium text-[var(--color-label-tertiary)]">
            P&amp;L (optional, neutral)
            <input
              type="number"
              step="any"
              className={field}
              value={form.pnl_amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, pnl_amount: e.target.value }))
              }
            />
          </label>
          {error && (
            <p className="text-xs text-red-600 whitespace-pre-wrap">{error}</p>
          )}
        </div>
        <footer className="flex gap-2 border-t border-[var(--color-separator)] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-[var(--color-label-secondary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="ml-auto rounded-full bg-[var(--color-tint)] px-5 py-2 text-sm font-medium text-[var(--color-on-tint)] disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save trade"}
          </button>
        </footer>
      </aside>
    </>
  );
}
