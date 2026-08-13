/**
 * One WebSocket per tab for Market Bus topics (MB3 / MB4).
 * Apps register interest; this module owns the single connection.
 */

import type { ChainSub, MarketInbound } from "./types";

type Listener = (msg: MarketInbound) => void;

function wsUrl(): string {
  if (typeof window === "undefined") return "";
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/api/me/market/stream`;
}

export class MarketSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private chains = new Map<string, ChainSub>();
  /** Union of per-widget symbol interests (id → symbols). */
  private symbolInterest = new Map<string, Set<string>>();
  private wantSession = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  subscribe(fn: Listener): () => void {
    // Intentional close must not permanently kill the tab singleton —
    // next subscriber (client nav back to Options Lab, Strict remount)
    // has to be able to open again without a full page refresh.
    this.closed = false;
    this.listeners.add(fn);
    this.ensureOpen();
    return () => {
      this.listeners.delete(fn);
      if (
        this.listeners.size === 0 &&
        this.chains.size === 0 &&
        this.symbolInterest.size === 0
      ) {
        this.teardown();
      }
    };
  }

  setChainInterest(id: string, sub: ChainSub | null): void {
    if (sub) {
      this.closed = false;
      this.chains.set(id, sub);
    } else this.chains.delete(id);
    this.flushSubs();
  }

  /**
   * Register underlier symbols for this interest id (e.g. widget).
   * Pass empty / null to clear this id only — other widgets keep their sets.
   */
  setSymbolInterest(id: string, syms: string[] | null): void {
    if (!syms || !syms.length) {
      this.symbolInterest.delete(id);
    } else {
      this.closed = false;
      this.symbolInterest.set(
        id,
        new Set(syms.map((s) => s.trim().toUpperCase()).filter(Boolean)),
      );
    }
    this.flushSubs();
  }

  /** @deprecated Prefer setSymbolInterest(id, syms) for multi-widget tabs. */
  setSymbols(syms: string[]): void {
    this.setSymbolInterest("default", syms);
  }

  setSession(on: boolean): void {
    this.wantSession = on;
    this.flushSubs();
  }

  private allSymbols(): string[] {
    const u = new Set<string>();
    for (const set of this.symbolInterest.values()) {
      for (const s of set) u.add(s);
    }
    return [...u];
  }

  private emit(msg: MarketInbound): void {
    for (const fn of this.listeners) fn(msg);
  }

  /** Re-open if needed and re-send current interest (one-shot; not a poll). */
  poke(): void {
    this.closed = false;
    this.ensureOpen();
    this.flushSubs();
  }

  private ensureOpen(): void {
    if (this.closed) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const url = wsUrl();
    if (!url) return;
    const ws = new WebSocket(url);
    this.ws = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ op: "hello", v: 1 }));
      this.flushSubs();
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as MarketInbound;
        this.emit(msg);
      } catch {
        /* ignore */
      }
    };
    ws.onclose = () => {
      this.ws = null;
      if (!this.closed && this.listeners.size > 0) {
        this.reconnectTimer = setTimeout(() => this.ensureOpen(), 1500);
      }
    };
    ws.onerror = () => {
      /* onclose follows */
    };
  }

  private flushSubs(): void {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      this.ensureOpen();
      return;
    }
    const chains = [...this.chains.values()];
    const symbols = this.allSymbols();
    if (!chains.length && !symbols.length && !this.wantSession) return;
    ws.send(
      JSON.stringify({
        op: "sub",
        symbols,
        chains,
        session: this.wantSession || undefined,
      }),
    );
  }

  teardown(): void {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.listeners.clear();
    this.chains.clear();
    this.symbolInterest.clear();
  }
}

/** Tab singleton */
let _singleton: MarketSocket | null = null;

export function getMarketSocket(): MarketSocket {
  if (typeof window === "undefined") {
    return new MarketSocket();
  }
  if (!_singleton) _singleton = new MarketSocket();
  return _singleton;
}
