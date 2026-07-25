'use client';

import type { AnyAlgorithmDef } from '@/lib/algorithm';
import bellmanFord from './bellman-ford';
import dijkstra from './dijkstra';
import kruskal from './kruskal';
import nQueens from './n-queens';

/**
 * The live definitions, components and all. Only client components may import
 * this — see `meta.ts` for the server-safe listing.
 *
 * Adding a visualizer: write the def, add it here, add its entry to meta.ts.
 */
export const REGISTRY: AnyAlgorithmDef[] = [nQueens, dijkstra, bellmanFord, kruskal];

export function findAlgorithm(slug: string): AnyAlgorithmDef | undefined {
  return REGISTRY.find((algorithm) => algorithm.slug === slug);
}
