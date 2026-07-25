/**
 * Bellman-Ford needs what Dijkstra cannot have: negative weights. A negative
 * undirected edge is already a negative cycle (a→b→a), so this study directs
 * the shared lattice graph instead. Every generated edge points from a lower
 * id to a higher one, which makes the base graph a DAG — any subset of its
 * edges can safely go negative without creating a negative cycle. The one
 * exception is deliberate: cycle mode adds a single back edge that undercuts
 * a forward edge, so the detection pass has something to find.
 */

import { buildGraph, mulberry32, type GraphNode, type GraphSize } from '@/lib/graph';

export type WeightMode = 'positive' | 'negative' | 'cycle';

export interface DiEdge {
  u: number;
  v: number;
  w: number;
  /** The injected cycle-closing edge, drawn curved so the pair stays readable. */
  back?: boolean;
}

export interface Digraph {
  nodes: GraphNode[];
  edges: DiEdge[];
  source: number;
  nodeCount: number;
}

export function buildDigraph(size: GraphSize, seed: number, mode: WeightMode): Digraph {
  const base = buildGraph(size, seed);
  // A separate stream, so toggling the mode never re-rolls the layout.
  const random = mulberry32(seed * 7919 + 17);

  const edges: DiEdge[] = base.edges.map(({ a, b, w }) => ({ u: a, v: b, w }));

  // The lattice generates edges in topological order, which would let a single
  // pass relax everything — hiding why Bellman-Ford needs several. Shuffle.
  for (let i = edges.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [edges[i], edges[j]] = [edges[j], edges[i]];
  }

  if (mode !== 'positive') {
    for (const edge of edges) {
      if (random() < 0.24) edge.w = -Math.max(1, Math.round(edge.w * 0.6));
    }
  }

  if (mode === 'cycle') {
    // v→u undercuts u→v by 2, so the pair sums to -2 whatever w is.
    const forward = edges[Math.floor(edges.length / 2)];
    edges.push({ u: forward.v, v: forward.u, w: -(forward.w + 2), back: true });
  }

  return { nodes: base.nodes, edges, source: base.source, nodeCount: base.nodes.length };
}
