"use client";

// Affiliates / Referral Credits (LK Phase 3b — Specs/Links-Attribution-Affiliates-Spec-v0_2.md).
// Never self-serve: every row starts pending, only an admin approval
// provisions an identity (AF-L4/AF-L12).

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import SegmentedControl from "@/components/ui/SegmentedControl";

type Affiliate = {
  id: number;
  name: string;
  email: string;
  status: "pending" | "approved" | "revoked";
  identity_id: number | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  credit_balance: number | null;
};

type TierRule = { price_id: string; credits: number; label: string };

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-5 shadow-[var(--elevation-1)] ${className}`}>
      {children}
    </div>
  );
}

function Pill({ status }: { status: Affiliate["status"] }) {
  const cls =
    status === "approved"
      ? "bg-[var(--color-tint-soft)] text-[var(--color-tint-emphasis)]"
      : status === "revoked"
        ? "bg-[var(--color-destructive-soft)] text-[var(--color-destructive)]"
        : "bg-[var(--color-fill)] text-[var(--color-label-secondary)]";
  return (
    <span className={`inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-1 text-[length:var(--text-caption)] font-semibold ${cls}`}>
      {status}
    </span>
  );
}

export default function AffiliatesPanel() {
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [rules, setRules] = useState<TierRule[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "revoked">("all");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [priceId, setPriceId] = useState("");
  const [ruleLabel, setRuleLabel] = useState("");
  const [ruleCredits, setRuleCredits] = useState("");
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [savingRule, setSavingRule] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/admin/affiliates", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/affiliates/tier-rules", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([a, t]) => {
        if (!a) {
          setState("denied");
          return;
        }
        setAffiliates(a.affiliates || []);
        setRules(t?.rules || []);
        setState("ready");
      })
      .catch(() => setState("denied"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 5000);
    return () => clearInterval(id);
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail ? String(data.detail) : `create failed (${res.status})`);
      setName("");
      setEmail("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "create failed");
    } finally {
      setCreating(false);
    }
  }

  async function setStatus(id: number, status: Affiliate["status"]) {
    await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function onSaveRule(e: React.FormEvent) {
    e.preventDefault();
    setRuleError(null);
    const credits = Number(ruleCredits);
    if (!priceId.trim() || !ruleLabel.trim() || !Number.isInteger(credits) || credits < 0) {
      setRuleError("Price ID, label, and a non-negative whole number of credits are required.");
      return;
    }
    setSavingRule(true);
    try {
      const res = await fetch("/api/admin/affiliates/tier-rules", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ price_id: priceId.trim(), label: ruleLabel.trim(), credits }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail ? String(data.detail) : `save failed (${res.status})`);
      }
      setPriceId("");
      setRuleLabel("");
      setRuleCredits("");
      load();
    } catch (err) {
      setRuleError(err instanceof Error ? err.message : "save failed");
    } finally {
      setSavingRule(false);
    }
  }

  async function deleteRule(price_id: string) {
    await fetch(`/api/admin/affiliates/tier-rules/${encodeURIComponent(price_id)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    load();
  }

  if (state === "loading") return <main className="p-8 text-[var(--color-label-secondary)]">Loading…</main>;
  if (state === "denied") {
    return (
      <main className="p-8">
        <h1 className="text-[length:var(--text-title-1)] font-semibold text-[var(--color-label)]">Affiliates</h1>
        <p className="mt-2 text-[var(--color-destructive)]">Administrator sign-in required.</p>
      </main>
    );
  }

  const filtered = affiliates.filter((a) => statusFilter === "all" || a.status === statusFilter);

  return (
    <main className="mx-auto max-w-4xl p-6" data-testid="affiliates-panel">
      <nav className="mb-4 flex gap-2 text-[length:var(--text-footnote)] text-[var(--color-label-secondary)]">
        <Link href="/admin" className="hover:underline">
          Admin
        </Link>
        <span>/</span>
        <Link href="/admin/links" className="hover:underline">
          Links / QR
        </Link>
        <span>/</span>
        <span className="text-[var(--color-label)]">Affiliates</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-[length:var(--text-title-1)] font-semibold tracking-tight text-[var(--color-label)]">
          Affiliates &amp; referral credits
        </h1>
        <p className="mt-1 text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]">
          Non-member referrers — never self-serve. Every entry starts pending; approving one provisions a
          lightweight identity (no membership) so they can own links, earn credit, and appear in recognition.
        </p>
      </header>

      <Card className="mb-6">
        <h2 className="mb-3 text-[length:var(--text-footnote)] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
          New affiliate application
        </h2>
        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
            Name
            <input
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-[length:var(--text-subheadline)] text-[var(--color-label)]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-[length:var(--text-subheadline)] text-[var(--color-label)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <Button type="submit" variant="primary" disabled={creating}>
            {creating ? "Adding…" : "Add pending"}
          </Button>
        </form>
        {error && <p className="mt-2 text-[length:var(--text-footnote)] text-[var(--color-destructive)]">{error}</p>}
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[length:var(--text-title-3)] font-semibold text-[var(--color-label)]">Registry</h2>
        <div className="w-64">
          <SegmentedControl
            value={statusFilter}
            onChange={setStatusFilter}
            ariaLabel="Status filter"
            options={[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "revoked", label: "Revoked" },
            ]}
          />
        </div>
      </div>

      <ul className="mb-8 space-y-3">
        {filtered.map((a) => (
          <li key={a.id} className="flex items-center gap-4 rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-4 shadow-[var(--elevation-1)]">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[length:var(--text-subheadline)] font-semibold text-[var(--color-label)]">{a.name}</span>
                <Pill status={a.status} />
              </div>
              <p className="text-[length:var(--text-footnote)] text-[var(--color-label-secondary)]">{a.email}</p>
              {a.identity_id && (
                <p className="font-[var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
                  identity {a.identity_id}
                </p>
              )}
            </div>
            {a.credit_balance !== null && (
              <div className="flex-none text-right">
                <div className="text-[length:var(--text-title-3)] font-semibold text-[var(--color-label)]">{a.credit_balance}</div>
                <div className="text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">credits</div>
              </div>
            )}
            <div className="flex-none flex gap-2">
              {a.status !== "approved" && (
                <Button variant="secondary" onClick={() => setStatus(a.id, "approved")}>
                  Approve
                </Button>
              )}
              {a.status !== "revoked" && (
                <Button variant="secondary" onClick={() => setStatus(a.id, "revoked")}>
                  Revoke
                </Button>
              )}
            </div>
          </li>
        ))}
        {!filtered.length && (
          <li className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-separator)] p-6 text-center text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]">
            No affiliates match this filter.
          </li>
        )}
      </ul>

      <Card>
        <h2 className="mb-1 text-[length:var(--text-footnote)] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
          Credit tier rules
        </h2>
        <p className="mb-3 text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
          Which Stripe price earns referral credit, and how much (AF-L9). Keyed by price, not role — Navigator
          Annual and Navigator Lifetime are the same role but different prices. Empty means no credit is
          awarded for anything yet; native Stripe billing has no real prices configured today.
        </p>
        <form onSubmit={onSaveRule} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_0.6fr_auto] sm:items-end">
          <label className="text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
            Stripe price ID
            <input
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 font-[var(--font-mono)] text-[length:var(--text-footnote)] text-[var(--color-label)]"
              value={priceId}
              onChange={(e) => setPriceId(e.target.value)}
              placeholder="price_..."
            />
          </label>
          <label className="text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
            Label
            <input
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-[length:var(--text-subheadline)] text-[var(--color-label)]"
              value={ruleLabel}
              onChange={(e) => setRuleLabel(e.target.value)}
              placeholder="Navigator (Annual)"
            />
          </label>
          <label className="text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
            Credits
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-[length:var(--text-subheadline)] text-[var(--color-label)]"
              value={ruleCredits}
              onChange={(e) => setRuleCredits(e.target.value)}
              placeholder="10"
            />
          </label>
          <Button type="submit" variant="secondary" disabled={savingRule}>
            {savingRule ? "Saving…" : "Save"}
          </Button>
        </form>
        {ruleError && <p className="mt-2 text-[length:var(--text-footnote)] text-[var(--color-destructive)]">{ruleError}</p>}

        <ul className="mt-4 space-y-2">
          {rules.map((r) => (
            <li key={r.price_id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-fill)] px-3 py-2">
              <div className="min-w-0">
                <div className="text-[length:var(--text-footnote)] font-medium text-[var(--color-label)]">{r.label}</div>
                <div className="truncate font-[var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">{r.price_id}</div>
              </div>
              <div className="flex flex-none items-center gap-3">
                <span className="text-[length:var(--text-subheadline)] font-semibold text-[var(--color-label)]">{r.credits} cr</span>
                <button
                  type="button"
                  onClick={() => deleteRule(r.price_id)}
                  className="text-[length:var(--text-caption)] text-[var(--color-destructive)] hover:underline"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
          {!rules.length && <li className="text-[length:var(--text-footnote)] text-[var(--color-label-tertiary)]">No rules configured yet.</li>}
        </ul>
      </Card>
    </main>
  );
}
