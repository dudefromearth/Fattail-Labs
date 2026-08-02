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
    intro_video_id: initial.intro_video_id ?? "",
    intro_video_title: initial.intro_video_title ?? "",
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
      const body: Record<string, string | null> = {};
      if ("title" in dirty) body.title = dirty.title;
      if ("description_md" in dirty) body.description_md = dirty.description_md;
      if ("intro_video_id" in dirty) {
        body.intro_video_id = dirty.intro_video_id.trim() || null;
      }
      if ("intro_video_title" in dirty) {
        body.intro_video_title = dirty.intro_video_title.trim() || null;
      }
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
        intro_video_id: page.intro_video_id ?? "",
        intro_video_title: page.intro_video_title ?? "",
      });
      setDirty({});
      setEditMode(false);
      const paths =
        slug === "labs"
          ? ["/app"]
          : slug === "resources"
            ? ["/resource"]
            : slug === "toughness"
              ? ["/app/toughness", "/app/toughness/about"]
              : slug === "hub"
                ? ["/hub"]
                : ["/live"];
      await revalidate(paths);
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
