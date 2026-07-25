'use client';

import { defineAlgorithm } from '@/lib/algorithm';
import type { TraceEvent } from '@/lib/trace';
import { nodeName, SIZES, type GraphSize } from '@/lib/graph';
import GraphStage from './GraphStage';
import styles from './GraphStage.module.css';
import { buildDigraph, type WeightMode } from './graph';
import {
  buildBellmanFordTrace,
  CODE,
  PY_CODE,
  PY_LINE,
  type BellmanFordParams,
  type BellmanFordPayload,
} from './trace';

const SIZE_LABELS: Record<GraphSize, string> = {
  small: '9 nodes',
  medium: '12 nodes',
  large: '20 nodes',
};

const MODE_LABELS: Record<WeightMode, string> = {
  positive: 'all positive',
  negative: 'some negative',
  cycle: 'negative cycle',
};

function Params({
  value,
  onChange,
}: {
  value: BellmanFordParams;
  onChange: (next: BellmanFordParams) => void;
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
      <div className="seg">
        {(Object.keys(MODE_LABELS) as WeightMode[]).map((mode) => (
          <button
            key={mode}
            aria-pressed={value.mode === mode}
            onClick={() => onChange({ ...value, mode })}
            title={`Edge weights: ${MODE_LABELS[mode]}`}
          >
            {MODE_LABELS[mode]}
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

/** The dist/prev table — the whole of Bellman-Ford's memory. */
function Inspector({
  event,
  params,
}: {
  event: TraceEvent<BellmanFordPayload>;
  params: BellmanFordParams;
}) {
  const graph = buildDigraph(params.size, params.seed, params.mode);
  const { dist, prev } = event.payload;

  return (
    <>
      <div className="lab">dist / prev</div>
      <div className={styles.table}>
        {graph.nodes.map((node) => {
          const d = dist[node.id];
          const p = prev[node.id];
          const classes = [styles.cell];
          if (d !== undefined) classes.push(styles.isReached);
          return (
            <div
              key={node.id}
              className={classes.join(' ')}
              title={`prev = ${p === undefined ? '—' : nodeName(p)}`}
            >
              <b>{node.name}</b>
              <span>{p === undefined ? '·' : `←${nodeName(p)}`}</span>
              <span className={styles.val}>{d === undefined ? '∞' : d}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default defineAlgorithm<BellmanFordParams, BellmanFordPayload>({
  slug: 'bellman-ford',
  title: 'Bellman-Ford',
  kicker: 'Shortest paths / Study №3',
  blurb:
    'No priority queue, no cleverness: sweep every edge, relax what improves, repeat. Slower than Dijkstra — but negative weights are fine, and one extra pass exposes a negative cycle.',
  fnName: 'bellmanFord',
  pyFnName: 'bellman_ford',
  code: CODE,
  pyCode: PY_CODE,
  pyLine: PY_LINE,
  stats: [
    { key: 'passes', label: 'Passes', tone: 'gold' },
    { key: 'scanned', label: 'Edges checked' },
    { key: 'relaxed', label: 'Relaxed', tone: 'green' },
  ],
  defaultParams: { size: 'medium', seed: 7, mode: 'negative' },
  build: buildBellmanFordTrace,
  Params,
  Stage: GraphStage,
  Inspector,
  marksLabel: 'Passes',
  marksEmpty: 'none yet — one bookmark per sweep of the edge list.',
});
