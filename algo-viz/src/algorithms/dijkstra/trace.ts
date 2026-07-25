import { TraceRecorder, type Trace } from '@/lib/trace';
import { buildGraph, nodeName, type Graph, type GraphSize } from './graph';

export interface DijkstraParams {
  size: GraphSize;
  seed: number;
}

export interface DijkstraPayload {
  /** node id → best known cost. Missing means Infinity. */
  dist: Record<number, number>;
  /** node id → predecessor on the best known path. */
  prev: Record<number, number>;
  /** Nodes whose cost is final. */
  done: number[];
  /** Nodes sitting in the queue, still improvable. */
  frontier: number[];
  /** Node currently being settled or scanned from. */
  u?: number;
  /** Neighbour under consideration. */
  v?: number;
  /** The edge being looked at right now, as [from, to]. */
  edge?: [number, number];
  /** Set on the closing event: the shortest path, source first. */
  path?: number[];
}

export const CODE = [
  'function dijkstra(graph, source, target) {',
  '  const dist  = new Map();      // best cost found so far',
  '  const prev  = new Map();      // predecessor on that best path',
  '  const done  = new Set();      // nodes whose cost is final',
  '  const queue = new MinQueue(); // frontier, ordered by cost — lazy deletion',
  '',
  '  dist.set(source, 0);',
  '  queue.push(source, 0);',
  '',
  '  while (!queue.isEmpty()) {',
  '    const u = queue.pop();           // nearest unsettled node',
  '    if (done.has(u)) continue;       // stale entry — already settled',
  '    done.add(u);                     // dist(u) can never improve now',
  '',
  '    if (u === target) break;         // the goal is settled, we are finished',
  '',
  '    for (const [v, w] of graph.edges(u)) {',
  '      if (done.has(v)) continue;     // its cost is already final',
  '',
  '      const alt = dist.get(u) + w;   // cost of reaching v through u',
  '      if (alt < (dist.get(v) ?? Infinity)) {',
  '        dist.set(v, alt);            // relax: a cheaper route to v',
  '        prev.set(v, u);',
  '        queue.push(v, alt);',
  '      }',
  '    }',
  '  }',
  '',
  '  return walkBack(prev, target);     // follow predecessors to the source',
  '}',
  '',
  'function walkBack(prev, target) {    // rebuild the route from the prev links',
  '  const path = [];',
  '  for (let at = target; at !== undefined; at = prev.get(at)) {',
  '    path.unshift(at);                // prepend, so it reads source → target',
  '  }',
  '  return path;',
  '}',
  '',
  'class MinQueue {                     // frontier: push duplicates, pop the cheapest',
  '  items = [];',
  '  push(node, cost) { this.items.push({ node, cost }); }',
  '  isEmpty() { return this.items.length === 0; }',
  '  pop() {                            // linear scan — a binary heap in real code',
  '    let best = 0;',
  '    for (let i = 1; i < this.items.length; i++)',
  '      if (this.items[i].cost < this.items[best].cost) best = i;',
  '    return this.items.splice(best, 1)[0].node;',
  '  }',
  '}',
];

const LINE = {
  seed: 8,
  loop: 10,
  pop: 11,
  stale: 12,
  settle: 13,
  goal: 15,
  scan: 17,
  skip: 18,
  compare: 21,
  relax: 22,
  walk: 29,
} as const;

/** The classic lazy Dijkstra in Python — heapq plus stale-entry skipping. */
export const PY_CODE = [
  'import heapq',
  '',
  'def dijkstra(graph, source, target):',
  '    dist = {source: 0}    # best cost found so far',
  '    prev = {}             # predecessor on that best path',
  '    done = set()          # nodes whose cost is final',
  '    heap = [(0, source)]  # frontier, ordered by cost — lazy deletion',
  '',
  '    while heap:',
  '        d, u = heapq.heappop(heap)  # nearest unsettled node',
  '        if u in done:',
  '            continue                # stale entry — already settled',
  '        done.add(u)                 # dist[u] can never improve now',
  '',
  '        if u == target:',
  '            break                   # the goal is settled, we are finished',
  '',
  '        for v, w in graph.edges(u):',
  '            if v in done:',
  '                continue            # its cost is already final',
  '',
  '            alt = d + w             # cost of reaching v through u',
  '            if alt < dist.get(v, float("inf")):',
  '                dist[v] = alt       # relax: a cheaper route to v',
  '                prev[v] = u',
  '                heapq.heappush(heap, (alt, v))',
  '',
  '    return walk_back(prev, target)  # follow predecessors to the source',
  '',
  'def walk_back(prev, target):',
  '    path = []',
  '    at = target',
  '    while at is not None:       # step backwards along the prev links',
  '        path.insert(0, at)      # prepend, so it reads source → target',
  '        at = prev.get(at)',
  '    return path',
];

const PY = {
  seed: 7,
  loop: 9,
  pop: 10,
  stale: 12,
  settle: 13,
  goal: 16,
  scan: 18,
  skip: 20,
  compare: 23,
  relax: 24,
  walk: 28,
} as const satisfies Record<keyof typeof LINE, number>;

export const PY_LINE: Record<number, number> = Object.fromEntries(
  (Object.keys(LINE) as (keyof typeof LINE)[]).map((key) => [LINE[key], PY[key]]),
);

/** Frontier ordered by cost, with lazy deletion — the classic simple version. */
class MinQueue {
  private items: { node: number; cost: number }[] = [];

  push(node: number, cost: number): void {
    this.items.push({ node, cost });
  }

  pop(): number {
    let best = 0;
    for (let i = 1; i < this.items.length; i++) {
      if (this.items[i].cost < this.items[best].cost) best = i;
    }
    return this.items.splice(best, 1)[0].node;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /** Distinct nodes still queued — what the picture calls the frontier. */
  pending(settled: Set<number>): number[] {
    return [...new Set(this.items.map((item) => item.node))].filter((n) => !settled.has(n));
  }
}

const cost = (dist: Record<number, number>, node: number) => dist[node] ?? Infinity;
const show = (value: number) => (value === Infinity ? '∞' : String(value));

export function buildDijkstraTrace(params: DijkstraParams): Trace<DijkstraPayload> {
  const graph: Graph = buildGraph(params.size, params.seed);
  const rec = new TraceRecorder<DijkstraPayload>();

  const dist: Record<number, number> = {};
  const prev: Record<number, number> = {};
  const done = new Set<number>();
  const queue = new MinQueue();

  const { source, target } = graph;

  /** Every event carries an immutable snapshot of the algorithm's state. */
  const snap = (extra: Partial<DijkstraPayload> = {}): DijkstraPayload => ({
    dist: { ...dist },
    prev: { ...prev },
    done: [...done],
    frontier: queue.pending(done),
    ...extra,
  });

  const name = nodeName;

  return rec.run(
    () => {
      dist[source] = 0;
      queue.push(source, 0);
      rec.push(
        'seed',
        LINE.seed,
        `start at ${name(source)} with cost 0 — every other node is ∞`,
        snap({ u: source }),
      );

      while (!queue.isEmpty()) {
        const u = queue.pop();
        rec.push(
          'pop',
          LINE.pop,
          `take ${name(u)} — the cheapest node in the frontier at cost ${show(cost(dist, u))}`,
          snap({ u }),
        );

        if (done.has(u)) {
          rec.bump('stale');
          rec.push(
            'stale',
            LINE.stale,
            `${name(u)} was already settled — this is a stale queue entry, skip it`,
            snap({ u }),
          );
          continue;
        }

        done.add(u);
        rec.bump('settled');
        rec.push(
          'settle',
          LINE.settle,
          `settle ${name(u)} — nothing cheaper can reach it, so ${show(cost(dist, u))} is final`,
          snap({ u }),
        );
        rec.mark(name(u));

        if (u === target) {
          rec.push(
            'goal',
            LINE.goal,
            `${name(target)} is the target and it is now settled — the search can stop`,
            snap({ u }),
          );
          break;
        }

        for (const { to: v, w } of graph.adjacency[u]) {
          rec.bump('scanned');
          rec.push(
            'scan',
            LINE.scan,
            `scan the edge ${name(u)}–${name(v)}, weight ${w}`,
            snap({ u, v, edge: [u, v] }),
          );

          if (done.has(v)) {
            rec.push(
              'skip',
              LINE.skip,
              `${name(v)} is already settled — its cost cannot improve`,
              snap({ u, v, edge: [u, v] }),
            );
            continue;
          }

          const alt = cost(dist, u) + w;
          const current = cost(dist, v);

          if (alt < current) {
            dist[v] = alt;
            prev[v] = u;
            queue.push(v, alt);
            rec.bump('relaxed');
            rec.push(
              'relax',
              LINE.relax,
              `${show(cost(dist, u))} + ${w} = ${alt}, cheaper than ${show(current)} — relax ${name(
                v,
              )} and route it through ${name(u)}`,
              snap({ u, v, edge: [u, v] }),
            );
          } else {
            rec.push(
              'noimprove',
              LINE.compare,
              `${show(cost(dist, u))} + ${w} = ${alt}, no better than ${show(
                current,
              )} — leave ${name(v)} alone`,
              snap({ u, v, edge: [u, v] }),
            );
          }
        }
      }
    },
    () => {
      // Walk predecessors back from the target to recover the route.
      const path: number[] = [];
      if (done.has(target)) {
        for (let at: number | undefined = target; at !== undefined; at = prev[at]) {
          path.unshift(at);
          if (at === source) break;
        }
      }

      rec.push(
        'path',
        LINE.walk,
        path.length
          ? `shortest path ${path.map(name).join(' → ')} — total cost ${dist[target]}`
          : `${name(target)} is unreachable from ${name(source)}`,
        snap({ path }),
      );
    },
  );
}
