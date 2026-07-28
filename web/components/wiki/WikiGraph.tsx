"use client";

// Wiki map — Wiki Interface Spec §5. Deterministic layout, no dependencies:
// topics on an inner ring, other kinds clustered by kind around an outer ring.
// Nodes over the cap render as the list fallback only (handled by the page).

import { useRouter } from "next/navigation";

export type GraphNode = { slug: string; title: string; kind: string };
export type GraphEdge = { from: string; to: string };

export const GRAPH_NODE_CAP = 150;

const W = 720;
const H = 540;
const CX = W / 2;
const CY = H / 2;
const INNER_R = 115;
const OUTER_R = 230;

// Kind → token color; topics take the tint, other kinds cycle deterministically.
const KIND_COLORS = [
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-destructive)",
  "var(--color-label-secondary)",
  "var(--color-label-tertiary)",
];

function polar(r: number, angle: number): { x: number; y: number } {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

export default function WikiGraph({
  nodes,
  edges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const router = useRouter();

  const topics = nodes
    .filter((n) => n.kind === "topic")
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const others = nodes.filter((n) => n.kind !== "topic");
  const otherKinds = Array.from(new Set(others.map((n) => n.kind))).sort();

  const colorFor = (kind: string) =>
    kind === "topic"
      ? "var(--color-tint)"
      : KIND_COLORS[otherKinds.indexOf(kind) % KIND_COLORS.length];

  // Position map: inner ring for topics, outer ring with contiguous per-kind
  // clusters (one empty slot between clusters keeps groups visually distinct).
  const pos = new Map<string, { x: number; y: number }>();
  topics.forEach((n, i) => {
    pos.set(n.slug, polar(topics.length === 1 ? 0 : INNER_R, (i / topics.length) * 2 * Math.PI - Math.PI / 2));
  });
  const grouped = otherKinds.map((k) =>
    others.filter((n) => n.kind === k).sort((a, b) => a.slug.localeCompare(b.slug)),
  );
  const slots = others.length + grouped.length;
  let slot = 0;
  for (const group of grouped) {
    for (const n of group) {
      pos.set(n.slug, polar(OUTER_R, (slot / Math.max(slots, 1)) * 2 * Math.PI - Math.PI / 2));
      slot += 1;
    }
    slot += 1; // cluster gap
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)]"
      role="img"
      aria-label="Map of wiki pages and their links"
    >
      <g stroke="var(--color-separator)" strokeWidth={1}>
        {edges.map((e, i) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
      </g>
      <g>
        {nodes.map((n) => {
          const p = pos.get(n.slug);
          if (!p) return null;
          return (
            <circle
              key={n.slug}
              cx={p.x}
              cy={p.y}
              r={n.kind === "topic" ? 8 : 6}
              fill={colorFor(n.kind)}
              className="cursor-pointer"
              tabIndex={0}
              role="link"
              aria-label={n.title}
              onClick={() => router.push(`/app/wiki/${encodeURIComponent(n.slug)}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  router.push(`/app/wiki/${encodeURIComponent(n.slug)}`);
                }
              }}
            >
              <title>{n.title}</title>
            </circle>
          );
        })}
      </g>
    </svg>
  );
}
