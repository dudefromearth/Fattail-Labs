"use client";

// Course Review block (Reviews Spec v1.0 §4) — aggregate, list, write form,
// admin moderation. Client-fetched so it is always fresh; the static page's
// aggregate refreshes via revalidation after a write.

import { useCallback, useEffect, useState } from "react";

type Review = {
  id: number;
  author: string;
  rating: number;
  body: string;
  status: string;
  created_at: string;
};

type Payload = {
  aggregate: { avg: number | null; count: number };
  reviews: Review[];
  viewer: {
    can_review: boolean;
    reason: string;
    is_admin: boolean;
    my_review: { rating: number; body: string; status: string } | null;
  } | null;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500">
      {"★".repeat(rating)}
      <span className="text-zinc-300 dark:text-zinc-700">
        {"★".repeat(5 - rating)}
      </span>
    </span>
  );
}

export default function ReviewsSection({ slug }: { slug: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [shown, setShown] = useState(4);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/courses/${slug}/reviews`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Payload | null) => {
        if (d) {
          setData(d);
          if (d.viewer?.my_review) {
            setRating(d.viewer.my_review.rating);
            setText(d.viewer.my_review.body ?? "");
          }
        }
      })
      .catch(() => {});
  }, [slug]);

  useEffect(load, [load]);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/courses/${slug}/reviews`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, body: text }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      setError(d?.detail ?? `Failed (${res.status})`);
      return;
    }
    // Refresh the static page's baked aggregate + JSON-LD in the background.
    fetch("/api/revalidate", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: `/courses/${slug}` }),
    }).catch(() => {});
    load();
  }

  async function moderate(id: number, status: string) {
    await fetch(`/api/admin/reviews/${id}/moderate`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (!data) return null;

  return (
    <div className="mt-8 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <div className="flex items-baseline gap-3">
        <h3 className="font-semibold">Course Review</h3>
        {data.aggregate.avg !== null ? (
          <span className="text-sm">
            <span className="font-semibold text-amber-700 dark:text-amber-500">
              {data.aggregate.avg.toFixed(1)}
            </span>{" "}
            <Stars rating={Math.round(data.aggregate.avg)} />{" "}
            <span className="text-zinc-500">({data.aggregate.count})</span>
          </span>
        ) : (
          <span className="text-sm text-zinc-500">
            {data.aggregate.count > 0
              ? `${data.aggregate.count} review${data.aggregate.count === 1 ? "" : "s"}`
              : "Not yet rated"}
          </span>
        )}
      </div>

      {/* Write / edit */}
      {data.viewer && data.viewer.can_review && (
        <div className="mt-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
          <p className="text-sm font-medium">
            {data.viewer.my_review ? "Update your review" : "Leave a review"}
          </p>
          <div className="mt-2 flex gap-1 text-2xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                aria-label={`${n} stars`}
                className={
                  n <= rating ? "text-amber-500" : "text-zinc-300 dark:text-zinc-700"
                }
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What did this course do for you? (optional)"
            rows={3}
            className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          <button
            onClick={submit}
            disabled={busy || rating === 0}
            className="mt-2 rounded-full bg-emerald-500 px-5 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Submit Review"}
          </button>
          {data.viewer.my_review?.status === "held" && (
            <p className="mt-2 text-xs text-zinc-500">
              Your review is held for moderation.
            </p>
          )}
        </div>
      )}
      {data.viewer && !data.viewer.can_review && (
        <p className="mt-3 text-sm text-zinc-500">{data.viewer.reason}.</p>
      )}

      {/* List */}
      <ul className="mt-4 space-y-4">
        {data.reviews.slice(0, shown).map((r) => (
          <li key={r.id} className={r.status === "held" ? "opacity-50" : ""}>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{r.author}</span>
              <Stars rating={r.rating} />
              {r.status === "held" && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                  held
                </span>
              )}
              {data.viewer?.is_admin && (
                <button
                  onClick={() =>
                    moderate(r.id, r.status === "held" ? "visible" : "held")
                  }
                  className="ml-auto text-xs text-zinc-400 hover:text-zinc-600"
                >
                  {r.status === "held" ? "Show" : "Hide"}
                </button>
              )}
            </div>
            {r.body && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {r.body}
              </p>
            )}
          </li>
        ))}
      </ul>
      {data.reviews.length > shown && (
        <button
          onClick={() => setShown((n) => n + 10)}
          className="mt-4 text-sm font-medium text-emerald-600 hover:underline"
        >
          Show more
        </button>
      )}
    </div>
  );
}
