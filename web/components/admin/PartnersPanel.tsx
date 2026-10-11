"use client";

// Partner / creator co-marketing links (LK Phase 4b — Specs/Links-Growth-
// Acquisition-Spec-v0_1.md, ruled by v0_2.md §2). Deliberately separate
// from Affiliates — cash or comp'd membership, never store credit
// (PM-L1). Never self-serve: every row starts pending, only an admin
// approval provisions an identity (PM-L2, mirrors AF-L4/AF-L12). No
// partner-facing surface anywhere (Q10) — this admin view is the only
// place these numbers are ever shown.

import { useCallback, useEffect, useState } from "react";
import AppCapsuleNav from "@/components/admin/AppCapsuleNav";
import Button from "@/components/ui/Button";
import SegmentedControl from "@/components/ui/SegmentedControl";

type TermsType = "cash" | "comp_membership";
type Status = "pending" | "approved" | "revoked";

type Partner = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  terms_type: TermsType;
  terms_cents: number | null;
  terms_plan_id: number | null;
  status: Status;
  identity_id: number | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  signups: number;
  total_cents: number | null;
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-5 shadow-[var(--elevation-1)] ${className}`}>
      {children}
    </div>
  );
}

function Pill({ status }: { status: Status }) {
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

function formatCents(cents: number | null): string {
  if (cents === null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PartnersPanel() {
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [termsType, setTermsType] = useState<TermsType>("cash");
  const [termsCents, setTermsCents] = useState("");
  const [termsPlanId, setTermsPlanId] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grantingId, setGrantingId] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/partners", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          setState("denied");
          return;
        }
        setPartners(data.partners || []);
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
    const body: Record<string, unknown> = {
      name,
      email,
      company: company.trim() || undefined,
      terms_type: termsType,
    };
    if (termsType === "cash") {
      const cents = Math.round(Number(termsCents) * 100);
      if (!Number.isFinite(cents) || cents <= 0) {
        setError("Enter a positive dollar amount for the flat fee per signup.");
        return;
      }
      body.terms_cents = cents;
    } else {
      const planId = Number(termsPlanId);
      if (!Number.isInteger(planId) || planId <= 0) {
        setError("Enter a valid plan ID to grant on approval.");
        return;
      }
      body.terms_plan_id = planId;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail ? String(data.detail) : `create failed (${res.status})`);
      setName("");
      setEmail("");
      setCompany("");
      setTermsCents("");
      setTermsPlanId("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "create failed");
    } finally {
      setCreating(false);
    }
  }

  async function setStatus(id: number, status: Status) {
    await fetch(`/api/admin/partners/${id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function grantMembership(id: number) {
    setGrantingId(id);
    try {
      const res = await fetch(`/api/admin/partners/${id}/grant-membership`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail ? String(data.detail) : `grant failed (${res.status})`);
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "grant failed");
    } finally {
      setGrantingId(null);
    }
  }

  if (state === "loading") return <main className="p-8 text-[var(--color-label-secondary)]">Loading…</main>;
  if (state === "denied") {
    return (
      <main className="p-8">
        <h1 className="text-[length:var(--text-title-1)] font-semibold text-[var(--color-label)]">Partners</h1>
        <p className="mt-2 text-[var(--color-destructive)]">Administrator sign-in required.</p>
      </main>
    );
  }

  const filtered = partners.filter((p) => statusFilter === "all" || p.status === statusFilter);

  return (
    <main className="mx-auto max-w-4xl p-6" data-testid="partners-panel">
      <AppCapsuleNav active="partners" />

      <header className="mb-6">
        <h1 className="text-[length:var(--text-title-1)] font-semibold tracking-tight text-[var(--color-label)]">
          Partners &amp; co-marketing
        </h1>
        <p className="mt-1 text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]">
          Creators, educators, and newsletters with no existing stake in FatTail — paid in cash or a comp&apos;d
          membership, never store credit. Never self-serve; every entry starts pending. No partner-facing
          view exists — report numbers to partners directly.
        </p>
      </header>

      <Card className="mb-6">
        <h2 className="mb-3 text-[length:var(--text-footnote)] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
          New partner
        </h2>
        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2">
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
          <label className="text-[length:var(--text-caption)] text-[var(--color-label-secondary)] sm:col-span-2">
            Company (optional)
            <input
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-[length:var(--text-subheadline)] text-[var(--color-label)]"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </label>
          <div className="sm:col-span-2">
            <span className="mb-1 block text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">Terms</span>
            <SegmentedControl
              value={termsType}
              onChange={(v) => setTermsType(v as TermsType)}
              ariaLabel="Terms type"
              options={[
                { id: "cash", label: "Cash per signup" },
                { id: "comp_membership", label: "Comp'd membership" },
              ]}
            />
          </div>
          {termsType === "cash" ? (
            <label className="text-[length:var(--text-caption)] text-[var(--color-label-secondary)] sm:col-span-2">
              Flat fee per signup (USD)
              <input
                type="number"
                min={0}
                step="0.01"
                className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-[length:var(--text-subheadline)] text-[var(--color-label)]"
                value={termsCents}
                onChange={(e) => setTermsCents(e.target.value)}
                placeholder="50.00"
              />
            </label>
          ) : (
            <label className="text-[length:var(--text-caption)] text-[var(--color-label-secondary)] sm:col-span-2">
              Plan ID to grant on approval
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 font-[var(--font-mono)] text-[length:var(--text-footnote)] text-[var(--color-label)]"
                value={termsPlanId}
                onChange={(e) => setTermsPlanId(e.target.value)}
                placeholder="1"
              />
            </label>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? "Adding…" : "Add pending"}
            </Button>
          </div>
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

      <ul className="space-y-3">
        {filtered.map((p) => (
          <li key={p.id} className="flex items-center gap-4 rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-4 shadow-[var(--elevation-1)]">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[length:var(--text-subheadline)] font-semibold text-[var(--color-label)]">{p.name}</span>
                <Pill status={p.status} />
                {p.company && (
                  <span className="text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">{p.company}</span>
                )}
              </div>
              <p className="text-[length:var(--text-footnote)] text-[var(--color-label-secondary)]">{p.email}</p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
                {p.terms_type === "cash"
                  ? `${formatCents(p.terms_cents)} / signup`
                  : `Comp'd membership — plan ${p.terms_plan_id}`}
                {p.identity_id && (
                  <>
                    {" · "}
                    <span className="font-[var(--font-mono)]">identity {p.identity_id}</span>
                  </>
                )}
              </p>
            </div>
            {p.identity_id && (
              <div className="flex-none text-right">
                <div className="text-[length:var(--text-title-3)] font-semibold text-[var(--color-label)]">{p.signups}</div>
                <div className="text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
                  {p.terms_type === "cash" ? `signups · ${formatCents(p.total_cents)}` : "signups"}
                </div>
              </div>
            )}
            <div className="flex-none flex gap-2">
              {p.status === "approved" && p.terms_type === "comp_membership" && (
                <Button
                  variant="secondary"
                  disabled={grantingId === p.id}
                  onClick={() => grantMembership(p.id)}
                >
                  {grantingId === p.id ? "Granting…" : "Grant membership"}
                </Button>
              )}
              {p.status !== "approved" && (
                <Button variant="secondary" onClick={() => setStatus(p.id, "approved")}>
                  Approve
                </Button>
              )}
              {p.status !== "revoked" && (
                <Button variant="secondary" onClick={() => setStatus(p.id, "revoked")}>
                  Revoke
                </Button>
              )}
            </div>
          </li>
        ))}
        {!filtered.length && (
          <li className="rounded-[var(--radius-xl)] border border-dashed border-[var(--color-separator)] p-6 text-center text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]">
            No partners match this filter.
          </li>
        )}
      </ul>
    </main>
  );
}
