/**
 * SSE Bus — Single shared EventSource connection to /sse/all.
 *
 * The 3-gateway consolidation design:
 *   3001 SSE Gateway  — ONE persistent connection for all streams
 *   3002 App API      — request/response (no persistent connection)
 *   3003 Vexy Gateway — request/response (no persistent connection)
 *
 * Before this bus, each hook opened its own EventSource (/sse/spot,
 * /sse/heatmap/I:SPX, /sse/all, /api/brokerage/events, etc.).
 * Under HTTP/1.1 (Vite dev server), browsers limit concurrent
 * connections to 6 per origin. 5-7 permanent SSE connections
 * exhausted all slots, blocking API calls → queue buildup → OOM.
 *
 * This bus opens ONE connection. Hooks subscribe by event type.
 * Uses sseConnect for backoff + circuit breaker.
 */

import { sseConnect, type SSEHandle } from './sseConnect';

type EventHandler = (evt: MessageEvent) => void;

interface Subscription {
  event: string;
  handler: EventHandler;
}

let handle: SSEHandle | null = null;
let subscriptions: Subscription[] = [];
let openCallbacks: Array<() => void> = [];
let closeCallbacks: Array<() => void> = [];

// Cache the last event for snapshot-style events so late subscribers don't miss
// the initial queue sent by the SSE gateway on connect.
const CACHED_EVENTS = new Set(['heatmap', 'spot', 'market_mode', 'bias_lfi', 'gex', 'eco_cal', 'trade_selector']);
const lastEvents = new Map<string, MessageEvent>();

// Multi-symbol events must be cached per-symbol (e.g. 'heatmap:I:SPX', 'heatmap:I:NDX')
// so that SPX and NDX snapshots don't overwrite each other in lastEvents.
const MULTI_SYMBOL_EVENTS = new Set(['heatmap', 'gex']);
const lastSymbolEvents = new Map<string, MessageEvent>();

/** Diagnostic: current subscriber count for memory profiling. */
export function getSubscriptionCount(): number {
  return subscriptions.length;
}

/** Diagnostic: whether the shared SSE connection is active. */
export function isConnected(): boolean {
  return handle !== null;
}

// All known event types that flow through /sse/all
const ALL_EVENTS = [
  'spot', 'gex', 'heatmap', 'heatmap_diff', 'candles',
  'trade_selector', 'vexy', 'bias_lfi', 'market_mode',
  'eco_cal', 'intent:lifecycle', 'connected',
  // Brokerage events forwarded via /sse/all
  'message',
  'brokerage:account',
  'brokerage:order',
  // User-scoped events
  'alerts', 'risk_graph', 'trade_log', 'positions', 'logs',
  'vexy_interaction_result', 'vexy_interaction_error', 'vexy_interaction_stage',
];

function dispatch(event: string) {
  return (evt: MessageEvent) => {
    if (CACHED_EVENTS.has(event)) {
      if (MULTI_SYMBOL_EVENTS.has(event)) {
        // Cache per-symbol so SPX and NDX snapshots don't overwrite each other
        try {
          const data = JSON.parse(evt.data);
          if (data?.symbol) {
            lastSymbolEvents.set(`${event}:${data.symbol}`, evt);
          } else {
            lastEvents.set(event, evt);
          }
        } catch {
          lastEvents.set(event, evt);
        }
      } else {
        lastEvents.set(event, evt);
      }
    }
    for (const sub of subscriptions) {
      if (sub.event === event) {
        sub.handler(evt);
      }
    }
  };
}

function ensureConnection() {
  if (handle) return;

  const listeners: Record<string, EventHandler> = {};
  for (const event of ALL_EVENTS) {
    listeners[event] = dispatch(event);
  }

  handle = sseConnect('/sse/all', listeners, {
    onOpen: () => {
      for (const cb of openCallbacks) cb();
    },
    onClose: () => {
      for (const cb of closeCallbacks) cb();
    },
  });
}

function maybeDisconnect() {
  if (subscriptions.length === 0 && handle) {
    handle.close();
    handle = null;
  }
}

/** Force-close the SSE connection (e.g. heatmap inactivity). */
export function disconnect(): void {
  if (handle) {
    handle.close();
    handle = null;
    lastEvents.clear();
    lastSymbolEvents.clear();
    for (const cb of closeCallbacks) cb();
  }
}

/** Reopen the SSE connection if not already connected. */
export function reconnect(): void {
  ensureConnection();
}

/**
 * Subscribe to one or more event types on the shared SSE connection.
 * Returns an unsubscribe function (call in useEffect cleanup).
 *
 * Usage:
 *   useEffect(() => {
 *     return sseBus.subscribe({ spot: handleSpot });
 *   }, [handleSpot]);
 */
export function subscribe(
  events: Record<string, EventHandler>,
  options?: { onOpen?: () => void; onClose?: () => void },
): () => void {
  const added: Subscription[] = [];

  for (const [event, handler] of Object.entries(events)) {
    const sub = { event, handler };
    subscriptions.push(sub);
    added.push(sub);
  }

  if (options?.onOpen) openCallbacks.push(options.onOpen);
  if (options?.onClose) closeCallbacks.push(options.onClose);

  ensureConnection();

  // Replay last known snapshot to late subscribers so they don't miss
  // the initial queue sent by the SSE gateway at connection time.
  for (const [event, handler] of Object.entries(events)) {
    if (MULTI_SYMBOL_EVENTS.has(event)) {
      // Replay all per-symbol entries — handler filters by symbol internally
      for (const [key, cached] of lastSymbolEvents) {
        if (key.startsWith(`${event}:`)) {
          try { handler(cached); } catch { /* ignore */ }
        }
      }
    } else {
      const cached = lastEvents.get(event);
      if (cached) {
        try { handler(cached); } catch { /* ignore */ }
      }
    }
  }

  return () => {
    for (const sub of added) {
      const idx = subscriptions.indexOf(sub);
      if (idx >= 0) subscriptions.splice(idx, 1);
    }
    if (options?.onOpen) {
      const idx = openCallbacks.indexOf(options.onOpen);
      if (idx >= 0) openCallbacks.splice(idx, 1);
    }
    if (options?.onClose) {
      const idx = closeCallbacks.indexOf(options.onClose);
      if (idx >= 0) closeCallbacks.splice(idx, 1);
    }
    maybeDisconnect();
  };
}

// ── HMR cleanup ──────────────────────────────────────────────────
// Vite HMR re-evaluates module scope but old EventSource listeners
// still reference the old dispatch() closures. On dispose, tear down
// the connection and clear all arrays so the fresh module starts clean.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (handle) {
      handle.close();
      handle = null;
    }
    subscriptions = [];
    openCallbacks = [];
    closeCallbacks = [];
    lastEvents.clear();
    lastSymbolEvents.clear();
  });
}
