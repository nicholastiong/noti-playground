/**
 * Plain data about each visualizer.
 *
 * Kept separate from `registry.ts` because the full definitions carry React
 * components, which cannot cross the server/client boundary. Server components
 * (the index page, route metadata, `generateStaticParams`) import this instead.
 */

export interface AlgorithmMeta {
  slug: string;
  title: string;
  kicker: string;
  blurb: string;
  family: string;
}

export const ALGORITHMS: AlgorithmMeta[] = [
  {
    slug: 'n-queens',
    title: 'N-Queens',
    kicker: 'Backtracking / Study №1',
    blurb:
      'Place n queens on an n×n board so that no two share a row, column, or diagonal. Step the search, watch it fail, watch it undo.',
    family: 'Backtracking',
  },
  {
    slug: 'dijkstra',
    title: 'Dijkstra',
    kicker: 'Shortest paths / Study №2',
    blurb:
      'Grow a set of settled nodes outward from the source, always taking the cheapest frontier node next. Once a node is settled, no cheaper route to it can exist.',
    family: 'Graphs',
  },
  {
    slug: 'bellman-ford',
    title: 'Bellman-Ford',
    kicker: 'Shortest paths / Study №3',
    blurb:
      'No priority queue, no cleverness: sweep every edge, relax what improves, repeat. Slower than Dijkstra — but negative weights are fine, and one extra pass exposes a negative cycle.',
    family: 'Graphs',
  },
  {
    slug: 'kruskal',
    title: 'Kruskal',
    kicker: 'Spanning trees / Study №4',
    blurb:
      'Sort every edge by weight, then walk the list keeping any edge that joins two different trees. Union-find answers "same tree?" in near-constant time, and greed happens to be optimal here.',
    family: 'Graphs',
  },
];

export function findAlgorithmMeta(slug: string): AlgorithmMeta | undefined {
  return ALGORITHMS.find((algorithm) => algorithm.slug === slug);
}
