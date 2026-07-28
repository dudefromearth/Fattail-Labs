"use client";

// Hub in-place edit engine — same model as course EditContext:
// each field (or FAQ structure op) commits independently. Never
// batch title/video/FAQ into one "Save the whole page" request.

import { fetchMe } from "@/lib/useIsAdmin";
import { putJSON } from "@/lib/client";
import { parseYoutubeVideoId, type HubFaqItem, type HubPage } from "@/lib/hub";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
  /** Local-only while typing mid-field. Prefer commitField on blur. */
  setField: (key: string, value: string) => void;
  /**
   * Commit one page field immediately (title, video, description, …).
   * Does NOT touch FAQs. Returns false on network/validation failure.
   */
  commitField: (key: string, value: string) => Promise<boolean>;
  value: (key: string, fallback: string) => string;
  faqs: FaqDraft[];
  /** Local FAQ field edit — call commitFaqs on blur / Done. */
  setFaqField: (
    id: number,
    field: "question" | "answer_md",
    value: string,
  ) => void;
  /** Persist the current FAQ list only (structure + question/answer text). */
  commitFaqs: () => Promise<boolean>;
  addFaq: () => void;
  removeFaq: (id: number) => void;
  moveFaq: (id: number, dir: -1 | 1) => void;
  saving: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  clearFieldError: (key: string) => void;
  lastSavedAt: string | null;
  /** Pending local edits (fields + optional FAQ flag). Status only — no bulk save. */
  dirty: Dirty;
  discard: () => void;
};

const Ctx = createContext<HubEditState | null>(null);

export function useHubEdit(): HubEditState | null {
  return useContext(Ctx);
}

let tempId = -1;

const PAGE_FIELDS = new Set([
  "title",
  "description_md",
  "intro_video_id",
  "intro_video_title",
  "faq_title",
  "faq_description_md",
]);

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

function normalizeField(key: string, value: string): {
  ok: true;
  value: string;
} | { ok: false; error: string } {
  if (key === "intro_video_id") {
    const raw = value.trim();
    if (!raw) return { ok: true, value: "" };
    const id = parseYoutubeVideoId(raw);
    if (!id) {
      return {
        ok: false,
        error:
          "Intro video must be a YouTube video ID or watch/share URL.",
      };
    }
    return { ok: true, value: id };
  }
  return { ok: true, value };
}

async function fetchLiveHub(): Promise<HubPage | null> {
  try {
    const r = await fetch("/api/hub", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!r.ok) return null;
    return (await r.json()) as HubPage;
  } catch {
    return null;
  }
}

async function revalidateHub(): Promise<void> {
  for (const path of ["/", "/hub"]) {
    await fetch("/api/revalidate", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, tag: "hub" }),
    }).catch(() => null);
  }
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
  const [faqs, setFaqs] = useState<FaqDraft[]>(() =>
    toDrafts(initial.faq_items),
  );
  const [faqDirty, setFaqDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const dirtyRef = useRef(dirty);
  const faqsRef = useRef(faqs);
  const faqDirtyRef = useRef(faqDirty);
  const baselineRef = useRef(baseline);
  const saveChainRef = useRef(Promise.resolve());

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);
  useEffect(() => {
    faqsRef.current = faqs;
  }, [faqs]);
  useEffect(() => {
    faqDirtyRef.current = faqDirty;
  }, [faqDirty]);
  useEffect(() => {
    baselineRef.current = baseline;
  }, [baseline]);

  // Live hydrate once — static SSR can lag behind the API after prior edits.
  useEffect(() => {
    let cancelled = false;
    void fetchLiveHub().then((live) => {
      if (cancelled || !live) return;
      if (Object.keys(dirtyRef.current).length > 0 || faqDirtyRef.current) return;
      setBaseline(live);
      baselineRef.current = live;
      const drafts = toDrafts(live.faq_items);
      setFaqs(drafts);
      faqsRef.current = drafts;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMe().then((me) => {
      if (!cancelled && me?.role === "administrator") setIsAdmin(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((fe) => {
      if (!(key in fe)) return fe;
      const next = { ...fe };
      delete next[key];
      return next;
    });
  }, []);

  const setField = useCallback(
    (key: string, value: string) => {
      clearFieldError(key);
      setDirty((d) => {
        const next = { ...d, [key]: value };
        dirtyRef.current = next;
        return next;
      });
    },
    [clearFieldError],
  );

  const value = useCallback(
    (key: string, fallback: string) => {
      if (key in dirty) return dirty[key];
      const base = baseline as unknown as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        const v = base[key];
        return v == null ? "" : String(v);
      }
      return fallback;
    },
    [dirty, baseline],
  );

  const applyPageFromServer = useCallback((updated: HubPage) => {
    setBaseline(updated);
    baselineRef.current = updated;
    // Drop dirty keys that match what the server now has.
    setDirty((d) => {
      const next = { ...d };
      for (const key of Object.keys(next)) {
        if (!PAGE_FIELDS.has(key)) continue;
        const serverVal =
          (updated as unknown as Record<string, unknown>)[key] == null
            ? ""
            : String((updated as unknown as Record<string, unknown>)[key]);
        if (next[key] === serverVal) delete next[key];
        // Also clear if we saved a normalized video id.
        if (
          key === "intro_video_id" &&
          parseYoutubeVideoId(next[key]) === serverVal
        ) {
          delete next[key];
        }
      }
      dirtyRef.current = next;
      return next;
    });
    if (!faqDirtyRef.current) {
      const drafts = toDrafts(updated.faq_items);
      setFaqs(drafts);
      faqsRef.current = drafts;
    }
    setLastSavedAt(new Date().toISOString());
  }, []);

  /** One network write for a single page field — never includes faq_items. */
  const commitField = useCallback(
    async (key: string, rawValue: string): Promise<boolean> => {
      if (!PAGE_FIELDS.has(key)) {
        setError(`Unknown field ${key}`);
        return false;
      }
      const norm = normalizeField(key, rawValue);
      if (!norm.ok) {
        setFieldErrors((fe) => ({ ...fe, [key]: norm.error }));
        setError(norm.error);
        return false;
      }

      // Optimistic local state.
      setDirty((d) => {
        const next = { ...d, [key]: norm.value };
        dirtyRef.current = next;
        return next;
      });
      clearFieldError(key);
      setError(null);

      const run = async (): Promise<boolean> => {
        setSaving(true);
        try {
          const res = await putJSON("/api/admin/hub", { [key]: norm.value });
          if (!res.ok) {
            const t = await res.text();
            setFieldErrors((fe) => ({
              ...fe,
              [key]: t || `Save failed (${res.status})`,
            }));
            setError(t || `Save failed (${res.status})`);
            setSaving(false);
            return false;
          }
          let updated = (await res.json()) as HubPage;
          const live = await fetchLiveHub();
          if (live) updated = live;

          if (key === "intro_video_id") {
            const got = updated.intro_video_id ?? "";
            if (norm.value && got !== norm.value) {
              setError(
                `Video did not stick (wanted ${norm.value}, API has ${got || "none"}).`,
              );
              setSaving(false);
              return false;
            }
          }

          applyPageFromServer(updated);
          void revalidateHub();
          setSaving(false);
          return true;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          setError(msg);
          setSaving(false);
          return false;
        }
      };

      const p = saveChainRef.current.then(run, run);
      saveChainRef.current = p.then(
        () => undefined,
        () => undefined,
      );
      return p;
    },
    [applyPageFromServer, clearFieldError],
  );

  const commitFaqs = useCallback(async (): Promise<boolean> => {
    const list = faqsRef.current;
    const run = async (): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const body = {
          faq_items: list.map((f, i) => ({
            ...(f._new || f.id < 0 ? {} : { id: f.id }),
            sort_order: i,
            question: f.question,
            answer_md: f.answer_md,
          })),
        };
        const res = await putJSON("/api/admin/hub", body);
        if (!res.ok) {
          const t = await res.text();
          setError(t || `FAQ save failed (${res.status})`);
          setSaving(false);
          return false;
        }
        let updated = (await res.json()) as HubPage;
        const live = await fetchLiveHub();
        if (live) updated = live;
        setBaseline(updated);
        baselineRef.current = updated;
        const drafts = toDrafts(updated.faq_items);
        setFaqs(drafts);
        faqsRef.current = drafts;
        faqDirtyRef.current = false;
        setFaqDirty(false);
        setLastSavedAt(new Date().toISOString());
        void revalidateHub();
        setSaving(false);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setSaving(false);
        return false;
      }
    };
    const p = saveChainRef.current.then(run, run);
    saveChainRef.current = p.then(
      () => undefined,
      () => undefined,
    );
    return p;
  }, []);

  const setFaqField = useCallback(
    (id: number, field: "question" | "answer_md", val: string) => {
      setFaqs((list) => {
        const next = list.map((f) =>
          f.id === id ? { ...f, [field]: val } : f,
        );
        faqsRef.current = next;
        return next;
      });
      setFaqDirty(true);
      faqDirtyRef.current = true;
    },
    [],
  );

  const addFaq = useCallback(() => {
    const id = tempId--;
    // Update ref first so commitFaqs() sees the new row immediately.
    const next = [
      ...faqsRef.current,
      {
        id,
        sort_order: faqsRef.current.length,
        question: "New question",
        answer_md: "",
        _new: true as const,
      },
    ];
    faqsRef.current = next;
    setFaqs(next);
    setFaqDirty(true);
    faqDirtyRef.current = true;
    void commitFaqs();
  }, [commitFaqs]);

  const removeFaq = useCallback(
    (id: number) => {
      const next = faqsRef.current
        .filter((f) => f.id !== id)
        .map((f, i) => ({ ...f, sort_order: i }));
      faqsRef.current = next;
      setFaqs(next);
      setFaqDirty(true);
      faqDirtyRef.current = true;
      void commitFaqs();
    },
    [commitFaqs],
  );

  const moveFaq = useCallback(
    (id: number, dir: -1 | 1) => {
      const list = faqsRef.current;
      const idx = list.findIndex((f) => f.id === id);
      if (idx < 0) return;
      const j = idx + dir;
      if (j < 0 || j >= list.length) return;
      const next = list.slice();
      [next[idx], next[j]] = [next[j], next[idx]];
      const ordered = next.map((f, i) => ({ ...f, sort_order: i }));
      faqsRef.current = ordered;
      setFaqs(ordered);
      setFaqDirty(true);
      faqDirtyRef.current = true;
      void commitFaqs();
    },
    [commitFaqs],
  );

  const discard = useCallback(() => {
    dirtyRef.current = {};
    setDirty({});
    const drafts = toDrafts(baselineRef.current.faq_items);
    faqsRef.current = drafts;
    setFaqs(drafts);
    faqDirtyRef.current = false;
    setFaqDirty(false);
    setError(null);
    setFieldErrors({});
  }, []);

  return (
    <Ctx.Provider
      value={{
        isAdmin,
        editMode,
        setEditMode,
        setField,
        commitField,
        value,
        faqs,
        setFaqField,
        commitFaqs,
        addFaq,
        removeFaq,
        moveFaq,
        saving,
        error,
        fieldErrors,
        clearFieldError,
        lastSavedAt,
        dirty: {
          ...dirty,
          ...(faqDirty ? { _faqs: "1" } : {}),
        },
        discard,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
