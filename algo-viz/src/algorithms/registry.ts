'use client';

import type { AnyAlgorithmDef } from '@/lib/algorithm';
import dijkstra from './dijkstra';
import nQueens from './n-queens';

/**
 * The live definitions, components and all. Only client components may import
 * this — see `meta.ts` for the server-safe listing.
 *
 * Adding a visualizer: write the def, add it here, add its entry to meta.ts.
 */
export const REGISTRY: AnyAlgorithmDef[] = [nQueens, dijkstra];

export function findAlgorithm(slug: string): AnyAlgorithmDef | undefined {
  return REGISTRY.find((algorithm) => algorithm.slug === slug);
}
