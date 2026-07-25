import { notFound } from 'next/navigation';
import { ALGORITHMS, findAlgorithmMeta } from '@/algorithms/meta';
import VisualizerHost from './VisualizerHost';

// Every visualizer is known at build time, so all routes are prerendered.
export function generateStaticParams() {
  return ALGORITHMS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = findAlgorithmMeta(slug);
  if (!meta) return {};
  return { title: meta.title, description: meta.blurb };
}

export default async function AlgorithmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!findAlgorithmMeta(slug)) notFound();
  return <VisualizerHost slug={slug} />;
}
