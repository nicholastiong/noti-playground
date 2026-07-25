'use client';

import { findAlgorithm } from '@/algorithms/registry';
import VisualizerFrame from '@/components/VisualizerFrame';

/**
 * Thin client boundary: the page is a server component (so routes prerender and
 * get real metadata), while the algorithm definitions — which contain React
 * components — are looked up here on the client.
 */
export default function VisualizerHost({ slug }: { slug: string }) {
  const def = findAlgorithm(slug);
  if (!def) return null;
  return <VisualizerFrame key={def.slug} def={def} />;
}
