/**
 * VolumeProfileSettings - Settings dialog for Volume Profile indicator
 */

import { useState, useEffect } from 'react';

export type VolumeProfileMode = 'raw' | 'tv';
export type RowsLayoutMode = 'number_of_rows' | 'ticks_per_row';

export interface VolumeProfileConfig {
  enabled: boolean;
  mode: VolumeProfileMode;   // 'raw' (VWAP) or 'tv' (TradingView distributed)
  widthPercent: number;      // % of chart width for profile scaling (0-100)
  rowsLayout: RowsLayoutMode; // 'number_of_rows' or 'ticks_per_row'
  rowSize: number;           // Number of rows (if number_of_rows) or ticks per row (if ticks_per_row)
  cappingSigma: number;      // Outlier capping threshold in sigma (1-5)
  color: string;             // Base color (hex)
  transparency: number;      // 0-100
}

export const defaultVolumeProfileConfig: VolumeProfileConfig = {
  enabled: true,
  mode: 'raw',
  widthPercent: 90,
  rowsLayout: 'number_of_rows',
  rowSize: 1000,
  cappingSigma: 4,
  color: '#3b82f6',          // Blue
  transparency: 25,
};

// Convert sigma to percentile for capping (two-tailed)
// 1σ = 68.27%, 2σ = 95.45%, 3σ = 99.73%, 5σ = 99.9999%
export function sigmaToPercentile(sigma: number): number {
  // erf(sigma / sqrt(2)) gives two-tailed probability
  const x = sigma / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429;
  const erf = 1 - (a1*t + a2*t*t + a3*t*t*t + a4*t*t*t*t + a5*t*t*t*t*t) * Math.exp(-x*x);
  return erf; // Two-tailed: 1σ=68.27%, 2σ=95.45%, 3σ=99.73%
}

interface Props {
  config: VolumeProfileConfig;
  onConfigChange: (config: VolumeProfileConfig) => void;
  onSaveDefault: () => void;
  onResetToFactory: () => void;
  onClose: () => void;
}

export default function VolumeProfileSettings({ config, onConfigChange, onSaveDefault, onResetToFactory, onClose }: Props) {
  const [localConfig, setLocalConfig] = useState<VolumeProfileConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleChange = <K extends keyof VolumeProfileConfig>(key: K, value: VolumeProfileConfig[K]) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange(newConfig); // Live preview
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const previewColor = hexToRgba(localConfig.color, (100 - localConfig.transparency) / 100);

  return (
    <div className="indicator-settings-dialog">
      <div className="indicator-settings-header">
        <h4>Volume Profile Settings</h4>
        <button className="indicator-settings-close" onClick={onClose}>&times;</button>
      </div>

      <div className="indicator-settings-body">
        {/* Enable/Disable */}
        <div className="setting-row">
          <label>
            <input
              type="checkbox"
              checked={localConfig.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
            />
            <span>Enabled</span>
          </label>
        </div>

        {/* Mode Selector */}
        <div className="setting-row">
          <label>Data Mode</label>
          <div className="setting-control mode-toggle">
            <button
              className={`mode-btn ${localConfig.mode === 'raw' ? 'active' : ''}`}
              onClick={() => handleChange('mode', 'raw')}
              title="RAW: Volume at VWAP price (spiky, discrete levels)"
            >
              RAW
            </button>
            <button
              className={`mode-btn ${localConfig.mode === 'tv' ? 'active' : ''}`}
              onClick={() => handleChange('mode', 'tv')}
              title="TV: Volume distributed across bar range (smooth, TradingView style)"
            >
              TV
            </button>
          </div>
        </div>

        {/* Width Percent - Profile Scaling */}
        <div className="setting-row">
          <label>Profile Width</label>
          <div className="setting-control">
            <input
              type="range"
              min="5"
              max="100"
              value={localConfig.widthPercent}
              onChange={(e) => handleChange('widthPercent', parseInt(e.target.value))}
            />
            <span className="setting-value">{localConfig.widthPercent}%</span>
          </div>
        </div>

        {/* Rows Layout */}
        <div className="setting-row">
          <label>Rows Layout</label>
          <div className="setting-control mode-toggle">
            <button
              className={`mode-btn ${localConfig.rowsLayout === 'number_of_rows' ? 'active' : ''}`}
              onClick={() => handleChange('rowsLayout', 'number_of_rows')}
              title="Fixed number of rows across visible price range"
            >
              # of Rows
            </button>
            <button
              className={`mode-btn ${localConfig.rowsLayout === 'ticks_per_row' ? 'active' : ''}`}
              onClick={() => handleChange('rowsLayout', 'ticks_per_row')}
              title="Fixed number of price ticks per row"
            >
              Ticks/Row
            </button>
          </div>
        </div>

        {/* Row Size */}
        <div className="setting-row">
          <label>Row Size</label>
          <div className="setting-control row-size-control">
            <input
              type="number"
              min={localConfig.rowsLayout === 'ticks_per_row' ? 1 : 1}
              max={localConfig.rowsLayout === 'ticks_per_row' ? 100 : 2000}
              value={localConfig.rowSize}
              onChange={(e) => handleChange('rowSize', parseInt(e.target.value) || 24)}
              className="row-size-input"
            />
            <span className="setting-hint">
              {localConfig.rowsLayout === 'ticks_per_row' ? 'ticks' : 'rows'}
            </span>
          </div>
        </div>

        {/* Outlier Capping */}
        <div className="setting-row">
          <label>Outlier Cap</label>
          <div className="setting-control">
            <input
              type="range"
              min="1"
              max="3"
              step="0.25"
              value={localConfig.cappingSigma}
              onChange={(e) => handleChange('cappingSigma', parseFloat(e.target.value))}
            />
            <span className="setting-value">{localConfig.cappingSigma}σ</span>
          </div>
        </div>

        {/* Color */}
        <div className="setting-row">
          <label>Color</label>
          <div className="setting-control color-control">
            <input
              type="color"
              value={localConfig.color}
              onChange={(e) => handleChange('color', e.target.value)}
            />
            <div className="color-preview" style={{ backgroundColor: previewColor }} />
          </div>
        </div>

        {/* Transparency */}
        <div className="setting-row">
          <label>Transparency</label>
          <div className="setting-control">
            <input
              type="range"
              min="0"
              max="80"
              value={localConfig.transparency}
              onChange={(e) => handleChange('transparency', parseInt(e.target.value))}
            />
            <span className="setting-value">{localConfig.transparency}%</span>
          </div>
        </div>
      </div>

      <div className="indicator-settings-footer">
        <button
          className="settings-btn reset"
          onClick={() => {
            onResetToFactory();
          }}
          title="Reset to factory defaults"
        >
          Reset
        </button>
        <button
          className="settings-btn save"
          onClick={() => {
            onSaveDefault();
            onClose();
          }}
          title="Save current settings as default"
        >
          Set Default
        </button>
      </div>
    </div>
  );
}
