"use client";

// Membership tiers + enrollment step 2 (Membership Tiers spec §1/§4):
// Navigator featured, Observer trial, Activator promo-gated; exit-intent
// retention offer pitches the trial; alumni promise under the cards.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Price = {
  price_id?: string;
  label?: string;
  interval?: string | null;
  badge?: string;
  amount?: number | null;
  currency?: string | null;
};

type Plan = {
  slug: string;
  name: string;
  grants_role: string;
  display: {
    featured?: boolean;
    promo_only?: boolean;
    tagline?: string;
    prices: Price[];
    features: string[];
  };
  prices: { price_id: string; amount?: number | null; currency?: string | null; interval?: string | null }[];
};

function liveLabel(p: { amount?: number | null; currency?: string | null; interval?: string | null }): string | null {
  if (p.amount == null || !p.currency) return null;
  const dollars = (p.amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency: p.currency.toUpperCase(),
    maximumFractionDigits: 0,
  });
  return p.interval ? `${dollars} / ${p.interval}` : dollars;
}

export default function MembershipPlans() {
  const [state, setState] = useState<
    "loading" | { enabled: boolean; plans: Plan[] }
  >("loading");
  const [me, setMe] = useState<null | { role: string; display_name: string }>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exitOffer, setExitOffer] = useState(false);
  const exitShown = useRef(false);
  const params = useSearchParams();
  const status = params.get("status");
  const welcome = params.get("welcome") === "1";
  const promo = params.get("promo");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing/plans")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setState({ enabled: d.enabled, plans: d.plans });
      })
      .catch(() => {});
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) {
          setMe(d);
          setChecked(true);
        }
      })
      .catch(() => setChecked(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // Exit intent (spec §4): once per page view, when the pointer leaves the top.
  useEffect(() => {
    function onLeave(e: MouseEvent) {
      if (e.clientY <= 0 && !exitShown.current) {
        exitShown.current = true;
        setExitOffer(true);
      }
    }
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, []);

  async function checkout(price_id: string) {
    setBusy(price_id);
    setError(null);
    const r = await fetch("/api/billing/checkout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price_id }),
    });
    setBusy(null);
    if (!r.ok) {
      const d = await r.json().catch(() => null);
      setError(d?.detail ?? `Checkout failed (${r.status})`);
      return;
    }
    const { url } = await r.json();
    window.location.href = url;
  }

  if (state === "loading")
    return <p className="text-sm text-zinc-400">Loading…</p>;

  const visiblePlans = state.plans.filter(
    (p) => !p.display.promo_only || promo,
  );
  const trial = state.plans.find((p) => p.slug === "observer-trial");

  function priceButton(plan: Plan, dp: Price, i: number) {
    // Match a live Stripe price by interval when available.
    const live = plan.prices.find((x) => x.interval === dp.interval);
    const label = dp.label ?? liveLabel(live ?? {}) ?? "—";
    const disabled = !state || busy !== null || !(state as { enabled: boolean }).enabled || !live;
    return (
      <button
        key={i}
        onClick={() => {
          if (checked && me === null) {
            window.location.href = "/signup";
            return;
          }
          if (live) checkout(live.price_id);
        }}
        disabled={disabled && !(checked && me === null)}
        className={`relative block w-full rounded-full py-2.5 text-center font-medium transition-colors ${
          plan.display.featured
            ? "bg-emerald-500 text-white hover:bg-emerald-600"
            : "border border-emerald-400 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
        } disabled:opacity-60`}
      >
        {busy === live?.price_id ? "Redirecting…" : label}
        {dp.badge && (
          <span className="absolute -top-2 right-3 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950">
            {dp.badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <div>
      {welcome && (
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
            2
          </span>
          <p className="font-medium">
            Step 2 of 2 — Welcome{me?.display_name ? `, ${me.display_name.split(" ")[0]}` : ""}!
            Choose how you want to train.
          </p>
        </div>
      )}
      {status === "success" && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950">
          Payment received — your membership activates as soon as Stripe confirms
          (usually seconds).
        </div>
      )}
      {status === "cancelled" && (
        <div className="mb-6 rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          Checkout cancelled — no charge was made.
        </div>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {visiblePlans.map((plan) => (
          <div
            key={plan.slug}
            className={`rounded-3xl border p-6 ${
              plan.display.featured
                ? "border-emerald-400 shadow-lg shadow-emerald-500/10 dark:border-emerald-700"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              {plan.display.featured && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  Most popular
                </span>
              )}
              {plan.display.promo_only && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  Promotional offer
                </span>
              )}
            </div>
            {plan.display.tagline && (
              <p className="mt-1 text-sm text-zinc-500">{plan.display.tagline}</p>
            )}
            <ul className="mt-4 space-y-1.5">
              {plan.display.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="text-emerald-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-2">
              {plan.display.prices.map((dp, i) => priceButton(plan, dp, i))}
            </div>
            {!state.enabled && (
              <p className="mt-2 text-center text-xs text-zinc-400">
                Checkout opens soon
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-zinc-50 p-5 text-center text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          The Alumni promise:
        </span>{" "}
        stay a full month — or complete the 4-week trial — and the entire course
        library is yours for a year, even if you leave.
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href="/pathway" className="text-zinc-500 hover:underline">
          Continue with your free account →
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-zinc-400">
        Secure checkout and billing management hosted by Stripe. Cancel anytime.
      </p>

      {/* Exit-intent retention offer (spec §4) */}
      {exitOffer && me !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-zinc-950">
            <button
              onClick={() => setExitOffer(false)}
              aria-label="Close"
              className="float-right -mr-4 -mt-4 text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold">Before you go —</h3>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Try <span className="font-semibold">everything</span> — coaching,
              the trading room, every course — for{" "}
              <span className="font-semibold">$20/week, four weeks</span>. Finish
              the trial and the course library is yours for a year no matter
              what you decide.
            </p>
            <div className="mt-6 space-y-2">
              {trial?.prices[0] ? (
                <button
                  onClick={() => checkout(trial.prices[0].price_id)}
                  className="w-full rounded-full bg-emerald-500 py-2.5 font-medium text-white hover:bg-emerald-600"
                >
                  Start the 4-Week Trial
                </button>
              ) : (
                <p className="text-sm text-zinc-400">Trial checkout opens soon.</p>
              )}
              <button
                onClick={() => setExitOffer(false)}
                className="w-full text-sm text-zinc-500 hover:underline"
              >
                Continue without the trial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
