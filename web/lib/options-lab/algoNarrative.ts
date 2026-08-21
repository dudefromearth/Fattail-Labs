/**
 * AZ-ALGO §9 local deterministic sentences. No LLM (OD-LLM).
 */

export type AlgoNarrativeInput = {
  phase: "waiting" | "armed" | "recorded";
  side: "near" | "far";
  symbol: string;
  fPct: number | null;
  xS: number | null;
  gexOn: boolean;
  vpOn: boolean;
  decayFast: boolean;
};

export function algoNarrativeLines(input: AlgoNarrativeInput): string[] {
  const lines: string[] = [];
  if (input.phase === "waiting") {
    lines.push(
      `${input.symbol} trail is waiting for unrealized gain to reach the entry fraction of debit.`,
    );
  } else if (input.phase === "armed") {
    const f =
      input.fPct != null && Number.isFinite(input.fPct)
        ? `${Math.round(input.fPct)}%`
        : "—";
    if (input.side === "far") {
      const xs =
        input.xS != null && Number.isFinite(input.xS)
          ? String(Math.round(input.xS * 100) / 100)
          : "—";
      lines.push(
        `Spot is through the body; the trail now sits on the far wing at ${xs}.`,
      );
      lines.push(
        "The move has outrun the structure; both sides of the tent are now give-back.",
      );
    } else {
      lines.push(`Trail is armed · ${f} of high-water.`);
      lines.push(
        input.decayFast
          ? "Session is spending the premium; the trail is coming in."
          : "Time is still cheap; the trail hasn’t pinched.",
      );
    }
  } else {
    lines.push(
      `Trail recorded an exit on the ${input.side} side. The position was not closed.`,
    );
  }
  if (input.gexOn) {
    lines.push("GEX map is on — structure voice follows the overlay.");
  }
  if (input.vpOn) {
    lines.push("Volume profile is engaged — levels join the tape.");
  }
  return lines;
}
