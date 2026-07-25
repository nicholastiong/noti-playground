'use client';

import { defineAlgorithm } from '@/lib/algorithm';
import type { TraceEvent } from '@/lib/trace';
import GraphStage from './GraphStage';
import styles from './GraphStage.module.css';
import { buildGraph, nodeName, SIZES, type GraphSize } from './graph';
import {
  buildDijkstraTrace,
  CODE,
  PY_CODE,
  PY_LINE,
  type DijkstraParams,
  type DijkstraPayload,
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
  value: DijkstraParams;
  onChange: (next: DijkstraParams) => void;
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

/** The frontier queue and the dist/prev table, which is the whole algorithm's memory. */
function Inspector({
  event,
  params,
}: {
  event: TraceEvent<DijkstraPayload>;
  params: DijkstraParams;
}) {
  const graph = buildGraph(params.size, params.seed);
  const { dist, prev, done, frontier } = event.payload;
  const settled = new Set(done);
  const queued = new Set(frontier);

  // Frontier, cheapest first — the order the queue will actually hand them out.
  const ordered = [...frontier].sort((a, b) => (dist[a] ?? Infinity) - (dist[b] ?? Infinity));

  return (
    <>
      <div className="lab">Frontier — cheapest first</div>
      <div className={styles.queue}>
        {ordered.length === 0 ? (
          <span className="chip ghost">empty</span>
        ) : (
          ordered.map((id) => (
            <span key={id} className="chip on">
              {nodeName(id)} · {dist[id]}
            </span>
          ))
        )}
      </div>

      <div className="lab">dist / prev</div>
      <div className={styles.table}>
        {graph.nodes.map((node) => {
          const d = dist[node.id];
          const p = prev[node.id];
          const classes = [styles.cell];
          if (settled.has(node.id)) classes.push(styles.isSettled);
          else if (queued.has(node.id)) classes.push(styles.isFrontier);
          return (
            <div key={node.id} className={classes.join(' ')} title={`prev = ${p === undefined ? '—' : nodeName(p)}`}>
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

export default defineAlgorithm<DijkstraParams, DijkstraPayload>({
  slug: 'dijkstra',
  title: 'Dijkstra',
  kicker: 'Shortest paths / Study №2',
  blurb:
    'Grow a set of settled nodes outward from the source, always taking the cheapest frontier node next. Once a node is settled, no cheaper route to it can exist.',
  fnName: 'dijkstra',
  code: CODE,
  pyCode: PY_CODE,
  pyLine: PY_LINE,
  stats: [
    { key: 'settled', label: 'Settled', tone: 'gold' },
    { key: 'scanned', label: 'Edges seen' },
    { key: 'relaxed', label: 'Relaxed', tone: 'green' },
    { key: 'stale', label: 'Stale pops', tone: 'red' },
  ],
  defaultParams: { size: 'medium', seed: 7 },
  build: buildDijkstraTrace,
  Params,
  Stage: GraphStage,
  Inspector,
  marksLabel: 'Settled, in order',
  marksEmpty: 'nothing settled yet — the strip records the order nodes are finalised.',
});
