'use client';

import { useMemo } from 'react';
import type { StageProps } from '@/lib/algorithm';
import { buildGraph } from './graph';
import type { DijkstraParams, DijkstraPayload } from './trace';
import styles from './GraphStage.module.css';

const R = 4.6; // node radius, in the 0-100 drawing space

export default function GraphStage({
  event,
  params,
  seek,
}: StageProps<DijkstraParams, DijkstraPayload>) {
  const graph = useMemo(() => buildGraph(params.size, params.seed), [params.size, params.seed]);
  const { dist, prev, done, frontier, u, v, edge, path } = event.payload;

  const settled = new Set(done);
  const queued = new Set(frontier);
  const onPath = new Set(path ?? []);

  // Edges chosen by `prev` form the shortest-path tree discovered so far.
  const treeEdge = (a: number, b: number) => prev[a] === b || prev[b] === a;
  const pathEdge = (a: number, b: number) => {
    if (!path || path.length < 2) return false;
    for (let i = 0; i < path.length - 1; i++) {
      if ((path[i] === a && path[i + 1] === b) || (path[i] === b && path[i + 1] === a)) return true;
    }
    return false;
  };
  const scanning = (a: number, b: number) =>
    !!edge && ((edge[0] === a && edge[1] === b) || (edge[0] === b && edge[1] === a));

  return (
    <>
      <div className={styles.wrap}>
        <svg viewBox="0 0 100 100" className={styles.canvas}>
          {/* ── edges ── */}
          <g>
            {graph.edges.map(({ a, b, w }) => {
              const A = graph.nodes[a];
              const B = graph.nodes[b];
              const classes = [styles.edge];
              if (treeEdge(a, b)) classes.push(styles.tree);
              if (scanning(a, b)) classes.push(styles.scanning);
              if (pathEdge(a, b)) classes.push(styles.onPath);

              return (
                <g key={`${a}-${b}`}>
                  <line
                    className={classes.join(' ')}
                    x1={A.x}
                    y1={A.y}
                    x2={B.x}
                    y2={B.y}
                  />
                  <g className={styles.weight}>
                    <circle cx={(A.x + B.x) / 2} cy={(A.y + B.y) / 2} r={2.4} />
                    <text
                      x={(A.x + B.x) / 2}
                      y={(A.y + B.y) / 2}
                      dominantBaseline="central"
                      textAnchor="middle"
                    >
                      {w}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* ── nodes ── */}
          <g>
            {graph.nodes.map((node) => {
              const classes = [styles.node];
              if (settled.has(node.id)) classes.push(styles.settled);
              else if (queued.has(node.id)) classes.push(styles.frontier);
              if (onPath.has(node.id)) classes.push(styles.nodeOnPath);
              if (node.id === u) classes.push(styles.current);
              if (node.id === v) classes.push(styles.neighbour);

              const d = dist[node.id];
              const isSource = node.id === graph.source;
              const isTarget = node.id === graph.target;

              return (
                <g
                  key={node.id}
                  className={classes.join(' ')}
                  onClick={() =>
                    seek((candidate) => candidate.type === 'settle' && candidate.payload.u === node.id)
                  }
                >
                  <title>{`${node.name} — click to jump to the moment it is settled`}</title>
                  {(isSource || isTarget) && (
                    <circle className={styles.ring} cx={node.x} cy={node.y} r={R + 1.8} />
                  )}
                  <circle className={styles.disc} cx={node.x} cy={node.y} r={R} />
                  <text
                    className={styles.name}
                    x={node.x}
                    y={node.y}
                    dominantBaseline="central"
                    textAnchor="middle"
                  >
                    {node.name}
                  </text>
                  <text className={styles.dist} x={node.x} y={node.y - R - 2.4} textAnchor="middle">
                    {d === undefined ? '∞' : d}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className={styles.legend}>
        <span>
          <i className={styles.swSource} /> source {graph.nodes[graph.source].name} · target{' '}
          {graph.nodes[graph.target].name}
        </span>
        <span>
          <i className={styles.swFrontier} /> frontier
        </span>
        <span>
          <i className={styles.swSettled} /> settled
        </span>
        <span>
          <i className={styles.swScan} /> scanning
        </span>
      </div>
      <p className={styles.hint}>Click a node to jump to the moment it gets settled.</p>
    </>
  );
}
