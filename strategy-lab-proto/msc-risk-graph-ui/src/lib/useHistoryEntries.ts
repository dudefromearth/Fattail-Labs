/**
 * useHistoryEntries — fetches CLOSED RegistryEntry records for a symbol.
 *
 * Used by History mode to display closed positions on the Price-Time chart.
 * Fetches GET /api/intents?status=CLOSED&symbol={symbol}
 * Refreshes once on mount (no auto-poll — history doesn't change frequently).
 */

import { useState, useEffect } from 'react';
import type { RegistryEntry } from '../types/position-intent';

interface IntentsResponse {
  entries: RegistryEntry[];
}

export function useHistoryEntries(
  symbol: string,
  enabled: boolean = true,
): {
  entries: RegistryEntry[];
  loading: boolean;
  error: string | null;
} {
  const [entries, setEntries] = useState<RegistryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setEntries([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchEntries = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/intent-registry?status=CLOSED`,
          { credentials: 'include' },
        );

        if (cancelled) return;

        if (!res.ok) {
          // Endpoint may not exist yet — fail silently with empty list
          setEntries([]);
          if (res.status !== 404) {
            setError(`History fetch failed: ${res.status}`);
          }
          return;
        }

        const data: IntentsResponse = await res.json();
        if (cancelled) return;

        if (!data.entries || !Array.isArray(data.entries)) {
          setEntries([]);
          return;
        }

        // Filter client-side to entries matching the requested symbol
        const filtered = data.entries.filter(
          (e) => e.intent?.symbol === symbol,
        );

        setEntries(filtered);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'History fetch failed');
          setEntries([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchEntries();

    return () => {
      cancelled = true;
    };
  }, [symbol, enabled]);

  return { entries, loading, error };
}
