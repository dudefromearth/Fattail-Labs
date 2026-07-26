"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SitePage } from "@/lib/sitePage";
import { appAlert } from "@/lib/dialogs";
import { putJSON, revalidate } from "@/lib/client";
import { useIsAdmin } from "@/lib/useIsAdmin";

type Ctx = {
  slug: string;
  isAdmin: boolean;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  dirty: Record<string, string>;
  setField: (k: string, v: string) => void;
  value: (k: string, fallback: string) => string;
  saving: boolean;
  save: () => Promise<void>;
  discard: () => void;
};

const SectionHubEditContext = createContext<Ctx | null>(null);

export function useSectionHubEdit() {
  return useContext(SectionHubEditContext);
}

export function SectionHubEditProvider({
  slug,
  initial,
  children,
}: {
  slug: string;
  initial: SitePage;
  children: ReactNode;
}) {
  const isAdmin = useIsAdmin();
  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState({
    title: initial.title,
    description_md: initial.description_md ?? "",
  });
  const [saving, setSaving] = useState(false);

  const setField = useCallback((k: string, v: string) => {
    setDirty((d) => ({ ...d, [k]: v }));
  }, []);

  const value = useCallback(
    (k: string, fallback: string) =>
      k in dirty ? dirty[k] : k in saved ? (saved as Record<string, string>)[k] : fallback,
    [dirty, saved],
  );

  const discard = useCallback(() => setDirty({}), []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if ("title" in dirty) body.title = dirty.title;
      if ("description_md" in dirty) body.description_md = dirty.description_md;
      if (!Object.keys(body).length) {
        setEditMode(false);
        return;
      }
      const r = await putJSON(`/api/admin/site-pages/${slug}`, body);
      if (!r.ok) {
        await appAlert({ title: "Save failed", message: await r.text() });
        return;
      }
      const page = (await r.json()) as SitePage;
      setSaved({
        title: page.title,
        description_md: page.description_md ?? "",
      });
      setDirty({});
      setEditMode(false);
      await revalidate([
        slug === "labs" ? "/labs" : slug === "resources" ? "/resources" : "/live",
      ]);
    } finally {
      setSaving(false);
    }
  }, [dirty, slug]);

  const ctx = useMemo(
    () => ({
      slug,
      isAdmin: !!isAdmin,
      editMode,
      setEditMode,
      dirty,
      setField,
      value,
      saving,
      save,
      discard,
    }),
    [slug, isAdmin, editMode, dirty, setField, value, saving, save, discard],
  );

  return (
    <SectionHubEditContext.Provider value={ctx}>
      {children}
    </SectionHubEditContext.Provider>
  );
}
