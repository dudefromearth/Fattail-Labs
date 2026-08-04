/**
 * GexSettings - Settings dialog for GEX indicator
 */

import { useState, useEffect } from 'react';

export interface GexConfig {
  enabled: boolean;
  mode: 'combined' | 'net';   // Put-Call separate or Net
  widthPercent: number;       // % of window (10-75)
  barHeight: number;          // Bar width in pixels (20-100)
  callColor: string;          // Color for calls (hex)
  putColor: string;           // Color for puts (hex)
  transparency: number;       // 0-100
  showATM: boolean;           // Highlight ATM strike
  atmColor: string;           // ATM highlight color
}

export const defaultGexConfig: GexConfig = {
  enabled: true,
  mode: 'combined',
  widthPercent: 100,     // Now always 100% of the side panel
  barHeight: 400,        // Bar width in pixels (20-400)
  callColor: '#22c55e',  // Green
  putColor: '#ef4444',   // Red
  transparency: 0,       // No longer used, kept for compatibility
  showATM: true,
  atmColor: '#fbbf24',   // Amber
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
          </div>
        </div>

        {/* Bar Thickness */}
        <div className="setting-row">
          <label>Bar Thickness</label>
          <div className="setting-control">
            <input
              type="range"
              min="100"
              max="500"
              value={localConfig.barHeight}
              onChange={(e) => handleChange('barHeight', parseInt(e.target.value))}
            />
            <span className="setting-value">{localConfig.barHeight}px</span>
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
