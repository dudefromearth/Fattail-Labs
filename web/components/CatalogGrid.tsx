"use client";

// Udemy-model catalog: banner cards with the essentials; tap/click goes
// straight to the course page (the hover quick-view popup was removed —
// Course Card Editor spec v1.1). Admins get a per-card editor: banner color,
// or the shared banner image (sharp here, blurred on the course page header).

import { useEffect, useMemo, useState } from "react";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { putJSON, revalidate, uploadMedia } from "@/lib/client";
import { FIELD } from "@/lib/ui";
import Link from "next/link";
import type { CourseCard } from "@/lib/types";
import { isNew } from "@/lib/catalog";
import { ImportCourseCard, NewCourseCard } from "@/components/edit/EditorExtras";
import { appAlert } from "@/lib/dialogs";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

// Deterministic banner art per category (until a color/image is chosen).
const BANNER_GRADIENTS: Record<string, string> = {
  "0-dte": "linear-gradient(135deg, #064e3b 0%, #10b981 100%)",
  butterflies: "linear-gradient(135deg, #1e3a8a 0%, #38bdf8 100%)",
  convexity: "linear-gradient(135deg, #3b0764 0%, #a855f7 100%)",
  "fat-tail-doctrine": "linear-gradient(135deg, #0c0a09 0%, #57534e 100%)",
  "risk-sizing": "linear-gradient(135deg, #7c2d12 0%, #f97316 100%)",
  "journaling-routine": "linear-gradient(135deg, #134e4a 0%, #2dd4bf 100%)",
  "marketswarm-platform": "linear-gradient(135deg, #111827 0%, #10b981 100%)",
  "options-foundations": "linear-gradient(135deg, #1e293b 0%, #64748b 100%)",
  psychology: "linear-gradient(135deg, #4c0519 0%, #fb7185 100%)",
};
const FALLBACK_GRADIENT = "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)";

// Curated palette for the card editor (the end-stops of the category art).
const CARD_PALETTE = [
  "#10b981", "#38bdf8", "#a855f7", "#f97316", "#2dd4bf",
  "#64748b", "#fb7185", "#f59e0b", "#57534e",
];

function shade(hex: string, factor: number): string {
  const m = hex.replace("#", "");
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const parts = [0, 2, 4].map((i) =>
    Math.max(0, Math.min(255, Math.round(parseInt(n.slice(i, i + 2), 16) * factor))),
  );
  return `#${parts.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function colorGradient(color: string): string {
  return `linear-gradient(135deg, ${shade(color, 0.3)} 0%, ${color} 100%)`;
}

function fmtHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(Math.round(rating))}
      <span className="text-zinc-300 dark:text-zinc-700">
        {"★".repeat(5 - Math.round(rating))}
      </span>
    </span>
  );
}

// Banner precedence: shared banner image (sharp) → chosen color → category art.
function Banner({ course }: { course: CourseCard }) {
  if (course.hero_image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={course.hero_image_url}
        alt=""
        loading="lazy"
        className="aspect-video w-full object-cover"
      />
    );
  }
  const cat = course.categories[0];
  const background = course.card_color
    ? colorGradient(course.card_color)
    : (BANNER_GRADIENTS[cat?.slug ?? ""] ?? FALLBACK_GRADIENT);
  return (
    <div
      className="relative flex aspect-video w-full flex-col justify-between p-4 text-white"
      style={{ background }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80">
        {cat?.name ?? "FatTail Labs"}
      </span>
      <span className="text-xl font-bold leading-snug drop-shadow-sm">
        {course.title}
      </span>
    </div>
  );
}

// Course Card Editor (spec v1.1): banner color, or the SHARED banner image
// (hero_image_url — sharp on the card, blurred on the course page header).
function CardEditor({
  course,
  onClose,
  onSaved,
}: {
  course: CourseCard;
  onClose: () => void;
  onSaved: (patch: { card_color: string | null; hero_image_url: string | null }) => void;
}) {
  const [color, setColor] = useState(course.card_color ?? "");
  const [imageUrl, setImageUrl] = useState(course.hero_image_url ?? "");
  const [busy, setBusy] = useState(false);

  const field = `w-full ${FIELD}`;

  async function upload(file: File) {
    setBusy(true);
    const url = await uploadMedia(file);
    setBusy(false);
    if (url) setImageUrl(url);
    else await appAlert({ title: "Upload failed", message: "Could not upload the image." });
  }

  async function save() {
    setBusy(true);
    const patch = {
      card_color: color || null,
      hero_image_url: imageUrl || null,
    };
    const r = await putJSON(`/api/admin/courses/${course.slug}`, patch);
    if (!r.ok) {
      setBusy(false);
      await appAlert({ title: "Save failed", message: await r.text() });
      return;
    }
    // In-place: patch local catalog state; revalidate for other visitors only.
    void revalidate(["/courses", `/courses/${course.slug}`]);
    onSaved(patch);
    setBusy(false);
    onClose();
  }

  const preview = imageUrl
    ? { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: color ? colorGradient(color) : FALLBACK_GRADIENT };

  return (
    <div className="absolute inset-0 z-40 flex flex-col gap-2 overflow-y-auto rounded-2xl border border-emerald-400 bg-white p-3 text-left shadow-2xl dark:bg-zinc-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
        Card editor
      </p>
      <div className="aspect-video w-full rounded-lg" style={preview} />
      <div className="flex flex-wrap items-center gap-1.5">
        {CARD_PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => {
              setColor(c);
              setImageUrl("");
            }}
            className={`h-6 w-6 rounded-full border-2 ${
              color === c ? "border-zinc-900 dark:border-white" : "border-transparent"
            }`}
            style={{ background: colorGradient(c) }}
            title={c}
          />
        ))}
        <input
          type="color"
          value={color || "#10b981"}
          onChange={(e) => {
            setColor(e.target.value);
            setImageUrl("");
          }}
          className="h-6 w-8 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700"
          title="Custom color"
        />
        {color && (
          <button
            onClick={() => setColor("")}
            className="text-xs text-zinc-500 hover:underline"
          >
            clear
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label className="chip cursor-pointer text-xs font-medium">
          Upload image…
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </label>
        {imageUrl && (
          <button
            onClick={() => setImageUrl("")}
            className="text-xs text-zinc-500 hover:underline"
          >
            remove image
          </button>
        )}
        <a
          href="/admin/media"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-emerald-600 hover:underline"
        >
          Media library ↗
        </a>
      </div>
      <input
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="…or paste an image URL"
        className={field}
      />
      <p className="text-[11px] leading-snug text-zinc-400">
        The image is the course banner: sharp here, blurred behind the course
        page header.
      </p>
      <div className="mt-auto flex items-center gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={onClose}
          className="chip font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "chip chip-active" : "chip"}
    >
      {children}
    </button>
  );
}

export default function CatalogGrid({ courses }: { courses: CourseCard[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const isAdmin = useIsAdmin();
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  /** Local catalog graph so card edits apply without page reload. */
  const [items, setItems] = useState(courses);
  useEffect(() => {
    setItems(courses);
  }, [courses]);

  // Admins see drafts + archived too — otherwise new courses "vanish" after create.
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    fetch("/api/admin/courses", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.courses) setItems(d.courses as CourseCard[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of items)
      for (const cat of c.categories) map.set(cat.slug, cat.name);
    return [...map.entries()].map(([slug, name]) => ({ slug, name }));
  }, [items]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((c) => {
      if (category && !c.categories.some((x) => x.slug === category)) return false;
      if (level && c.level !== level) return false;
      if (
        needle &&
        !`${c.title} ${c.description_md}`.toLowerCase().includes(needle)
      )
        return false;
      return true;
    });
  }, [items, category, level, q]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <Chip
            key={cat.slug}
            active={category === cat.slug}
            onClick={() => setCategory(category === cat.slug ? null : cat.slug)}
          >
            {cat.name}
          </Chip>
        ))}
        <span className="mx-2 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
        {LEVELS.map((lv) => (
          <Chip
            key={lv}
            active={level === lv}
            onClick={() => setLevel(level === lv ? null : lv)}
          >
            {lv}
          </Chip>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search courses…"
          className="chip-input ml-auto w-56"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((c) => (
          <div key={c.slug} className="relative">
            <Link
              href={`/courses/${c.slug}`}
              className="surface-card block overflow-hidden border border-[var(--color-separator)] transition-shadow hover:shadow-[var(--elevation-2)]"
            >
              <Banner course={c} />
              <div className="p-4">
                <h2 className="line-clamp-2 font-semibold leading-snug">
                  {c.title}
                </h2>
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {c.instructors.map((x) => x.name).join(", ") ||
                    (c.status === "draft" ? "No instructors yet" : "")}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-sm">
                  {c.status === "draft" ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      DRAFT
                    </span>
                  ) : c.status === "archived" ? (
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      ARCHIVED
                    </span>
                  ) : c.avg_rating !== null ? (
                    <>
                      <span className="font-semibold text-amber-700 dark:text-amber-500">
                        {c.avg_rating.toFixed(1)}
                      </span>
                      <Stars rating={c.avg_rating} />
                      <span className="text-xs text-zinc-500">
                        ({c.review_count})
                      </span>
                    </>
                  ) : isNew(c.published_at) ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      NEW
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">
                      Not yet rated
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">
                  {fmtHours(c.total_duration_seconds)} total ·{" "}
                  <span className="capitalize">{c.level}</span> ·{" "}
                  {c.lesson_count} lessons
                </p>
              </div>
            </Link>
            {isAdmin && editingSlug !== c.slug && (
              <button
                onClick={() => setEditingSlug(c.slug)}
                className="absolute right-2 top-2 z-20 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-700 shadow hover:bg-white dark:bg-zinc-900/90 dark:text-zinc-200"
                title="Edit card appearance"
              >
                ✎ Card
              </button>
            )}
            {editingSlug === c.slug && (
              <CardEditor
                course={c}
                onClose={() => setEditingSlug(null)}
                onSaved={(patch) => {
                  setItems((prev) =>
                    prev.map((x) =>
                      x.slug === c.slug
                        ? {
                            ...x,
                            card_color: patch.card_color,
                            hero_image_url: patch.hero_image_url,
                          }
                        : x,
                    ),
                  );
                }}
              />
            )}
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-zinc-500">No courses match. Clear a filter and try again.</p>
        )}
        <NewCourseCard />
        <ImportCourseCard />
      </div>
    </div>
  );
}
