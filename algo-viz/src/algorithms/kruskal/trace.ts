import { TraceRecorder, type Trace } from '@/lib/trace';
import { buildGraph, nodeName, type GraphEdge, type GraphSize } from '@/lib/graph';

export interface KruskalParams {
  size: GraphSize;
  seed: number;
}

export interface KruskalPayload {
  /** find(x) for every node — which tree each node currently belongs to. */
  roots: number[];
  /** Indices into the sorted edge order, in acceptance order. */
  mst: number[];
  /** Sorted-order indices discarded as cycle-closers. */
  rejected: number[];
  /** Position in the sorted order under consideration. */
  edgeIndex?: number;
  totalW: number;
}

/** The edges in the order Kruskal walks them — the stage shares this order. */
export function sortedEdges(edges: GraphEdge[]): GraphEdge[] {
  return [...edges].sort((e, f) => e.w - f.w);
}

export const CODE = [
  'function kruskal(graph) {',
  '  const uf = new UnionFind();',
  '  for (const node of graph.nodes) uf.add(node);  // every node starts alone',
  '  const edges = [...graph.edges].sort((e, f) => e.w - f.w);',
  '  const mst = [];',
  '',
  '  for (const { a, b, w } of edges) {    // cheapest edge first',
  '    if (!uf.union(a, b)) continue;      // same tree — would close a cycle',
  '    mst.push({ a, b, w });',
  '    if (mst.length === graph.nodeCount - 1) break;  // spanning — stop early',
  '  }',
  '',
  '  return mst;                           // n-1 edges, minimum total weight',
  '}',
  '',
  'class UnionFind {',
  '  constructor() {',
  '    this.parent = new Map();            // node → parent, a root points at itself',
  '    this.size = new Map();              // root → number of nodes in its tree',
  '  }',
  '',
  '  add(x) {                              // a new node starts as its own tree',
  '    if (this.parent.has(x)) return;',
  '    this.parent.set(x, x);',
  '    this.size.set(x, 1);',
  '  }',
  '',
  '  find(x) {                             // walk up, flattening as we go',
  '    if (this.parent.get(x) !== x) {',
  '      this.parent.set(x, this.find(this.parent.get(x)));  // path compression',
  '    }',
  '    return this.parent.get(x);',
  '  }',
  '',
  '  union(a, b) {                         // false when already in the same tree',
  '    let ra = this.find(a);',
  '    let rb = this.find(b);',
  '    if (ra === rb) return false;        // joining them would close a cycle',
  '    if (this.size.get(ra) > this.size.get(rb)) [ra, rb] = [rb, ra];',
  '    this.parent.set(ra, rb);            // union by size: smaller joins larger',
  '    this.size.set(rb, this.size.get(ra) + this.size.get(rb));',
  '    return true;',
  '  }',
  '}',
];

const LINE = {
  init: 3,
  sort: 4,
  take: 7,
  reject: 8,
  accept: 9,
  span: 10,
  done: 13,
} as const;

/** The same algorithm in Python, for the code panel's language toggle. */
export const PY_CODE = [
  'def kruskal(graph):',
  '    uf = UnionFind()',
  '    for node in graph.nodes:              # every node starts alone',
  '        uf.add(node)',
  '    edges = sorted(graph.edges, key=lambda e: e[2])',
  '    mst = []',
  '',
  '    for a, b, w in edges:                 # cheapest edge first',
  '        if not uf.union(a, b):',
  '            continue                      # same tree — would close a cycle',
  '        mst.append((a, b, w))',
  '        if len(mst) == graph.node_count - 1:',
  '            break                         # spanning — stop early',
  '',
  '    return mst                            # n-1 edges, minimum total weight',
  '',
  'class UnionFind:',
  '    def __init__(self):',
  '        self.parent = {}                  # node → parent, a root points at itself',
  '        self.size = {}                    # root → number of nodes in its tree',
  '',
  '    def add(self, x):                     # a new node starts as its own tree',
  '        if x not in self.parent:',
  '            self.parent[x] = x',
  '            self.size[x] = 1',
  '',
  '    def find(self, x):                    # walk up, flattening as we go',
  '        if self.parent[x] != x:',
  '            self.parent[x] = self.find(self.parent[x])   # path compression',
  '        return self.parent[x]',
  '',
  '    def union(self, a, b):                # False when already in the same tree',
  '        ra, rb = self.find(a), self.find(b)',
  '        if ra == rb:',
  '            return False                  # joining them would close a cycle',
  '        if self.size[ra] > self.size[rb]:',
  '            ra, rb = rb, ra               # union by size: smaller joins larger',
  '        self.parent[ra] = rb',
  '        self.size[rb] += self.size[ra]',
  '        return True',
];

const PY = {
  init: 4,
  sort: 5,
  take: 8,
  reject: 10,
  accept: 11,
  span: 13,
  done: 15,
} as const satisfies Record<keyof typeof LINE, number>;

export const PY_LINE: Record<number, number> = Object.fromEntries(
  (Object.keys(LINE) as (keyof typeof LINE)[]).map((key) => [LINE[key], PY[key]]),
);

/** Same shape as the class in the code panel, so the picture matches the text. */
class UnionFind {
  parent = new Map<number, number>();
  size = new Map<number, number>();

  add(x: number): void {
    if (this.parent.has(x)) return;
    this.parent.set(x, x);
    this.size.set(x, 1);
  }

  find(x: number): number {
    const p = this.parent.get(x)!;
    if (p !== x) this.parent.set(x, this.find(p));
    return this.parent.get(x)!;
  }

  union(a: number, b: number): boolean {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;
    if (this.size.get(ra)! > this.size.get(rb)!) [ra, rb] = [rb, ra];
    this.parent.set(ra, rb);
    this.size.set(rb, this.size.get(ra)! + this.size.get(rb)!);
    return true;
  }
}

export function buildKruskalTrace(params: KruskalParams): Trace<KruskalPayload> {
  const graph = buildGraph(params.size, params.seed);
  const rec = new TraceRecorder<KruskalPayload>();
  const name = nodeName;
  const n = graph.nodes.length;

  const uf = new UnionFind();
  const mst: number[] = [];
  const rejected: number[] = [];
  let totalW = 0;

  const snap = (extra: Partial<KruskalPayload> = {}): KruskalPayload => ({
    roots: graph.nodes.map((node) => uf.find(node.id)),
    mst: [...mst],
    rejected: [...rejected],
    totalW,
    ...extra,
  });

  const edges = sortedEdges(graph.edges);
  rec.set('components', n);

  return rec.run(() => {
    for (const node of graph.nodes) uf.add(node.id);
    rec.push('init', LINE.init, `add all ${n} nodes — ${n} trees of size 1`, snap());

    rec.push(
      'sort',
      LINE.sort,
      `sort all ${edges.length} edges by weight — Kruskal never looks at the picture, only this list`,
      snap(),
    );

    for (let i = 0; i < edges.length; i++) {
      const { a, b, w } = edges[i];
      rec.push(
        'take',
        LINE.take,
        `edge ${i + 1} of ${edges.length}: ${name(a)}–${name(b)}, weight ${w} — the cheapest not yet decided`,
        snap({ edgeIndex: i }),
      );

      const sizeA = uf.size.get(uf.find(a))!;
      const sizeB = uf.size.get(uf.find(b))!;

      if (!uf.union(a, b)) {
        rejected.push(i);
        rec.bump('rejected');
        rec.push(
          'reject',
          LINE.reject,
          `${name(a)} and ${name(b)} are already in the same tree — this edge would close a cycle`,
          snap({ edgeIndex: i }),
        );
        continue;
      }

      mst.push(i);
      totalW += w;
      rec.bump('accepted');
      rec.set('components', rec.count('components') - 1);
      rec.set('weight', totalW);
      rec.push(
        'accept',
        LINE.accept,
        `different trees, sizes ${Math.min(sizeA, sizeB)} and ${Math.max(sizeA, sizeB)} — the smaller joins the larger; total weight now ${totalW}`,
        snap({ edgeIndex: i }),
      );
      rec.mark(`${name(a)}–${name(b)}`);

      if (mst.length === n - 1) {
        rec.push(
          'span',
          LINE.span,
          `${n - 1} edges chosen — every node is connected, the rest of the list is irrelevant`,
          snap({ edgeIndex: i }),
        );
        break;
      }
    }

    rec.push(
      'done',
      LINE.done,
      `minimum spanning tree complete — ${mst.length} edges, total weight ${totalW}`,
      snap(),
    );
  });
}
