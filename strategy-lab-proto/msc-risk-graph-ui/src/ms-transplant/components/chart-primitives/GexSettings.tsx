/**
 * GexSettings - Settings dialog for GEX indicator
 */

import { useState, useEffect } from 'react';

export interface GexConfig {
  enabled: boolean;
  mode: 'combined' | 'net' | 'abs';  // Put-Call separate, Net, or Absolute (|calls|+|puts|)
  widthPercent: number;             // % of window (10-75)
  barHeight: number;                // DEPRECATED — kept for localStorage backward compat
  heightPercent: number;            // Max bar height as % of chart (5-50), replaces barHeight
  callColor: string;                // Color for calls (hex)
  putColor: string;                 // Color for puts (hex)
  transparency: number;             // 0-100
  showATM: boolean;                 // Highlight ATM strike
  atmColor: string;                 // ATM highlight color
  // ZGR rendering constants (sourced from config instead of hardcoded)
  zgrDotMinRadius: number;          // Dot radius when spot is far from crossing (px)
  zgrDotMaxRadius: number;          // Dot radius when spot is at the crossing (px)
  zgrLineBaseAlpha: number;         // ZGR vertical line baseline opacity
  zgrLineProximityBoost: number;    // Additional line opacity at max spot proximity
  zgrDotBaseOpacity: number;        // ZGR dot baseline opacity
  zgfzExponentMin: number;          // ZGR gradient power-curve exponent minimum
  zgfzExponentRange: number;        // ZGR gradient power-curve exponent range
  zgrMinAbsNet: number;             // Min |calls+puts| to render a ZGR bar (epsilon filter)
}

export const defaultGexConfig: GexConfig = {
  enabled: true,
  mode: 'combined',
  widthPercent: 100,
  barHeight: 400,             // DEPRECATED — kept for localStorage backward compat
  heightPercent: 40,          // Max bar height as % of chart
  callColor: '#22c55e',       // Green
  putColor: '#ef4444',        // Red
  transparency: 0,            // No longer used, kept for compatibility
  showATM: true,
  atmColor: '#fbbf24',        // Amber
  zgrDotMinRadius: 3,
  zgrDotMaxRadius: 12,
  zgrLineBaseAlpha: 0.15,
  zgrLineProximityBoost: 0.35,
  zgrDotBaseOpacity: 0.3,
  zgfzExponentMin: 0.15,
  zgfzExponentRange: 7.85,
  zgrMinAbsNet: 0,
};

interface Props {
  config: GexConfig;
  onConfigChange: (config: GexConfig) => void;
  onSaveDefault: () => void;
  onResetToFactory: () => void;
  onClose: () => void;
}

export default function GexSettings({ config, onConfigChange, onSaveDefault, onResetToFactory, onClose }: Props) {
  const [localConfig, setLocalConfig] = useState<GexConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleChange = <K extends keyof GexConfig>(key: K, value: GexConfig[K]) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onConfigChange(newConfig); // Live preview
  };

  return (
    <div className="indicator-settings-dialog">
      <div className="indicator-settings-header">
        <h4>GEX Settings</h4>
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

        {/* Mode Toggle */}
        <div className="setting-row">
          <label>Display Mode</label>
          <div className="setting-control mode-toggle">
            <button
              className={`mode-btn ${localConfig.mode === 'combined' ? 'active' : ''}`}
              onClick={() => handleChange('mode', 'combined')}
            >
              Put/Call
            </button>
            <button
              className={`mode-btn ${localConfig.mode === 'net' ? 'active' : ''}`}
              onClick={() => handleChange('mode', 'net')}
            >
              Net
            </button>
            <button
              className={`mode-btn ${localConfig.mode === 'abs' ? 'active' : ''}`}
              onClick={() => handleChange('mode', 'abs')}
            >
              Abs
            </button>
          </div>
        </div>

        {/* Bar Height */}
        <div className="setting-row">
          <label>Bar Height</label>
          <div className="setting-control">
            <input
              type="range"
              min="5"
              max="50"
              value={localConfig.heightPercent}
              onChange={(e) => handleChange('heightPercent', parseInt(e.target.value))}
            />
            <span className="setting-value">{localConfig.heightPercent}%</span>
          </div>
        </div>

        {/* ZGR Min Net (epsilon filter) */}
        <div className="setting-row">
          <label>ZGR Min Net</label>
          <div className="setting-control">
            <input
              type="number"
              min="0"
              step="1000000"
              value={localConfig.zgrMinAbsNet}
              onChange={(e) => handleChange('zgrMinAbsNet', parseFloat(e.target.value) || 0)}
              style={{ width: '90px' }}
            />
          </div>
        </div>

        {/* Call Color */}
        <div className="setting-row">
          <label>Call Color</label>
          <div className="setting-control color-control">
            <input
              type="color"
              value={localConfig.callColor}
              onChange={(e) => handleChange('callColor', e.target.value)}
            />
            <div className="color-preview" style={{ backgroundColor: localConfig.callColor }} />
          </div>
        </div>

        {/* Put Color */}
        <div className="setting-row">
          <label>Put Color</label>
          <div className="setting-control color-control">
            <input
              type="color"
              value={localConfig.putColor}
              onChange={(e) => handleChange('putColor', e.target.value)}
            />
            <div className="color-preview" style={{ backgroundColor: localConfig.putColor }} />
          </div>
        </div>

        {/* Show ATM */}
        <div className="setting-row">
          <label>
            <input
              type="checkbox"
              checked={localConfig.showATM}
              onChange={(e) => handleChange('showATM', e.target.checked)}
            />
            <span>Highlight ATM Strike</span>
          </label>
        </div>

        {/* ATM Color */}
        {localConfig.showATM && (
          <div className="setting-row">
            <label>ATM Color</label>
            <div className="setting-control color-control">
              <input
                type="color"
                value={localConfig.atmColor}
                onChange={(e) => handleChange('atmColor', e.target.value)}
              />
            </div>
          </div>
        )}
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
