/**
 * AlertDesigner — Unified alert create/edit dialog
 *
 * Three modes via segmented control:
 * - Price: threshold on underlying price (Condition + Value + Trigger)
 * - Position: alert on a specific position (Position dropdown + Condition + Value + Trigger)
 * - Algo: algorithmic alert on a position (Position dropdown + placeholder criteria box)
 *
 * Header shows: close dot + "SPX - Price Alert" or "SPX - 6700/6720/6740" for position/algo
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDraggable } from '../hooks/useDraggable';
import type {
  Alert,
  AlertType,
  AlertCondition,
  AlertBehavior,
  AlertMode,
  ThresholdScope,
  GreekName,
} from '../types/alerts';

// ── Type categories ──────────────────────────────────────────────
// Greeks is a first-class type (not buried under Position sub-tabs) so the
// Δ/Γ/Θ picker is always reachable from the main Type control.
type TypeCategory = 'price' | 'position' | 'greeks' | 'algo';

const TYPE_CATEGORIES: { key: TypeCategory; label: string }[] = [
  { key: 'price', label: 'Price' },
  { key: 'position', label: 'Position' },
  { key: 'greeks', label: 'Greeks' },
  { key: 'algo', label: 'Algo' },
];

const PRICE_CONDITIONS = [
  { value: 'above', label: 'Cross Above' },
  { value: 'below', label: 'Cross Below' },
  { value: 'at', label: 'Touches' },
];

const POSITION_CONDITIONS = [
  { value: 'above', label: 'Profit Above' },
  { value: 'below', label: 'Loss Below' },
];

const GREEK_CONDITIONS = [
  { value: 'above', label: 'Greater Than' },
  { value: 'below', label: 'Less Than' },
];

const GREEK_OPTIONS: { value: GreekName; label: string }[] = [
  { value: 'delta', label: 'Delta' },
  { value: 'gamma', label: 'Gamma' },
  { value: 'theta', label: 'Theta ($/day)' },
];

// ── Position sub-tabs ────────────────────────────────────────────
// Live (evaluable): pnl, profit, greeks
// Placeholder (UI only): breakeven, trailing, zerodte
//
// Greeks can ALSO be selected via Type → Greeks (top segment). Both routes
// show the same Δ/Γ/Θ picker + threshold form.
type PositionSubTab = 'pnl' | 'breakeven' | 'profit' | 'trailing' | 'greeks' | 'zerodte';

const POSITION_SUB_TABS: { key: PositionSubTab; label: string; live: boolean }[] = [
  { key: 'pnl', label: 'P&L', live: true },
  { key: 'profit', label: 'Profit Target', live: true },
  { key: 'greeks', label: 'Greeks', live: true },
  { key: 'breakeven', label: 'Break-Even', live: false },
  { key: 'trailing', label: 'Trailing Stop', live: false },
  { key: 'zerodte', label: '0DTE', live: false },
];

const TRIGGER_OPTIONS = [
  { value: 'once_only', label: 'Once Only' },
  { value: 'repeating', label: 'Repeating' },
  { value: 'persistent', label: 'Persistent' },
];

const ALERT_COLORS = [
  '#3b82f6', '#ef4444', '#f97316', '#22c55e',
  '#8b5cf6', '#eab308', '#ffffff', '#9ca3af',
];

const TAG_NAMES: Record<string, string> = {
  '#3b82f6': 'watch',
  '#ef4444': 'urgent',
  '#f97316': 'warning',
  '#22c55e': 'target',
  '#8b5cf6': 'setup',
  '#eab308': 'caution',
  '#ffffff': 'neutral',
  '#9ca3af': 'other',
};

export interface StrategyInfo {
  id: string;
  label: string;
  /** Slash-joined leg strikes, e.g. "6700/6720/6740" */
  strikesLabel?: string;
}

export interface AlertDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alert: {
    id?: string;
    type: AlertType;
    condition: AlertCondition;
    targetValue: number;
    color: string;
    behavior: AlertBehavior;
    goal?: string;
    thresholdScope?: ThresholdScope;
    strategyIds?: string[];
    mode?: AlertMode;
    greekName?: GreekName;
    label?: string;
    strategyId?: string;
    expiration?: string;
    algoSubType?: '0dte_entry' | 'profit_mgmt' | 'prompt';
  }) => void;
  strategies: StrategyInfo[];
  spotPrice: number;
  totalPnL: number;
  delta: number;
  gamma: number;
  theta: number;
  strategyPnLAtSpot: Record<string, number>;
  initialType?: string;
  initialValue?: number;
  initialCondition?: 'above' | 'below' | 'at';
  initialStrategyId?: string;
  editingAlert?: Alert | null;
}

// ── Inline styles — Apple HIG macOS dark mode ───────────────────
//
// References:
//   - macOS system dialog: 12px corner radius, elevated surface #2c2c2e
//   - Standard control height: 22px (small), 28px (medium), 32px (large)
//   - System font: SF Pro, 13px body, 15px title (semibold)
//   - Segmented control: filled background with raised selected segment
//   - Buttons: sentence case, never uppercase. Cancel = plain, Save = filled
//   - Traffic light dots: 12px diameter
//   - Padding: 20px horizontal, 16px vertical for dialog body
//
const S = {
  backdrop: {
    position: 'fixed' as const, inset: 0, zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.45)',
  },
  dialog: {
    background: '#2c2c2e', borderRadius: 12,
    boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.08)',
    width: 460, maxHeight: '85vh', overflow: 'hidden',
    display: 'flex', flexDirection: 'column' as const,
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 20px 10px', cursor: 'grab',
    borderBottom: '0.5px solid rgba(255,255,255,0.06)',
  },
  closeDot: {
    width: 12, height: 12, borderRadius: '50%',
    background: '#ff5f57', border: '0.5px solid rgba(0,0,0,0.12)',
    cursor: 'pointer', flexShrink: 0,
  },
  title: {
    flex: 1, fontSize: 15, fontWeight: 600 as const,
    color: '#f5f5f7', textAlign: 'center' as const,
    letterSpacing: -0.2,
  },
  body: {
    padding: '16px 20px 20px', display: 'flex',
    flexDirection: 'column' as const, gap: 14, overflowY: 'auto' as const,
  },
  row: { display: 'flex', alignItems: 'center', gap: 10 },
  label: {
    width: 80, fontSize: 13, fontWeight: 500 as const,
    color: '#98989d', textAlign: 'right' as const, flexShrink: 0,
  },
  // Segmented control: filled track with raised selected pill
  segmented: {
    display: 'flex', flex: 1,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 8, padding: 2, gap: 2,
  },
  segBtn: (active: boolean) => ({
    flex: 1,
    background: active ? 'rgba(255,255,255,0.14)' : 'transparent',
    border: 'none', borderRadius: 6,
    padding: '6px 0', fontSize: 13, fontWeight: 500 as const,
    color: active ? '#f5f5f7' : '#98989d', cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  }),
  // Popup button / dropdown — dark mode standard
  select: {
    flex: 1, background: 'rgba(255,255,255,0.08)',
    border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 6,
    padding: '7px 10px', fontSize: 13, fontWeight: 400 as const,
    color: '#f5f5f7', cursor: 'pointer', appearance: 'auto' as const,
  },
  // Value field wrapper
  valueWrap: {
    flex: 1, display: 'flex', alignItems: 'center',
    background: 'rgba(255,255,255,0.08)', borderRadius: 6,
    border: '0.5px solid rgba(255,255,255,0.1)', overflow: 'hidden',
  },
  // NSStepper-style arrows
  stepper: {
    width: 28, display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)', alignSelf: 'stretch',
    cursor: 'pointer', fontSize: 9, color: '#98989d',
    fontWeight: 600 as const, userSelect: 'none' as const,
    borderRight: '0.5px solid rgba(255,255,255,0.08)',
  },
  // Number input — standard text field appearance
  valueInput: {
    flex: 1, background: 'transparent', border: 'none',
    padding: '7px 10px', fontSize: 15, fontWeight: 500 as const,
    color: '#f5f5f7', textAlign: 'right' as const,
    fontFamily: "'SF Mono', 'Fira Code', monospace", outline: 'none',
  },
  // Tag/color picker container
  tagsWrap: {
    flex: 1, background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '8px 10px', minHeight: 44,
    display: 'flex', flexWrap: 'wrap' as const, gap: 6,
    alignContent: 'flex-start',
  },
  tag: (c: string) => ({
    background: c, borderRadius: 12, padding: '4px 14px',
    fontSize: 11, fontWeight: 600 as const, color: '#fff', cursor: 'pointer',
  }),
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 8,
    padding: '12px 20px 16px',
    borderTop: '0.5px solid rgba(255,255,255,0.06)',
  },
  // Cancel: plain system button (no fill)
  btnCancel: {
    background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.12)',
    borderRadius: 6, padding: '7px 20px', fontSize: 13, fontWeight: 500 as const,
    color: '#f5f5f7', cursor: 'pointer',
  },
  // Save: filled primary button
  btnSave: (disabled: boolean) => ({
    background: disabled ? 'rgba(10,132,255,0.3)' : '#0a84ff',
    border: 'none', borderRadius: 6, padding: '7px 20px',
    fontSize: 13, fontWeight: 500 as const,
    color: disabled ? 'rgba(255,255,255,0.4)' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }),
  // Placeholder area for future controls
  algoPlaceholder: {
    flex: 1, border: '1px dashed rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '20px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#636366', fontSize: 12, fontStyle: 'italic' as const,
    minHeight: 80,
  },
};

export default function AlertDesigner({
  isOpen, onClose, onSave, strategies,
  spotPrice, totalPnL, delta, gamma, theta,
  strategyPnLAtSpot, initialType, initialValue,
  initialCondition, initialStrategyId, editingAlert,
}: AlertDesignerProps) {
  // ── Form state ──────────────────────────────────────────────
  const [category, setCategory] = useState<TypeCategory>('price');
  const [condition, setCondition] = useState<'above' | 'below' | 'at'>('above');
  const [targetValue, setTargetValue] = useState('');
  const [behavior, setBehavior] = useState<AlertBehavior>('once_only');
  const [expiration, setExpiration] = useState('');
  const [noExpiration, setNoExpiration] = useState(false);
  const [color, setColor] = useState(ALERT_COLORS[0]);
  const [boundStrategyId, setBoundStrategyId] = useState('');
  const [goal, setGoal] = useState('');
  const [algoSubType, setAlgoSubType] = useState<'0dte_entry' | 'profit_mgmt' | 'prompt'>('0dte_entry');
  const [positionSubTab, setPositionSubTab] = useState<PositionSubTab>('pnl');
  const [greekName, setGreekName] = useState<GreekName>('delta');

  // Draggable
  const { dragHandleProps, containerStyle } = useDraggable({
    handleSelector: '.alert-designer-header',
    initialCentered: true,
  });

  // Keep latest strategies without putting the array in the open-reset effect
  // deps — a new strategies[] every parent render was wiping Position→Greeks
  // back to P&L and made the greek picker impossible to keep on screen.
  const strategiesRef = useRef(strategies);
  strategiesRef.current = strategies;
  const wasOpenRef = useRef(false);

  // ── Reset ONLY when the dialog opens (or the edited alert identity changes)
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }
    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;
    // While open, ignore parent re-renders — only re-init on open edge or edit id change
    if (!justOpened && !editingAlert) return;

    const strats = strategiesRef.current;
    if (editingAlert) {
      const isGreek = editingAlert.type === 'greeks_threshold';
      const isPos = editingAlert.type === 'profit_target';
      setCategory(
        isGreek ? 'greeks'
          : isPos ? 'position'
          : editingAlert.type === 'price' ? 'price'
          : 'algo',
      );
      setPositionSubTab('pnl');
      setCondition((editingAlert.condition as 'above' | 'below' | 'at') || 'above');
      setTargetValue(editingAlert.targetValue.toString());
      setColor(editingAlert.color || ALERT_COLORS[0]);
      setBoundStrategyId(editingAlert.strategyId || strats[0]?.id || '');
      setGoal(editingAlert.goal || '');
      const g = (editingAlert.greekName || editingAlert.label || 'delta').toLowerCase();
      setGreekName(g === 'gamma' || g === 'theta' || g === 'delta' ? g : 'delta');
    } else if (justOpened) {
      const isGreekInit = initialType === 'greeks_threshold'
        || initialType === 'delta' || initialType === 'gamma' || initialType === 'theta'
        || initialType === 'greeks';
      const cat: TypeCategory = isGreekInit ? 'greeks'
        : initialType === 'profit_target' || initialType === 'profit' || initialType === 'position'
          ? 'position'
          : initialType === 'algo' ? 'algo'
          : 'price';
      setCategory(cat);
      setPositionSubTab('pnl');
      if (initialType === 'gamma' || initialType === 'delta' || initialType === 'theta') {
        setGreekName(initialType);
      } else {
        setGreekName('delta');
      }
      setCondition(initialCondition || 'above');
      setTargetValue(initialValue != null ? initialValue.toString() : '');
      setColor(ALERT_COLORS[0]);
      setBoundStrategyId(initialStrategyId || strats[0]?.id || '');
      setGoal('');
      setBehavior('once_only');
      const etDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      setExpiration(`${etDate}T16:00`);
      setNoExpiration(false);
    }
  }, [isOpen, editingAlert, initialType, initialValue, initialCondition, initialStrategyId]);

  // ── Derived ─────────────────────────────────────────────────
  // Greeks form shows for EITHER:
  //   Type → Greeks  OR  Type → Position → sub-tab Greeks
  const isGreeksForm =
    category === 'greeks'
    || (category === 'position' && positionSubTab === 'greeks');
  const isLivePositionTab = category === 'position' && (
    positionSubTab === 'pnl' || positionSubTab === 'profit'
  );
  const conditions = category === 'price'
    ? PRICE_CONDITIONS
    : isGreeksForm
      ? GREEK_CONDITIONS
      : POSITION_CONDITIONS;
  const needsPosition = category === 'position' || category === 'greeks' || category === 'algo';

  // Selected strategy info
  const selectedStrategy = useMemo(
    () => strategies.find(s => s.id === boundStrategyId) || strategies[0],
    [strategies, boundStrategyId],
  );
  const symbol = selectedStrategy?.label?.split(' ')[0] || 'SPX';
  const strikesLabel = selectedStrategy?.strikesLabel || '';

  // Live greek readout for the bound position (portfolio greeks when no per-strat feed)
  const liveGreekValue = useMemo(() => {
    switch (greekName) {
      case 'delta': return delta;
      case 'gamma': return gamma;
      case 'theta': return theta;
      default: return delta;
    }
  }, [greekName, delta, gamma, theta]);

  const livePositionPnL = boundStrategyId
    ? (strategyPnLAtSpot[boundStrategyId] ?? totalPnL)
    : totalPnL;

  // Title: "SPX - Price Alert" or "SPX - 6700/6720/6740"
  const titleText = category === 'price'
    ? `${symbol} - Price Alert`
    : isGreeksForm
      ? `${symbol} - Greeks Alert (Δ Γ Θ)`
      : strikesLabel
        ? `${symbol} - ${strikesLabel}`
        : `${symbol} - ${category === 'position' ? 'Position' : 'Algo'} Alert`;

  // Stepper
  const step = isGreeksForm ? 0.5 : category === 'price' ? 1 : 10;
  const handleStep = useCallback((dir: 1 | -1) => {
    setTargetValue(prev => {
      const n = parseFloat(prev);
      if (isNaN(n)) return prev;
      const next = n + dir * step;
      // Keep a sensible precision for greeks
      return isGreeksForm ? (Math.round(next * 100) / 100).toString() : next.toString();
    });
  }, [step, isGreeksForm]);

  // ── Save ────────────────────────────────────────────────────
  const targetNum = parseFloat(targetValue);
  const positionTabLive = POSITION_SUB_TABS.find(t => t.key === positionSubTab)?.live ?? false;
  const canSave =
    category === 'price' || isGreeksForm
      ? !isNaN(targetNum)
      : category === 'position'
        ? positionTabLive && !isNaN(targetNum)
        : false; // Algo placeholders cannot save yet

  const handleSave = useCallback(() => {
    if (!canSave) return;

    let alertType: AlertType = 'price';
    let greek: GreekName | undefined;
    let label: string | undefined;

    if (category === 'price') {
      alertType = 'price';
    } else if (isGreeksForm) {
      alertType = 'greeks_threshold';
      greek = greekName;
      label = greekName;
    } else if (category === 'position') {
      // pnl + profit target both evaluate as profit_target dollars at spot
      alertType = 'profit_target';
    } else {
      return; // algo not live
    }

    onSave({
      id: editingAlert?.id,
      type: alertType,
      condition,
      targetValue: targetNum,
      color,
      behavior,
      goal: goal.trim() || undefined,
      thresholdScope: boundStrategyId ? 'single' : 'all',
      mode: 'observe',
      greekName: greek,
      label,
      strategyId: boundStrategyId || undefined,
      expiration: noExpiration ? undefined : expiration || undefined,
    });
    onClose();
  }, [
    canSave, category, isGreeksForm, greekName, condition, targetNum, color, behavior,
    goal, boundStrategyId, noExpiration, expiration, editingAlert, onSave, onClose,
  ]);

  if (!isOpen) return null;

  return (
    <div style={S.backdrop} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={dragHandleProps.ref}
        onMouseDown={dragHandleProps.onMouseDown}
        style={{ ...S.dialog, ...(containerStyle as any) }}
      >
        {/* Header */}
        <div style={S.header} className="alert-designer-header draggable-handle">
          <button style={S.closeDot} onClick={onClose} title="Close" />
          <span style={S.title}>{titleText}</span>
          <div style={{ width: 14 }} />
        </div>

        {/* Body */}
        <div style={S.body}>
          {/* Type: Price | Position | Greeks | Algo */}
          <div style={S.row}>
            <span style={S.label}>Type:</span>
            <div style={S.segmented}>
              {TYPE_CATEGORIES.map((tc, i) => (
                <button
                  key={tc.key}
                  type="button"
                  style={{
                    ...S.segBtn(category === tc.key),
                    ...(i === TYPE_CATEGORIES.length - 1 ? { borderRight: 'none' } : {}),
                    ...(tc.key === 'greeks' && category === 'greeks'
                      ? { background: 'rgba(96,165,250,0.28)', color: '#fff' }
                      : {}),
                  }}
                  onClick={() => {
                    setCategory(tc.key);
                    if (tc.key === 'greeks') {
                      setCondition(prev => (prev === 'at' ? 'above' : prev));
                      const seed = greekName === 'gamma' ? gamma
                        : greekName === 'theta' ? theta
                        : delta;
                      if (Number.isFinite(seed)) {
                        setTargetValue((Math.round(seed * 100) / 100).toString());
                      }
                    }
                  }}
                >
                  {tc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position dropdown — shown for Position and Algo categories */}
          {needsPosition && strategies.length > 0 && (
            <div style={S.row}>
              <span style={S.label}>Position:</span>
              <select
                style={S.select}
                value={boundStrategyId}
                onChange={e => setBoundStrategyId(e.target.value)}
              >
                {strategies.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.strikesLabel || s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── Position sub-tabs (includes Greeks) ── */}
          {category === 'position' && (
            <div style={{
              display: 'flex', gap: 2,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 8, padding: 2,
            }}>
              {POSITION_SUB_TABS.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setPositionSubTab(t.key);
                    if (t.key === 'greeks') {
                      // Leave Type as Position; show greek form via positionSubTab
                      setCondition(prev => (prev === 'at' ? 'above' : prev));
                      const seed = greekName === 'gamma' ? gamma
                        : greekName === 'theta' ? theta
                        : delta;
                      if (Number.isFinite(seed)) {
                        setTargetValue((Math.round(Number(seed) * 100) / 100).toString());
                      } else {
                        setTargetValue('');
                      }
                    }
                  }}
                  style={{
                    flex: 1, padding: '5px 2px', border: 'none', borderRadius: 6,
                    background: positionSubTab === t.key ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: positionSubTab === t.key ? '#f5f5f7' : '#636366',
                    fontSize: 11, fontWeight: 500, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Greeks form: Type→Greeks OR Position→Greeks ── */}
          {isGreeksForm && (
            <div
              data-testid="greeks-alert-form"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                padding: '14px 12px',
                marginTop: 4,
                background: 'rgba(96,165,250,0.12)',
                border: '1px solid rgba(96,165,250,0.45)',
                borderRadius: 10,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#93c5fd' }}>
                Select greek type
              </div>

              {/* Always-visible greek type control: native select (reliable) + buttons */}
              <div style={S.row}>
                <span style={{ ...S.label, color: '#f5f5f7' }}>Greek:</span>
                <select
                  style={{
                    ...S.select,
                    fontSize: 14,
                    fontWeight: 600,
                    minHeight: 36,
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(96,165,250,0.5)',
                  }}
                  value={greekName}
                  onChange={e => {
                    const g = e.target.value as GreekName;
                    setGreekName(g);
                    const live = g === 'gamma' ? gamma : g === 'theta' ? theta : delta;
                    if (Number.isFinite(live)) {
                      setTargetValue((Math.round(Number(live) * 100) / 100).toString());
                    }
                  }}
                  aria-label="Select greek type"
                >
                  <option value="delta">Delta (Δ)</option>
                  <option value="gamma">Gamma (Γ)</option>
                  <option value="theta">Theta (Θ $/day)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {GREEK_OPTIONS.map(g => {
                  const active = greekName === g.value;
                  const live = g.value === 'delta' ? delta : g.value === 'gamma' ? gamma : theta;
                  const liveN = Number(live);
                  return (
                    <button
                      key={g.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setGreekName(g.value);
                        if (Number.isFinite(liveN)) {
                          setTargetValue((Math.round(liveN * 100) / 100).toString());
                        }
                      }}
                      style={{
                        flex: 1,
                        minHeight: 52,
                        borderRadius: 8,
                        border: active ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.15)',
                        background: active ? 'rgba(96,165,250,0.28)' : 'rgba(0,0,0,0.25)',
                        color: '#f5f5f7',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {g.value === 'delta' ? 'Δ' : g.value === 'gamma' ? 'Γ' : 'Θ'}
                      {' '}
                      {g.value.charAt(0).toUpperCase() + g.value.slice(1)}
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#bfdbfe', marginTop: 2 }}>
                        now {Number.isFinite(liveN) ? liveN.toFixed(g.value === 'gamma' ? 3 : 2) : '—'}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={S.row}>
                <span style={S.label}>When:</span>
                <select
                  style={S.select}
                  value={condition === 'at' ? 'above' : condition}
                  onChange={e => setCondition(e.target.value as 'above' | 'below')}
                >
                  {GREEK_CONDITIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div style={S.row}>
                <span style={S.label}>Threshold:</span>
                <div style={S.valueWrap}>
                  <div style={S.stepper}>
                    <span style={{ lineHeight: 1, cursor: 'pointer' }} onClick={() => handleStep(1)}>▲</span>
                    <span style={{ lineHeight: 1, cursor: 'pointer' }} onClick={() => handleStep(-1)}>▼</span>
                  </div>
                  <input
                    type="number"
                    style={S.valueInput}
                    value={targetValue}
                    onChange={e => setTargetValue(e.target.value)}
                    placeholder={
                      Number.isFinite(Number(liveGreekValue))
                        ? Number(liveGreekValue).toFixed(greekName === 'gamma' ? 3 : 2)
                        : '0'
                    }
                    step={0.5}
                  />
                </div>
              </div>

              <div style={S.row}>
                <span style={S.label}>Trigger:</span>
                <select
                  style={S.select}
                  value={behavior}
                  onChange={e => setBehavior(e.target.value as AlertBehavior)}
                >
                  {TRIGGER_OPTIONS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Price / Position P&L / Profit Target forms (not when greeks form showing) ── */}
          {(category === 'price' || isLivePositionTab) && !isGreeksForm && (
            <>
              {(category === 'position' && (positionSubTab === 'pnl' || positionSubTab === 'profit')) && (
                <div style={S.row}>
                  <span style={S.label}>Now:</span>
                  <span style={{ flex: 1, fontSize: 13, color: '#98989d' }}>
                    Position P&L{' '}
                    <span style={{
                      color: livePositionPnL >= 0 ? '#4ade80' : '#f87171',
                      fontWeight: 600,
                    }}>
                      {livePositionPnL >= 0 ? '+' : ''}${livePositionPnL.toFixed(0)}
                    </span>
                  </span>
                </div>
              )}

              <div style={S.row}>
                <span style={S.label}>Condition:</span>
                <select
                  style={S.select}
                  value={condition}
                  onChange={e => setCondition(e.target.value as 'above' | 'below' | 'at')}
                >
                  {conditions.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div style={S.row}>
                <span style={S.label}>Value:</span>
                <div style={S.valueWrap}>
                  <div style={S.stepper}>
                    <span style={{ lineHeight: 1, cursor: 'pointer' }} onClick={() => handleStep(1)}>▲</span>
                    <span style={{ lineHeight: 1, cursor: 'pointer' }} onClick={() => handleStep(-1)}>▼</span>
                  </div>
                  <input
                    type="number"
                    style={S.valueInput}
                    value={targetValue}
                    onChange={e => setTargetValue(e.target.value)}
                    placeholder={category === 'price' ? spotPrice.toFixed(0) : '0'}
                    step={step}
                  />
                </div>
              </div>

              <div style={S.row}>
                <span style={S.label}>Trigger:</span>
                <select
                  style={S.select}
                  value={behavior}
                  onChange={e => setBehavior(e.target.value as AlertBehavior)}
                >
                  {TRIGGER_OPTIONS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* ── Position placeholders (not evaluable yet) ── */}
          {category === 'position' && positionSubTab === 'breakeven' && (
            <div style={S.row}>
              <span style={S.label}>Break-Even:</span>
              <div style={{ ...S.algoPlaceholder, minHeight: 60 }}>
                Coming soon — alert when price approaches structural break-even
              </div>
            </div>
          )}
          {category === 'position' && positionSubTab === 'trailing' && (
            <div style={S.row}>
              <span style={S.label}>Trail:</span>
              <div style={{ ...S.algoPlaceholder, minHeight: 60 }}>
                Coming soon — trailing stop that follows P&L high-water mark
              </div>
            </div>
          )}
          {category === 'position' && positionSubTab === 'zerodte' && (
            <div style={S.row}>
              <span style={S.label}>0DTE:</span>
              <div style={{ ...S.algoPlaceholder, minHeight: 60 }}>
                Coming soon — 0DTE gamma / time-decay strategy triggers
              </div>
            </div>
          )}

          {/* ── Algo: not evaluable yet ── */}
          {category === 'algo' && (
            <>
              <div style={S.row}>
                <span style={S.label}>Type:</span>
                <div style={{
                  flex: 1, display: 'flex', gap: 2,
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8, padding: 2,
                }}>
                  {([
                    { key: '0dte_entry' as const, label: '0DTE Entry' },
                    { key: 'profit_mgmt' as const, label: 'Profit Mgmt' },
                    { key: 'prompt' as const, label: 'Prompt' },
                  ]).map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setAlgoSubType(t.key)}
                      style={{
                        flex: 1, padding: '6px 4px', borderRadius: 6, border: 'none',
                        background: algoSubType === t.key ? 'rgba(255,255,255,0.12)' : 'transparent',
                        color: algoSubType === t.key ? '#f5f5f7' : '#636366',
                        fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        transition: 'background 0.15s, color 0.15s',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={S.row}>
                <span style={S.label}>Criteria:</span>
                <div style={S.algoPlaceholder}>
                  Coming soon — algorithmic / prompt-based alerts are not live yet.
                  Use Position → Greeks for delta/gamma/theta thresholds.
                </div>
              </div>
            </>
          )}

          {/* Expiration */}
          <div style={S.row}>
            <span style={S.label}>Expiration:</span>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="datetime-local"
                style={{ ...S.select, width: '100%', boxSizing: 'border-box' as const }}
                value={noExpiration ? '' : expiration}
                onChange={e => { setExpiration(e.target.value); setNoExpiration(false); }}
              />
            </div>
          </div>

          {/* Tags (color picker as tag chips) */}
          <div style={S.row}>
            <span style={S.label}>Tags:</span>
            <div style={S.tagsWrap}>
              {ALERT_COLORS.map(c => (
                <div
                  key={c}
                  style={{
                    ...S.tag(c),
                    outline: color === c ? '2px solid #fff' : 'none',
                    outlineOffset: 1,
                    opacity: color === c ? 1 : 0.7,
                  }}
                  onClick={() => setColor(c)}
                >
                  {TAG_NAMES[c] || 'tag'}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <button style={S.btnCancel} onClick={onClose}>Cancel</button>
          <button
            style={S.btnSave(!canSave)}
            onClick={handleSave}
            disabled={!canSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
