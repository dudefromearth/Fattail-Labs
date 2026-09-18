/** Live tab bind: payload session_date wins. Clock is a probe, never the label. */

export type DevelopingProbe = {
  session_date?: string | null;
  status?: string | null;
  named_state?: string | null;
  bin_count?: number;
};

export type LiveBind = {
  kind: "developing" | "session";
  sessionDate: string | null;
  label: string;
  reason: "developing" | "closed" | "no-coverage";
};

export function monthDay(iso: string): string {
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  return `${parts[1]}-${parts[2]}`;
}

export function resolveLiveBind(opts: {
  tradingDate: string;
  ceilingSession: string | null | undefined;
  developing: DevelopingProbe;
}): LiveBind {
  const named = opts.developing.named_state || "";
  const status = opts.developing.status || "";
  const date = opts.developing.session_date || null;
  const closedNamed =
    named === "UNAVAILABLE" ||
    named === "NO COVERAGE" ||
    status === "UNAVAILABLE";
  const hasBins =
    typeof opts.developing.bin_count === "number"
      ? opts.developing.bin_count > 0
      : Boolean(date) && !closedNamed;

  if (closedNamed || !date || !hasBins) {
    if (opts.ceilingSession) {
      return {
        kind: "session",
        sessionDate: opts.ceilingSession,
        label: `Session — ${monthDay(opts.ceilingSession)} (closed)`,
        reason: "closed",
      };
    }
    return {
      kind: "session",
      sessionDate: null,
      label: "No coverage",
      reason: "no-coverage",
    };
  }

  if (date !== opts.tradingDate || status.toLowerCase().includes("closed")) {
    return {
      kind: "session",
      sessionDate: date,
      label: `Session — ${monthDay(date)} (closed)`,
      reason: "closed",
    };
  }

  return {
    kind: "developing",
    sessionDate: date,
    label: `Developing — ${monthDay(date)}`,
    reason: "developing",
  };
}
