"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconGlobe,
  IconGrid,
  IconMagnifyingGlass,
  IconXMark,
} from "@/components/ui/icons";
import { fetchResolve, fetchUniverse, postGrayTelemetry } from "@/lib/symbology/api";
import {
  chromeForRoot,
  continuityCaptionFor,
  familyChildren,
  groupIsExpandable,
  groupMatchesChip,
  groupParent,
  groupsFromRows,
  isBangAlias,
  pairBadgeForRoot,
  pairBadgesFromUniverse,
  rowBindable,
  rowGrayCopy,
  rowIsGray,
} from "@/lib/symbology/picker";
import {
  CLASS_CHIPS,
  type ClassChipId,
  type GrayReason,
  type ResolvePayload,
  type SymbolBind,
  type SymbologyRow,
  type UniverseGroup,
  type UniversePayload,
} from "@/lib/symbology/types";

const DEBOUNCE_MS = 140;

export default function SymbolSearchDialog({
  open,
  onClose,
  roles,
  onBind,
}: {
  open: boolean;
  onClose: () => void;
  roles: readonly string[];
  onBind: (bind: SymbolBind) => void;
}) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<ClassChipId>("all");
  const [universe, setUniverse] = useState<UniversePayload | null>(null);
  const [resolve, setResolve] = useState<ResolvePayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const telRef = useRef<string>("");

  const rolesKey = roles.join(",");

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setChip("all");
    setResolve(null);
    setLoadError(null);
    setExpanded({});
    setFocusKey(null);
    let cancel = false;
    void fetchUniverse(roles)
      .then((body) => {
        if (cancel) return;
        setUniverse(body);
      })
      .catch((e) => {
        if (cancel) return;
        setLoadError(e instanceof Error ? e.message : "Could not load symbols");
      });
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => {
      cancel = true;
      window.clearTimeout(t);
    };
    // rolesKey captures roles; listing roles would retrigger on array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rolesKey]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setResolve(null);
      return;
    }
    let cancel = false;
    const t = window.setTimeout(() => {
      void fetchResolve(q, roles)
        .then((body) => {
          if (cancel) return;
          setResolve(body);
          setLoadError(null);
          if (body.type === "matches") {
            const roots = new Set((body.matches || []).map((m) => m.root));
            setExpanded((prev) => {
              const next = { ...prev };
              for (const root of roots) next[root] = true;
              return next;
            });
          }
          if (body.type === "miss" && body.miss) {
            const key = `${body.q}|${body.miss.reason_code}`;
            if (telRef.current !== key) {
              telRef.current = key;
              void postGrayTelemetry(body.q, body.miss.reason_code);
            }
          }
        })
        .catch((e) => {
          if (cancel) return;
          setLoadError(e instanceof Error ? e.message : "Resolve failed");
        });
    }, DEBOUNCE_MS);
    return () => {
      cancel = true;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query, rolesKey]);

  const pairBadges = useMemo(
    () => pairBadgesFromUniverse(universe?.groups || []),
    [universe],
  );

  const restGroups = useMemo(() => {
    const groups = universe?.groups || [];
    return groups.filter((g) => groupMatchesChip(g, chip));
  }, [universe, chip]);

  const searchGroups = useMemo(() => {
    if (!resolve || resolve.type === "miss") return [];
    if (resolve.type === "binding" && resolve.binding) {
      const row = resolve.binding;
      return groupsFromRows([row], [row.root]).filter((g) =>
        groupMatchesChip(g, chip),
      );
    }
    const matches = resolve.matches || [];
    const order = [...new Set(matches.map((m) => m.root))];
    return groupsFromRows(matches, order).filter((g) => groupMatchesChip(g, chip));
  }, [resolve, chip]);

  const showingSearch = query.trim().length > 0;
  const groups = showingSearch ? searchGroups : restGroups;
  const miss: GrayReason | null =
    showingSearch && resolve?.type === "miss" ? resolve.miss || null : null;

  const visibleKeys = useMemo(() => {
    const keys: string[] = [];
    if (miss) {
      keys.push(`miss:${query.trim()}`);
      return keys;
    }
    for (const g of groups) {
      const parent = groupParent(g);
      if (parent) keys.push(`p:${g.root}`);
      const openFamily =
        !groupIsExpandable(g) ||
        expanded[g.root] ||
        (showingSearch && (g.rows.length > 1 || g.rows[0]?.type !== "root"));
      if (openFamily) {
        const kids = showingSearch
          ? searchChildren(g, query)
          : familyChildren(g);
        for (const row of kids) keys.push(`c:${g.root}:${row.symbol}`);
      }
    }
    return keys;
  }, [groups, expanded, showingSearch, miss, query]);

  useEffect(() => {
    if (!open) return;
    setFocusKey((cur) =>
      cur && visibleKeys.includes(cur) ? cur : visibleKeys[0] || null,
    );
  }, [open, visibleKeys]);

  const bindRow = useCallback(
    async (row: SymbologyRow) => {
      if (!rowBindable(row)) return;
      let bound = row.bound_symbol || (row.type === "continuity-alias" ? "" : row.symbol);
      let boundType = row.type;
      let state = row.state;
      let gray = row.gray;
      if (row.type === "continuity-alias" && !row.bound_symbol) {
        const got = await fetchResolve(row.symbol, roles);
        if (got.type !== "binding" || !got.binding?.bound_symbol) return;
        bound = got.binding.bound_symbol;
        boundType = got.binding.type;
        state = got.binding.state;
        gray = got.binding.gray;
      }
      if (!bound) return;
      onBind({
        boundSymbol: bound,
        queried: row.symbol,
        type: boundType,
        root: row.root,
        roles: row.roles,
        continuity: row.type === "continuity-alias",
        continuityCaption: continuityCaptionFor(row),
        state,
        gray,
      });
      onClose();
    },
    [onBind, onClose, roles],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusKey((cur) => {
          const i = Math.max(0, visibleKeys.indexOf(cur || ""));
          const next =
            e.key === "ArrowDown"
              ? Math.min(visibleKeys.length - 1, i + 1)
              : Math.max(0, i - 1);
          return visibleKeys[next] || cur;
        });
        return;
      }
      if (e.key === "Enter") {
        const key = focusKey;
        if (!key || key.startsWith("miss:")) return;
        if (key.startsWith("p:")) {
          const root = key.slice(2);
          const g = groups.find((x) => x.root === root);
          if (g && groupIsExpandable(g) && !showingSearch) {
            e.preventDefault();
            setExpanded((prev) => ({ ...prev, [root]: !prev[root] }));
          }
          return;
        }
        if (key.startsWith("c:")) {
          const symbol = key.split(":").slice(2).join(":");
          const row = groups.flatMap((g) => g.rows).find((r) => r.symbol === symbol);
          if (row && rowBindable(row)) {
            e.preventDefault();
            void bindRow(row);
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, visibleKeys, focusKey, groups, showingSearch, bindRow]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-4"
      data-testid="symbol-search-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="symbol-search-dialog"
        data-roles={rolesKey}
        data-clause5="white-black"
        className="flex h-[min(720px,85vh)] w-[min(920px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl bg-white text-black shadow-2xl"
        style={{ fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex h-14 shrink-0 items-center justify-between px-5">
          <h2 id={titleId} className="text-[22px] font-semibold tracking-tight text-black">
            Symbol search
          </h2>
          <button
            type="button"
            aria-label="Close"
            data-testid="symbol-search-close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-black"
            onClick={onClose}
          >
            <IconXMark size={18} />
          </button>
        </header>

        <div className="shrink-0 px-5">
          <label className="relative block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <IconMagnifyingGlass size={18} />
            </span>
            <input
              ref={inputRef}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Symbol search"
              data-testid="symbol-search-input"
              className="h-11 w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-20 text-[15px] text-black outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-800 focus:outline-none focus:ring-0 focus-visible:outline-none"
            />
            <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  data-testid="symbol-search-clear"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-black"
                  onClick={() => setQuery("")}
                >
                  <IconXMark size={14} />
                </button>
              ) : null}
              <span
                className="inline-flex h-7 w-7 items-center justify-center text-zinc-400"
                aria-hidden
                title="List layout"
              >
                <IconGrid size={16} />
              </span>
            </span>
          </label>
        </div>

        <div
          className="mt-3 flex shrink-0 flex-wrap gap-2 px-5"
          data-testid="symbol-search-chips"
          role="tablist"
          aria-label="Instrument class"
        >
          {CLASS_CHIPS.map((c) => {
            const on = chip === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={on}
                data-testid={`symbol-search-chip-${c.id}`}
                onClick={() => setChip(c.id)}
                className={
                  on
                    ? "h-8 rounded-full bg-black px-3.5 text-[13px] font-medium text-white"
                    : "h-8 rounded-full border border-zinc-300 bg-white px-3.5 text-[13px] font-medium text-zinc-700 hover:border-zinc-500"
                }
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div
          className="mt-3 min-h-0 flex-1 overflow-y-auto border-t border-zinc-200"
          data-testid="symbol-search-list"
        >
          {loadError ? (
            <p className="px-5 py-6 text-sm text-zinc-700" role="alert">
              {loadError}
            </p>
          ) : null}
          {miss ? (
            <MissRow
              q={query.trim()}
              miss={miss}
              focused={focusKey === `miss:${query.trim()}`}
            />
          ) : null}
          {!loadError && !miss && groups.length === 0 && universe ? (
            <p className="px-5 py-6 text-sm text-zinc-500">No symbols in this class.</p>
          ) : null}
          {!miss
            ? groups.map((g) => (
                <FamilyBlock
                  key={g.root}
                  group={g}
                  query={query}
                  showingSearch={showingSearch}
                  expanded={Boolean(expanded[g.root])}
                  onToggle={() =>
                    setExpanded((prev) => ({ ...prev, [g.root]: !prev[g.root] }))
                  }
                  focusKey={focusKey}
                  onFocus={setFocusKey}
                  onBind={bindRow}
                  pair={pairBadgeForRoot(g.root, pairBadges)}
                />
              ))
            : null}
        </div>
      </div>
    </div>
  );
}

function searchChildren(group: UniverseGroup, query: string): SymbologyRow[] {
  const q = query.trim();
  return group.rows.filter((r) => {
    if (r.type === "root") return false;
    if (r.type === "continuity-alias" && !isBangAlias(r.symbol)) {
      return q === r.symbol || q.toUpperCase() === r.symbol.toUpperCase();
    }
    return true;
  });
}

function FamilyBlock({
  group,
  query,
  showingSearch,
  expanded,
  onToggle,
  focusKey,
  onFocus,
  onBind,
  pair,
}: {
  group: UniverseGroup;
  query: string;
  showingSearch: boolean;
  expanded: boolean;
  onToggle: () => void;
  focusKey: string | null;
  onFocus: (key: string) => void;
  onBind: (row: SymbologyRow) => void;
  pair: ReturnType<typeof pairBadgeForRoot>;
}) {
  const parent = group.rows.find((r) => r.type === "root") || null;
  const kids = showingSearch ? searchChildren(group, query) : familyChildren(group);
  const futuresFamily =
    Boolean(parent) ||
    kids.some(
      (r) => r.type === "contract" || r.type === "continuity-alias",
    );
  const expandable = futuresFamily && (showingSearch ? kids.length > 0 : groupIsExpandable(group));
  const openFamily = !expandable || expanded || showingSearch;
  const chrome = chromeForRoot(group.root);
  const parentKey = `p:${group.root}`;
  const parentFocused = focusKey === parentKey;
  const headerRow =
    parent ||
    (futuresFamily
      ? {
          type: "root" as const,
          symbol: group.root,
          root: group.root,
          roles: kids[0]?.roles || [],
          state: null,
          member_visible: true,
          has_chains: false,
          may_be_active: false,
          metadata_ref: null,
          gray: null,
        }
      : groupParent(group));

  if (!futuresFamily && headerRow) {
    return (
      <Row
        row={headerRow}
        depth="parent"
        chrome={chrome}
        focused={parentFocused}
        pair={pair}
        onFocus={() => onFocus(parentKey)}
        onActivate={() => onBind(headerRow)}
      />
    );
  }

  if (!headerRow) return null;

  return (
    <div data-testid={`symbol-search-family-${group.root}`}>
      <Row
        row={headerRow}
        depth="parent"
        chrome={chrome}
        focused={parentFocused}
        pair={pair}
        expanded={openFamily}
        expandable={expandable && !showingSearch}
        onFocus={() => onFocus(parentKey)}
        onActivate={() => {
          if (showingSearch || !expandable) return;
          onToggle();
        }}
      />
      {openFamily
        ? kids.map((row) => {
            const key = `c:${group.root}:${row.symbol}`;
            return (
              <Row
                key={row.symbol}
                row={row}
                depth="child"
                chrome={chrome}
                focused={focusKey === key}
                onFocus={() => onFocus(key)}
                onActivate={() => onBind(row)}
              />
            );
          })
        : null}
    </div>
  );
}

function Row({
  row,
  depth,
  chrome,
  focused,
  pair,
  expanded,
  expandable,
  onFocus,
  onActivate,
}: {
  row: SymbologyRow;
  depth: "parent" | "child";
  chrome: ReturnType<typeof chromeForRoot>;
  focused: boolean;
  pair?: ReturnType<typeof pairBadgeForRoot>;
  expanded?: boolean;
  expandable?: boolean;
  onFocus: () => void;
  onActivate: () => void;
}) {
  const gray = rowIsGray(row);
  const caption = continuityCaptionFor(row);
  const reason = rowGrayCopy(row);
  const tickerCls = gray
    ? "text-zinc-400"
    : "text-[#2962ff]";
  return (
    <button
      type="button"
      data-testid={`symbol-search-row-${row.symbol}`}
      data-type={row.type}
      data-state={row.state || ""}
      data-focused={focused ? "1" : "0"}
      onMouseEnter={onFocus}
      onFocus={onFocus}
      onClick={onActivate}
      className={[
        "flex w-full items-center gap-3 border-b border-zinc-100 px-5 text-left",
        depth === "child" ? "h-12 pl-16" : "h-[52px]",
        focused ? "rounded-[4px] ring-1 ring-inset ring-black" : "",
        gray ? "bg-white" : focused ? "bg-white" : "bg-white hover:bg-zinc-50",
      ].join(" ")}
    >
      {depth === "parent" ? (
        <span
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ background: chrome.badgeBg }}
          aria-hidden
        >
          {chrome.badge}
        </span>
      ) : (
        <span className="sr-only"> </span>
      )}
      <span className={`w-[7.5rem] shrink-0 text-[14px] font-medium ${tickerCls}`}>
        {row.symbol}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-700">
        {chrome.title}
        {caption ? (
          <span
            className="ml-2 text-[11px] text-zinc-500"
            data-testid="symbol-search-continuity-label"
          >
            {caption}
          </span>
        ) : null}
        {reason ? (
          <span
            className="ml-2 text-[11px] text-zinc-500"
            data-testid="symbol-search-gray-reason"
          >
            {reason}
          </span>
        ) : null}
      </span>
      {pair ? (
        <span
          data-testid="symbol-search-pair-badge"
          data-active={pair.active ? "1" : "0"}
          data-state={pair.state}
          title={
            pair.active
              ? pair.label
              : `${pair.label} · ${pair.state.toLowerCase()}`
          }
          className={
            pair.active
              ? "shrink-0 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white"
              : "shrink-0 rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-medium text-zinc-500"
          }
        >
          {pair.label}
        </span>
      ) : null}
      {chrome.exchange ? (
        <span className="shrink-0 text-[12px] text-zinc-500">{chrome.exchange}</span>
      ) : null}
      <span
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e88e5] text-white"
        aria-hidden
      >
        <IconGlobe size={14} />
      </span>
      {expandable ? (
        <span className="text-zinc-500" aria-hidden>
          {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        </span>
      ) : (
        <span className="w-4" aria-hidden />
      )}
    </button>
  );
}

function MissRow({
  q,
  miss,
  focused,
}: {
  q: string;
  miss: GrayReason;
  focused: boolean;
}) {
  return (
    <div
      data-testid="symbol-search-miss"
      data-reason={miss.reason_code}
      data-focused={focused ? "1" : "0"}
      className={[
        "flex h-12 items-center gap-3 border-b border-zinc-100 px-5",
        focused ? "rounded-[4px] ring-1 ring-inset ring-black" : "",
      ].join(" ")}
      aria-disabled="true"
    >
      <span className="w-[7.5rem] shrink-0 text-[14px] font-medium text-zinc-400">
        {q}
      </span>
      <span
        className="min-w-0 flex-1 text-[13px] text-zinc-500"
        data-testid="symbol-search-gray-reason"
      >
        {miss.copy}
      </span>
    </div>
  );
}
