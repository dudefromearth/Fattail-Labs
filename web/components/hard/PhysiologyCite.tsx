/**
 * Mandatory aMCC / mental toughness citation block — Hard Spec v1.0 §4 / DL-175.
 */

export default function PhysiologyCite({
  citation,
  doi,
  note,
}: {
  citation: string;
  doi: string;
  note?: string;
}) {
  return (
    <section
      className="rounded-2xl border border-[var(--color-separator)] bg-[var(--color-fill)]/40 p-5"
      aria-labelledby="hard-physiology-heading"
      data-testid="hard-physiology-cite"
    >
      <h2
        id="hard-physiology-heading"
        className="text-sm font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]"
      >
        Why this program · physiology
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-label)]">
        FatTail Hard trains <strong>mental toughness</strong> — persistence when
        effort is costly — through repeated voluntary challenge. Research on the{" "}
        <strong>anterior mid-cingulate cortex (aMCC)</strong> situates this
        region as a network hub for willpower under load and the cost/benefit of
        effort (sometimes called the &ldquo;willpower muscle&rdquo;).
      </p>
      {note ? (
        <p className="mt-2 text-sm text-[var(--color-label-secondary)]">{note}</p>
      ) : null}
      <div className="mt-4 border-t border-[var(--color-separator)] pt-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
          Sources
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-label)]">
          {citation}{" "}
          <a
            href={doi}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-tint)] underline-offset-2 hover:underline"
          >
            {doi}
          </a>
        </p>
        <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
          Mental Toughness scores track compliance with the challenge you chose
          — a process signal, not a medical or imaging result. No guaranteed
          clinical outcomes; never P&amp;L claims.
        </p>
      </div>
    </section>
  );
}
