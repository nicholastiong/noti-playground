import { TraceRecorder, type Trace } from '@/lib/trace';
import { nodeName, type GraphSize } from '@/lib/graph';
import { buildDigraph, type WeightMode } from './graph';

export interface BellmanFordParams {
  size: GraphSize;
  seed: number;
  mode: WeightMode;
}

export interface BellmanFordPayload {
  /** node id → best known cost. Missing means Infinity. */
  dist: Record<number, number>;
  /** node id → predecessor on the best known path. */
  prev: Record<number, number>;
  /** 1-based sweep number; 0 before the first pass. */
  pass: number;
  /** The directed edge under consideration, as [u, v, w]. */
  edge?: [number, number, number];
  /** Set on detection: the edge that proves a negative cycle. */
  cycleEdge?: [number, number];
  verdict?: 'ok' | 'cycle';
}

export const CODE = [
  'function bellmanFord(graph, source) {',
  '  const dist = new Map([[source, 0]]);  // best cost found so far',
  '  const prev = new Map();               // predecessor on that best path',
  '',
  '  for (let pass = 1; pass < graph.nodeCount; pass++) {',
  '    let changed = false;',
  '',
  '    for (const [u, v, w] of graph.edges) {',
  '      if (!dist.has(u)) continue;       // u not reached yet',
  '      const alt = dist.get(u) + w;      // cost of reaching v through u',
  '      if (alt < (dist.get(v) ?? Infinity)) {',
  '        dist.set(v, alt);               // relax: a cheaper route to v',
  '        prev.set(v, u);',
  '        changed = true;',
  '      }',
  '    }',
  '',
  '    if (!changed) break;                // a full pass changed nothing — done',
  '  }',
  '',
  '  for (const [u, v, w] of graph.edges) {  // one more pass, only to check',
  '    if (dist.has(u) && dist.get(u) + w < (dist.get(v) ?? Infinity)) {',
  '      return null;                      // still improvable — negative cycle',
  '    }',
  '  }',
  '',
  '  return { dist, prev };                // costs are final',
  '}',
];

const LINE = {
  seed: 2,
  pass: 5,
  skip: 9,
  noimprove: 11,
  relax: 12,
  converge: 18,
  verify: 21,
  cycle: 23,
  done: 27,
} as const;

/** The same algorithm in Python, for the code panel's language toggle. */
export const PY_CODE = [
  'def bellman_ford(graph, source):',
  '    dist = {source: 0}    # best cost found so far',
  '    prev = {}             # predecessor on that best path',
  '',
  '    for _ in range(graph.node_count - 1):',
  '        changed = False',
  '',
  '        for u, v, w in graph.edges:',
  '            if u not in dist:',
  '                continue              # u not reached yet',
  '            alt = dist[u] + w         # cost of reaching v through u',
  '            if alt < dist.get(v, float("inf")):',
  '                dist[v] = alt         # relax: a cheaper route to v',
  '                prev[v] = u',
  '                changed = True',
  '',
  '        if not changed:',
  '            break                     # a full pass changed nothing — done',
  '',
  '    for u, v, w in graph.edges:       # one more pass, only to check',
  '        if u in dist and dist[u] + w < dist.get(v, float("inf")):',
  '            return None               # still improvable — negative cycle',
  '',
  '    return dist, prev                 # costs are final',
];

const PY = {
  seed: 2,
  pass: 5,
  skip: 10,
  noimprove: 12,
  relax: 13,
  converge: 18,
  verify: 20,
  cycle: 22,
  done: 24,
} as const satisfies Record<keyof typeof LINE, number>;

export const PY_LINE: Record<number, number> = Object.fromEntries(
  (Object.keys(LINE) as (keyof typeof LINE)[]).map((key) => [LINE[key], PY[key]]),
);

const show = (value: number) => (value === Infinity ? '∞' : String(value));
const plus = (w: number) => (w < 0 ? `− ${-w}` : `+ ${w}`);

export function buildBellmanFordTrace(params: BellmanFordParams): Trace<BellmanFordPayload> {
  const graph = buildDigraph(params.size, params.seed, params.mode);
  const rec = new TraceRecorder<BellmanFordPayload>();

  const dist: Record<number, number> = {};
  const prev: Record<number, number> = {};
  const name = nodeName;

  const snap = (pass: number, extra: Partial<BellmanFordPayload> = {}): BellmanFordPayload => ({
    dist: { ...dist },
    prev: { ...prev },
    pass,
    ...extra,
  });

  return rec.run(() => {
    dist[graph.source] = 0;
    rec.push(
      'seed',
      LINE.seed,
      `start at ${name(graph.source)} with cost 0 — every other node is ∞`,
      snap(0),
    );

    let pass = 0;
    for (pass = 1; pass < graph.nodeCount; pass++) {
      rec.bump('passes');
      rec.push(
        'pass',
        LINE.pass,
        `pass ${pass} of at most ${graph.nodeCount - 1} — sweep all ${graph.edges.length} edges`,
        snap(pass),
      );
      rec.mark(`pass ${pass}`);

      let changed = 0;
      for (const { u, v, w } of graph.edges) {
        rec.bump('scanned');

        if (dist[u] === undefined) {
          rec.push(
            'skip',
            LINE.skip,
            `${name(u)}→${name(v)}: ${name(u)} has no cost yet — nothing to relax from`,
            snap(pass, { edge: [u, v, w] }),
          );
          continue;
        }

        const alt = dist[u] + w;
        const current = dist[v] ?? Infinity;

        if (alt < current) {
          dist[v] = alt;
          prev[v] = u;
          changed++;
          rec.bump('relaxed');
          rec.push(
            'relax',
            LINE.relax,
            `${dist[u]} ${plus(w)} = ${alt} beats ${show(current)} — relax ${name(v)} via ${name(u)}`,
            snap(pass, { edge: [u, v, w] }),
          );
        } else {
          rec.push(
            'noimprove',
            LINE.noimprove,
            `${dist[u]} ${plus(w)} = ${alt}, no better than ${show(current)} — leave ${name(v)} alone`,
            snap(pass, { edge: [u, v, w] }),
          );
        }
      }

      if (!changed) {
        rec.push(
          'converge',
          LINE.converge,
          `pass ${pass} changed nothing — every cost is already final`,
          snap(pass),
        );
        break;
      }
    }

    // The extra pass: if anything is still improvable, a negative cycle exists.
    for (const { u, v, w } of graph.edges) {
      if (dist[u] !== undefined && dist[u] + w < (dist[v] ?? Infinity)) {
        rec.push(
          'cycle',
          LINE.cycle,
          `${name(u)}→${name(v)} can STILL improve after ${graph.nodeCount - 1} passes — negative cycle, no shortest paths exist`,
          snap(pass, { edge: [u, v, w], cycleEdge: [u, v], verdict: 'cycle' }),
        );
        rec.mark('negative cycle');
        rec.halt();
      }
      rec.push(
        'verify',
        LINE.verify,
        `check ${name(u)}→${name(v)}: cannot improve — consistent`,
        snap(pass, { edge: [u, v, w] }),
      );
    }

    rec.push(
      'done',
      LINE.done,
      `all costs final after ${rec.count('passes')} pass${rec.count('passes') === 1 ? '' : 'es'} — the tree below is the answer`,
      snap(pass, { verdict: 'ok' }),
    );
  });
}
