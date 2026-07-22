"use client";

// In-place edit engine for the course hub page (mirrors course EditContext
// pattern: dirty fields + FAQ list ops + save/revalidate).

import { fetchMe } from "@/lib/useIsAdmin";
import { putJSON, revalidate as revalidatePages } from "@/lib/client";
import type { HubFaqItem, HubPage } from "@/lib/hub";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Dirty = Record<string, string>;

export type FaqDraft = {
  /** Server id, or negative temp id for new rows */
  id: number;
  sort_order: number;
  question: string;
  answer_md: string;
  _new?: boolean;
};

type HubEditState = {
  isAdmin: boolean;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  dirty: Dirty;
  setField: (key: string, value: string) => void;
  value: (key: string, fallback: string) => string;
  faqs: FaqDraft[];
  setFaqField: (
    id: number,
    field: "question" | "answer_md",
    value: string,
  ) => void;
  addFaq: () => void;
  removeFaq: (id: number) => void;
  moveFaq: (id: number, dir: -1 | 1) => void;
  saving: boolean;
  error: string | null;
  save: () => Promise<void>;
  discard: () => void;
};

const Ctx = createContext<HubEditState | null>(null);

export function useHubEdit(): HubEditState | null {
  return useContext(Ctx);
}

let tempId = -1;

function toDrafts(items: HubFaqItem[]): FaqDraft[] {
  return items
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    .map((f) => ({
      id: f.id,
      sort_order: f.sort_order,
      question: f.question,
      answer_md: f.answer_md,
    }));
}

export function HubEditProvider({
  initial,
  children,
}: {
  initial: HubPage;
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditModeState] = useState(false);
  const editKey = "labs-edit-mode:hub";

  useEffect(() => {
    if (sessionStorage.getItem(editKey) === "1") setEditModeState(true);
  }, []);

  const setEditMode = useCallback((v: boolean) => {
    setEditModeState(v);
    if (v) sessionStorage.setItem(editKey, "1");
    else sessionStorage.removeItem(editKey);
  }, []);

  const [baseline, setBaseline] = useState(initial);
  const [dirty, setDirty] = useState<Dirty>({});
  const [faqs, setFaqs] = useState<FaqDraft[]>(() => toDrafts(initial.faq_items));
  const [faqDirty, setFaqDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMe().then((me) => {
      if (!cancelled && me?.role === "administrator") setIsAdmin(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setField = useCallback((key: string, value: string) => {
    setDirty((d) => ({ ...d, [key]: value }));
  }, []);

  const value = useCallback(
    (key: string, fallback: string) => {
      if (key in dirty) return dirty[key];
      const base = baseline as unknown as Record<string, string | null>;
      return base[key] ?? fallback;
    },
    [dirty, baseline],
  );

  const setFaqField = useCallback(
    (id: number, field: "question" | "answer_md", val: string) => {
      setFaqs((list) =>
        list.map((f) => (f.id === id ? { ...f, [field]: val } : f)),
      );
      setFaqDirty(true);
    },
    [],
  );

  const addFaq = useCallback(() => {
    const id = tempId--;
    setFaqs((list) => [
      ...list,
      {
        id,
        sort_order: list.length,
        question: "New question",
        answer_md: "",
        _new: true,
      },
    ]);
    setFaqDirty(true);
  }, []);

  const removeFaq = useCallback((id: number) => {
    setFaqs((list) =>
      list
        .filter((f) => f.id !== id)
        .map((f, i) => ({ ...f, sort_order: i })),
    );
    setFaqDirty(true);
  }, []);

  const moveFaq = useCallback((id: number, dir: -1 | 1) => {
    setFaqs((list) => {
      const idx = list.findIndex((f) => f.id === id);
      if (idx < 0) return list;
      const j = idx + dir;
      if (j < 0 || j >= list.length) return list;
      const next = list.slice();
      [next[idx], next[j]] = [next[j], next[idx]];
      return next.map((f, i) => ({ ...f, sort_order: i }));
    });
    setFaqDirty(true);
  }, []);

  const discard = useCallback(() => {
    setDirty({});
    setFaqs(toDrafts(baseline.faq_items));
    setFaqDirty(false);
    setError(null);
  }, [baseline]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    const body: Record<string, unknown> = { ...dirty };
    if (faqDirty || Object.keys(dirty).length > 0) {
      body.faq_items = faqs.map((f, i) => ({
        ...(f._new || f.id < 0 ? {} : { id: f.id }),
        sort_order: i,
        question: f.question,
        answer_md: f.answer_md,
      }));
    }
    const res = await putJSON("/api/admin/hub", body);
    if (!res.ok) {
      const t = await res.text();
      setSaving(false);
      setError(t || `Save failed (${res.status})`);
      return;
    }
    const updated = (await res.json()) as HubPage;
    setBaseline(updated);
    setDirty({});
    setFaqs(toDrafts(updated.faq_items));
    setFaqDirty(false);
    await revalidatePages(["/"]);
    setSaving(false);
    // Soft reload so static shell matches saved content.
    window.location.reload();
  }, [dirty, faqDirty, faqs]);

  return (
    <Ctx.Provider
      value={{
        isAdmin,
        editMode,
        setEditMode,
        dirty: {
          ...dirty,
          ...(faqDirty ? { _faqs: "1" } : {}),
        },
        setField,
        value,
        faqs,
        setFaqField,
        addFaq,
        removeFaq,
        moveFaq,
        saving,
        error,
        save,
        discard,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
