/* Position Builder — floating dialog for constructing option positions.
   Matches reference design: SYMBOL/STRATEGY top row, Buy/Sell toggle,
   LEGS table with grid columns, Preview footer with action buttons. */

import { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef, memo } from 'react';
import { FloatingWindow } from '../FloatingWindow';
import {
  butterflyLegs, verticalLegs, ironCondorLegs, straddleLegs, singleLeg,
  bwbLegs, condorLegs, strangleLegs, ironFlyLegs, calendarLegs, diagonalLegs,
  diagonalWidthFromLadder,
} from '../../lib/templates';
import { buildLabel, buildNotation } from '../../lib/positionLabels';
import type { LegInput, PositionInput, TemplateType, TradeStatus } from '../../types/risk-graph';
import type { ChainContract } from '../../lib/useChain';
import { snapToNearestStrike } from '../../lib/snapToNearestStrike';
import { generateTosScript } from '../../lib/tosGenerator';

interface ChainAccessors {
  expirations: string[];
  getStrikes: (expiration: string) => number[];
  getContract: (expiration: string, strike: number, type: 'call' | 'put') => ChainContract | undefined;
  nearestStrike: (expiration: string, target: number) => number;
}

interface PositionBuilderProps {
  initialPosition: PositionInput;
  spotPrice: number;
  chain?: ChainAccessors;
  /** True when chain data exists but is older than CHAIN_STRIKE_STALE_SEC. */
  isChainStale?: boolean;
  /** True when no chain snapshot has ever been received (no validation possible). */
  isChainUnavailable?: boolean;
  mode: 'create' | 'edit';
  onSave: (label: string, notation: string, positionConfig: PositionInput, entryTime?: string) => void;
  onCancel: () => void;
  loading: boolean;
  onPlaceOrder?: (positionId: string) => void;
  onPreviewRisk?: (position: PositionInput) => void;
  onSubmitOrder?: (position: PositionInput, label: string, entryTime?: string) => void;
  editingId?: string | null;
  tradeStatus?: TradeStatus | null;
  /** Admin-only: show entry timestamp field */
  isAdmin?: boolean;
  /** Admin-only: pre-fill entry time input when editing an existing position (ISO 8601) */
  initialEntryTime?: string;
  /**
   * D8: When false, a warning is shown for multi-leg positions.
   * Defaults to true (no warning). Set to false when the active broker
   * does not support multi-leg order submission.
   */
  brokerSupportsMultiLeg?: boolean;
}

/* ── Template detection helpers ── */

const TEMPLATE_LABELS: Record<TemplateType, string> = {
  single: 'Single',
  vertical: 'Vertical',
  butterfly: 'Butterfly',
  bwb: 'BWB',
  condor: 'Condor',
  straddle: 'Straddle',
  strangle: 'Strangle',
  iron_fly: 'Iron Fly',
  iron_condor: 'Iron Condor',
  calendar: 'Calendar',
  diagonal: 'Diagonal',
};

const STRATEGY_GROUPS: { label: string; items: TemplateType[] }[] = [
  { label: 'Basic', items: ['single', 'vertical'] },
  { label: 'Spreads', items: ['butterfly', 'bwb', 'condor'] },
  { label: 'Volatility', items: ['straddle', 'strangle', 'iron_fly', 'iron_condor'] },
  { label: 'Time', items: ['calendar', 'diagonal'] },
];

function detectTemplateFromLegs(legs: LegInput[]): TemplateType {
  if (legs.length === 1) return 'single';
  if (legs.length === 2) {
    const sameStrike = legs[0].strike === legs[1].strike;
    const diffType = legs[0].type !== legs[1].type;
    const diffSide = legs[0].side !== legs[1].side;
    if (sameStrike && diffType) return 'straddle';
    if (!sameStrike && diffType) return 'strangle';
    if (sameStrike && !diffType && diffSide) return 'calendar';
    // Diagonal: same type, different strikes, different sides, with per-leg expirations
    if (!sameStrike && !diffType && diffSide) {
      const hasPerLegExp = legs.some(l => l.expiration);
      if (hasPerLegExp) return 'diagonal';
    }
    return 'vertical';
  }
  if (legs.length === 3) {
    const sorted = [...legs].sort((a, b) => a.strike - b.strike);
    const gap1 = sorted[1].strike - sorted[0].strike;
    const gap2 = sorted[2].strike - sorted[1].strike;
    if (Math.abs(gap1 - gap2) > 0.01) return 'bwb';
    return 'butterfly';
  }
  if (legs.length === 4) {
    const types = new Set(legs.map(l => l.type));
    if (types.size === 2) {
      // Check for iron fly (short strikes at same price)
      const shorts = legs.filter(l => l.side === 'short');
      if (shorts.length === 2 && shorts[0].strike === shorts[1].strike) return 'iron_fly';
      return 'iron_condor';
    }
    return 'condor';
  }
  return 'single';
}

function deriveCenterAndWidth(
  legs: LegInput[],
  template: TemplateType,
): { center: number; width: number; side: 'call' | 'put' } {
  const strikes = legs.map(l => l.strike).sort((a, b) => a - b);
  const side = legs[0]?.type ?? 'call';

  switch (template) {
    case 'butterfly':
    case 'bwb':
      return {
        center: strikes.length >= 3 ? strikes[1] : strikes[0],
        width: strikes.length >= 3 ? strikes[1] - strikes[0] : 50,
        side,
      };
    case 'vertical':
      return {
        center: strikes[0],
        width: strikes.length >= 2 ? strikes[1] - strikes[0] : 50,
        side,
      };
    case 'condor':
      return {
        center: strikes.length >= 4
          ? Math.round((strikes[1] + strikes[2]) / 2)
          : strikes[0],
        width: strikes.length >= 4 ? Math.round((strikes[2] - strikes[1]) / 2) : 50,
        side,
      };
    case 'iron_condor':
    case 'iron_fly':
      return {
        center: strikes.length >= 4
          ? Math.round((strikes[1] + strikes[2]) / 2)
          : strikes[0],
        width: strikes.length >= 4 ? Math.round((strikes[2] - strikes[1]) / 2) : 50,
        side: 'call',
      };
    case 'diagonal':
      return {
        center: strikes[0],
        // Prefer actual span; fallback = 2 strikes between (3 increments @ $5)
        width: strikes.length >= 2 ? strikes[1] - strikes[0] : 15,
        side,
      };
    case 'straddle':
    case 'strangle':
      return {
        center: strikes.length >= 2
          ? Math.round((strikes[0] + strikes[1]) / 2)
          : strikes[0],
        width: strikes.length >= 2
          ? Math.round((strikes[1] - strikes[0]) / 2)
          : 20,
        side: 'call',
      };
    case 'calendar':
      return { center: strikes[0], width: 0, side };
    case 'single':
      return { center: strikes[0], width: 0, side };
    default:
      return { center: strikes[0] ?? 0, width: 50, side: 'call' };
  }
}

const TEMPLATE_HAS_SIDE: Record<TemplateType, boolean> = {
  single: true,
  vertical: true,
  butterfly: true,
  bwb: true,
  condor: true,
  straddle: false,
  strangle: false,
  iron_fly: false,
  iron_condor: false,
  calendar: true,
  diagonal: true,
};

/* ── Time-spread back-expiration helpers ── */

/**
 * Returns the default back expiration for calendar/diagonal spreads:
 * front + 1 calendar day, skipping Saturday (→ +3 days = Monday).
 * Used when chain data is unavailable or has no next expiration.
 */
function defaultBackExpiration(front: string): string {
  const d = new Date(front + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2); // Sat → Mon
  return d.toISOString().slice(0, 10);
}

/* ── Direction helpers ── */

function flipLegs(legs: LegInput[]): LegInput[] {
  return legs.map(leg => ({
    ...leg,
    side: leg.side === 'long' ? 'short' as const : 'long' as const,
  }));
}

function detectDirectionFromLegs(legs: LegInput[]): 'buy' | 'sell' {
  return legs[0]?.side === 'long' ? 'buy' : 'sell';
}

/* ── Payoff diagram SVG paths (small decorative icon) ── */

const STRATEGY_DIAGRAMS: Record<TemplateType, string> = {
  single: 'M2,22 L58,6',
  vertical: 'M2,22 L20,22 L40,6 L58,6',
  butterfly: 'M2,18 L12,18 L30,4 L48,18 L58,18',
  bwb: 'M2,18 L12,18 L28,4 L52,18 L58,18',
  condor: 'M2,18 L10,18 L20,6 L40,6 L50,18 L58,18',
  straddle: 'M2,6 L30,22 L58,6',
  strangle: 'M2,6 L18,18 L42,18 L58,6',
  iron_fly: 'M2,6 L10,18 L30,4 L50,18 L58,6',
  iron_condor: 'M2,6 L15,18 L45,18 L58,6',
  calendar: 'M2,16 L20,10 L30,6 L40,10 L58,16',
  diagonal: 'M2,18 L20,12 L32,6 L44,10 L58,16',
};

/** Default wing width by underlying symbol (non-diagonal structures). */
function defaultWidth(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s === 'NDX' || s === 'NQX' || s.startsWith('NQ')) return 50;
  return 20;
}

/**
 * Default diagonal width: 2 listed strikes between the legs (3 chain steps).
 * SPX $5 ladder → 15 pts; NDX $25 → 75 pts. Chain ladder preferred when present.
 */
const DIAGONAL_STRIKES_BETWEEN = 2;

function defaultDiagonalWidth(symbol: string): number {
  const s = symbol.toUpperCase();
  // Approximate increment × (between + 1)
  if (s === 'NDX' || s === 'NQX' || s.startsWith('NQ')) return 25 * (DIAGONAL_STRIKES_BETWEEN + 1);
  if (s === 'SPX' || s === 'SPXW' || s === 'XSP') return 5 * (DIAGONAL_STRIKES_BETWEEN + 1);
  return 5 * (DIAGONAL_STRIKES_BETWEEN + 1);
}

function resolveDiagonalWidth(
  center: number,
  symbol: string,
  ladder: readonly number[] | null | undefined,
): number {
  if (ladder && ladder.length >= 2) {
    const w = diagonalWidthFromLadder(center, ladder, DIAGONAL_STRIKES_BETWEEN);
    if (w != null && w > 0) return w;
  }
  return defaultDiagonalWidth(symbol);
}

/* ── Component ── */

export const PositionBuilder = memo(function PositionBuilder({
  initialPosition,
  spotPrice,
  chain,
  isChainStale,
  isChainUnavailable,
  mode,
  onSave,
  onCancel,
  loading,
  onPlaceOrder,
  onPreviewRisk,
  onSubmitOrder,
  editingId,
  tradeStatus,
  isAdmin,
  initialEntryTime,
  brokerSupportsMultiLeg = true,
}: PositionBuilderProps) {
  const hasChain = chain != null && chain.expirations.length > 0;

  /* ── Local position state (isolated from parent until save) ── */

  const [position, setPosition] = useState<PositionInput>(() => ({
    ...initialPosition,
    legs: initialPosition.legs.map(l => ({ ...l })),
  }));

  // Entry timestamp for the price-time chart overlay.
  // Pre-fills from initialEntryTime when editing, or from now when creating.
  const [adminEntryTime, setAdminEntryTime] = useState<string>(() => {
    const src = initialEntryTime ? new Date(initialEntryTime) : new Date();
    if (isNaN(src.getTime())) return new Date().toLocaleString('sv').slice(0, 16).replace(' ', 'T');
    // sv locale gives "YYYY-MM-DD HH:MM:SS" in local time; slice to "YYYY-MM-DDTHH:MM"
    return src.toLocaleString('sv').slice(0, 16).replace(' ', 'T');
  });

  const updatePosition = useCallback((updates: Partial<PositionInput>) => {
    setPosition(prev => ({ ...prev, ...updates }));
  }, []);

  const updateLeg = useCallback((index: number, updates: Partial<LegInput>) => {
    setPosition(prev => ({
      ...prev,
      legs: prev.legs.map((leg, i) => i === index ? { ...leg, ...updates } : leg),
    }));
  }, []);

  const addLeg = useCallback(() => {
    setPosition(prev => ({
      ...prev,
      legs: [...prev.legs, { strike: 4200, type: 'call' as const, quantity: 1, side: 'long' as const, entry_price: 0 }],
    }));
  }, []);

  const removeLeg = useCallback((index: number) => {
    setPosition(prev => ({
      ...prev,
      legs: prev.legs.filter((_, i) => i !== index),
    }));
  }, []);

  const applyTemplate = useCallback((legs: LegInput[]) => {
    setPosition(prev => ({ ...prev, legs }));
  }, []);

  /* ── Template & direction state ── */

  // Derive initial template state from legs (edit mode OR heatmap-provided legs)
  const hasInitialLegs = mode === 'edit' || initialPosition.legs.length > 0;
  const initTemplate = hasInitialLegs ? detectTemplateFromLegs(position.legs) : 'butterfly' as TemplateType;
  const initDerived = hasInitialLegs
    ? deriveCenterAndWidth(position.legs, initTemplate)
    : { center: Math.round(spotPrice), width: defaultWidth(initialPosition.underlying), side: 'call' as const };

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(initTemplate);

  // Snap center to nearest canonical strike if chain is available, otherwise
  // fall back to integer rounding. When chain arrives, didSnapStrikes will
  // further align to exact chain strikes.
  const [centerStrike, setCenterStrike] = useState<number>(() => {
    if (chain && chain.expirations.length > 0) {
      const strikes = chain.getStrikes(initialPosition.expiration);
      if (strikes.length > 0) {
        return snapToNearestStrike(initDerived.center, strikes);
      }
    }
    return Math.round(initDerived.center); // integer fallback (no $5 assumption)
  });

  const [wingWidth, setWingWidth] = useState<number>(initDerived.width);

  const [optionSide, setOptionSide] = useState<'call' | 'put'>(initDerived.side);

  const [direction, setDirection] = useState<'buy' | 'sell'>(() => {
    if (hasInitialLegs) return detectDirectionFromLegs(position.legs);
    return 'buy';
  });

  const isTimeSpread = selectedTemplate === 'calendar' || selectedTemplate === 'diagonal';

  // Back-day expiration for calendar/diagonal spreads
  const [backExpiration, setBackExpiration] = useState<string>(() => {
    // If editing a time spread, derive back from the long leg's expiration
    if (hasInitialLegs) {
      const longLeg = initialPosition.legs.find(l => l.side === 'long');
      if (longLeg?.expiration) return longLeg.expiration;
    }
    // New time spread: default to +1 day (Sat → +3 = Mon)
    if (initTemplate === 'calendar' || initTemplate === 'diagonal') {
      return defaultBackExpiration(initialPosition.expiration);
    }
    return '';
  });

  // When template switches to a time spread and backExpiration is empty (or stale),
  // resolve to the next chain expiration if available, else +1 calendar day.
  useEffect(() => {
    if (!isTimeSpread || backExpiration) return;
    if (hasChain && chain) {
      const exps = chain.expirations;
      const frontIdx = exps.indexOf(position.expiration);
      if (frontIdx >= 0 && frontIdx + 1 < exps.length) {
        setBackExpiration(exps[frontIdx + 1]);
        return;
      }
    }
    setBackExpiration(defaultBackExpiration(position.expiration));
  // Only run when isTimeSpread or backExpiration goes empty — not on every position.expiration change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeSpread, backExpiration]);

  /* ── Net premium ── */

  const netPremium = useMemo(() => {
    let total = 0;
    for (const leg of position.legs) {
      const sign = leg.side === 'long' ? -1 : 1;
      total += sign * leg.quantity * leg.entry_price;
    }
    return total;
  }, [position.legs]);

  const costLabel = netPremium <= 0 ? 'DEBIT' : 'CREDIT';
  const costAmount = parseFloat(Math.abs(netPremium).toFixed(2));

  /* ── Chain lookups ── */

  // Returns both the mid price and the per-leg IV from the chain.
  // IV is used for skew-accurate BS pricing — each leg has its own IV.
  const getContractData = useCallback(
    (strike: number, type: 'call' | 'put'): { mid: number; iv: number | null } => {
      if (!chain) return { mid: 0, iv: null };
      const c = chain.getContract(position.expiration, strike, type);
      return { mid: c?.mid ?? 0, iv: c?.iv ?? null };
    },
    [chain, position.expiration],
  );

  /* ── Leg generation ── */

  const regenerateLegs = useCallback(
    (template: TemplateType, center: number, width: number, side: 'call' | 'put', dir: 'buy' | 'sell' = 'buy', backExp?: string, frontExp?: string) => {
      let legs: LegInput[];

      switch (template) {
        case 'single':
          legs = singleLeg(center, side);
          break;
        case 'vertical':
          legs = verticalLegs(center, center + width, side);
          break;
        case 'butterfly':
          legs = butterflyLegs(center, width, side);
          break;
        case 'bwb':
          legs = bwbLegs(center, width, side);
          break;
        case 'condor':
          legs = condorLegs(center, width, side);
          break;
        case 'straddle':
          legs = straddleLegs(center);
          break;
        case 'strangle':
          legs = strangleLegs(center, width || 20);
          break;
        case 'iron_fly':
          legs = ironFlyLegs(center, width || 20);
          break;
        case 'iron_condor':
          legs = ironCondorLegs(
            center - width * 2,
            center - width,
            center + width,
            center + width * 2,
          );
          break;
        case 'calendar':
          legs = calendarLegs(center, side);
          break;
        case 'diagonal':
          // Width is set by template default (2 strikes between) or the wing control
          legs = diagonalLegs(center, width, side);
          break;
      }

      // For time spreads, stamp per-leg expirations (short=front, long=back)
      const timeSpread = template === 'calendar' || template === 'diagonal';
      if (timeSpread) {
        // backExp takes priority (freshly computed by caller to avoid stale closure)
        const front = frontExp ?? position.expiration;
        const back = backExp ?? backExpiration ?? front;
        legs = legs.map(leg => ({
          ...leg,
          expiration: leg.side === 'short' ? front : back,
        }));
      }

      // Snap to chain strikes + fill prices and per-leg IV
      if (chain && hasChain) {
        legs = legs.map(leg => {
          const exp = leg.expiration ?? position.expiration;
          const snapped = chain.nearestStrike(exp, leg.strike);
          const c = chain.getContract(exp, snapped, leg.type);
          return { ...leg, strike: snapped, entry_price: c?.mid ?? 0, volatility: c?.iv ?? undefined };
        });
      }

      // Flip if selling
      if (dir === 'sell') legs = flipLegs(legs);

      applyTemplate(legs);
    },
    [chain, hasChain, position.expiration, backExpiration, applyTemplate],
  );

  // Generate initial legs on create mount — but only if no legs were provided (e.g. from heatmap tile click)
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current || mode === 'edit') return;
    didInit.current = true;
    if (initialPosition.legs.length === 0) {
      regenerateLegs(selectedTemplate, centerStrike, wingWidth, optionSide, direction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Snap existing leg strikes to valid chain strikes when the chain first becomes available.
  // Runs in both create and edit modes — covers editing a position whose stored strikes no
  // longer exist on the live chain (wrong strike step, expired expiry data, etc.).
  const didSnapStrikes = useRef(false);
  useEffect(() => {
    if (didSnapStrikes.current) return;   // only snap once per dialog open
    if (!chain || !hasChain) return;      // wait until chain is loaded
    const strikes = chain.getStrikes(position.expiration);
    if (strikes.length === 0) return;     // chain loaded but no strikes for this expiry yet

    didSnapStrikes.current = true;

    setPosition(prev => {
      const snapped = prev.legs.map(leg => {
        const exp = leg.expiration ?? prev.expiration;
        const chainStrikes = chain.getStrikes(exp);
        if (chainStrikes.length === 0) return leg; // no data for this leg's expiry
        const s = chain.nearestStrike(exp, leg.strike);
        const c = chain.getContract(exp, s, leg.type);
        if (s === leg.strike && c?.iv == null) return leg;  // already valid, no IV to add
        return {
          ...leg,
          strike: s,
          // Only update entry_price when the strike actually changed (snapped to new value).
          // When the strike is already valid, preserve the stored entry price so the
          // user's debit doesn't get overwritten with the live market mid.
          ...(s !== leg.strike ? { entry_price: c?.mid ?? leg.entry_price } : {}),
          ...(c?.iv != null ? { volatility: c.iv } : {}),
        };
      });
      // If nothing changed, return prev reference unchanged (avoids spurious re-renders)
      const changed = snapped.some((l, i) =>
        l.strike !== prev.legs[i].strike || l.volatility !== prev.legs[i].volatility,
      );
      if (changed) {
        // Also re-anchor the center strike to the snapped legs so that future
        // regenerateLegs calls (template swap, expiry change) use valid chain strikes.
        const derived = deriveCenterAndWidth(snapped, selectedTemplate);
        setCenterStrike(derived.center);
        return { ...prev, legs: snapped };
      }
      return prev;
    });
  // Chain identity changes when data loads; position.expiration is a stable string.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain, hasChain]);

  /* ── Change handlers ── */

  const handleTemplateChange = useCallback(
    (tmpl: TemplateType) => {
      setSelectedTemplate(tmpl);
      const side = TEMPLATE_HAS_SIDE[tmpl] ? optionSide : 'call';

      // Auto-select back expiration for time spreads (must be strictly after front).
      // Compute the value synchronously and pass it directly to regenerateLegs —
      // setBackExpiration is async so the closure inside regenerateLegs would see
      // the old (empty) value if we relied on state alone.
      let computedBack: string | undefined;
      const timeSpread = tmpl === 'calendar' || tmpl === 'diagonal';
      if (timeSpread) {
        if (hasChain && chain) {
          const exps = chain.expirations;
          const frontIdx = exps.indexOf(position.expiration);
          computedBack = frontIdx >= 0 && frontIdx + 1 < exps.length
            ? exps[frontIdx + 1]
            : defaultBackExpiration(position.expiration);
        } else {
          computedBack = defaultBackExpiration(position.expiration);
        }
        setBackExpiration(computedBack);
      }

      // Diagonal default: 2 strikes between legs (width from ladder or symbol)
      let width = wingWidth;
      if (tmpl === 'diagonal') {
        const ladder = hasChain && chain
          ? chain.getStrikes(position.expiration)
          : null;
        width = resolveDiagonalWidth(
          centerStrike,
          position.underlying,
          ladder && ladder.length > 0 ? ladder : null,
        );
        setWingWidth(width);
      }

      regenerateLegs(tmpl, centerStrike, width, side, direction, computedBack);
    },
    [centerStrike, wingWidth, optionSide, direction, regenerateLegs, hasChain, chain, position.expiration, backExpiration, position.underlying],
  );

  const handleDirectionChange = useCallback(
    (dir: 'buy' | 'sell') => {
      if (dir === direction) return;
      setDirection(dir);
      setPosition(prev => ({ ...prev, legs: flipLegs(prev.legs) }));
    },
    [direction],
  );

  const handleExpirationChange = useCallback(
    (expiration: string) => {
      updatePosition({ expiration });
      // For time spreads, compute back expiration synchronously to avoid stale closure.
      // Both updatePosition and setBackExpiration are async — regenerateLegs would see
      // old values if we relied on state alone.
      let computedBack: string | undefined;
      if (isTimeSpread) {
        if (hasChain && chain) {
          const exps = chain.expirations;
          const frontIdx = exps.indexOf(expiration);
          if (backExpiration <= expiration && frontIdx >= 0 && frontIdx + 1 < exps.length) {
            computedBack = exps[frontIdx + 1];
          } else if (backExpiration > expiration) {
            // back is still valid — reuse it
            computedBack = backExpiration;
          } else {
            computedBack = defaultBackExpiration(expiration);
          }
        } else {
          computedBack = backExpiration > expiration ? backExpiration : defaultBackExpiration(expiration);
        }
        setBackExpiration(computedBack);
      }
      // Reset didSnapStrikes so the snap-to-chain effect re-fires with the new expiration's strikes
      didSnapStrikes.current = false;
      regenerateLegs(selectedTemplate, centerStrike, wingWidth, optionSide, direction, computedBack, expiration);
    },
    [selectedTemplate, centerStrike, wingWidth, optionSide, direction, updatePosition, regenerateLegs, isTimeSpread, hasChain, chain, backExpiration],
  );

  const handleBackExpirationChange = useCallback(
    (exp: string) => {
      setBackExpiration(exp);
      // Update long legs with the new back expiration
      setPosition(prev => ({
        ...prev,
        legs: prev.legs.map(leg =>
          leg.side === 'long' ? { ...leg, expiration: exp } : leg,
        ),
      }));
    },
    [],
  );

  /* ── Leg field handlers ── */

  const handleQtyChange = useCallback(
    (index: number, signedQty: number) => {
      const qty = Math.max(1, Math.abs(signedQty) || 1);
      const side = signedQty >= 0 ? 'long' as const : 'short' as const;
      updateLeg(index, { quantity: qty, side });
    },
    [updateLeg],
  );

  const handleStrikeChange = useCallback(
    (index: number, strike: number, type: 'call' | 'put') => {
      // Snap to nearest $5 when the chain isn't available (freeform input).
      // When chain IS available we use a select, so the value is always a valid chain strike.
      const s = (!hasChain && strike > 0) ? Math.round(strike / 5) * 5 : strike;
      const { mid, iv } = getContractData(s, type);
      updateLeg(index, { strike: s, entry_price: mid, ...(iv != null ? { volatility: iv } : {}) });
    },
    [hasChain, getContractData, updateLeg],
  );

  const handleTypeToggle = useCallback(
    (index: number, leg: LegInput) => {
      const newType = leg.type === 'call' ? 'put' as const : 'call' as const;
      const { mid, iv } = getContractData(leg.strike, newType);
      updateLeg(index, { type: newType, entry_price: mid, ...(iv != null ? { volatility: iv } : {}) });
    },
    [getContractData, updateLeg],
  );

  /* ── Preview ── */

  const previewLabel = useMemo(
    () => buildLabel(position.underlying, position.legs, position.expiration),
    [position.underlying, position.legs, position.expiration],
  );
  const previewNotation = useMemo(
    () => buildNotation(position.legs),
    [position.legs],
  );

  const strategyName = useMemo(() => {
    return previewLabel
      .replace(position.underlying + ' ', '')
      .replace(/\s*\d+d$/, '');
  }, [previewLabel, position.underlying]);

  /* ── ToS Script ── */

  const tosScript = useMemo(() => {
    if (position.legs.length === 0) return '';
    const legs = position.legs.map(leg => ({
      strike: leg.strike,
      expiration: leg.expiration ?? position.expiration,
      right: leg.type,
      quantity: leg.side === 'long' ? leg.quantity : -leg.quantity,
    }));
    const basis = position.net_debit_override ?? costAmount;
    return generateTosScript({ symbol: position.underlying, legs, costBasis: basis });
  }, [position.legs, position.underlying, position.expiration, position.net_debit_override, costAmount]);

  const [copied, setCopied] = useState(false);

  const handleCopyTos = useCallback(() => {
    if (!tosScript) return;
    navigator.clipboard.writeText(tosScript).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [tosScript]);

  /* ── DTE ── */

  const dte = useMemo(() => {
    const exp = new Date(position.expiration + 'T16:00:00Z');
    const now = new Date();
    return Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }, [position.expiration]);

  /* ── Canonical strike validation ── */

  // True when ANY leg has a non-canonical strike AND the chain is loaded.
  // Used to gate the Analyze/Update button.
  const hasNonCanonicalLeg = useMemo(() => {
    if (!hasChain || !chain) return false;
    return position.legs.some(leg => {
      const exp = leg.expiration ?? position.expiration;
      const strikes = chain.getStrikes(exp);
      if (strikes.length === 0) return false; // no data for this expiry — allow
      return !strikes.includes(leg.strike);
    });
  }, [hasChain, chain, position.legs, position.expiration]);

  /* ── Save ── */

  const handleSave = useCallback(() => {
    const entryIso = adminEntryTime ? new Date(adminEntryTime).toISOString() : undefined;
    // Ensure calendar/diagonal legs carry distinct front/back expirations
    let legs = position.legs;
    if (selectedTemplate === 'calendar' || selectedTemplate === 'diagonal') {
      const front = position.expiration;
      const back = backExpiration > front ? backExpiration : defaultBackExpiration(front);
      legs = position.legs.map(leg => ({
        ...leg,
        expiration: leg.side === 'short' ? front : back,
      }));
    }
    // Stamp Buy/Sell so commit-time price_side is correct when leg prices are 0
    onSave(previewLabel, previewNotation, { ...position, legs, direction }, entryIso);
  }, [previewLabel, previewNotation, position, direction, selectedTemplate, backExpiration, onSave, adminEntryTime]);

  /* ── Place Order ── */

  const canPlaceOrder = mode === 'edit' && editingId != null && onPlaceOrder != null
    && tradeStatus !== 'OPEN' && tradeStatus !== 'PENDING';

  const handlePlaceOrder = useCallback(() => {
    if (canPlaceOrder && editingId) {
      onPlaceOrder!(editingId);
    }
  }, [canPlaceOrder, editingId, onPlaceOrder]);

  /* ── Preview Risk ── */

  const handlePreviewRisk = useCallback(() => {
    onPreviewRisk?.(position);
  }, [onPreviewRisk, position]);

  /* ── Submit Order ── */

  const handleSubmitOrder = useCallback(() => {
    const entryIso = adminEntryTime ? new Date(adminEntryTime).toISOString() : undefined;
    onSubmitOrder?.({ ...position, direction }, previewLabel, entryIso);
  }, [onSubmitOrder, position, direction, previewLabel, adminEntryTime]);

  /* ── Keyboard: Escape closes, Cmd+Enter places order ── */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canPlaceOrder) {
        e.preventDefault();
        handlePlaceOrder();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel, canPlaceOrder, handlePlaceOrder]);

  /* ── Floating window position/size ──
     Height grows with leg count so 4-leg strategies never crush the footer. */

  const PB_WIDTH = 740;
  const PB_TITLEBAR = 44;
  /** Non-leg chrome (symbol/strategy/direction/ToS/footer + padding/gaps). */
  const PB_FIXED_CHROME = 420;
  const PB_LEG_HEADER = 36;
  const PB_LEG_ROW = 52;
  const PB_LEGS_PAD = 28;
  const PB_MIN_HEIGHT = 560;
  const PB_VIEWPORT_MARGIN = 24;

  const heightForLegCount = useCallback((legCount: number) => {
    const legsBlock = PB_LEG_HEADER + Math.max(1, legCount) * PB_LEG_ROW + PB_LEGS_PAD;
    // Time spreads add a back-expiration control row under the strategy area
    const timeExtra = (selectedTemplate === 'calendar' || selectedTemplate === 'diagonal') ? 48 : 0;
    const natural = PB_TITLEBAR + PB_FIXED_CHROME + legsBlock + timeExtra;
    const maxH = Math.max(PB_MIN_HEIGHT, window.innerHeight - PB_VIEWPORT_MARGIN);
    return Math.min(maxH, Math.max(PB_MIN_HEIGHT, natural));
  }, [selectedTemplate]);

  const initialH = heightForLegCount(Math.max(1, initialPosition.legs.length));
  const [winPos, setWinPos] = useState(() => ({
    x: Math.round((window.innerWidth - PB_WIDTH) / 2),
    y: Math.max(12, Math.round((window.innerHeight - initialH) / 2)),
  }));
  const [winSize, setWinSize] = useState({ width: PB_WIDTH, height: initialH });

  // Grow/shrink window when leg count or template changes; keep on-screen.
  useLayoutEffect(() => {
    const nextH = heightForLegCount(position.legs.length);
    setWinSize(prev => (prev.height === nextH ? prev : { ...prev, height: nextH }));
    setWinPos(prev => {
      const maxY = Math.max(12, window.innerHeight - nextH - 12);
      const y = Math.min(prev.y, maxY);
      return y === prev.y ? prev : { ...prev, y };
    });
  }, [position.legs.length, heightForLegCount]);

  /* ── Chain-derived data ── */

  const strikes = hasChain ? chain.getStrikes(position.expiration) : [];

  /* ── Shift all strikes up/down ── */

  const shiftAllStrikes = useCallback(
    (dir: 'up' | 'down') => {
      if (hasChain && strikes.length > 0) {
        setPosition(prev => ({
          ...prev,
          legs: prev.legs.map(leg => {
            const idx = strikes.indexOf(leg.strike);
            const newIdx = dir === 'up'
              ? Math.min(strikes.length - 1, idx + 1)
              : Math.max(0, idx - 1);
            const newStrike = strikes[newIdx];
            const c = chain!.getContract(prev.expiration, newStrike, leg.type);
            return {
              ...leg,
              strike: newStrike,
              entry_price: c?.mid ?? 0,
              ...(c?.iv != null ? { volatility: c.iv } : {}),
            };
          }),
        }));
      } else {
        const step = dir === 'up' ? 5 : -5;
        setPosition(prev => ({
          ...prev,
          legs: prev.legs.map(leg => ({ ...leg, strike: leg.strike + step })),
        }));
      }
    },
    [hasChain, strikes, chain],
  );

  /* ── Signed qty helper ── */

  const signedQty = (leg: LegInput) => leg.side === 'long' ? leg.quantity : -leg.quantity;

  /* ── Format expiration for display ── */

  const formatExpDate = (exp: string) => {
    const parts = exp.split('-');
    if (parts.length < 3) return exp;
    return `${parts[1]} / ${parts[2]} / ${parts[0]}`;
  };

  return (
    <FloatingWindow
      open
      title={mode === 'edit' ? 'Edit Position' : 'Create Position'}
      position={winPos}
      onPositionChange={setWinPos}
      size={winSize}
      onSizeChange={setWinSize}
      onClose={onCancel}
      resizable={false}
      minWidth={PB_WIDTH}
      minHeight={PB_MIN_HEIGHT}
      className="pb-window"
    >
      <div className="pb-body" data-report-area="Position Builder">
        {/* ── Top row: Symbol + Strategy ── */}
        <div className="pb-top-row">
          <div className="pb-field">
            <label className="pb-section-label">SYMBOL</label>
            <div className="pb-select-wrap">
              <input
                className="pb-select"
                type="text"
                value={position.underlying}
                onChange={e => updatePosition({ underlying: e.target.value.toUpperCase() })}
                placeholder="SPX"
              />
              <span className="pb-select-caret">&#x25BE;</span>
            </div>
          </div>
          <div className="pb-field">
            <label className="pb-section-label">STRATEGY</label>
            <div className="pb-select-wrap">
              <select
                className="pb-select"
                value={selectedTemplate}
                onChange={e => handleTemplateChange(e.target.value as TemplateType)}
              >
                {STRATEGY_GROUPS.map(group => (
                  <optgroup key={group.label} label={group.label}>
                    {group.items.map(t => (
                      <option key={t} value={t}>{TEMPLATE_LABELS[t]}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Direction row: diagram + Buy/Sell toggle + label ── */}
        <div className="pb-direction-row">
          <svg
            className="pb-payoff-diagram"
            viewBox="0 0 60 24"
            width="60"
            height="24"
            style={direction === 'sell' ? { transform: 'scaleY(-1)' } : undefined}
          >
            <path
              d={STRATEGY_DIAGRAMS[selectedTemplate]}
              fill="none"
              stroke={direction === 'buy' ? 'var(--color-profit)' : 'var(--color-loss)'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="pb-direction-toggle">
            <button
              className={direction === 'buy' ? 'active buy' : ''}
              onClick={() => handleDirectionChange('buy')}
            >
              Buy
            </button>
            <button
              className={direction === 'sell' ? 'active sell' : ''}
              onClick={() => handleDirectionChange('sell')}
            >
              Sell
            </button>
          </div>
          <span className="pb-direction-label">
            {direction === 'buy' ? 'Buy' : 'Sell'} {TEMPLATE_LABELS[selectedTemplate]}
          </span>
        </div>

        {/* ── Legs section ── */}
        <div className="pb-legs-section">
          <label className="pb-section-label">LEGS</label>
          <div className="pb-legs-container">
            <div className="pb-legs-header">
              <span />
              <span>QTY</span>
              <span />
              <span>STRIKE</span>
              <span>TYPE</span>
              <span>EXPIRATION</span>
              <span className="pb-header-accent">DEBIT</span>
              <span>POS</span>
            </div>
            {position.legs.map((leg, i) => (
              <div key={i} className="pb-leg-row">
                <span className="pb-leg-label">Leg {i + 1}:</span>
                <input
                  className="pb-leg-qty"
                  type="number"
                  value={signedQty(leg)}
                  onChange={e => handleQtyChange(i, parseInt(e.target.value, 10) || 1)}
                />
                {i === 0 ? (
                  <button
                    className="pb-shift-btn"
                    onClick={() => shiftAllStrikes('up')}
                    aria-label="Shift strikes up"
                  >&#x25B2;</button>
                ) : i === position.legs.length - 1 ? (
                  <button
                    className="pb-shift-btn"
                    onClick={() => shiftAllStrikes('down')}
                    aria-label="Shift strikes down"
                  >&#x25BC;</button>
                ) : (
                  <span />
                )}
                <div className="pb-leg-strike-wrap">
                  {hasChain && strikes.length > 0 ? (
                    <select
                      className="pb-leg-strike"
                      value={leg.strike}
                      onChange={e => handleStrikeChange(i, parseFloat(e.target.value), leg.type)}
                    >
                      {strikes.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="pb-leg-strike"
                      type="number"
                      value={leg.strike}
                      onChange={e => handleStrikeChange(i, parseFloat(e.target.value) || 0, leg.type)}
                      step="5"
                    />
                  )}
                  <span className="pb-strike-caret">&#x25BE;</span>
                </div>
                <button
                  className="pb-leg-type-cell"
                  onClick={() => handleTypeToggle(i, leg)}
                >
                  {leg.type === 'call' ? 'Call' : 'Put'}
                </button>
                {/* Expiration column: time spreads show per-leg, others show on first leg only */}
                {(i === 0 || isTimeSpread) ? (
                  <div className="pb-leg-exp-wrap">
                    {(() => {
                      const isBackLeg = isTimeSpread && leg.side === 'long';
                      const legExp = isTimeSpread
                        ? (leg.expiration ?? (isBackLeg ? backExpiration : position.expiration))
                        : position.expiration;
                      const onExpChange = (val: string) => {
                        if (isBackLeg) handleBackExpirationChange(val);
                        else handleExpirationChange(val);
                      };
                      // Back leg: only show expirations strictly after front
                      const availableExps = hasChain
                        ? (isBackLeg
                          ? chain.expirations.filter(e => e > position.expiration)
                          : chain.expirations)
                        : [];
                      return hasChain ? (
                        <select
                          className="pb-leg-exp"
                          value={legExp}
                          onChange={e => onExpChange(e.target.value)}
                        >
                          {availableExps.map(exp => (
                            <option key={exp} value={exp}>
                              {formatExpDate(exp)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="pb-leg-exp"
                          type="date"
                          value={legExp}
                          min={isBackLeg ? position.expiration : undefined}
                          onChange={e => onExpChange(e.target.value)}
                        />
                      );
                    })()}
                  </div>
                ) : (
                  <span />
                )}
                {/* Debit + POS columns: always on first leg row */}
                {i === 0 ? (
                  <>
                    <input
                      className="pb-leg-debit"
                      type="number"
                      step="0.01"
                      min="0"
                      value={position.net_debit_override != null ? position.net_debit_override : (costAmount > 0 ? costAmount : '')}
                      placeholder={costAmount > 0 ? costAmount.toFixed(2) : '—'}
                      onChange={e => {
                        const v = parseFloat(e.target.value);
                        updatePosition({ net_debit_override: isNaN(v) ? null : v });
                      }}
                      title="Net debit / credit for this position"
                    />
                    <input
                      className="pb-leg-pos"
                      type="number"
                      value={position.contracts}
                      min={1}
                      onChange={e => updatePosition({ contracts: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    />
                  </>
                ) : (
                  <>
                    <span />
                    <span />
                  </>
                )}
                <button
                  className="pb-leg-remove"
                  onClick={() => removeLeg(i)}
                  disabled={position.legs.length <= 1}
                  aria-label="Remove leg"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <button className="pb-add-leg" onClick={addLeg}>+ Add Leg</button>
        </div>

        {/* ── Footer: ToS + Buttons ── */}
        <div className="pb-footer-two-col">
          <div className="pb-tos-block">
            <label className="pb-section-label">TOS SCRIPT</label>
            <div
              className={`pb-tos-ctc${tosScript ? '' : ' pb-tos-ctc--empty'}`}
              onClick={handleCopyTos}
            >
              <span className="pb-tos-script-text">{tosScript || '—'}</span>
              <span className="pb-tos-hint">{copied ? 'Copied!' : 'click to copy'}</span>
            </div>
          </div>
          <div className="pb-footer-buttons">
            {/* Entry timestamp — pre-filled with now for new positions, editable for back-fill */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 2, alignSelf: 'center' }}>
              <span style={{ color: '#888', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Entry time
              </span>
              <input
                type="datetime-local"
                value={adminEntryTime}
                onChange={e => setAdminEntryTime(e.target.value)}
                style={{
                  background: 'rgba(28,28,30,0.9)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 5, color: '#e0e0e0', fontSize: 11,
                  padding: '3px 6px', colorScheme: 'dark',
                }}
              />
            </label>
            {/* D8: broker multi-leg capability warning */}
            {!brokerSupportsMultiLeg && position.legs.length > 1 && (
              <div className="pb-broker-warning">
                Selected broker does not support multi-leg orders. You can analyze this structure here, but you&apos;ll need to leg in manually at execution.
              </div>
            )}
            {onPreviewRisk && (
              <button
                className="pb-btn-secondary"
                onClick={handlePreviewRisk}
                disabled={loading || position.legs.length === 0}
              >
                Preview Risk
              </button>
            )}
            <button
              className="pb-btn-primary"
              onClick={handleSave}
              disabled={loading || position.legs.length === 0 || hasNonCanonicalLeg}
              title={hasNonCanonicalLeg
                ? 'One or more leg strikes are not valid for the selected expiration'
                : undefined}
            >
              {mode === 'edit' ? 'Update Position' : 'Analyze'}
            </button>
            {onSubmitOrder && (
              <button
                className="pb-btn-primary pb-btn-order"
                onClick={handleSubmitOrder}
                disabled={loading || position.legs.length === 0}
                title="Submit order through execution pipeline"
              >
                Submit
              </button>
            )}
            {canPlaceOrder && !onSubmitOrder && (
              <button
                className="pb-btn-primary pb-btn-order"
                onClick={handlePlaceOrder}
                disabled={loading}
                title="Place Order"
              >
                Place Order
              </button>
            )}
            <button className="pb-btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="pb-preview-block">
          <div className="pb-preview-title">Preview:</div>
          <div className="pb-preview-label">
            <span className="pb-preview-sym">{position.underlying}</span>
            {' '}{strategyName}{' '}
            <span className="pb-preview-dte">{dte}d</span>
            {costAmount > 0 && (
              <>
                {' '}
                <span className="pb-preview-cost">${costAmount.toFixed(2)} {costLabel}</span>
              </>
            )}
          </div>
          <div className="pb-preview-notation">{previewNotation}</div>
        </div>
      </div>
    </FloatingWindow>
  );
});
