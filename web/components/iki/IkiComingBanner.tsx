/**
 * Public IKI promotional banner slot. Apple HIG inset grouped.
 * Copy is Coach's. Empty string = reserved slot, not a claim.
 * Hotel + Tango review before any live string.
 */

export default function IkiComingBanner({
  copy,
  testId,
}: {
  copy: string;
  testId: string;
}) {
  const text = copy.trim();
  return (
    <section
      className="rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] px-5 py-4 shadow-[var(--elevation-1)]"
      data-testid={testId}
      aria-label="Coming"
    >
      {text ? (
        <p className="text-sm leading-relaxed text-[var(--color-label)]">{text}</p>
      ) : (
        <p
          className="min-h-[2.75rem] text-sm text-[var(--color-label-tertiary)]"
          data-testid={`${testId}-empty`}
        >
          {/* Coach owes copy. Do not invent promotional text. */}
        </p>
      )}
    </section>
  );
}
