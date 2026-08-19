"use client";

// Apply form admin — questions + slots. Same in-place field API as courses.

import { fetchMe } from "@/lib/useIsAdmin";
import type { ApplyQuestion } from "@/lib/applyFields";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FieldEditApi } from "./fieldEdit";

export type ApplySlot = {
  id: number;
  starts_et: string;
  sort_order?: number;
  live?: boolean;
};

type Ctx = FieldEditApi & {
  setEditMode: (v: boolean) => void;
  slots: ApplySlot[];
  liveSlots: ApplySlot[];
  liveError: string | null;
  questions: ApplyQuestion[];
  adminQuestions: ApplyQuestion[];
  formError: string | null;
  questionsLoading: boolean;
  reload: () => Promise<void>;
  addSlot: () => Promise<void>;
  removeSlot: (id: number) => Promise<void>;
  addQuestion: () => Promise<void>;
  removeQuestion: (id: number) => Promise<void>;
  moveQuestion: (id: number, direction: "up" | "down") => Promise<void>;
  addOption: (id: number) => Promise<void>;
  removeOption: (id: number, index: number) => Promise<void>;
  saving: boolean;
  lastSavedAt: string | null;
  error: string | null;
};

const ApplySlotsEditContext = createContext<Ctx | null>(null);

export function useApplySlotsEdit(): Ctx | null {
  return useContext(ApplySlotsEditContext);
}

function readEditFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("edit") === "1";
}

function asQuestion(raw: unknown): ApplyQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;
  if (typeof q.id !== "number" && typeof q.id !== "string") return null;
  if (typeof q.slug !== "string") return null;
  return {
    id: Number(q.id),
    slug: q.slug,
    ask: String(q.ask || ""),
    hint: String(q.hint || ""),
    qtype: (String(q.qtype || "free_text") as ApplyQuestion["qtype"]),
    options: Array.isArray(q.options)
      ? q.options.map((o) => String(o))
      : [],
    ac_key: typeof q.ac_key === "string" ? q.ac_key : null,
    ac_field_id: typeof q.ac_field_id === "string" ? q.ac_field_id : null,
    is_email: Boolean(q.is_email),
    sort_order: Number(q.sort_order || 0),
  };
}

export function ApplySlotsEditProvider({
  children,
  startInEdit = false,
}: {
  children: ReactNode;
  startInEdit?: boolean;
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditModeState] = useState(false);
  const [pendingOpenField, setPendingOpenField] = useState<string | null>(null);
  const [slots, setSlots] = useState<ApplySlot[]>([]);
  const [liveSlots, setLiveSlots] = useState<ApplySlot[]>([]);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ApplyQuestion[]>([]);
  const [adminQuestions, setAdminQuestions] = useState<ApplyQuestion[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
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

  useEffect(() => {
    setEditModeState(startInEdit || readEditFromUrl());
    const syncFromHistory = () =>
      setEditModeState(startInEdit || readEditFromUrl());
    window.addEventListener("popstate", syncFromHistory);
    window.addEventListener("pageshow", syncFromHistory);
    return () => {
      window.removeEventListener("popstate", syncFromHistory);
      window.removeEventListener("pageshow", syncFromHistory);
    };
  }, [startInEdit]);

  const setEditMode = useCallback((v: boolean) => {
    if (!v) setPendingOpenField(null);
    setEditModeState(v);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (v) url.searchParams.set("edit", "1");
    else url.searchParams.delete("edit");
    const next = `${url.pathname}${url.search}${url.hash}`;
    if (v) window.history.pushState({ labsEdit: true }, "", next);
    else window.history.replaceState({ labsEdit: false }, "", next);
  }, []);

  const enterEditAtField = useCallback(
    (field: string) => {
      setPendingOpenField(field);
      setEditMode(true);
    },
    [setEditMode],
  );

  useEffect(() => {
    if (!pendingOpenField || !editMode) return;
    const t = window.setTimeout(() => setPendingOpenField(null), 150);
    return () => window.clearTimeout(t);
  }, [pendingOpenField, editMode]);

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const loadPublic = useCallback(async () => {
    setQuestionsLoading(true);
    try {
      const r = await fetch("/api/apply/form", { credentials: "same-origin" });
      const body = await r.json().catch(() => null);
      if (!r.ok || body?.ok !== true || !Array.isArray(body?.questions)) {
        const detail =
          typeof body?.detail === "string"
            ? body.detail
            : "Apply questions did not load.";
        setQuestions([]);
        setLiveSlots([]);
        setFormError(detail);
        setLiveError(
          Array.isArray(body?.slots) ? null : "Conversation times did not load.",
        );
        return;
      }
      const qs = (body.questions as unknown[])
        .map(asQuestion)
        .filter((q): q is ApplyQuestion => q !== null);
      setQuestions(qs);
      setFormError(qs.length ? null : "Apply questions are not configured.");
      if (Array.isArray(body.slots)) {
        setLiveSlots(body.slots as ApplySlot[]);
        setLiveError(null);
      } else {
        setLiveSlots([]);
        setLiveError("Conversation times did not load.");
      }
    } catch {
      setQuestions([]);
      setLiveSlots([]);
      setFormError("Apply questions did not load. Network error.");
      setLiveError("Conversation times did not load. Network error.");
    } finally {
      setQuestionsLoading(false);
    }
  }, []);

  const loadAdmin = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const [qr, sr] = await Promise.all([
        fetch("/api/admin/apply/questions", { credentials: "same-origin" }),
        fetch("/api/admin/apply/slots", { credentials: "same-origin" }),
      ]);
      const qbody = await qr.json().catch(() => null);
      const sbody = await sr.json().catch(() => null);
      if (!qr.ok || qbody?.ok !== true || !Array.isArray(qbody?.questions)) {
        setError(
          typeof qbody?.detail === "string"
            ? qbody.detail
            : "Apply questions did not load.",
        );
      } else {
        const qs = (qbody.questions as unknown[])
          .map(asQuestion)
          .filter((q): q is ApplyQuestion => q !== null);
        setAdminQuestions(qs);
      }
      if (!sr.ok || sbody?.ok !== true || !Array.isArray(sbody?.slots)) {
        setError(
          typeof sbody?.detail === "string"
            ? sbody.detail
            : "Apply slots did not load.",
        );
      } else {
        setSlots(sbody.slots as ApplySlot[]);
      }
    } catch {
      setError("Apply admin store did not load. Network error.");
    }
  }, [isAdmin]);

  const reload = useCallback(async () => {
    await Promise.all([loadPublic(), loadAdmin()]);
  }, [loadPublic, loadAdmin]);

  useEffect(() => {
    void loadPublic();
  }, [loadPublic]);

  useEffect(() => {
    if (isAdmin) void loadAdmin();
  }, [isAdmin, loadAdmin]);

  const value = useCallback(
    (key: string, fallback: string) => {
      const slot = /^slot\.(\d+)\.starts_et$/.exec(key);
      if (slot) {
        const row = slots.find((s) => s.id === Number(slot[1]));
        return row ? row.starts_et : fallback;
      }
      const qask = /^question\.(\d+)\.(ask|hint|qtype|is_email)$/.exec(key);
      if (qask) {
        const row = adminQuestions.find((q) => q.id === Number(qask[1]));
        if (!row) return fallback;
        const field = qask[2];
        if (field === "is_email") return row.is_email ? "yes" : "no";
        return String(row[field as "ask" | "hint" | "qtype"] ?? fallback);
      }
      const opt = /^question\.(\d+)\.option\.(\d+)$/.exec(key);
      if (opt) {
        const row = adminQuestions.find((q) => q.id === Number(opt[1]));
        return row?.options[Number(opt[2])] ?? fallback;
      }
      return fallback;
    },
    [slots, adminQuestions],
  );

  const commitField = useCallback(
    async (key: string, nextValue: string | boolean) => {
      const slotMatch = /^slot\.(\d+)\.starts_et$/.exec(key);
      if (slotMatch) {
        const id = Number(slotMatch[1]);
        setSaving(true);
        setError(null);
        try {
          const r = await fetch(`/api/admin/apply/slots/${id}`, {
            method: "PATCH",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ starts_et: String(nextValue) }),
          });
          const body = await r.json().catch(() => null);
          if (!r.ok || body?.ok !== true) {
            const detail =
              typeof body?.detail === "string"
                ? body.detail
                : "That time did not save.";
            setFieldErrors((e) => ({ ...e, [key]: detail }));
            return false;
          }
          setSlots((prev) =>
            prev.map((s) => (s.id === body.slot.id ? body.slot : s)),
          );
          setLastSavedAt(new Date().toISOString());
          await loadPublic();
          return true;
        } catch {
          setFieldErrors((e) => ({
            ...e,
            [key]: "That time did not save. Network error.",
          }));
          return false;
        } finally {
          setSaving(false);
        }
      }

      const qMatch = /^question\.(\d+)\.(ask|hint|qtype|is_email)$/.exec(key);
      const oMatch = /^question\.(\d+)\.option\.(\d+)$/.exec(key);
      if (!qMatch && !oMatch) {
        setFieldErrors((e) => ({ ...e, [key]: "Unknown apply field" }));
        return false;
      }
      const id = Number((qMatch || oMatch)![1]);
      const current = adminQuestions.find((q) => q.id === id);
      if (!current) {
        setFieldErrors((e) => ({ ...e, [key]: "Question not found" }));
        return false;
      }
      const patch: Record<string, unknown> = {};
      if (qMatch) {
        const field = qMatch[2];
        if (field === "is_email") {
          patch.is_email = String(nextValue) === "yes" || nextValue === true;
        } else {
          patch[field] = String(nextValue);
        }
      } else if (oMatch) {
        const options = [...current.options];
        options[Number(oMatch[2])] = String(nextValue);
        patch.options = options;
      }
      setSaving(true);
      setError(null);
      try {
        const r = await fetch(`/api/admin/apply/questions/${id}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const body = await r.json().catch(() => null);
        if (!r.ok || body?.ok !== true) {
          const detail =
            typeof body?.detail === "string"
              ? body.detail
              : "That question did not save.";
          setFieldErrors((e) => ({ ...e, [key]: detail }));
          return false;
        }
        const saved = asQuestion(body.question);
        if (saved) {
          setAdminQuestions((prev) =>
            prev.map((q) => (q.id === saved.id ? saved : q)),
          );
        }
        setLastSavedAt(new Date().toISOString());
        await loadPublic();
        return true;
      } catch {
        setFieldErrors((e) => ({
          ...e,
          [key]: "That question did not save. Network error.",
        }));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [adminQuestions, loadPublic],
  );

  const addSlot = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/apply/slots", {
        method: "POST",
        credentials: "same-origin",
      });
      const body = await r.json().catch(() => null);
      if (!r.ok || body?.ok !== true) {
        setError(
          typeof body?.detail === "string"
            ? body.detail
            : "Could not add a time.",
        );
        return;
      }
      setSlots((prev) => [...prev, body.slot as ApplySlot]);
      setLastSavedAt(new Date().toISOString());
    } catch {
      setError("Could not add a time. Network error.");
    } finally {
      setSaving(false);
    }
  }, []);

  const removeSlot = useCallback(
    async (id: number) => {
      setSaving(true);
      setError(null);
      try {
        const r = await fetch(`/api/admin/apply/slots/${id}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const body = await r.json().catch(() => null);
        if (!r.ok || body?.ok !== true) {
          setError(
            typeof body?.detail === "string"
              ? body.detail
              : "Could not remove that time.",
          );
          return;
        }
        setSlots((prev) => prev.filter((s) => s.id !== id));
        setLastSavedAt(new Date().toISOString());
        await loadPublic();
      } catch {
        setError("Could not remove that time. Network error.");
      } finally {
        setSaving(false);
      }
    },
    [loadPublic],
  );

  const addQuestion = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/apply/questions", {
        method: "POST",
        credentials: "same-origin",
      });
      const body = await r.json().catch(() => null);
      if (!r.ok || body?.ok !== true) {
        setError(
          typeof body?.detail === "string"
            ? body.detail
            : "Could not add a question.",
        );
        return;
      }
      const saved = asQuestion(body.question);
      if (saved) setAdminQuestions((prev) => [...prev, saved]);
      setLastSavedAt(new Date().toISOString());
      await loadPublic();
    } catch {
      setError("Could not add a question. Network error.");
    } finally {
      setSaving(false);
    }
  }, [loadPublic]);

  const removeQuestion = useCallback(
    async (id: number) => {
      setSaving(true);
      setError(null);
      try {
        const r = await fetch(`/api/admin/apply/questions/${id}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const body = await r.json().catch(() => null);
        if (!r.ok || body?.ok !== true) {
          setError(
            typeof body?.detail === "string"
              ? body.detail
              : "Could not remove that question.",
          );
          return;
        }
        setAdminQuestions((prev) => prev.filter((q) => q.id !== id));
        setLastSavedAt(new Date().toISOString());
        await loadPublic();
      } catch {
        setError("Could not remove that question. Network error.");
      } finally {
        setSaving(false);
      }
    },
    [loadPublic],
  );

  const moveQuestion = useCallback(
    async (id: number, direction: "up" | "down") => {
      setSaving(true);
      setError(null);
      try {
        const r = await fetch(`/api/admin/apply/questions/${id}/move`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction }),
        });
        const body = await r.json().catch(() => null);
        if (!r.ok || body?.ok !== true || !Array.isArray(body?.questions)) {
          setError(
            typeof body?.detail === "string"
              ? body.detail
              : "Could not move that question.",
          );
          return;
        }
        const qs = (body.questions as unknown[])
          .map(asQuestion)
          .filter((q): q is ApplyQuestion => q !== null);
        setAdminQuestions(qs);
        setLastSavedAt(new Date().toISOString());
        await loadPublic();
      } catch {
        setError("Could not move that question. Network error.");
      } finally {
        setSaving(false);
      }
    },
    [loadPublic],
  );

  const addOption = useCallback(
    async (id: number) => {
      const current = adminQuestions.find((q) => q.id === id);
      if (!current) return;
      await commitField(
        `question.${id}.option.${current.options.length}`,
        "New choice",
      );
    },
    [adminQuestions, commitField],
  );

  const removeOption = useCallback(
    async (id: number, index: number) => {
      const current = adminQuestions.find((q) => q.id === id);
      if (!current) return;
      const options = current.options.filter((_, i) => i !== index);
      setSaving(true);
      try {
        const r = await fetch(`/api/admin/apply/questions/${id}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ options }),
        });
        const body = await r.json().catch(() => null);
        if (!r.ok || body?.ok !== true) {
          setError(
            typeof body?.detail === "string"
              ? body.detail
              : "Could not remove that choice.",
          );
          return;
        }
        const saved = asQuestion(body.question);
        if (saved) {
          setAdminQuestions((prev) =>
            prev.map((q) => (q.id === saved.id ? saved : q)),
          );
        }
        setLastSavedAt(new Date().toISOString());
        await loadPublic();
      } finally {
        setSaving(false);
      }
    },
    [adminQuestions, loadPublic],
  );

  const ctx = useMemo<Ctx>(
    () => ({
      isAdmin,
      editMode,
      setEditMode,
      enterEditAtField,
      pendingOpenField,
      value,
      commitField,
      fieldErrors,
      clearFieldError,
      slots,
      liveSlots,
      liveError,
      questions,
      adminQuestions,
      formError,
      questionsLoading,
      reload,
      addSlot,
      removeSlot,
      addQuestion,
      removeQuestion,
      moveQuestion,
      addOption,
      removeOption,
      saving,
      lastSavedAt,
      error,
    }),
    [
      isAdmin,
      editMode,
      setEditMode,
      enterEditAtField,
      pendingOpenField,
      value,
      commitField,
      fieldErrors,
      clearFieldError,
      slots,
      liveSlots,
      liveError,
      questions,
      adminQuestions,
      formError,
      questionsLoading,
      reload,
      addSlot,
      removeSlot,
      addQuestion,
      removeQuestion,
      moveQuestion,
      addOption,
      removeOption,
      saving,
      lastSavedAt,
      error,
    ],
  );

  return (
    <ApplySlotsEditContext.Provider value={ctx}>
      {children}
    </ApplySlotsEditContext.Provider>
  );
}
