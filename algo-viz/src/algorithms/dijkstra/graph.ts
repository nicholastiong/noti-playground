/**
 * A small weighted graph, generated deterministically from a seed so a run is
 * reproducible and shareable.
 *
 * Nodes sit on a jittered lattice, which keeps the drawing readable (few edge
 * crossings) while still looking hand-drawn rather than mechanical. Every node
 * is wired to its right and lower neighbour, so the graph is always connected.
 */

export interface GraphNode {
  id: number;
  name: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  a: number;
  b: number;
  w: number;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** adjacency[u] = neighbours of u, each with the edge weight. */
  adjacency: { to: number; w: number }[][];
  source: number;
  target: number;
}

export type GraphSize = 'small' | 'medium' | 'large';

export const SIZES: Record<GraphSize, { cols: number; rows: number }> = {
  small: { cols: 3, rows: 3 },
  medium: { cols: 4, rows: 3 },
  large: { cols: 5, rows: 4 },
};

/** Small, fast, seedable PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function nodeName(id: number): string {
  return String.fromCharCode(65 + id);
}

export function buildGraph(size: GraphSize, seed: number): Graph {
  const { cols, rows } = SIZES[size];
  const random = mulberry32(seed);

  const nodes: GraphNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = r * cols + c;
      // Spread across a 0-100 box with a margin, then jitter off the lattice.
      const x = 10 + (c * 80) / Math.max(1, cols - 1) + (random() - 0.5) * 11;
      const y = 12 + (r * 76) / Math.max(1, rows - 1) + (random() - 0.5) * 11;
      nodes.push({ id, name: nodeName(id), x, y });
    }
  }

  const edges: GraphEdge[] = [];
  const weight = (a: number, b: number) => {
    const dx = nodes[a].x - nodes[b].x;
    const dy = nodes[a].y - nodes[b].y;
    return Math.max(1, Math.round(Math.hypot(dx, dy) * 0.36));
  };
  const link = (a: number, b: number) => edges.push({ a, b, w: weight(a, b) });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = r * cols + c;
      if (c + 1 < cols) link(id, id + 1); // right
      if (r + 1 < rows) link(id, id + cols); // down
      // A few diagonals so the shortest path is not simply the lattice path.
      if (c + 1 < cols && r + 1 < rows && random() < 0.34) link(id, id + cols + 1);
      if (c > 0 && r + 1 < rows && random() < 0.24) link(id, id + cols - 1);
    }
  }

  const adjacency: { to: number; w: number }[][] = nodes.map(() => []);
  for (const { a, b, w } of edges) {
    adjacency[a].push({ to: b, w });
    adjacency[b].push({ to: a, w });
  }

  return { nodes, edges, adjacency, source: 0, target: nodes.length - 1 };
}
