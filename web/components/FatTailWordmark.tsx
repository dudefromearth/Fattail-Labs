/** Brush-arch + word fattail. Apply chrome only — no 0-DTE, no Labs mark. */

export default function FatTailWordmark({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 280 88"
      role="img"
      aria-label="fattail"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 50C48 14 92 6 140 8C188 10 232 20 262 50"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28 52C62 22 110 14 140 16C176 18 220 30 250 52"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        opacity="0.35"
      />
      <text
        x="140"
        y="80"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
        fontSize="28"
        fontWeight="600"
        letterSpacing="0.06em"
      >
        fattail
      </text>
    </svg>
  );
}
