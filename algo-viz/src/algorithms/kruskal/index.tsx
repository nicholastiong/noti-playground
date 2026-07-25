'use client';

import { useMemo } from 'react';
import { defineAlgorithm } from '@/lib/algorithm';
import type { TraceEvent } from '@/lib/trace';
import { buildGraph, nodeName, SIZES, type GraphSize } from '@/lib/graph';
import GraphStage from './GraphStage';
import styles from './GraphStage.module.css';
import {
  buildKruskalTrace,
  CODE,
  PY_CODE,
  PY_LINE,
  sortedEdges,
  type KruskalParams,
  type KruskalPayload,
} from './trace';

const SIZE_LABELS: Record<GraphSize, string> = {
  small: '9 nodes',
  medium: '12 nodes',
  large: '20 nodes',
};

function Params({
  value,
  onChange,
}: {
  value: KruskalParams;
  onChange: (next: KruskalParams) => void;
}) {
  return (
    <div className={styles.setup}>
      <div className="seg">
        {(Object.keys(SIZES) as GraphSize[]).map((size) => (
          <button
            key={size}
            aria-pressed={value.size === size}
            onClick={() => onChange({ ...value, size })}
            title={SIZE_LABELS[size]}
          >
            {SIZE_LABELS[size]}
          </button>
        ))}
      </div>
      <button
        className="btn"
        onClick={() => onChange({ ...value, seed: (value.seed + 1) % 9999 })}
        title="Generate a different graph"
      >
        ⟳ new graph <span className="chip">seed {value.seed}</span>
      </button>
    </div>
  );
}

/** The sorted edge list Kruskal walks, and the union-find forest as it merges. */
function Inspector({
  event,
  params,
}: {
  event: TraceEvent<KruskalPayload>;
  params: KruskalParams;
}) {
  const graph = useMemo(() => buildGraph(params.size, params.seed), [params]);
  const edges = useMemo(() => sortedEdges(graph.edges), [graph]);
  const { roots, mst, rejected, edgeIndex } = event.payload;

  const inMst = new Set(mst);
  const isRejected = new Set(rejected);

  // Group nodes by the root of their tree, larger trees first.
  const trees = new Map<number, number[]>();
  roots.forEach((root, id) => trees.set(root, [...(trees.get(root) ?? []), id]));
  const forest = [...trees.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <>
      <div className="lab">Edges, cheapest first</div>
      <div className={styles.list}>
        {edges.map(({ a, b, w }, i) => {
          const state = inMst.has(i) ? 'chip on' : isRejected.has(i) ? 'chip ghost' : 'chip';
          return (
            <span key={i} className={i === edgeIndex ? `${state} ${styles.current}` : state}>
              {nodeName(a)}–{nodeName(b)}·{w}
            </span>
          );
        })}
      </div>

      <div className="lab">Union-find forest</div>
      <div className={styles.forest}>
        {forest.map(([root, members]) => (
          <div key={root} className={styles.treeRow}>
            <span className={styles.treeRoot}>{nodeName(root)}</span>
            <span>{members.map(nodeName).join(' ')}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default defineAlgorithm<KruskalParams, KruskalPayload>({
  slug: 'kruskal',
  title: 'Kruskal',
  kicker: 'Spanning trees / Study №4',
  blurb:
    'Sort every edge by weight, then walk the list keeping any edge that joins two different trees. Union-find answers "same tree?" in near-constant time, and greed happens to be optimal here.',
  fnName: 'kruskal',
  code: CODE,
  pyCode: PY_CODE,
  pyLine: PY_LINE,
  stats: [
    { key: 'accepted', label: 'Kept', tone: 'gold' },
    { key: 'rejected', label: 'Rejected', tone: 'red' },
    { key: 'components', label: 'Trees' },
    { key: 'weight', label: 'Total weight', tone: 'gold' },
  ],
  defaultParams: { size: 'medium', seed: 7 },
  build: buildKruskalTrace,
  Params,
  Stage: GraphStage,
  Inspector,
  marksLabel: 'Tree edges, in order',
  marksEmpty: 'none yet — the strip records each edge kept.',
});
