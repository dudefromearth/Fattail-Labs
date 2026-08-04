/**
 * Resilient SSE connection with exponential backoff and circuit breaker.
 *
 * Replaces raw `new EventSource()` in hooks to prevent OOM when the
 * SSE server is down. Native EventSource auto-reconnects with no
 * backoff — 6+ hooks reconnecting simultaneously every ~3s causes
 * unbounded memory churn in Firefox.
 *
 * Backoff: 1s → 2s → 4s → 8s → 16s → 30s (capped).
 * Resets to 1s on successful open.
 *
 * Circuit breaker: after MAX_RETRIES consecutive failures, stops
 * reconnecting entirely. Resumes on page visibility change (tab
 * focus) — the only reliable signal that the user is back and
 * services may have been restarted.
 *
 * Buffer flush: Firefox's EventSource keeps ALL received data in an
 * internal response body buffer that's never released while the
 * connection is alive. For high-frequency SSE (spot ticks, heatmap
 * diffs), this grows without bound. Periodic reconnect every
 * BUFFER_FLUSH_INTERVAL_MS releases the buffer.
 */

const BASE_DELAY = 1000;
const MAX_DELAY = 30000;
const BACKOFF_FACTOR = 2;
const MAX_RETRIES = 8; // ~2 min of attempts before circuit opens
const BUFFER_FLUSH_INTERVAL_MS = 5 * 60 * 1000; // 5 min — reconnect to release browser internal buffer


export interface SSEHandle {
  /** Close the connection and stop all reconnection attempts. */
  close: () => void;
}

/**
 * Create a managed SSE connection with exponential backoff + circuit breaker.
 *
 * @param url         SSE endpoint path (e.g., '/sse/spot')
 * @param listeners   Map of event name → handler (e.g., { spot: handler })
 * @param options     withCredentials (default true), onOpen/onClose callbacks
 */
export function sseConnect(
  url: string,
  listeners: Record<string, (evt: MessageEvent) => void>,
  options?: { withCredentials?: boolean; onOpen?: () => void; onClose?: () => void },
): SSEHandle {
  let delay = BASE_DELAY;
  let retries = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let sse: EventSource | null = null;
  let closed = false;
  let circuitOpen = false;

  // Track live EventSource count for MemoryMonitor diagnostics
  function updateCounter(delta: number) {
    (window as any).__msc_es_count = ((window as any).__msc_es_count ?? 0) + delta;
  }

  // Track when connection opens to suppress stale event bursts.
  // After reconnect (especially post-idle), the server may flush buffered
  // events. We suppress handler calls for RESUME_GRACE_MS after open,
  // allowing only the last event per type to fire (latest-wins).
  const RESUME_GRACE_MS = 300;
  let resumeUntil = 0;
  const pendingEvents: Record<string, MessageEvent[]> = {};
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    if (closed || circuitOpen) return;

    // Defensive: close any existing EventSource before opening a new one.
    // Prevents leaked connections if connect() is called while sse is active
    // (e.g., overlapping timer callbacks from error retry + buffer flush).
    if (sse) {
      sse.close();
      sse = null;
      updateCounter(-1);
    }

    sse = new EventSource(url, {
      withCredentials: options?.withCredentials ?? true,
    });
    updateCounter(1);

    sse.onopen = () => {
      delay = BASE_DELAY;
      retries = 0;
      circuitOpen = false;
      // Start grace period — batch events arriving in first 300ms
      resumeUntil = Date.now() + RESUME_GRACE_MS;
      options?.onOpen?.();
    };

    for (const [event, handler] of Object.entries(listeners)) {
      sse.addEventListener(event, (evt: Event) => {
        const msgEvt = evt as MessageEvent;
        // During grace period, buffer events and only deliver the latest
        if (Date.now() < resumeUntil) {
          if (!pendingEvents[event]) pendingEvents[event] = [];
          pendingEvents[event].push(msgEvt);
          if (!flushTimer) {
            flushTimer = setTimeout(() => {
              flushTimer = null;
              for (const [ev, msgs] of Object.entries(pendingEvents)) {
                if (listeners[ev]) {
                  for (const msg of msgs) listeners[ev](msg);
                }
                delete pendingEvents[ev];
              }
            }, RESUME_GRACE_MS);
          }
          return;
        }
        handler(msgEvt);
      });
    }

    sse.onerror = () => {
      if (closed) return;
      sse?.close();
      updateCounter(-1);
      sse = null;
      options?.onClose?.();

      retries++;
      if (retries >= MAX_RETRIES) {
        // Circuit breaker opens — stop all reconnection attempts
        circuitOpen = true;
        return;
      }

      // Clear any pending reconnect timer before scheduling a new one.
      // Prevents orphaned timers from overlapping with buffer flush timers.
      if (timer) clearTimeout(timer);
      timer = setTimeout(connect, delay);
      delay = Math.min(delay * BACKOFF_FACTOR, MAX_DELAY);
    };
  }

  // Resume on tab focus — services may have been restarted
  function onVisibilityChange() {
    if (closed) return;
    if (document.visibilityState === 'visible' && circuitOpen) {
      circuitOpen = false;
      delay = BASE_DELAY;
      retries = 0;
      connect();
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange);
  connect();

  // Periodic reconnect to flush Firefox's internal EventSource buffer.
  // Firefox keeps all received SSE data in memory for the lifetime of the
  // connection. For long-running sessions with high-frequency events
  // (spot ticks ~1/sec, heatmap diffs every few sec), this grows without
  // bound and eventually causes OOM. Closing and reopening the connection
  // releases the buffer.
  const bufferFlushTimer = setInterval(() => {
    if (closed || circuitOpen) return;
    if (sse) {
      sse.close();
      updateCounter(-1);
      sse = null;
      // Clear any pending reconnect timer before scheduling buffer-flush reconnect
      if (timer) clearTimeout(timer);
      // Small delay to let the server register disconnect before reconnect
      timer = setTimeout(connect, 500);
    }
  }, BUFFER_FLUSH_INTERVAL_MS);

  return {
    close() {
      closed = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(bufferFlushTimer);
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      if (sse) {
        sse.close();
        updateCounter(-1);
        sse = null;
      }
    },
  };
}
