"use client";

/**
 * Shared symbol for all Options Lab apps.
 * Persists in sessionStorage; URL ?symbol= wins on first paint when present.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchMarketUniverse,
  type MarketUniverseSymbol,
} from "@/lib/capitalApi";

const STORAGE_KEY = "options-lab-symbol";

type Ctx = {
  symbol: string;
  setSymbol: (s: string) => void;
  universe: MarketUniverseSymbol[];
  loading: boolean;
  error: string | null;
};

const OptionsLabCtx = createContext<Ctx | null>(null);

export function OptionsLabProvider({ children }: { children: ReactNode }) {
  const [symbol, setSymbolState] = useState("SPX");
  const [universe, setUniverse] = useState<MarketUniverseSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const u = await fetchMarketUniverse({ enabledOnly: true });
        if (cancelled) return;
        const syms = u.symbols || [];
        setUniverse(syms);

        let initial = "SPX";
        if (typeof window !== "undefined") {
          const q = new URLSearchParams(window.location.search).get("symbol");
          if (q) initial = q.trim().toUpperCase();
          else {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) initial = stored.trim().toUpperCase();
          }
        }
        if (syms.length) {
          const has = syms.some((s) => s.symbol === initial);
          setSymbolState(has ? initial : syms[0].symbol);
        } else {
          setSymbolState(initial);
        }
        setError(null);
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Could not load market universe",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setSymbol = useCallback((s: string) => {
    const next = s.trim().toUpperCase();
    setSymbolState(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("symbol", next);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const value = useMemo(
    () => ({ symbol, setSymbol, universe, loading, error }),
    [symbol, setSymbol, universe, loading, error],
  );

  return (
    <OptionsLabCtx.Provider value={value}>{children}</OptionsLabCtx.Provider>
  );
}

export function useOptionsLab(): Ctx {
  const ctx = useContext(OptionsLabCtx);
  if (!ctx) {
    throw new Error("useOptionsLab must be used within OptionsLabProvider");
  }
  return ctx;
}
