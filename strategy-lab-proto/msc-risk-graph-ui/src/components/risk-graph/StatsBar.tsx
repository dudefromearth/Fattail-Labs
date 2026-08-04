/**
 * StatsBar — compact analytics bar shown below Price-Time chart.
 * Shows key hold-time and position statistics at a glance.
 */

import type { HoldTimeStats } from '../../lib/useHoldTimeAnalytics';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StatsBarProps {
  stats: HoldTimeStats;
  visible: boolean;  // only render when visible
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StatsBar({ stats, visible }: StatsBarProps) {
  if (!visible) return null;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: '32px',
    paddingLeft: '8px',
    paddingRight: '8px',
    background: 'var(--bg-content)',
    flexShrink: 0,
    overflow: 'hidden',
  };

  const textStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const divider = ' · ';

  if (stats.totalPositions === 0) {
    return (
      <div style={containerStyle}>
        <span style={textStyle}>No positions tracked</span>
      </div>
    );
  }

  const parts: string[] = [
    `${stats.totalPositions} position${stats.totalPositions !== 1 ? 's' : ''}`,
  ];

  if (stats.avgDteAtEntry > 0) {
    parts.push(`Avg DTE: ${stats.avgDteAtEntry}`);
  }

  if (stats.analysisCount > 0) {
    parts.push(`Analysis: ${stats.analysisCount}`);
  }

  if (stats.openCount > 0) {
    parts.push(`Open: ${stats.openCount}`);
  }

  if (stats.closedCount > 0) {
    parts.push(`Closed: ${stats.closedCount}`);
  }

  for (const topology of stats.topologies) {
    parts.push(topology);
  }

  for (const direction of stats.directions) {
    parts.push(direction);
  }

  return (
    <div style={containerStyle}>
      <span style={textStyle}>{parts.join(divider)}</span>
    </div>
  );
}
