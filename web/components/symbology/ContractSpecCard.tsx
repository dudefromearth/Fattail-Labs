"use client";

import { useEffect, useState } from "react";
import { IconXMark } from "@/components/ui/icons";
import { fetchSpec } from "@/lib/symbology/api";
import { formatByShape } from "@/lib/saDisplayShape";
import type { ContractSpec } from "@/lib/symbology/types";

function usd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function sampleQuote(spec: ContractSpec): string {
  const sample = spec.display_shape.kind === "fractional" ? 115.5 : spec.tick_size;
  return formatByShape(sample, spec.display_shape, spec.tick_size);
}

export default function ContractSpecCard({
  symbol,
  onClose,
}: {
  symbol: string;
  onClose: () => void;
}) {
  const [spec, setSpec] = useState<ContractSpec | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    setSpec(null);
    setErr(null);
    void fetchSpec(symbol)
      .then((body) => {
        if (cancel) return;
        setSpec(body);
      })
      .catch((e) => {
        if (cancel) return;
        setErr(e instanceof Error ? e.message : "Spec unavailable");
      });
    return () => {
      cancel = true;
    };
  }, [symbol]);

  const sessionsPending = !spec?.session_summary;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4"
      data-testid="contract-spec-card"
      data-symbol={symbol}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">
            Contract specification
          </p>
          <h3 className="text-[20px] font-semibold text-black">
            {spec?.title || symbol}
          </h3>
          <p className="text-[13px] text-zinc-600">{spec?.symbol || symbol}</p>
        </div>
        <button
          type="button"
          aria-label="Back to search"
          data-testid="contract-spec-close"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-black"
          onClick={onClose}
        >
          <IconXMark size={16} />
        </button>
      </div>

      {err ? (
        <p className="text-sm text-zinc-700" role="alert">
          {err}
        </p>
      ) : null}
      {!err && !spec ? (
        <p className="text-sm text-zinc-500">Loading specification…</p>
      ) : null}
      {spec ? (
        <dl className="grid grid-cols-[9.5rem_1fr] gap-x-3 gap-y-2 text-[13px]">
          <dt className="text-zinc-500">State</dt>
          <dd data-testid="contract-spec-state">{spec.state || "—"}</dd>
          <dt className="text-zinc-500">Exchange</dt>
          <dd>
            {spec.exchange}
            {spec.product_codes.globex ? ` · Globex ${spec.product_codes.globex}` : ""}
          </dd>
          <dt className="text-zinc-500">Tick size</dt>
          <dd data-testid="contract-spec-tick-size">{spec.tick_size}</dd>
          <dt className="text-zinc-500">Tick value</dt>
          <dd data-testid="contract-spec-tick-value">{usd(spec.tick_value)}</dd>
          <dt className="text-zinc-500">Big Point Value</dt>
          <dd data-testid="contract-spec-bpv">{usd(spec.big_point_value)}</dd>
          <dt className="text-zinc-500">Sample quote</dt>
          <dd data-testid="contract-spec-sample">{sampleQuote(spec)}</dd>
          <dt className="text-zinc-500">Months</dt>
          <dd data-testid="contract-spec-months">
            {spec.months.join(" ")} · {spec.periodicity}
          </dd>
          <dt className="text-zinc-500">Sessions</dt>
          <dd data-testid="contract-spec-sessions">
            {sessionsPending ? "Sessions pending" : spec.session_summary}
          </dd>
          <dt className="text-zinc-500">Settlement</dt>
          <dd>{spec.settlement}</dd>
          <dt className="text-zinc-500">Citation</dt>
          <dd data-testid="contract-spec-citation">
            <a
              href={spec.citation.url}
              className="text-[#2962ff] underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {spec.citation.title}
            </a>
            <span className="block text-[12px] text-zinc-500">
              as of {spec.as_of}
            </span>
          </dd>
        </dl>
      ) : null}
    </div>
  );
}
