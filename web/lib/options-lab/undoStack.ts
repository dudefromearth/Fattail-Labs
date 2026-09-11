/**
 * Analyzer book undo (PC-UNDO-1…7). Session-only. Never persisted.
 */

import type { AnalyzerPosition } from "./analyzerBook";

export type UndoKind =
  | "card"
  | "dialog"
  | "overlay-commit"
  | "lock"
  | "unlock"
  | "delete"
  | "create-submit"
  | "strategy-rebuild"
  | "repair"
  | "pos-scale"
  | "keep";

export type UndoEntry = {
  kind: UndoKind;
  book: AnalyzerPosition[];
  createdId?: string;
};

export const UNDO_LIMIT_DEFAULT = 50;

export function cloneBook(
  book: readonly AnalyzerPosition[],
): AnalyzerPosition[] {
  return structuredClone(book) as AnalyzerPosition[];
}

export function createUndoStack(limit = UNDO_LIMIT_DEFAULT) {
  const entries: UndoEntry[] = [];
  return {
    push(
      kind: UndoKind,
      book: readonly AnalyzerPosition[],
      extra?: { createdId?: string },
    ): void {
      entries.push({
        kind,
        book: cloneBook(book),
        createdId: extra?.createdId,
      });
      while (entries.length > limit) entries.shift();
    },
    /** Pop the last member write. Null if empty. */
    undo(): UndoEntry | null {
      return entries.pop() ?? null;
    },
    peek(): UndoEntry | null {
      return entries.length ? entries[entries.length - 1] : null;
    },
    size(): number {
      return entries.length;
    },
    clear(): void {
      entries.length = 0;
    },
  };
}

export type UndoStack = ReturnType<typeof createUndoStack>;
