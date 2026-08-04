/* What-If Controls — sliders for time, spot, volatility + preset buttons + scenario list.
   Each change triggers debounced compute. Max 4 scenarios. */

import { useCallback } from 'react';
import { GlassCard } from '../GlassCard';
import { CapsuleButton } from '../CapsuleButton';
import type { ScenarioConfig, RiskGraphConfig } from '../../types/risk-graph';

const CURVE_COLORS = ['#3B82F6', '#EC4899', '#22C55E', '#F59E0B'];

interface WhatIfControlsProps {
  config: RiskGraphConfig;
  scenarios: ScenarioConfig[];
  baseSpot: number;
  baseVol: number;
  baseDTE: number;
  onUpdateConfig: (updates: Partial<RiskGraphConfig>) => void;
  onAddScenario: (scenario: ScenarioConfig) => void;
  onRemoveScenario: (index: number) => void;
  onDebouncedCompute: (pos?: undefined, cfg?: RiskGraphConfig, scen?: ScenarioConfig[]) => void;
}

export function WhatIfControls({
  config,
  scenarios,
  baseSpot,
  baseVol,
  baseDTE,
  onUpdateConfig,
  onAddScenario,
  onRemoveScenario,
  onDebouncedCompute,
}: WhatIfControlsProps) {

  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const hours = parseFloat(e.target.value);
    const newDTE = Math.max(0, baseDTE - hours / 24);
    const updates = { timeToExpiryDays: newDTE };
    onUpdateConfig(updates);
    onDebouncedCompute(undefined, { ...config, ...updates });
  }, [baseDTE, config, onUpdateConfig, onDebouncedCompute]);

  const handleSpotChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = parseFloat(e.target.value) / 100;
    const newSpot = baseSpot * (1 + pct);
    const updates = { spotPrice: newSpot };
    onUpdateConfig(updates);
    onDebouncedCompute(undefined, { ...config, ...updates });
  }, [baseSpot, config, onUpdateConfig, onDebouncedCompute]);

  const handleVolChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = parseFloat(e.target.value) / 100;
    const newVol = baseVol * (1 + pct);
    const updates = { volatility: Math.max(0.01, newVol) };
    onUpdateConfig(updates);
    onDebouncedCompute(undefined, { ...config, ...updates });
  }, [baseVol, config, onUpdateConfig, onDebouncedCompute]);

  // Presets
  const presets = [
    { label: '2h Later', fn: () => onAddScenario({ label: '2h Later', time_to_expiry_days: Math.max(0, baseDTE - 2/24) }) },
    { label: 'At Expiry', fn: () => onAddScenario({ label: 'At Expiry', time_to_expiry_days: 0 }) },
    { label: '+1% Move', fn: () => onAddScenario({ label: '+1% Move', spot_price: baseSpot * 1.01 }) },
    { label: '-1% Move', fn: () => onAddScenario({ label: '-1% Move', spot_price: baseSpot * 0.99 }) },
    { label: 'Vol Crush', fn: () => onAddScenario({ label: 'Vol Crush (-30%)', volatility: baseVol * 0.70 }) },
    { label: 'Vol Spike', fn: () => onAddScenario({ label: 'Vol Spike (+50%)', volatility: baseVol * 1.50 }) },
  ];

  const timeHoursElapsed = Math.max(0, (baseDTE - config.timeToExpiryDays) * 24);
  const spotPctChange = ((config.spotPrice / baseSpot) - 1) * 100;
  const volPctChange = ((config.volatility / baseVol) - 1) * 100;

  return (
    <div className="whatif-controls">
      <GlassCard>
        <div className="wif-section">
          <div className="wif-title">What-If Sliders</div>

          <div className="wif-slider-row">
            <span className="wif-slider-label">Time</span>
            <input
              type="range"
              className="wif-slider"
              min={0}
              max={baseDTE * 24}
              step={1}
              value={timeHoursElapsed}
              onChange={handleTimeChange}
            />
            <span className="wif-slider-value">{timeHoursElapsed.toFixed(0)}h</span>
          </div>

          <div className="wif-slider-row">
            <span className="wif-slider-label">Spot</span>
            <input
              type="range"
              className="wif-slider"
              min={-20}
              max={20}
              step={0.1}
              value={spotPctChange}
              onChange={handleSpotChange}
            />
            <span className="wif-slider-value">{spotPctChange >= 0 ? '+' : ''}{spotPctChange.toFixed(1)}%</span>
          </div>

          <div className="wif-slider-row">
            <span className="wif-slider-label">Vol</span>
            <input
              type="range"
              className="wif-slider"
              min={-50}
              max={50}
              step={1}
              value={volPctChange}
              onChange={handleVolChange}
            />
            <span className="wif-slider-value">{volPctChange >= 0 ? '+' : ''}{volPctChange.toFixed(0)}%</span>
          </div>
        </div>
      </GlassCard>

      {/* Presets */}
      <div className="wif-presets">
        {presets.map(p => (
          <CapsuleButton
            key={p.label}
            label={p.label}
            onClick={p.fn}
            compact
            disabled={scenarios.length >= 4}
          />
        ))}
      </div>

      {/* Scenario List */}
      {scenarios.length > 0 && (
        <GlassCard>
          <div className="wif-section">
            <div className="wif-title">Scenarios ({scenarios.length}/4)</div>
            {scenarios.map((s, i) => (
              <div key={i} className="wif-scenario-row">
                <span
                  className="wif-scenario-swatch"
                  style={{ backgroundColor: CURVE_COLORS[i] || '#888' }}
                />
                <span className="wif-scenario-label">{s.label}</span>
                <button
                  className="wif-scenario-remove"
                  onClick={() => onRemoveScenario(i)}
                  aria-label={`Remove ${s.label}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
