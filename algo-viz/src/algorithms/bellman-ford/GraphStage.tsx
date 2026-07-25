'use client';

import { useMemo } from 'react';
import type { StageProps } from '@/lib/algorithm';
import { buildDigraph, type DiEdge } from './graph';
import type { BellmanFordParams, BellmanFordPayload } from './trace';
import styles from './GraphStage.module.css';

const R = 4.6; // node radius, in the 0-100 drawing space

interface Pt {
  x: number;
  y: number;
}

/**
 * Straight edges are lines; the injected back edge bows out perpendicular so
 * the opposing pair stays readable. Returns the path plus points for the
 * weight badge (mid) and the arrowhead (tip + angle).
 */
function edgeGeometry(A: Pt, B: Pt, curved: boolean) {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  if (!curved) {
    const t = 1 - (R + 3) / len; // just short of the target disc
    return {
      d: `M ${A.x} ${A.y} L ${B.x} ${B.y}`,
      mid: { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 },
      tip: { x: A.x + dx * t, y: A.y + dy * t },
      angle,
    };
  }

  const C = { x: (A.x + B.x) / 2 - (dy / len) * 9, y: (A.y + B.y) / 2 + (dx / len) * 9 };
  return {
    d: `M ${A.x} ${A.y} Q ${C.x} ${C.y} ${B.x} ${B.y}`,
    // Apex of the quadratic (t = 0.5) carries the weight badge...
    mid: { x: 0.25 * A.x + 0.5 * C.x + 0.25 * B.x, y: 0.25 * A.y + 0.5 * C.y + 0.25 * B.y },
    // ...and the arrow sits a little past it, tangent to the curve.
    tip: { x: 0.09 * A.x + 0.42 * C.x + 0.49 * B.x, y: 0.09 * A.y + 0.42 * C.y + 0.49 * B.y },
    angle: (Math.atan2(0.6 * (B.y - C.y) + 0.4 * (C.y - A.y), 0.6 * (B.x - C.x) + 0.4 * (C.x - A.x)) * 180) / Math.PI,
  };
}

export default function GraphStage({
  event,
  params,
  seek,
}: StageProps<BellmanFordParams, BellmanFordPayload>) {
  const graph = useMemo(
    () => buildDigraph(params.size, params.seed, params.mode),
    [params.size, params.seed, params.mode],
  );
  const { dist, prev, edge, cycleEdge } = event.payload;

  const isCurrent = (e: DiEdge) => !!edge && e.u === edge[0] && e.v === edge[1];
  const isTree = (e: DiEdge) => prev[e.v] === e.u;
  const isCycle = (e: DiEdge) =>
    !!cycleEdge &&
    ((e.u === cycleEdge[0] && e.v === cycleEdge[1]) || (e.u === cycleEdge[1] && e.v === cycleEdge[0]));

  return (
    <>
      <div className={styles.wrap}>
        <svg viewBox="0 0 100 100" className={styles.canvas}>
          {/* ── edges ── */}
          <g>
            {graph.edges.map((e) => {
              const geometry = edgeGeometry(graph.nodes[e.u], graph.nodes[e.v], !!e.back);
              const classes = [styles.edge];
              if (isTree(e)) classes.push(styles.tree);
              if (isCurrent(e)) classes.push(styles.scanning);
              if (isCycle(e)) classes.push(styles.cycle);

              return (
                <g key={`${e.u}-${e.v}`}>
                  <path className={classes.join(' ')} d={geometry.d} fill="none" />
                  <polygon
                    className={`${styles.arrow} ${isCycle(e) ? styles.cycleArrow : ''}`}
                    points="0,-1.5 3,0 0,1.5"
                    transform={`translate(${geometry.tip.x} ${geometry.tip.y}) rotate(${geometry.angle})`}
                  />
                  <g className={e.w < 0 ? `${styles.weight} ${styles.negative}` : styles.weight}>
                    <circle cx={geometry.mid.x} cy={geometry.mid.y} r={2.4} />
                    <text
                      x={geometry.mid.x}
                      y={geometry.mid.y}
                      dominantBaseline="central"
                      textAnchor="middle"
                    >
                      {e.w}
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
              if (dist[node.id] !== undefined) classes.push(styles.reached);
              if (edge && node.id === edge[0]) classes.push(styles.from);
              if (edge && node.id === edge[1]) classes.push(styles.to);
              if (cycleEdge?.includes(node.id)) classes.push(styles.onCycle);

              const d = dist[node.id];

              return (
                <g
                  key={node.id}
                  className={classes.join(' ')}
                  onClick={() =>
                    seek(
                      (candidate) =>
                        candidate.type === 'relax' && candidate.payload.edge?.[1] === node.id,
                    )
                  }
                >
                  <title>{`${node.name} — click to jump to the next time its cost improves`}</title>
                  {node.id === graph.source && (
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
          <i className={styles.swSource} /> source {graph.nodes[graph.source].name}
        </span>
        <span>
          <i className={styles.swTree} /> best-path tree
        </span>
        <span>
          <i className={styles.swScan} /> relaxing
        </span>
        <span>
          <i className={styles.swNegative} /> negative weight
        </span>
      </div>
      <p className={styles.hint}>Click a node to jump to the next time its cost improves.</p>
    </>
  );
}
