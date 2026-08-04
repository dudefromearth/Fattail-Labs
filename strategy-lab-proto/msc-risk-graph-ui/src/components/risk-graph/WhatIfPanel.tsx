/* What-If / Simulation Panel — bottom-right surface.
   Live/What-If/Reset toggles, Time/Spot/Vol sliders, Regime/Model selectors.
   All non-functional initially. */

import { useState } from 'react';

type PanelMode = 'live' | 'whatif';

export function WhatIfPanel() {
  const [mode, setMode] = useState<PanelMode>('live');

  return (
    <div className="rg-whatif-panel">
      <div className="rg-whatif-header">
        <div className="rg-whatif-toggles">
          <button
            className={`rg-whatif-toggle${mode === 'live' ? ' rg-whatif-toggle--active' : ''}`}
            onClick={() => setMode('live')}
          >
            Live
          </button>
          <button
            className={`rg-whatif-toggle${mode === 'whatif' ? ' rg-whatif-toggle--active' : ''}`}
            onClick={() => setMode('whatif')}
          >
            What-If
          </button>
        </div>
        <button className="rg-header-btn" disabled>Reset</button>
      </div>

      <div className="rg-whatif-sliders">
        <label className="rg-whatif-slider-row">
          <span className="rg-whatif-slider-label">Time</span>
          <input type="range" min="0" max="100" defaultValue="0" disabled={mode === 'live'} />
        </label>
        <label className="rg-whatif-slider-row">
          <span className="rg-whatif-slider-label">Spot</span>
          <input type="range" min="-20" max="20" defaultValue="0" disabled={mode === 'live'} />
        </label>
        <label className="rg-whatif-slider-row">
          <span className="rg-whatif-slider-label">Volatility</span>
          <input type="range" min="-50" max="50" defaultValue="0" disabled={mode === 'live'} />
        </label>
      </div>

      <div className="rg-whatif-selectors">
        <label className="rg-whatif-selector">
          <span className="rg-whatif-slider-label">Regime</span>
          <select className="rg-whatif-select" disabled>
            <option>Default</option>
          </select>
        </label>
        <label className="rg-whatif-selector">
          <span className="rg-whatif-slider-label">Model</span>
          <select className="rg-whatif-select" disabled>
            <option>Black-Scholes</option>
          </select>
        </label>
      </div>
    </div>
  );
}
