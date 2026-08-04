/**
 * RiskGraphBackdropSettings - Local display settings for VP + GEX in Risk Graph
 *
 * These settings only affect the Risk Graph backdrop appearance.
 * They are persisted to localStorage via useIndicatorSettings, NOT to the backend.
 * The standalone Dealer Gravity panel has its own separate settings dialog.
 */

import type { GexConfig } from './chart-primitives/GexSettings';
import type { VolumeProfileConfig, RowsLayoutMode } from './chart-primitives/VolumeProfileSettings';

interface RiskGraphBackdropSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  vpConfig: VolumeProfileConfig;
  gexConfig: GexConfig;
  onVpChange: (config: VolumeProfileConfig) => void;
  onGexChange: (config: GexConfig) => void;
  onSaveDefault: () => void;
  onResetToFactory: () => void;
}

export default function RiskGraphBackdropSettings({
  isOpen,
  onClose,
  vpConfig,
  gexConfig,
  onVpChange,
  onGexChange,
  onSaveDefault,
  onResetToFactory,
}: RiskGraphBackdropSettingsProps) {
  if (!isOpen) return null;

  const handleVP = <K extends keyof VolumeProfileConfig>(key: K, value: VolumeProfileConfig[K]) => {
    onVpChange({ ...vpConfig, [key]: value });
  };

  const handleGex = <K extends keyof GexConfig>(key: K, value: GexConfig[K]) => {
    onGexChange({ ...gexConfig, [key]: value });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content dg-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Risk Graph Backdrop Settings</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Volume Profile Section */}
          <section className="settings-section">
            <h3>Volume Profile</h3>

            <div className="setting-row">
              <label>Mode</label>
              <select
                value={vpConfig.mode}
                onChange={(e) => handleVP('mode', e.target.value as 'raw' | 'tv')}
              >
                <option value="tv">TV (Smoothed)</option>
                <option value="raw">Raw</option>
              </select>
            </div>

            <div className="setting-row">
              <label>Rows Layout</label>
              <select
                value={vpConfig.rowsLayout}
                onChange={(e) => handleVP('rowsLayout', e.target.value as RowsLayoutMode)}
              >
                <option value="number_of_rows">Number of Rows</option>
                <option value="ticks_per_row">Ticks per Row</option>
              </select>
            </div>

            <div className="setting-row">
              <label>
                Row Size
                <span className="setting-hint-inline">
                  {vpConfig.rowsLayout === 'ticks_per_row' ? '(ticks)' : '(rows)'}
                </span>
              </label>
              <input
                type="number"
                min={vpConfig.rowsLayout === 'ticks_per_row' ? 1 : 10}
                max={vpConfig.rowsLayout === 'ticks_per_row' ? 100 : 2000}
                value={vpConfig.rowSize}
                onChange={(e) => handleVP('rowSize', parseInt(e.target.value) || 24)}
                className="setting-number-input"
              />
            </div>

            <div className="setting-row">
              <label>Color</label>
              <input
                type="color"
                value={vpConfig.color}
                onChange={(e) => handleVP('color', e.target.value)}
              />
            </div>

            <div className="setting-row">
              <label>Width: {vpConfig.widthPercent}%</label>
              <input
                type="range"
                min="5"
                max="100"
                value={vpConfig.widthPercent}
                onChange={(e) => handleVP('widthPercent', parseInt(e.target.value))}
              />
            </div>

            <div className="setting-row">
              <label>Transparency: {vpConfig.transparency}%</label>
              <input
                type="range"
                min="0"
                max="80"
                value={vpConfig.transparency}
                onChange={(e) => handleVP('transparency', parseInt(e.target.value))}
              />
            </div>

            <div className="setting-row">
              <label>Outlier Cap: {vpConfig.cappingSigma}&sigma;</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.25"
                value={vpConfig.cappingSigma}
                onChange={(e) => handleVP('cappingSigma', parseFloat(e.target.value))}
              />
            </div>
          </section>

          {/* GEX Section */}
          <section className="settings-section">
            <h3>GEX Panel</h3>

            <div className="setting-row">
              <label>Mode</label>
              <select
                value={gexConfig.mode}
                onChange={(e) => handleGex('mode', e.target.value as 'combined' | 'net')}
              >
                <option value="combined">Combined</option>
                <option value="net">Net</option>
              </select>
            </div>

            <div className="setting-row">
              <label>Calls Color</label>
              <input
                type="color"
                value={gexConfig.callColor}
                onChange={(e) => handleGex('callColor', e.target.value)}
              />
            </div>

            <div className="setting-row">
              <label>Puts Color</label>
              <input
                type="color"
                value={gexConfig.putColor}
                onChange={(e) => handleGex('putColor', e.target.value)}
              />
            </div>

            <div className="setting-row">
              <label>Bar Thickness: {gexConfig.barHeight}px</label>
              <input
                type="range"
                min="100"
                max="500"
                value={gexConfig.barHeight}
                onChange={(e) => handleGex('barHeight', parseInt(e.target.value))}
              />
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={() => onResetToFactory()}
          >
            Reset
          </button>
          <button
            className="btn-secondary"
            onClick={() => { onSaveDefault(); }}
          >
            Set Default
          </button>
          <button
            className="btn-primary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>

      <style>{`
        .dg-settings-modal {
          max-width: 480px;
          width: 90%;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }
        .dg-settings-modal .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #333;
        }
        .dg-settings-modal .modal-header h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }
        .dg-settings-modal .modal-close {
          background: none;
          border: none;
          color: #888;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .dg-settings-modal .modal-close:hover { color: #fff; }
        .dg-settings-modal .modal-body {
          padding: 20px;
          max-height: 60vh;
          overflow-y: auto;
        }
        .dg-settings-modal .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid #333;
        }
        .dg-settings-modal .btn-primary {
          background: #3b82f6;
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }
        .dg-settings-modal .btn-primary:hover { background: #2563eb; }
        .dg-settings-modal .btn-secondary {
          background: #333;
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }
        .dg-settings-modal .btn-secondary:hover { background: #444; }
        .settings-section { margin-bottom: 24px; }
        .settings-section h3 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #fff);
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-color, #333);
        }
        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 12px;
        }
        .setting-row label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary, #aaa);
          font-size: 13px;
        }
        .setting-row input[type="range"] { flex: 1; max-width: 150px; }
        .setting-row input[type="color"] {
          width: 32px;
          height: 24px;
          padding: 0;
          border: 1px solid var(--border-color, #333);
          border-radius: 4px;
          cursor: pointer;
        }
        .setting-row select {
          background: var(--input-bg, #1a1a1a);
          color: var(--text-primary, #fff);
          border: 1px solid var(--border-color, #333);
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 13px;
        }
        .setting-hint-inline {
          font-size: 11px;
          color: var(--text-muted, #666);
          margin-left: 4px;
        }
        .setting-number-input {
          width: 70px;
          background: var(--input-bg, #1a1a1a);
          color: var(--text-primary, #fff);
          border: 1px solid var(--border-color, #333);
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 13px;
          text-align: center;
        }
        .setting-number-input::-webkit-inner-spin-button,
        .setting-number-input::-webkit-outer-spin-button { opacity: 1; }

        /* Light theme */
        [data-theme="light"] .dg-settings-modal {
          background: #ffffff;
          border-color: #d1d1d6;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }
        [data-theme="light"] .dg-settings-modal .modal-header { border-bottom-color: #e5e5ea; }
        [data-theme="light"] .dg-settings-modal .modal-header h2 { color: #1d1d1f; }
        [data-theme="light"] .dg-settings-modal .modal-close { color: #86868b; }
        [data-theme="light"] .dg-settings-modal .modal-close:hover { color: #1d1d1f; }
        [data-theme="light"] .dg-settings-modal .modal-footer { border-top-color: #e5e5ea; }
        [data-theme="light"] .dg-settings-modal .btn-primary { background: #007aff; }
        [data-theme="light"] .dg-settings-modal .btn-primary:hover { background: #0069d9; }
        [data-theme="light"] .dg-settings-modal .btn-secondary { background: #e5e5ea; color: #1d1d1f; }
        [data-theme="light"] .dg-settings-modal .btn-secondary:hover { background: #d1d1d6; }
        [data-theme="light"] .settings-section h3 { color: #1d1d1f; border-bottom-color: #e5e5ea; }
        [data-theme="light"] .setting-row label { color: #3c3c43; }
        [data-theme="light"] .setting-row input[type="color"] { border-color: #d1d1d6; }
        [data-theme="light"] .setting-row select {
          background: #f5f5f7; color: #1d1d1f; border-color: #d1d1d6;
        }
        [data-theme="light"] .setting-hint-inline { color: #86868b; }
        [data-theme="light"] .setting-number-input {
          background: #f5f5f7; color: #1d1d1f; border-color: #d1d1d6;
        }
      `}</style>
    </div>
  );
}
