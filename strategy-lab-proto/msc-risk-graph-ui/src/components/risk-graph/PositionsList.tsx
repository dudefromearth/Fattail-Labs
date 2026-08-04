/* Positions List — scrollable list of saved positions in the left rail.
   3-band card layout: Header (label + badges) | Body (legs + price) | Actions (remove, hide, submit).
   Visual states: hidden (dimmed), ghost (faded), focused (accent edge), debit/credit tint. */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { UiPosition, UiLeg, TradeStatus } from '../../types/risk-graph';
import type { PositionLeg } from '../../lib/useRiskGraphCalculations';
import { recognizePositionType, formatPositionLabel } from '../../lib/positionUtils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toRecognitionLegs(legs: UiLeg[]): PositionLeg[] {
  return legs.map(l => ({
    strike: l.strike,
    expiration: l.expiry,
    right: l.type,
    quantity: l.qty,
  }));
}

function deriveLabel(pos: UiPosition): string {
  if (pos.legs.length === 0) return pos.label;
  const rLegs = toRecognitionLegs(pos.legs);
  const recognition = recognizePositionType(rLegs);
  return `${pos.symbol} ${formatPositionLabel(recognition.type, recognition.direction, rLegs)}`;
}

function liveDte(pos: UiPosition): number {
  const expiry = pos.legs[0]?.expiry;
  if (!expiry) return pos.dte ?? 0;
  const exp = new Date(expiry + 'T16:00:00Z');
  const now = new Date();
  return Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

/** Spread width label for verticals and butterflies. Returns null for all other topologies. */
function spreadWidth(legs: UiLeg[]): string | null {
  if (legs.length < 2) return null;
  const rLegs = toRecognitionLegs(legs);
  const { type } = recognizePositionType(rLegs);
  const strikes = rLegs.map(l => l.strike).sort((a, b) => a - b);
  if (type === 'vertical') {
    return `${strikes[strikes.length - 1] - strikes[0]}W`;
  }
  if (type === 'butterfly') {
    return `${strikes[1] - strikes[0]}W`;
  }
  if (type === 'bwb') {
    const lower = strikes[1] - strikes[0];
    const upper = strikes[2] - strikes[1];
    return lower === upper ? `${lower}W` : `${lower}/${upper}W`;
  }
  return null;
}

/** Format a single leg for stacked display. */
function formatLegLine(leg: UiLeg): string {
  const sign = leg.qty > 0 ? '+' : '';
  const side = leg.type === 'call' ? 'C' : 'P';
  return `${sign}${leg.qty} ${leg.strike}${side}`;
}

const GHOST_STATUSES: Set<TradeStatus> = new Set(['CLOSED', 'CANCELLED', 'REJECTED']);

// ---------------------------------------------------------------------------
// Editable Price Input
// ---------------------------------------------------------------------------
//
// C5 override pattern:
//   - Displays server currentNetValue by default.
//   - When the user edits, stores { value, timestamp } in local state.
//   - Shows the override while override.timestamp > lastFetchTimestamp
//     (i.e. the user's edit is newer than the most recent server push).
//   - Parent should set key={`${pos.id}-${visibleIds.has(pos.id)}`} so the
//     component remounts (clearing override) on intentId change or
//     visibility toggle off → on.

function EditablePrice({
  serverValue,
  onCommit,
}: {
  serverValue: number | null;
  onCommit: (v: number) => void;
}) {
  const [override, setOverride] = useState<{ value: number; timestamp: number } | null>(null);
  const lastFetchTsRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track when each server value arrives so we can compare with override timestamp.
  useEffect(() => {
    if (serverValue !== null) {
      lastFetchTsRef.current = Date.now();
    }
  }, [serverValue]);

  const displayValue = useMemo(() => {
    if (override !== null && override.timestamp > lastFetchTsRef.current) {
      return override.value;
    }
    return serverValue ?? 0;
  // lastFetchTsRef.current is mutated in an effect, not reactive — intentional.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [override, serverValue]);

  const [draft, setDraft] = useState(() => displayValue.toFixed(2));

  // Sync draft when displayValue changes externally (server push), but not while editing.
  const lastDisplayRef = useRef(displayValue);
  useEffect(() => {
    if (displayValue !== lastDisplayRef.current) {
      lastDisplayRef.current = displayValue;
      if (document.activeElement !== inputRef.current) {
        setDraft(displayValue.toFixed(2));
      }
    }
  }, [displayValue]);

  const commit = useCallback(() => {
    const parsed = parseFloat(draft);
    if (isNaN(parsed) || parsed < 0) {
      setDraft(displayValue.toFixed(2));
      return;
    }
    const rounded = Math.round(parsed * 100) / 100;
    setOverride({ value: rounded, timestamp: Date.now() });
    setDraft(rounded.toFixed(2));
    onCommit(rounded);
  }, [draft, displayValue, onCommit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setDraft(displayValue.toFixed(2));
      inputRef.current?.blur();
    }
  }, [displayValue]);

  return (
    <input
      ref={inputRef}
      className="rg-pos-card-price-input"
      type="text"
      inputMode="decimal"
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      onClick={e => e.stopPropagation()}
      onFocus={e => { e.stopPropagation(); e.target.select(); }}
    />
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PositionsListProps {
  positions: UiPosition[];
  visibleIds: Set<string>;
  tradeStatuses: Map<string, TradeStatus>;
  brokerTypes?: Map<string, string>;
  focusedId: string | null;
  onFocus: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onClose?: (id: string) => void;
  onSubmit: (id: string) => void;
  onUpdatePrice: (id: string, value: number) => void;
  /** Server-authoritative current_net_value per intentId from useRealTimeRiskMap. */
  serverPrices?: Record<string, number | null>;
}

const STATUS_LABELS: Record<TradeStatus, string> = {
  ANALYSIS: 'ANALYSIS',
  PENDING: 'PENDING',
  OPEN: 'OPEN',
  PARTIAL_OPEN: 'PARTIAL',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
};

const STATUS_CLASS: Record<TradeStatus, string> = {
  ANALYSIS: 'rg-status--analysis',
  PENDING: 'rg-status--pending',
  OPEN: 'rg-status--open',
  PARTIAL_OPEN: 'rg-status--partial_open',
  CLOSED: 'rg-status--closed',
  CANCELLED: 'rg-status--cancelled',
  REJECTED: 'rg-status--rejected',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Broker Badge
// ---------------------------------------------------------------------------

function BrokerBadge({ brokerType }: { brokerType?: string }) {
  const label = brokerType?.toUpperCase() ?? 'BROKER';
  return (
    <span className="rg-pos-card-broker-badge" title={`Live at ${label}`}>
      <svg width="22" height="26" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shield body */}
        <path
          d="M11 1L2 4.5V11c0 5.8 3.9 11.2 9 12.5C16.1 22.2 20 16.8 20 11V4.5L11 1z"
          fill="rgba(59,130,246,0.18)"
          stroke="rgba(59,130,246,0.55)"
          strokeWidth="1.4"
        />
        {/* Star */}
        <path
          d="M11 6.5l1.3 3.9h4.1l-3.3 2.4 1.3 3.9L11 14.3l-3.4 2.4 1.3-3.9-3.3-2.4h4.1z"
          fill="#60a5fa"
        />
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PositionsList({
  positions,
  visibleIds,
  tradeStatuses,
  brokerTypes,
  focusedId,
  onFocus,
  onToggleVisibility,
  onEdit,
  onDelete,
  onClose,
  onSubmit,
  onUpdatePrice,
  serverPrices,
}: PositionsListProps) {
  if (positions.length === 0) {
    return <div className="rg-rail-empty">No positions in this account.</div>;
  }

  return (
    <div className="rg-positions-list">
      {positions.map(pos => {
        const status = tradeStatuses.get(pos.id);
        const canSubmit = !status || status === 'ANALYSIS' || status === 'REJECTED' || status === 'CANCELLED';

        const dte = liveDte(pos);
        const priceSide = pos.price_side ?? 'debit';
        const isHidden = !visibleIds.has(pos.id);
        const isGhost = status != null && GHOST_STATUSES.has(status);
        const isFocused = pos.id === focusedId;
        const displayLabel = deriveLabel(pos);
        // Server currentNetValue takes priority; falls back to stored priceValue.
        const serverPrice = serverPrices?.[pos.id] ?? null;
        const editableServerValue = serverPrice ?? (pos.priceValue ?? null);

        const widthLabel = spreadWidth(pos.legs);
        const isOpen = status === 'OPEN' || status === 'PARTIAL_OPEN';
        const isPending = status === 'PENDING';
        const isLive = isOpen || isPending;
        const brokerType = brokerTypes?.get(pos.id);
        const itemClasses = [
          'rg-pos-card',
          priceSide === 'credit' ? 'rg-pos-card--credit' : 'rg-pos-card--debit',
          isOpen ? 'rg-pos-card--open' : '',
          isLive ? 'rg-pos-card--live' : '',
          isHidden ? 'rg-pos-card--hidden' : '',
          isGhost ? 'rg-pos-card--ghost' : '',
          isFocused ? 'rg-pos-card--focused' : '',
        ].filter(Boolean).join(' ');

        return (
          <div
            key={pos.id}
            className={itemClasses}
            onClick={() => onFocus(pos.id)}
          >
            {/* ── Top area: name + DTE | status badges | legs | price ── */}
            <div className="rg-pos-card-upper">
              <span className="rg-pos-card-title">
                {displayLabel}
                <span className="rg-pos-card-dte">{dte}D</span>
                {status && (
                  <span className={`rg-pos-status ${STATUS_CLASS[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                )}
                {brokerType === 'msc' && (
                  <span className="rg-pos-status rg-status--sim">SIM</span>
                )}
              </span>
              <div className="rg-pos-card-legs">
                {pos.legs.map((leg, i) => (
                  <span key={i} className="rg-pos-card-leg">{formatLegLine(leg)}</span>
                ))}
                {widthLabel && (
                  <span className="rg-pos-card-width">{widthLabel}</span>
                )}
              </div>
              <div className="rg-pos-card-price-cluster">
                <EditablePrice
                  key={`${pos.id}-${visibleIds.has(pos.id)}`}
                  serverValue={editableServerValue}
                  onCommit={(v) => onUpdatePrice(pos.id, v)}
                />
                <span className="rg-pos-card-price-side">
                  {priceSide === 'credit' ? 'CREDIT' : 'DEBIT'}
                </span>
              </div>
            </div>

            {/* ── Bottom area: X | buttons | broker badge / lock ── */}
            <div className="rg-pos-card-actions">
              <button
                className="rg-pos-card-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  isLive ? (onClose ?? onDelete)(pos.id) : onDelete(pos.id);
                }}
                aria-label={isLive ? 'Close position' : 'Remove position'}
                title={isLive ? 'Close' : 'Remove'}
              >
                {'\u00D7'}
              </button>
              <div className="rg-pos-card-btns">
                <button
                  className="rg-pos-card-btn"
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility(pos.id); }}
                >
                  {isHidden ? 'SHOW' : 'HIDE'}
                </button>
                {!isLive && (
                  <button
                    className="rg-pos-card-btn"
                    onClick={(e) => { e.stopPropagation(); onEdit(pos.id); }}
                  >
                    EDIT
                  </button>
                )}
                {(canSubmit || isLive) && (
                  <button
                    className="rg-pos-card-btn rg-pos-card-btn--submit"
                    onClick={(e) => { e.stopPropagation(); onSubmit(pos.id); }}
                  >
                    SUBMIT
                  </button>
                )}
              </div>
              {isLive ? (
                <BrokerBadge brokerType={brokerType} />
              ) : isPending ? (
                <span className="rg-pos-card-lock" title="Pending">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                  </svg>
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
