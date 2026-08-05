"use client";

import { useEffect, useMemo, useState } from "react";
import type { Account, Catalog, Leg, Trade } from "@/lib/tradeLog";
import {
  buildCloseDraftFromOpen,
  buildStructureLegs,
  defaultNetSideForStrategy,
  describeOpenTrade,
  findPairedClose,
  formatStructurePreview,
  listUnmatchedOpens,
  strategySupportsStructureSimple,
  templateLegs,
  tradeIsCloseFill,
} from "@/lib/tradeLog";

const field =
  "mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1.5 text-sm text-[var(--color-label)]";

type SheetMode = "create" | "edit" | "close";
/** structure = one-shot strategy fields; legs = advanced; simple_asset = stock/future/crypto */
type EntryUi = "structure" | "legs" | "simple_asset";

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
  // Structure simple params (options spreads)
  underlier: string;
  expiry: string;
  center_strike: string;
  width: string;
  right: "PUT" | "CALL";
  units: string;
  // Simple asset
  asset_symbol: string;
  asset_qty: string;
  asset_price: string;
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return iso.slice(0, 16);
}

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultEntryUi(strategy: string): EntryUi {
  if (strategySupportsStructureSimple(strategy)) return "structure";
  if (strategy === "STOCK" || strategy === "FUTURE" || strategy === "CRYPTO")
    return "simple_asset";
  return "legs";
}

function emptyForm(accountId: number | "", strategy = "BUTTERFLY"): FormState {
  const exp = todayYmd();
  return {
    account_id: accountId,
    exec_at: toLocalInput(null),
    strategy,
    asset_class: "equity_option",
    order_type: "LMT",
    net_price: "",
    net_side: defaultNetSideForStrategy(strategy),
    setup_md: "",
    plan_md: "",
    rules_md: "",
    adherence: "unknown",
    deviation_md: "",
    lesson_md: "",
    pnl_amount: "",
    legs: templateLegs(strategy),
    underlier: "SPX",
    expiry: exp,
    center_strike: "",
    width: strategy === "SINGLE" || strategy === "STRADDLE" ? "0" : "25",
    right: "PUT",
    units: "1",
    asset_symbol: strategy === "STOCK" ? "SPY" : strategy === "FUTURE" ? "/ES" : "BTC-USD",
    asset_qty: strategy === "STOCK" ? "100" : "1",
    asset_price: "",
  };
}

function fromTrade(t: Trade): FormState {
  const first = t.legs[0];
  const strikes = t.legs
    .map((l) => l.strike)
    .filter((s): s is number => s != null && !Number.isNaN(s));
  const center =
    strikes.length > 0
      ? String(
          [...strikes].sort((a, b) => a - b)[Math.floor(strikes.length / 2)],
        )
      : "";
  const sorted = [...strikes].sort((a, b) => a - b);
  const width =
    sorted.length >= 2
      ? String(Math.abs(sorted[sorted.length - 1] - sorted[0]) / (sorted.length > 2 ? 2 : 1))
      : "0";

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
    underlier: first?.underlier || first?.symbol || "SPX",
    expiry: first?.expiry?.slice(0, 10) || todayYmd(),
    center_strike: center,
    width,
    right: (first?.right as "PUT" | "CALL") || "PUT",
    units: "1",
    asset_symbol: first?.symbol || first?.underlier || "",
    asset_qty: first ? String(first.quantity) : "1",
    asset_price:
      first?.fill_price != null ? String(first.fill_price) : "",
  };
}

function formFromCloseDraft(
  open: Trade,
  accountFallback: number | "",
): FormState {
  const d = buildCloseDraftFromOpen(open);
  const base = fromTrade(open);
  return {
    ...base,
    account_id: d.account_id || accountFallback,
    exec_at: toLocalInput(null),
    strategy: d.strategy,
    asset_class: d.asset_class,
    order_type: d.order_type,
    net_price: "",
    net_side:
      d.net_side ||
      (defaultNetSideForStrategy(d.strategy) === "DEBIT" ? "CREDIT" : "DEBIT"),
    setup_md: "",
    plan_md: "",
    rules_md: "",
    adherence: "unknown",
    deviation_md: "",
    lesson_md: "",
    pnl_amount: "",
    legs: d.legs,
  };
}

function buildAssetLegs(f: FormState): Leg[] {
  const qty = Math.max(1, Number(f.asset_qty) || 1);
  const price = Number(f.asset_price) || 0;
  if (f.strategy === "STOCK") {
    return [
      {
        side: "BUY",
        quantity: qty,
        pos_effect: "TO_OPEN",
        asset_class: "equity",
        symbol: f.asset_symbol || "SPY",
        fill_price: price,
      },
    ];
  }
  if (f.strategy === "FUTURE") {
    return [
      {
        side: "BUY",
        quantity: qty,
        pos_effect: "TO_OPEN",
        asset_class: "future",
        symbol: f.asset_symbol || "/ES",
        fill_price: price,
      },
    ];
  }
  return [
    {
      side: "BUY",
      quantity: qty,
      pos_effect: null,
      asset_class: "crypto",
      symbol: f.asset_symbol || "BTC-USD",
      fill_price: price,
    },
  ];
}

export default function TradeSheet({
  open,
  mode,
  trade,
  trades,
  accounts,
  catalog,
  defaultAccountId,
  onClose,
  onSaved,
  onRequestCloseFromOpen,
  onRequestImport,
  onSelectOpenForClose,
}: {
  open: boolean;
  mode: SheetMode;
  trade: Trade | null;
  trades: Trade[];
  accounts: Account[];
  catalog: Catalog | null;
  defaultAccountId: number | null;
  onClose: () => void;
  onSaved: () => void;
  onRequestCloseFromOpen: (openTrade: Trade) => void;
  onRequestImport: () => void;
  onSelectOpenForClose: (openTrade: Trade) => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(defaultAccountId ?? ""),
  );
  const [entryUi, setEntryUi] = useState<EntryUi>("structure");
  const [showProcess, setShowProcess] = useState(false);
  const [venue, setVenue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createContinueNew, setCreateContinueNew] = useState(false);

  const unmatchedOpens = listUnmatchedOpens(trades);
  const pairedClose =
    mode === "edit" && trade ? findPairedClose(trades, trade.id) : null;
  const isUnmatchedOpen =
    mode === "edit" &&
    trade &&
    !tradeIsCloseFill(trade) &&
    !pairedClose &&
    (trade.legs || []).length > 0;
  const showCreateOpenGate =
    mode === "create" && unmatchedOpens.length > 0 && !createContinueNew;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setVenue("");
    setCreateContinueNew(false);
    setShowProcess(false);
    if (mode === "edit" && trade) {
      setForm(fromTrade(trade));
      setEntryUi("legs");
    } else if (mode === "close" && trade) {
      setForm(formFromCloseDraft(trade, defaultAccountId ?? ""));
      // Close: simple net + time; structure already in legs
      setEntryUi(
        strategySupportsStructureSimple(trade.strategy)
          ? "structure"
          : "legs",
      );
    } else {
      const f = emptyForm(defaultAccountId ?? accounts[0]?.id ?? "");
      setForm(f);
      setEntryUi(defaultEntryUi(f.strategy));
    }
  }, [open, mode, trade, defaultAccountId, accounts]);

  const selectedAccount = accounts.find(
    (a) => a.id === (form.account_id === "" ? defaultAccountId : form.account_id),
  );
  const needsVenue =
    !selectedAccount?.broker || selectedAccount.broker === "unset";

  const structurePreviewLegs = useMemo(() => {
    if (mode === "close") return form.legs;
    if (!strategySupportsStructureSimple(form.strategy)) return form.legs;
    const center = Number(form.center_strike);
    const width = Number(form.width);
    if (!form.center_strike || Number.isNaN(center)) return [];
    if (
      form.strategy !== "SINGLE" &&
      form.strategy !== "STRADDLE" &&
      (form.width === "" || Number.isNaN(width) || width < 0)
    )
      return [];
    return buildStructureLegs({
      strategy: form.strategy,
      underlier: form.underlier || "SPX",
      expiry: form.expiry || todayYmd(),
      centerStrike: center,
      width: width || 0,
      right: form.right,
      units: Number(form.units) || 1,
      posEffect: "TO_OPEN",
    });
  }, [form, mode]);

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
    const ui = defaultEntryUi(code);
    setEntryUi(ui);
    setForm((f) => ({
      ...emptyForm(f.account_id, code),
      account_id: f.account_id,
      exec_at: f.exec_at,
      strategy: code,
      asset_class:
        code === "STOCK"
          ? "equity"
          : code === "FUTURE"
            ? "future"
            : code === "CRYPTO"
              ? "crypto"
              : "equity_option",
      net_side: defaultNetSideForStrategy(code),
      legs: templateLegs(code),
    }));
  }

  function updateLeg(i: number, patch: Partial<Leg>) {
    setForm((f) => {
      const legs = f.legs.map((l, j) => (j === i ? { ...l, ...patch } : l));
      return { ...f, legs };
    });
  }

  function resolveLegsForSave(): Leg[] | null {
    if (entryUi === "simple_asset") {
      return buildAssetLegs(form);
    }
    if (entryUi === "structure" && strategySupportsStructureSimple(form.strategy)) {
      if (mode === "close") {
        // Keep reversed structure; only prices/time change at trade level
        return form.legs.map((l) => ({
          ...l,
          pos_effect: "TO_CLOSE",
          underlier: form.underlier || l.underlier,
          expiry: form.expiry || l.expiry,
        }));
      }
      const center = Number(form.center_strike);
      const width = Number(form.width) || 0;
      if (form.center_strike === "" || Number.isNaN(center)) {
        setError("Enter center strike.");
        return null;
      }
      if (
        form.strategy !== "SINGLE" &&
        form.strategy !== "STRADDLE" &&
        (form.width === "" || Number.isNaN(width) || width <= 0)
      ) {
        setError("Enter width (points between body and wing).");
        return null;
      }
      if (!form.expiry) {
        setError("Enter expiration date.");
        return null;
      }
      const legs = buildStructureLegs({
        strategy: form.strategy,
        underlier: (form.underlier || "SPX").toUpperCase(),
        expiry: form.expiry,
        centerStrike: center,
        width,
        right: form.right,
        units: Number(form.units) || 1,
        posEffect: "TO_OPEN",
      });
      if (!legs.length) {
        setError("Could not build legs for this strategy.");
        return null;
      }
      return legs;
    }
    return form.legs;
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
    if (form.net_price === "" && entryUi !== "legs") {
      setError(
        mode === "close"
          ? "Enter net credit (or debit) for the close."
          : "Enter net debit or credit.",
      );
      setBusy(false);
      return;
    }
    const legs = resolveLegsForSave();
    if (!legs) {
      setBusy(false);
      return;
    }
    if (form.strategy !== "NOTE" && !legs.length) {
      setError("Add at least one leg (or use structure entry).");
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
      legs: legs.map((l, i) => ({
        leg_index: i,
        side: l.side,
        quantity: Number(l.quantity),
        pos_effect: l.pos_effect || null,
        asset_class: l.asset_class || form.asset_class,
        underlier: l.underlier || null,
        symbol: l.symbol || null,
        expiry: l.expiry || null,
        strike:
          l.strike != null && l.strike !== ("" as unknown)
            ? Number(l.strike)
            : null,
        right: l.right || null,
        fill_price: Number(l.fill_price) || 0,
      })),
    };
    if (needsVenue && venue) body.broker = venue;
    const isEdit = mode === "edit" && trade;
    const url = isEdit
      ? `/api/me/trade-log/trades/${trade!.id}`
      : "/api/me/trade-log/trades";
    const method = isEdit ? "PATCH" : "POST";
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
  const title =
    mode === "edit"
      ? "Edit trade"
      : mode === "close"
        ? "Enter closing order"
        : "New trade";

  const showStructureFields =
    entryUi === "structure" &&
    strategySupportsStructureSimple(form.strategy) &&
    mode !== "close";

  const showCloseSimple =
    mode === "close" && entryUi !== "legs";

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
        aria-label={title}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[var(--color-separator)] bg-[var(--color-surface)] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[var(--color-separator)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--color-label)]">
            {title}
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
          {showCreateOpenGate && (
            <div className="rounded-xl border-2 border-[var(--color-tint)] bg-[var(--color-fill)] p-4">
              <p className="text-base font-bold leading-snug text-[var(--color-label)]">
                You have {unmatchedOpens.length} open position
                {unmatchedOpens.length === 1 ? "" : "s"}. Enter a closing order?
              </p>
              <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
                Closing keeps the structure matched for Reports and Journal.
              </p>
              <ul className="mt-3 max-h-40 space-y-1.5 overflow-y-auto">
                {unmatchedOpens.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => onSelectOpenForClose(o)}
                      className="w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-left text-xs font-medium text-[var(--color-label)] hover:border-[var(--color-tint)]"
                    >
                      Close: {describeOpenTrade(o)}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestImport();
                  }}
                  className="rounded-full border border-[var(--color-separator)] px-4 py-2 text-xs font-medium text-[var(--color-label)] hover:bg-[var(--color-canvas)]"
                >
                  Paste closing order from thinkorswim…
                </button>
                <button
                  type="button"
                  onClick={() => setCreateContinueNew(true)}
                  className="text-xs text-[var(--color-label-secondary)] underline"
                >
                  No — create a new opening trade
                </button>
              </div>
            </div>
          )}

          {isUnmatchedOpen && trade && (
            <div className="rounded-xl border-2 border-[var(--color-tint)] bg-[var(--color-fill)] p-4">
              <p className="text-lg font-bold leading-snug text-[var(--color-label)]">
                Enter a closing order for this position?
              </p>
              <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
                Prefill reverse structure; enter net credit and time only.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onRequestCloseFromOpen(trade)}
                  className="rounded-full bg-[var(--color-tint)] px-4 py-2.5 text-sm font-semibold text-[var(--color-on-tint)]"
                >
                  Yes — enter closing order
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestImport();
                  }}
                  className="rounded-full border border-[var(--color-separator)] px-4 py-2 text-xs font-medium text-[var(--color-label)] hover:bg-[var(--color-canvas)]"
                >
                  Paste closing order from thinkorswim…
                </button>
              </div>
            </div>
          )}

          {mode === "edit" && trade && pairedClose && (
            <p className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-xs text-[var(--color-label-secondary)]">
              Paired with close #{pairedClose.id}.
            </p>
          )}

          {mode === "close" && trade && (
            <div className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-xs text-[var(--color-label-secondary)]">
              <p className="font-semibold text-[var(--color-label)]">
                Closing open #{trade.id}
              </p>
              <p className="mt-0.5">{describeOpenTrade(trade)}</p>
              <p className="mt-1 font-mono text-[11px] text-[var(--color-label)]">
                {formatStructurePreview(form.legs)}
              </p>
            </div>
          )}

          {!showCreateOpenGate && (
            <>
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
                </label>
              )}

              {mode !== "close" && (
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
              )}

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

              {/* —— Structure simple (default for multi-leg options) —— */}
              {showStructureFields && (
                <div className="space-y-3 rounded-xl border border-[var(--color-separator)] bg-[var(--color-canvas)] p-3">
                  <p className="text-xs font-semibold text-[var(--color-label)]">
                    Structure — legs built automatically
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Underlier
                      <input
                        className={field}
                        value={form.underlier}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            underlier: e.target.value.toUpperCase(),
                          }))
                        }
                      />
                    </label>
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Expiration
                      <input
                        type="date"
                        className={field}
                        value={form.expiry}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, expiry: e.target.value }))
                        }
                      />
                    </label>
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Center strike
                      <input
                        type="number"
                        step="any"
                        className={field}
                        value={form.center_strike}
                        placeholder="e.g. 5750"
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            center_strike: e.target.value,
                          }))
                        }
                      />
                    </label>
                    {form.strategy !== "SINGLE" &&
                      form.strategy !== "STRADDLE" && (
                        <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                          Width
                          <input
                            type="number"
                            step="any"
                            min={0}
                            className={field}
                            value={form.width}
                            placeholder="e.g. 25"
                            onChange={(e) =>
                              setForm((f) => ({ ...f, width: e.target.value }))
                            }
                          />
                        </label>
                      )}
                    {(form.strategy === "BUTTERFLY" ||
                      form.strategy === "VERTICAL" ||
                      form.strategy === "CONDOR" ||
                      form.strategy === "SINGLE") && (
                      <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                        Put / Call
                        <select
                          className={field}
                          value={form.right}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              right: e.target.value as "PUT" | "CALL",
                            }))
                          }
                        >
                          <option value="PUT">PUT</option>
                          <option value="CALL">CALL</option>
                        </select>
                      </label>
                    )}
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Qty (units)
                      <input
                        type="number"
                        min={1}
                        className={field}
                        value={form.units}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, units: e.target.value }))
                        }
                      />
                    </label>
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Net {form.net_side === "CREDIT" ? "credit" : "debit"}
                      <input
                        type="number"
                        step="any"
                        className={field}
                        value={form.net_price}
                        placeholder="e.g. 1.15"
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            net_price: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Debit / Credit
                      <select
                        className={field}
                        value={form.net_side}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            net_side: e.target.value,
                          }))
                        }
                      >
                        <option value="DEBIT">DEBIT</option>
                        <option value="CREDIT">CREDIT</option>
                      </select>
                    </label>
                  </div>
                  <p className="rounded-lg bg-[var(--color-surface)] px-2 py-1.5 font-mono text-[11px] text-[var(--color-label)]">
                    {formatStructurePreview(structurePreviewLegs) ||
                      "Enter center strike to preview legs"}
                  </p>
                  <button
                    type="button"
                    className="text-xs text-[var(--color-tint)] underline"
                    onClick={() => {
                      const legs =
                        structurePreviewLegs.length > 0
                          ? structurePreviewLegs
                          : form.legs;
                      setForm((f) => ({ ...f, legs }));
                      setEntryUi("legs");
                    }}
                  >
                    Advanced: edit legs one by one
                  </button>
                </div>
              )}

              {/* —— Close simple: net + time only —— */}
              {showCloseSimple && (
                <div className="space-y-3 rounded-xl border border-[var(--color-separator)] bg-[var(--color-canvas)] p-3">
                  <p className="text-xs font-semibold text-[var(--color-label)]">
                    Close fill — structure already set
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Net credit / debit
                      <input
                        type="number"
                        step="any"
                        className={field}
                        value={form.net_price}
                        placeholder="e.g. 0.40"
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            net_price: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Debit / Credit
                      <select
                        className={field}
                        value={form.net_side}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            net_side: e.target.value,
                          }))
                        }
                      >
                        <option value="CREDIT">CREDIT</option>
                        <option value="DEBIT">DEBIT</option>
                      </select>
                    </label>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-[var(--color-tint)] underline"
                    onClick={() => setEntryUi("legs")}
                  >
                    Advanced: edit close legs
                  </button>
                  <button
                    type="button"
                    className="ml-3 text-xs text-[var(--color-tint)] underline"
                    onClick={() => {
                      onClose();
                      onRequestImport();
                    }}
                  >
                    Paste from thinkorswim
                  </button>
                </div>
              )}

              {/* —— Stock / future / crypto simple —— */}
              {entryUi === "simple_asset" && mode !== "close" && (
                <div className="space-y-3 rounded-xl border border-[var(--color-separator)] bg-[var(--color-canvas)] p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Symbol
                      <input
                        className={field}
                        value={form.asset_symbol}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            asset_symbol: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Qty
                      <input
                        type="number"
                        className={field}
                        value={form.asset_qty}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            asset_qty: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="col-span-2 block text-xs font-medium text-[var(--color-label-secondary)]">
                      Fill price
                      <input
                        type="number"
                        step="any"
                        className={field}
                        value={form.asset_price}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            asset_price: e.target.value,
                            net_price: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* —— Advanced legs —— */}
              {entryUi === "legs" && (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--color-label-secondary)]">
                      Legs (advanced)
                    </span>
                    <div className="flex gap-2">
                      {strategySupportsStructureSimple(form.strategy) &&
                        mode === "create" && (
                          <button
                            type="button"
                            className="text-xs text-[var(--color-tint)]"
                            onClick={() => setEntryUi("structure")}
                          >
                            Back to structure
                          </button>
                        )}
                      {mode !== "close" && (
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
                                  underlier: f.underlier || "SPX",
                                  expiry: f.expiry || todayYmd(),
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
                      )}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Order
                      <input
                        className={field}
                        value={form.order_type}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            order_type: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Net
                      <input
                        className={field}
                        value={form.net_price}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            net_price: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Debit/Credit
                      <select
                        className={field}
                        value={form.net_side}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            net_side: e.target.value,
                          }))
                        }
                      >
                        <option value="">—</option>
                        <option value="DEBIT">DEBIT</option>
                        <option value="CREDIT">CREDIT</option>
                      </select>
                    </label>
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
                              updateLeg(i, {
                                quantity: Number(e.target.value),
                              })
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
                            onChange={(e) =>
                              updateLeg(i, { expiry: e.target.value })
                            }
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
                                right: (e.target.value ||
                                  null) as Leg["right"],
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
                              updateLeg(i, {
                                fill_price: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        {mode !== "close" && (
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
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <button
                  type="button"
                  className="text-xs font-medium text-[var(--color-label-secondary)] underline"
                  onClick={() => setShowProcess((v) => !v)}
                >
                  {showProcess ? "Hide" : "Process notes"} (optional)
                </button>
                {showProcess && (
                  <div className="mt-2 space-y-2">
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Setup
                      <textarea
                        className={field}
                        rows={2}
                        value={form.setup_md}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            setup_md: e.target.value,
                          }))
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
                          setForm((f) => ({
                            ...f,
                            plan_md: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Adherence
                      <select
                        className={field}
                        value={form.adherence}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            adherence: e.target.value,
                          }))
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
                          setForm((f) => ({
                            ...f,
                            lesson_md: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-xs font-medium text-[var(--color-label-tertiary)]">
                      P&amp;L (optional)
                      <input
                        type="number"
                        step="any"
                        className={field}
                        value={form.pnl_amount}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            pnl_amount: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-xs text-red-600 whitespace-pre-wrap">
                  {error}
                </p>
              )}
            </>
          )}
        </div>
        {!showCreateOpenGate && (
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
              {busy
                ? "Saving…"
                : mode === "close"
                  ? "Save closing trade"
                  : "Save trade"}
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
