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
  private symbols = new Set<string>();
  private wantSession = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    this.ensureOpen();
    return () => {
      this.listeners.delete(fn);
      if (this.listeners.size === 0 && this.chains.size === 0 && this.symbols.size === 0) {
        this.teardown();
      }
    };
  }

  setChainInterest(id: string, sub: ChainSub | null): void {
    if (sub) this.chains.set(id, sub);
    else this.chains.delete(id);
    this.flushSubs();
  }

  setSymbols(syms: string[]): void {
    this.symbols = new Set(syms.map((s) => s.toUpperCase()));
    this.flushSubs();
  }

  setSession(on: boolean): void {
    this.wantSession = on;
    this.flushSubs();
  }

  private emit(msg: MarketInbound): void {
    for (const fn of this.listeners) fn(msg);
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
    const symbols = [...this.symbols];
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
    this.symbols.clear();
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
