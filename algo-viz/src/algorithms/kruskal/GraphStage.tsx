'use client';

import { useMemo } from 'react';
import type { StageProps } from '@/lib/algorithm';
import { buildGraph, nodeName } from '@/lib/graph';
import { sortedEdges, type KruskalParams, type KruskalPayload } from './trace';
import styles from './GraphStage.module.css';

const R = 4.6; // node radius, in the 0-100 drawing space

export default function GraphStage({
  event,
  params,
  seek,
}: StageProps<KruskalParams, KruskalPayload>) {
  const graph = useMemo(() => buildGraph(params.size, params.seed), [params.size, params.seed]);
  const edges = useMemo(() => sortedEdges(graph.edges), [graph]);
  const { roots, mst, rejected, edgeIndex } = event.payload;

  const inMst = new Set(mst);
  const isRejected = new Set(rejected);

  return (
    <>
      <div className={styles.wrap}>
        <svg viewBox="0 0 100 100" className={styles.canvas}>
          {/* ── edges, in sorted order so states key cleanly ── */}
          <g>
            {edges.map(({ a, b, w }, i) => {
              const A = graph.nodes[a];
              const B = graph.nodes[b];
              const classes = [styles.edge];
              if (inMst.has(i)) classes.push(styles.mst);
              if (isRejected.has(i)) classes.push(styles.rejected);
              if (i === edgeIndex) classes.push(styles.scanning);

              return (
                <g key={i}>
                  <line className={classes.join(' ')} x1={A.x} y1={A.y} x2={B.x} y2={B.y} />
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

          {/* ── nodes, labelled with the root of their tree ── */}
          <g>
            {graph.nodes.map((node) => {
              const root = roots[node.id];
              const classes = [styles.node];
              if (roots.some((other, id) => id !== node.id && other === root)) {
                classes.push(styles.joined);
              }
              const current = edgeIndex !== undefined && edges[edgeIndex];
              if (current && (current.a === node.id || current.b === node.id)) {
                classes.push(styles.endpoint);
              }

              return (
                <g
                  key={node.id}
                  className={classes.join(' ')}
                  onClick={() =>
                    seek((candidate) => {
                      if (candidate.type !== 'accept') return false;
                      const i = candidate.payload.edgeIndex;
                      return i !== undefined && (edges[i].a === node.id || edges[i].b === node.id);
                    })
                  }
                >
                  <title>{`${node.name} — click to jump to the next tree edge that touches it`}</title>
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
                  <text className={styles.root} x={node.x} y={node.y - R - 2.4} textAnchor="middle">
                    {nodeName(root)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className={styles.legend}>
        <span>
          <i className={styles.swMst} /> tree edge
        </span>
        <span>
          <i className={styles.swRejected} /> rejected (cycle)
        </span>
        <span>
          <i className={styles.swScan} /> considering
        </span>
        <span className={styles.legendNote}>the letter above a node is the root of its tree</span>
      </div>
      <p className={styles.hint}>Click a node to jump to the next tree edge that touches it.</p>
    </>
  );
}
