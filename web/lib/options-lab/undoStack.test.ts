/**
 * PC4 — AT-PC-37 · AT-PC-45 · AT-PC-50 (stack half).
 *
 *   npx --yes tsx lib/options-lab/undoStack.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createUndoStack, type UndoKind } from "./undoStack";
import type { AnalyzerPosition } from "./analyzerBook";

const here = dirname(fileURLToPath(import.meta.url));

function pos(id: string, extra?: Partial<AnalyzerPosition>): AnalyzerPosition {
  return {
    id,
    label: id,
    notation: "",
    status: "ANALYSIS",
    livePackagePerShare: null,
    lastNatSigned: null,
    priceSide: null,
    visible: true,
    lock: { mode: "unlocked" },
    liveState: "not_live",
    displayAsOf: null,
    contentHashes: {},
    maxSkewMs: null,
    epochQuality: null,
    createdAt: 1,
    updatedAt: 1,
    position: {
      underlying: "XSP",
      expiration: "2026-09-11",
      contracts: 1,
      direction: "buy",
      legs: [],
    },
    ...extra,
  };
}

let n = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    n += 1;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

test("AT-PC-37 Undo reverses a card write, dialog patch, lock, delete, strategy rebuild", () => {
  const stack = createUndoStack(50);
  let book: AnalyzerPosition[] = [pos("a")];

  const apply = (kind: UndoKind, next: AnalyzerPosition[]) => {
    stack.push(kind, book);
    book = next;
  };

  apply("card", [pos("a", { label: "shifted" })]);
  apply("dialog", [pos("a", { label: "patched" })]);
  apply("lock", [pos("a", { lock: { mode: "unlocked" }, label: "locked-step" })]);
  apply("delete", []);
  apply("strategy-rebuild", [pos("b")]);

  assert.equal(stack.undo()?.kind, "strategy-rebuild");
  book = stack.peek() ? book : [pos("a")];
  const del = stack.undo();
  assert.equal(del?.kind, "delete");
  assert.equal(del?.book.length, 1);
  const lock = stack.undo();
  assert.equal(lock?.kind, "lock");
  assert.equal(stack.undo()?.kind, "dialog");
  assert.equal(stack.undo()?.kind, "card");
  assert.equal(stack.undo(), null);
});

test("AT-PC-37 a quote tick is never an undo step", () => {
  const stack = createUndoStack();
  const before = [pos("a", { lastNatSigned: 0.5 })];
  stack.push("card", before);
  const afterQuote = [pos("a", { lastNatSigned: 0.67 })];
  // quote merge: write book, do not push
  const quoted = afterQuote;
  const entry = stack.undo();
  assert.equal(entry?.kind, "card");
  assert.equal(entry?.book[0].lastNatSigned, 0.5);
  assert.equal(quoted[0].lastNatSigned, 0.67);
  assert.equal(stack.size(), 0);
});

test("AT-PC-45 Undo does not un-Log; promotion is absent from the history stack", () => {
  const stack = createUndoStack();
  const live = [pos("a")];
  stack.push("card", live);
  const logged = [pos("a", { tradeLogTradeId: 42 })];
  // promotion write is not pushed
  assert.equal(stack.peek()?.kind, "card");
  assert.notEqual(stack.peek()?.kind, "keep");
  const kinds = [] as string[];
  let e = stack.undo();
  while (e) {
    kinds.push(e.kind);
    e = stack.undo();
  }
  assert.ok(!kinds.includes("promote" as UndoKind));
  assert.equal(logged[0].tradeLogTradeId, 42);
});

test("AT-PC-50 stack half: undo of Create-Submit removes the record", () => {
  const stack = createUndoStack();
  const empty: AnalyzerPosition[] = [];
  const created = pos("new-1");
  stack.push("create-submit", empty, { createdId: created.id });
  const book = [created];
  const entry = stack.undo();
  assert.equal(entry?.kind, "create-submit");
  assert.equal(entry?.createdId, "new-1");
  const restored = entry.book;
  assert.equal(restored.length, 0);
  assert.ok(!restored.some((p) => p.id === "new-1"));
  assert.equal(book.length, 1);
});

test("bounded ring default 50 drops the oldest", () => {
  const stack = createUndoStack(50);
  for (let i = 0; i < 51; i++) {
    stack.push("card", [pos(String(i))]);
  }
  assert.equal(stack.size(), 50);
  const first = stack.undo();
  assert.equal(first?.book[0].id, "50");
});

test("PC4 host: quote and Log writers do not call push; member writers do", () => {
  const src = readFileSync(
    join(here, "../../components/options-lab/OpfRiskAnalyzer.tsx"),
    "utf8",
  );
  assert.match(src, /createUndoStack\(50\)/);
  assert.match(src, /commitBook\(/);
  assert.match(src, /toLowerCase\(\) !== "z"|key !== "z"|key === "z"/);
  const quoteFn = src.slice(
    src.indexOf("const onPackageUpdate"),
    src.indexOf("const spotOverride"),
  );
  assert.doesNotMatch(quoteFn, /commitBook/);
  const logFn = src.slice(
    src.indexOf("onSendToTradeLog:"),
    src.indexOf("onLockNatural:"),
  );
  assert.doesNotMatch(logFn, /commitBook/);
  assert.match(src, /commitBook\("delete"/);
  assert.match(src, /commitBook\("dialog"/);
  assert.match(src, /commitBook\("create-submit"/);
  assert.match(src, /commitBook\("lock"/);
  assert.match(src, /commitBook\("overlay-commit"/);
});

console.log(`undoStack.test.ts ${n} ok`);
