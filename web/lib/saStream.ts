/** Consume contract v1.3 SSE via the Labs relay. */

export type StreamHandlers = {
  onHello?: (d: Record<string, unknown>) => void;
  onHeartbeat?: (d: Record<string, unknown>) => void;
  onTick?: (d: { p: number; t?: number; source?: string }) => void;
  onBar?: (d: {
    t: number;
    o: number;
    h: number;
    l: number;
    c: number;
    v?: number;
  }) => void;
  onGen?: (d: { profile_generation_id?: string; kind?: string }) => void;
  onError?: () => void;
};

function parseBlock(block: string): { event: string; data: string } | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (!dataLines.length) return null;
  return { event, data: dataLines.join("\n") };
}

export function openVpStream(
  url: string,
  handlers: StreamHandlers,
): () => void {
  const ac = new AbortController();
  void (async () => {
    try {
      const res = await fetch(url, {
        credentials: "same-origin",
        signal: ac.signal,
        headers: { Accept: "text/event-stream" },
      });
      if (!res.ok || !res.body) {
        handlers.onError?.();
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const block of parts) {
          const parsed = parseBlock(block);
          if (!parsed) continue;
          let data: Record<string, unknown> = {};
          try {
            data = JSON.parse(parsed.data) as Record<string, unknown>;
          } catch {
            continue;
          }
          if (parsed.event === "hello") handlers.onHello?.(data);
          else if (parsed.event === "heartbeat" || parsed.event === "hb")
            handlers.onHeartbeat?.(data);
          else if (parsed.event === "tick")
            handlers.onTick?.(data as { p: number; t?: number; source?: string });
          else if (parsed.event === "bar")
            handlers.onBar?.(
              data as {
                t: number;
                o: number;
                h: number;
                l: number;
                c: number;
                v?: number;
              },
            );
          else if (parsed.event === "gen")
            handlers.onGen?.(
              data as { profile_generation_id?: string; kind?: string },
            );
        }
      }
    } catch (e) {
      if ((e as { name?: string }).name !== "AbortError") handlers.onError?.();
    }
  })();
  return () => ac.abort();
}
