/**
 * useHoldTimeAnalytics — computes hold time statistics from RegistryEntry[].
 *
 * Works from available data only — no backend call needed.
 * "Hold time" is estimated from entry.intent.dte (days to expiration at entry).
 * Used by StatsBar and Vexy _planning_canvas hold_time_summary.
 */

import { useMemo } from 'react';
import type { RegistryEntry } from '../types/position-intent';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HoldTimeStats {
  totalPositions: number;       // all entries regardless of status
  analysisCount: number;        // status === 'ANALYSIS'
  pendingCount: number;         // status === 'PENDING'
  openCount: number;            // status === 'OPEN'
  closedCount: number;          // status === 'CLOSED'
  cancelledCount: number;       // status === 'CANCELLED'
  rejectedCount: number;        // status === 'REJECTED'
  avgDteAtEntry: number;        // avg intent.dte across all entries with dte > 0
  minDte: number;               // min intent.dte
  maxDte: number;               // max intent.dte
  topologies: string[];         // unique topologies present (e.g. ['vertical', 'butterfly'])
  directions: string[];         // unique directions (e.g. ['long', 'short'])
  // Simple win/loss proxy — count by direction
  longCount: number;
  shortCount: number;
}

// ---------------------------------------------------------------------------
// Pure computation (no React — safe to call outside components)
// ---------------------------------------------------------------------------

export function computeHoldTimeStats(entries: RegistryEntry[]): HoldTimeStats {
  if (entries.length === 0) {
    return {
      totalPositions: 0,
      analysisCount: 0,
      pendingCount: 0,
      openCount: 0,
      closedCount: 0,
      cancelledCount: 0,
      rejectedCount: 0,
      avgDteAtEntry: 0,
      minDte: 0,
      maxDte: 0,
      topologies: [],
      directions: [],
      longCount: 0,
      shortCount: 0,
    };
  }

  let analysisCount = 0;
  let pendingCount = 0;
  let openCount = 0;
  let closedCount = 0;
  let cancelledCount = 0;
  let rejectedCount = 0;
  let longCount = 0;
  let shortCount = 0;

  const dteValues: number[] = [];
  const topologySet = new Set<string>();
  const directionSet = new Set<string>();

  for (const entry of entries) {
    // Status counts
    switch (entry.status) {
      case 'ANALYSIS':     analysisCount++;   break;
      case 'PENDING':      pendingCount++;    break;
      case 'OPEN':
      case 'PARTIAL_OPEN': openCount++;       break;
      case 'CLOSED':       closedCount++;     break;
      case 'CANCELLED':    cancelledCount++;  break;
      case 'REJECTED':     rejectedCount++;   break;
    }

    // Direction counts
    if (entry.intent.direction === 'long') {
      longCount++;
    } else if (entry.intent.direction === 'short') {
      shortCount++;
    }

    // DTE collection
    const dte = entry.intent.dte;
    if (dte > 0) {
      dteValues.push(dte);
    }

    // Topology dedup
    const topology = entry.intent.topology;
    if (topology && topology.trim() !== '') {
      topologySet.add(topology);
    }

    // Direction dedup
    const direction = entry.intent.direction;
    if (direction && direction.trim() !== '') {
      directionSet.add(direction);
    }
  }

  const avgDteAtEntry = dteValues.length > 0
    ? Math.round(dteValues.reduce((a, b) => a + b, 0) / dteValues.length)
    : 0;

  const minDte = dteValues.length > 0 ? Math.min(...dteValues) : 0;
  const maxDte = dteValues.length > 0 ? Math.max(...dteValues) : 0;

  return {
    totalPositions: entries.length,
    analysisCount,
    pendingCount,
    openCount,
    closedCount,
    cancelledCount,
    rejectedCount,
    avgDteAtEntry,
    minDte,
    maxDte,
    topologies: Array.from(topologySet),
    directions: Array.from(directionSet),
    longCount,
    shortCount,
  };
}

// ---------------------------------------------------------------------------
// Hook — useMemo wrapper over computeHoldTimeStats
// ---------------------------------------------------------------------------

export function useHoldTimeAnalytics(entries: RegistryEntry[]): HoldTimeStats {
  return useMemo(() => computeHoldTimeStats(entries), [entries]);
}
