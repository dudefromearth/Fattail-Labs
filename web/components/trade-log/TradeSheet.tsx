"use client";

import { useEffect, useMemo, useState } from "react";
import type { Account, Catalog, Leg, Trade } from "@/lib/tradeLog";
import {
  TRASH_REASONS,
  buildCloseDraftFromOpen,
  buildStructureLegs,
  defaultNetSideForStrategy,
  describeOpenTrade,
  entrySourceLabel,
  canDeleteTrade,
  findOpenForCloseDraft,
  findPairedClose,
  findPairedOpen,
  formatStructurePreview,
  isManualEntry,
  listUnmatchedOpens,
  netDollarHint,
  normalizeEntrySource,
  shortStructureLabel,
  strategySupportsStructureSimple,
  positionBadge,
  structureDriftWarnings,
  templateLegs,
  tradeIsCloseFill,
  tradeUnitQty,
} from "@/lib/tradeLog";
import {
  loadTradeLogLastUsed,
  saveTradeLogLastUsed,
} from "@/lib/tradeLogPrefs";
import TagPicker from "@/components/tags/TagPicker";
import TradeChart from "@/components/trade-log/TradeChart";
import {
  fetchCampaigns,
  fetchPlaybookEntries,
  type PlaybookEntry,
  type PracticeCampaign,
} from "@/lib/practiceSpineApi";

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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format for `<input type="datetime-local">` — past dates allowed (backdating). */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  // Naive wall-clock from API (space or T); do not force UTC shift for stored naive times
  const normalized = String(iso).trim().replace(" ", "T").replace(/Z$/i, "");
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)) {
    return normalized.slice(0, 16);
  }
  const d = new Date(iso);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  return toLocalInput(null);
}

function formatExecDisplay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const s = toLocalInput(iso);
  return s.replace("T", " ");
}

/** Body value for API — always include seconds for parse reliability. */
function execAtForApi(local: string): string {
  if (!local) return local;
  if (local.length === 16) return `${local}:00`; // YYYY-MM-DDTHH:mm
  return local;
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
  const legs = Array.isArray(t.legs) ? t.legs : [];
  const first = legs[0];
  const strikes = legs
    .map((l) => l.strike)
    .filter((s): s is number => s != null && !Number.isNaN(Number(s)))
    .map((s) => Number(s));
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
    strategy: t.strategy || "CUSTOM",
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
    legs: legs.length ? legs.map((l) => ({ ...l })) : [],
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
  onTrashed,
  onDuplicateOpen,
  onOpenTrade,
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
  /** After hard-delete of an open (or close) fill. */
  onTrashed: () => void;
  /** Prefill new open from this open's structure. */
  onDuplicateOpen?: (openTrade: Trade) => void;
  /** Jump to another fill (e.g. paired close that must be deleted first). */
  onOpenTrade?: (t: Trade) => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(defaultAccountId ?? ""),
  );
  const [entryUi, setEntryUi] = useState<EntryUi>("structure");
  /** Legs editor collapsed by default; Order/Net/Debit live above it. */
  const [showLegsAdvanced, setShowLegsAdvanced] = useState(false);
  /** Once expanded, save uses form.legs even if section is collapsed again. */
  const [legsTouched, setLegsTouched] = useState(false);
  const [showProcess, setShowProcess] = useState(false);
  const [venue, setVenue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createContinueNew, setCreateContinueNew] = useState(false);
  const [playbooks, setPlaybooks] = useState<PlaybookEntry[]>([]);
  const [activeCampaign, setActiveCampaign] =
    useState<PracticeCampaign | null>(null);
  const [playbookEntryId, setPlaybookEntryId] = useState<number | "">("");
  const [practiceCampaignId, setPracticeCampaignId] = useState<
    number | ""
  >("");
  /** Delete confirm lives only in this drawer (not on the blotter row). */
  const [trashConfirm, setTrashConfirm] = useState(false);
  const [trashReason, setTrashReason] = useState("");
  const [allowOrphanClose, setAllowOrphanClose] = useState(false);
  const [allowAccountMismatch, setAllowAccountMismatch] = useState(false);
  const [allowPartialUnits, setAllowPartialUnits] = useState(false);
  const [allowDrift, setAllowDrift] = useState(false);

  const unmatchedOpens = listUnmatchedOpens(trades);
  const pairedClose =
    mode === "edit" && trade && !tradeIsCloseFill(trade)
      ? findPairedClose(trades, trade.id)
      : null;
  const pairedOpen =
    mode === "edit" && trade && tradeIsCloseFill(trade)
      ? findPairedOpen(trades, trade.id)
      : null;
  const isUnmatchedOpen =
    mode === "edit" &&
    trade &&
    !tradeIsCloseFill(trade) &&
    !pairedClose &&
    (trade.legs || []).length > 0;
  const deleteGate =
    mode === "edit" && trade
      ? canDeleteTrade(trade, trades)
      : { ok: true as const };
  const showCreateOpenGate =
    mode === "create" && unmatchedOpens.length > 0 && !createContinueNew;
  /** Manual fills: emphasize full date-time edit / backdate. */
  const manualDatetimeEditable =
    mode === "create" ||
    mode === "close" ||
    (mode === "edit" && trade && isManualEntry(trade));

  useEffect(() => {
    if (!open) return;
    setError(null);
    setVenue("");
    setCreateContinueNew(false);
    setShowProcess(false);
    setShowLegsAdvanced(false);
    setLegsTouched(false);
    setTrashConfirm(false);
    setTrashReason("");
    setAllowOrphanClose(false);
    setAllowAccountMismatch(false);
    setAllowPartialUnits(false);
    setAllowDrift(false);
    void (async () => {
      try {
        const [pb, camps] = await Promise.all([
          fetchPlaybookEntries(false),
          fetchCampaigns(),
        ]);
        setPlaybooks(pb.entries || []);
        setActiveCampaign(camps.active);
        if (mode === "edit" && trade) {
          const t = trade as Trade & {
            playbook_entry_id?: number | null;
            practice_campaign_id?: number | null;
          };
          setPlaybookEntryId(t.playbook_entry_id ?? "");
          setPracticeCampaignId(t.practice_campaign_id ?? "");
        } else if (mode === "create") {
          setPlaybookEntryId("");
          setPracticeCampaignId(camps.active?.id ?? "");
        } else {
          setPlaybookEntryId("");
          setPracticeCampaignId("");
        }
      } catch {
        setPlaybooks([]);
        setActiveCampaign(null);
      }
    })();
    const last = loadTradeLogLastUsed();
    if (mode === "edit" && trade) {
      setForm(fromTrade(trade));
      setEntryUi(
        strategySupportsStructureSimple(trade.strategy)
          ? "structure"
          : "legs",
      );
    } else if (mode === "close" && trade) {
      setForm(formFromCloseDraft(trade, defaultAccountId ?? ""));
      setEntryUi(
        strategySupportsStructureSimple(trade.strategy)
          ? "structure"
          : "legs",
      );
    } else {
      type DupT = {
        strategy?: string;
        account_id?: number;
        legs?: Leg[];
        asset_class?: string;
        net_side?: string | null;
      };
      let dup: DupT | null = null;
      try {
        const raw = sessionStorage.getItem("ft.tradeLog.duplicateTemplate");
        if (raw) {
          dup = JSON.parse(raw) as DupT;
          sessionStorage.removeItem("ft.tradeLog.duplicateTemplate");
        }
      } catch {
        dup = null;
      }
      const f = emptyForm(
        dup?.account_id ??
          last.account_id ??
          defaultAccountId ??
          accounts[0]?.id ??
          "",
        dup?.strategy || last.strategy || "BUTTERFLY",
      );
      if (last.underlier) f.underlier = last.underlier;
      if (last.right) f.right = last.right;
      if (last.width) f.width = last.width;
      if (last.units) f.units = last.units;
      if (dup?.legs?.length) {
        f.legs = dup.legs.map((l) => ({ ...l, pos_effect: "TO_OPEN" as const }));
        f.asset_class = dup.asset_class || f.asset_class;
        f.net_side = dup.net_side || f.net_side;
        f.net_price = "";
        const first = dup.legs[0];
        if (first?.underlier) f.underlier = first.underlier;
        if (first?.expiry) f.expiry = first.expiry.slice(0, 10);
        if (first?.right === "PUT" || first?.right === "CALL")
          f.right = first.right;
        setEntryUi("legs");
        setLegsTouched(true);
        setShowLegsAdvanced(true);
      } else {
        setEntryUi(defaultEntryUi(f.strategy));
      }
      setForm(f);
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
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (!showCreateOpenGate) void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save uses latest form via closure on each open session
  }, [open, onClose, showCreateOpenGate]);

  const closeMatchOpen = useMemo(() => {
    if (mode !== "close" || !trade) return null;
    const draftLegs =
      showLegsAdvanced || legsTouched
        ? form.legs
        : form.legs.length
          ? form.legs
          : structurePreviewLegs;
    return findOpenForCloseDraft(trades, {
      account_id:
        form.account_id === ""
          ? trade.account_id
          : Number(form.account_id),
      strategy: form.strategy || trade.strategy,
      legs: draftLegs,
      exec_at: execAtForApi(form.exec_at),
    });
  }, [
    mode,
    trade,
    trades,
    form,
    showLegsAdvanced,
    legsTouched,
    structurePreviewLegs,
  ]);

  const driftWarnings = useMemo(() => {
    if (mode !== "close" || !trade) return [];
    return structureDriftWarnings(trade, form.legs);
  }, [mode, trade, form.legs]);

  // Derived UI flags — must stay above any early return (Rules of Hooks).
  const strategies = catalog?.strategies || [];
  const title =
    mode === "edit" && trade
      ? tradeIsCloseFill(trade)
        ? `Close · #${trade.id}`
        : isUnmatchedOpen
          ? `Open · ${shortStructureLabel(trade)}`
          : `Edit · #${trade.id}`
      : mode === "close" && trade
        ? `Close · #${trade.id}`
        : "New trade";
  const dollarHint = netDollarHint(
    form.net_price === "" ? null : Number(form.net_price),
    form.asset_class,
    Number(form.units) || 1,
  );
  const showStructureFields =
    entryUi === "structure" &&
    strategySupportsStructureSimple(form.strategy) &&
    mode !== "close";
  const showCloseSimple = mode === "close";
  const showOrderNetFields =
    entryUi !== "simple_asset" &&
    (showStructureFields ||
      showCloseSimple ||
      entryUi === "legs" ||
      (mode === "edit" && !!trade));

  const checklist = useMemo(() => {
    const items: { ok: boolean; label: string }[] = [];
    const acct =
      form.account_id === "" ? defaultAccountId : Number(form.account_id);
    items.push({ ok: !!acct, label: "Account" });
    items.push({
      ok: !needsVenue || !!venue,
      label: "Venue (first use)",
    });
    items.push({ ok: !!form.exec_at, label: "Exec time" });
    if (showStructureFields) {
      items.push({
        ok:
          form.center_strike !== "" &&
          !Number.isNaN(Number(form.center_strike)),
        label: "Center strike",
      });
      if (form.strategy !== "SINGLE" && form.strategy !== "STRADDLE") {
        items.push({
          ok: form.width !== "" && Number(form.width) > 0,
          label: "Width",
        });
      }
      items.push({ ok: !!form.expiry, label: "Expiration" });
    }
    if (entryUi !== "simple_asset") {
      items.push({
        ok: form.net_price !== "" && !Number.isNaN(Number(form.net_price)),
        label: "Net debit/credit",
      });
    }
    return items;
  }, [
    form,
    defaultAccountId,
    needsVenue,
    venue,
    showStructureFields,
    entryUi,
  ]);

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
    // Advanced legs were used → use explicit leg list
    if (legsTouched || showLegsAdvanced) {
      if (mode === "close") {
        return form.legs.map((l) => ({
          ...l,
          pos_effect: "TO_CLOSE" as const,
        }));
      }
      return form.legs;
    }
    if (entryUi === "structure" && strategySupportsStructureSimple(form.strategy)) {
      if (mode === "close") {
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

  function openLegsAdvanced() {
    const legs =
      structurePreviewLegs.length > 0 ? structurePreviewLegs : form.legs;
    setForm((f) => ({
      ...f,
      legs: !legsTouched && legs.length ? legs : f.legs,
    }));
    setLegsTouched(true);
    setShowLegsAdvanced(true);
  }

  async function trashOpen() {
    if (!trade || mode !== "edit") return;
    const gate = canDeleteTrade(trade, trades);
    if (!gate.ok) {
      setError(gate.reason || "Cannot delete this fill yet.");
      setTrashConfirm(false);
      return;
    }
    setBusy(true);
    setError(null);
    const r = await fetch(`/api/me/trade-log/trades/${trade.id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    setBusy(false);
    if (!r.ok) {
      setError(await r.text().catch(() => "Could not trash trade"));
      setTrashConfirm(false);
      return;
    }
    setTrashConfirm(false);
    onTrashed();
    onClose();
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
    if (form.net_price === "" && entryUi !== "simple_asset") {
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

    if (mode === "close" && trade) {
      if (Number(account_id) !== trade.account_id && !allowAccountMismatch) {
        setError(
          "Close account differs from open account. Confirm mismatch below or fix account.",
        );
        setBusy(false);
        return;
      }
      const matched = findOpenForCloseDraft(trades, {
        account_id: Number(account_id),
        strategy: form.strategy || trade.strategy,
        legs,
        exec_at: execAtForApi(form.exec_at),
      });
      if (!matched && !allowOrphanClose) {
        setError(
          "No open match for this close structure. Confirm orphan close below, or fix structure.",
        );
        setBusy(false);
        return;
      }
      if (matched && matched.id !== trade.id && !allowOrphanClose) {
        setError(
          `Would pair with open #${matched.id}, not #${trade.id}. Confirm or fix.`,
        );
        setBusy(false);
        return;
      }
      const openUnits = tradeUnitQty(trade);
      const closeUnits = tradeUnitQty({ ...trade, legs });
      if (closeUnits !== openUnits && !allowPartialUnits) {
        setError(
          `Close units (${closeUnits}) ≠ open units (${openUnits}). Full close only unless you confirm partial/different size.`,
        );
        setBusy(false);
        return;
      }
      const drifts = structureDriftWarnings(trade, legs);
      if (drifts.length && !allowDrift) {
        setError(drifts[0] + " Confirm drift below or restore structure.");
        setBusy(false);
        return;
      }
    }

    if (!form.exec_at || form.exec_at.length < 16) {
      setError("Enter execution date and time (backdating is allowed).");
      setBusy(false);
      return;
    }

    const body: Record<string, unknown> = {
      account_id,
      exec_at: execAtForApi(form.exec_at),
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
      playbook_entry_id: playbookEntryId === "" ? null : playbookEntryId,
      practice_campaign_id:
        practiceCampaignId === "" ? null : practiceCampaignId,
      pnl_amount: form.pnl_amount === "" ? null : Number(form.pnl_amount),
      entry_source: "manual",
      legs: legs.map((l, i) => ({
        leg_index: i,
        side: l.side,
        quantity: Number(l.quantity),
        pos_effect:
          mode === "close"
            ? "TO_CLOSE"
            : l.pos_effect || (mode === "create" ? "TO_OPEN" : null),
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
    saveTradeLogLastUsed({
      account_id: Number(account_id),
      underlier: form.underlier,
      right: form.right,
      width: form.width,
      strategy: form.strategy,
      units: form.units,
    });
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
        <header className="flex items-start justify-between gap-2 border-b border-[var(--color-separator)] px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--color-label)]">
              {title}
            </h2>
            {trade && (mode === "edit" || mode === "close") && (
              <p className="mt-0.5 text-[11px] text-[var(--color-label-tertiary)]">
                <span className="font-semibold text-[var(--color-label-secondary)]">
                  {entrySourceLabel(trade.entry_source)}
                </span>
                {normalizeEntrySource(trade.entry_source) === "import"
                  ? " (file/paste)"
                  : normalizeEntrySource(trade.entry_source) === "automated"
                    ? " (Strategy Lab / automation)"
                    : " (typed)"}
                {trade.created_at
                  ? ` · Created ${trade.created_at.slice(0, 16).replace("T", " ")}`
                  : ""}
                {trade.updated_at
                  ? ` · Edited ${trade.updated_at.slice(0, 16).replace("T", " ")}`
                  : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full px-2 py-1 text-sm text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto text-sm">
          {/* —— ACTIONS (top) —— */}
          {(showCreateOpenGate ||
            isUnmatchedOpen ||
            (mode === "close" && trade) ||
            (mode === "edit" && trade && pairedClose) ||
            (mode === "edit" && trade && tradeIsCloseFill(trade))) && (
            <section className="px-4 pt-3 pb-1" aria-labelledby="tl-sheet-actions-h">
              <h3
                id="tl-sheet-actions-h"
                className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-label-secondary)]"
              >
                Actions
              </h3>
              <div className="mt-2 space-y-3">
                {showCreateOpenGate && (
                  <div className="rounded-xl border-2 border-[var(--color-tint)] bg-[var(--color-fill)] p-4">
                    <p className="text-base font-bold leading-snug text-[var(--color-label)]">
                      You have {unmatchedOpens.length} open position
                      {unmatchedOpens.length === 1 ? "" : "s"}. Enter a closing
                      order?
                    </p>
                    <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
                      Closing keeps the structure matched for Reports and
                      Journal.
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
                    <p className="text-base font-bold leading-snug text-[var(--color-label)]">
                      What do you want to do with this open?
                    </p>
                    <p className="mt-1.5 text-xs text-[var(--color-label-secondary)]">
                      Close it, paste a ToS close, duplicate structure, or delete
                      this TO OPEN (only when no close exists).
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => onRequestCloseFromOpen(trade)}
                        className="rounded-full bg-[var(--color-tint)] px-4 py-2.5 text-sm font-semibold text-[var(--color-on-tint)]"
                      >
                        Enter closing order
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
                      {onDuplicateOpen && (
                        <button
                          type="button"
                          onClick={() => onDuplicateOpen(trade)}
                          className="rounded-full border border-[var(--color-separator)] px-4 py-2 text-xs font-medium text-[var(--color-label)] hover:bg-[var(--color-canvas)]"
                        >
                          Duplicate as new open (template)
                        </button>
                      )}
                      {/* Unmatched open: delete allowed (close-first rule already satisfied) */}
                      {!trashConfirm ? (
                        <button
                          type="button"
                          onClick={() => setTrashConfirm(true)}
                          className="rounded-full border border-red-300 px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
                        >
                          Delete this TO OPEN
                        </button>
                      ) : (
                        <div className="rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
                          <p className="text-xs font-semibold text-red-800 dark:text-red-200">
                            Delete open #{trade.id} permanently?
                          </p>
                          <p className="mt-1 text-[11px] text-red-700 dark:text-red-300">
                            No paired close — safe to remove this open. Cannot be
                            undone.
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {TRASH_REASONS.map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => setTrashReason(r.id)}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  trashReason === r.id
                                    ? "bg-red-700 text-white"
                                    : "bg-white/80 text-red-900 dark:bg-black/30 dark:text-red-100"
                                }`}
                              >
                                {r.label}
                              </button>
                            ))}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void trashOpen()}
                              className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              {busy ? "Deleting…" : "Yes, delete open"}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                setTrashConfirm(false);
                                setTrashReason("");
                              }}
                              className="rounded-full px-3 py-1.5 text-xs text-[var(--color-label-secondary)]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Paired open: must delete TO CLOSE first */}
                {mode === "edit" && trade && pairedClose && (
                  <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-4 text-xs dark:bg-amber-950">
                    <p className="text-sm font-bold text-amber-950 dark:text-amber-100">
                      TO OPEN paired with TO CLOSE #{pairedClose.id}
                    </p>
                    <p className="mt-1.5 text-amber-900 dark:text-amber-200">
                      You must <strong>delete the TO CLOSE</strong> fill first.
                      Only after that close is gone can you delete this TO OPEN.
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      {onOpenTrade && (
                        <button
                          type="button"
                          onClick={() => onOpenTrade(pairedClose)}
                          className="rounded-full bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800"
                        >
                          Open TO CLOSE #{pairedClose.id} to delete it
                        </button>
                      )}
                      <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
                        Delete of this open is blocked until the close is removed.
                      </p>
                    </div>
                  </div>
                )}

                {mode === "edit" && trade && tradeIsCloseFill(trade) && (
                    <div className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-xs dark:bg-amber-950">
                      <p className="font-semibold text-amber-900 dark:text-amber-100">
                        TO CLOSE fill
                        {positionBadge(trade, trades) === "complete"
                          ? " · paired with an open"
                          : " · orphan"}
                      </p>
                      <p className="mt-1 text-amber-800 dark:text-amber-200">
                        Delete this close first if you want to remove the whole
                        position. After it is gone, the matching TO OPEN can be
                        deleted.
                      </p>
                      {!trashConfirm ? (
                        <button
                          type="button"
                          className="mt-2 w-full rounded-full border border-red-400 bg-white px-4 py-2.5 text-sm font-semibold text-red-800 dark:bg-transparent dark:text-red-200"
                          onClick={() => setTrashConfirm(true)}
                        >
                          Delete this TO CLOSE
                        </button>
                      ) : (
                        <div className="mt-2 space-y-3 rounded-lg border-2 border-red-500 bg-red-50 p-3 dark:bg-red-950">
                          <p className="text-sm font-bold text-red-900 dark:text-red-100">
                            Confirm delete of TO CLOSE #{trade.id}?
                          </p>
                          <p className="text-[11px] text-red-800 dark:text-red-200">
                            The paired open will show as open again. You can
                            delete that open only after this close is gone.
                          </p>
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              className="w-full rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                              onClick={() => void trashOpen()}
                            >
                              {busy ? "Deleting…" : "Yes, delete this TO CLOSE"}
                            </button>
                            <button
                              type="button"
                              className="text-xs text-[var(--color-label-secondary)] underline"
                              onClick={() => setTrashConfirm(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
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
                    <p className="mt-2 font-medium text-[var(--color-label)]">
                      {closeMatchOpen
                        ? closeMatchOpen.id === trade.id
                          ? `Will pair with open #${closeMatchOpen.id} ✓`
                          : `Would pair with open #${closeMatchOpen.id} (not #${trade.id})`
                        : "No open match — orphan close unless fixed"}
                    </p>
                    {driftWarnings.length > 0 && (
                      <p className="mt-1 text-amber-700 dark:text-amber-300">
                        {driftWarnings[0]}
                      </p>
                    )}
                    <button
                      type="button"
                      className="mt-2 text-xs text-[var(--color-tint)] underline"
                      onClick={() => {
                        onClose();
                        onRequestImport();
                      }}
                    >
                      Prefer paste from thinkorswim
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* —— RULE + TRADE DETAILS (bottom) —— */}
          {!showCreateOpenGate && (
            <>
              {(isUnmatchedOpen ||
                (mode === "close" && trade) ||
                (mode === "edit" && trade && pairedClose) ||
                (mode === "edit" && trade && tradeIsCloseFill(trade))) && (
                <hr
                  className="mx-4 my-3 border-0 border-t-2 border-[var(--color-separator)]"
                  aria-hidden
                />
              )}

              {/* Phase 2 charts — underlier context for saved fills only */}
              {mode === "edit" && trade?.id != null && (
                <div className="px-4 pb-2">
                  <TradeChart tradeId={trade.id} />
                </div>
              )}

              <section
                className="space-y-3 px-4 pb-3"
                aria-labelledby="tl-sheet-details-h"
              >
                <h3
                  id="tl-sheet-details-h"
                  className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-label-secondary)]"
                >
                  Trade details
                </h3>

              {needsVenue && (
                <div className="rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:bg-amber-950 dark:text-amber-100">
                  <strong>Venue required</strong> — choose broker / sim / FatTail
                  on first use of this account before saving.
                </div>
              )}

              <ul className="flex flex-wrap gap-1.5">
                {checklist.map((c) => (
                  <li
                    key={c.label}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      c.ok
                        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                    }`}
                  >
                    {c.ok ? "✓" : "·"} {c.label}
                  </li>
                ))}
              </ul>

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

              {/* Execution date/time — backdate allowed for errata fixes */}
              <div className="space-y-2 rounded-xl border-2 border-[var(--color-tint)]/40 bg-[var(--color-fill)] p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <label className="block min-w-[12rem] flex-1 text-xs font-bold text-[var(--color-label)]">
                    {mode === "close" ||
                    (mode === "edit" && trade && tradeIsCloseFill(trade))
                      ? "TO CLOSE — filled at"
                      : mode === "edit" && trade && !tradeIsCloseFill(trade)
                        ? "TO OPEN — filled at"
                        : "Filled at (date & time)"}
                    <input
                      type="datetime-local"
                      className={`${field} font-mono text-sm`}
                      value={form.exec_at}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, exec_at: e.target.value }))
                      }
                      // No max= — backdating past fills is intentional for manual books
                    />
                  </label>
                </div>
                <p className="text-[11px] leading-snug text-[var(--color-label-secondary)]">
                  {manualDatetimeEditable
                    ? "You can backdate or correct this time for manual entries. Use the real fill time so open→close matching and Reports stay honest."
                    : "Edit date/time if this fill was logged wrong. Prefer real market fill time."}
                </p>
                {mode === "edit" && trade && pairedClose && (
                  <p className="text-[11px] text-[var(--color-label-secondary)]">
                    Paired{" "}
                    <strong>TO CLOSE #{pairedClose.id}</strong> filled at{" "}
                    <span className="font-mono">
                      {formatExecDisplay(pairedClose.exec_at)}
                    </span>
                    {onOpenTrade && (
                      <>
                        {" · "}
                        <button
                          type="button"
                          className="font-medium text-[var(--color-tint)] underline"
                          onClick={() => onOpenTrade(pairedClose)}
                        >
                          Edit close date/time
                        </button>
                      </>
                    )}
                  </p>
                )}
                {mode === "edit" && trade && pairedOpen && (
                  <p className="text-[11px] text-[var(--color-label-secondary)]">
                    Paired{" "}
                    <strong>TO OPEN #{pairedOpen.id}</strong> filled at{" "}
                    <span className="font-mono">
                      {formatExecDisplay(pairedOpen.exec_at)}
                    </span>
                    {onOpenTrade && (
                      <>
                        {" · "}
                        <button
                          type="button"
                          className="font-medium text-[var(--color-tint)] underline"
                          onClick={() => onOpenTrade(pairedOpen)}
                        >
                          Edit open date/time
                        </button>
                      </>
                    )}
                  </p>
                )}
                {mode === "close" && trade && (
                  <p className="text-[11px] text-[var(--color-label-secondary)]">
                    Opening fill #{trade.id} at{" "}
                    <span className="font-mono">
                      {formatExecDisplay(trade.exec_at)}
                    </span>
                    . Close time can be the same day or later (or corrected if you
                    logged late).
                  </p>
                )}
              </div>

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
                  </div>
                  <p className="rounded-lg bg-[var(--color-surface)] px-2 py-1.5 font-mono text-[11px] text-[var(--color-label)]">
                    {formatStructurePreview(structurePreviewLegs) ||
                      "Enter center strike to preview legs"}
                  </p>
                </div>
              )}

              {showCloseSimple && (
                <p className="text-xs text-[var(--color-label-secondary)]">
                  Structure is fixed from the open. Set order type and net
                  below, then save. Expand Legs only if you need per-leg edits.
                </p>
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

              {/* —— Order / Net / Debit (primary controls; above legs) —— */}
              {showOrderNetFields && (
                <div className="space-y-1 rounded-xl border border-[var(--color-separator)] bg-[var(--color-fill)] p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <label className="block text-xs font-semibold text-[var(--color-label)]">
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
                    <label className="block text-xs font-semibold text-[var(--color-label)]">
                      Net
                      <input
                        type="number"
                        step="any"
                        className={field}
                        value={form.net_price}
                        placeholder={
                          form.net_side === "CREDIT" ? "credit" : "debit"
                        }
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            net_price: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[var(--color-label)]">
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
                        <option value="">—</option>
                        <option value="DEBIT">DEBIT</option>
                        <option value="CREDIT">CREDIT</option>
                      </select>
                    </label>
                  </div>
                  {dollarHint && (
                    <p className="text-[10px] text-[var(--color-label-tertiary)]">
                      {dollarHint} · points not dollars
                    </p>
                  )}
                </div>
              )}

              {mode === "close" && (
                <div className="space-y-1 rounded-lg border border-[var(--color-separator)] px-3 py-2 text-[11px]">
                  <p className="font-semibold text-[var(--color-label-secondary)]">
                    Confirm if needed
                  </p>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allowOrphanClose}
                      onChange={(e) => setAllowOrphanClose(e.target.checked)}
                    />
                    Allow orphan / unexpected pair
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allowAccountMismatch}
                      onChange={(e) =>
                        setAllowAccountMismatch(e.target.checked)
                      }
                    />
                    Allow different account than open
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allowPartialUnits}
                      onChange={(e) => setAllowPartialUnits(e.target.checked)}
                    />
                    Allow unit size ≠ open (partial / scaled)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allowDrift}
                      onChange={(e) => setAllowDrift(e.target.checked)}
                    />
                    Allow structure drift from open
                  </label>
                </div>
              )}

              {/* —— Legs advanced (collapsed by default) —— */}
              {entryUi !== "simple_asset" &&
                (showStructureFields ||
                  showCloseSimple ||
                  entryUi === "legs" ||
                  (mode === "edit" && trade)) && (
                  <div className="rounded-xl border-2 border-[var(--color-separator)] bg-[var(--color-canvas)]">
                    <button
                      type="button"
                      onClick={() => {
                        if (showLegsAdvanced) {
                          setShowLegsAdvanced(false);
                        } else {
                          openLegsAdvanced();
                        }
                      }}
                      className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left"
                      aria-expanded={showLegsAdvanced}
                    >
                      <span className="text-sm font-bold text-[var(--color-label)]">
                        Legs (advanced)
                      </span>
                      <span className="text-xs font-medium text-[var(--color-label-secondary)]">
                        {showLegsAdvanced ? "Hide ▲" : "Show ▼"}
                      </span>
                    </button>
                    {showLegsAdvanced && (
                      <div className="space-y-2 border-t border-[var(--color-separator)] px-3 pb-3 pt-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-[var(--color-label-tertiary)]">
                            Edit individual legs only when structure entry is
                            not enough.
                          </p>
                          {mode !== "close" && (
                            <button
                              type="button"
                              className="shrink-0 text-xs font-medium text-[var(--color-tint)]"
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
                        <ul className="space-y-2">
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
                  </div>
                )}

              <div>
                <button
                  type="button"
                  className="text-xs font-medium text-[var(--color-label-secondary)] underline"
                  onClick={() => setShowProcess((v) => !v)}
                >
                  {showProcess ? "Hide" : "Process notes"}
                  {mode === "close" ? " on close" : ""} (optional)
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
                      Practice season
                      <select
                        className={field}
                        value={
                          practiceCampaignId === ""
                            ? ""
                            : String(practiceCampaignId)
                        }
                        onChange={(e) =>
                          setPracticeCampaignId(
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value),
                          )
                        }
                        data-testid="trade-campaign-select"
                      >
                        <option value="">None</option>
                        {activeCampaign && (
                          <option value={String(activeCampaign.id)}>
                            {activeCampaign.title} (active)
                          </option>
                        )}
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      Playbook entry
                      <select
                        className={field}
                        value={
                          playbookEntryId === "" ? "" : String(playbookEntryId)
                        }
                        onChange={(e) =>
                          setPlaybookEntryId(
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value),
                          )
                        }
                        data-testid="trade-playbook-select"
                      >
                        <option value="">None</option>
                        {playbooks.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
                      {playbookEntryId !== ""
                        ? "Against your playbook"
                        : "Adherence"}
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
                    {mode === "edit" && trade?.id ? (
                      <div
                        className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] p-2"
                        data-testid="trade-sheet-tags"
                      >
                        <p className="text-xs font-medium text-[var(--color-label-secondary)]">
                          Process tags
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--color-label-tertiary)]">
                          Label behavior in the trader&apos;s language — optional.
                          Lexicon only; never required to save.
                        </p>
                        <div className="mt-2">
                          <TagPicker
                            objectType="trade"
                            objectId={trade.id}
                            onError={(msg) => setError(msg)}
                          />
                        </div>
                      </div>
                    ) : mode === "create" ? (
                      <p className="text-[10px] text-[var(--color-label-tertiary)]">
                        Save the fill first, then open it to add process tags.
                      </p>
                    ) : null}
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
              </section>
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
            <span className="hidden text-[10px] text-[var(--color-label-tertiary)] sm:inline self-center">
              ⌘/Ctrl+Enter
            </span>
          </footer>
        )}
      </aside>
    </>
  );
}
