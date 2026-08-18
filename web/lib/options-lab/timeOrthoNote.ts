import { chartWindow } from "./timeOrthoSession";

export type SessionNoteInput = {
  symbol: string;
  phase: string;
  positions: Array<{ label: string; notation: string }>;
  lastMid: number | null;
  bookPnl: number | null;
  bookState: string | null;
};

export function localSessionNote(input: SessionNoteInput, nowMs = Date.now()): string {
  const win = chartWindow(nowMs);
  const tape = win.prefillsPriorDay
    ? "Overnight — yesterday’s tape is up, pre-market through post-market."
    : "Trading day — pre-market on the left, cash open just past the controls, post-market on the right.";
  const names = input.positions
    .map((s) => s.label || s.notation)
    .filter(Boolean)
    .slice(0, 4);
  const book =
    names.length === 0
      ? "No visible position on this symbol yet. Add or change one in Analyzer; the book stays yours."
      : `On the book: ${names.join(" · ")}. Hide, show, or add a position any time. This view lasts only while a position is on the list.`;
  const mid =
    input.lastMid != null && Number.isFinite(input.lastMid)
      ? ` Live mid ${input.lastMid}.`
      : "";
  const pnl =
    input.bookPnl != null && Number.isFinite(input.bookPnl)
      ? ` Current book mark ${input.bookPnl >= 0 ? "+" : ""}${input.bookPnl.toFixed(2)} (a mark, not a forecast).`
      : "";
  const state = input.bookState ? ` State: ${input.bookState}.` : "";
  return `${tape}${mid}${pnl}${state} ${book}`.replace(/\s+/g, " ").trim();
}
