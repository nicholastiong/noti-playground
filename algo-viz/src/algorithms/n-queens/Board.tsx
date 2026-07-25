'use client';

import { useEffect, useRef } from 'react';
import type { StageProps } from '@/lib/algorithm';
import type { NQueensParams, NQueensPayload } from './trace';
import styles from './Board.module.css';

export default function Board({
  event,
  params,
  seek,
}: StageProps<NQueensParams, NQueensPayload>) {
  const { n } = params;
  const { queens, row, col, attackers } = event.payload;
  const boardRef = useRef<HTMLDivElement>(null);

  // Replay the flourish whenever a solution lands, including on a re-visit.
  useEffect(() => {
    const board = boardRef.current;
    if (!board || event.type !== 'solution') return;
    board.classList.remove(styles.win);
    void board.offsetWidth; // force reflow so the animation restarts
    board.classList.add(styles.win);
  }, [event]);

  const candidate = row !== undefined && col !== undefined ? { row, col } : null;
  const attackerSet = new Set(attackers ?? []);

  return (
    <>
      <div className={styles.frame}>
        <div className={styles.ranks} style={{ gridTemplateRows: `repeat(${n},1fr)` }}>
          {Array.from({ length: n }, (_, i) => (
            <span key={i}>{n - i}</span>
          ))}
        </div>
        <div className={styles.files} style={{ gridTemplateColumns: `repeat(${n},1fr)` }}>
          {Array.from({ length: n }, (_, i) => (
            <span key={i}>{String.fromCharCode(97 + i)}</span>
          ))}
        </div>

        <div
          className={styles.board}
          style={{ gridTemplateColumns: `repeat(${n},1fr)` }}
          ref={boardRef}
        >
          {/* Threat rays: drawn over the squares, in board coordinates. */}
          <svg className={styles.rays} viewBox={`0 0 ${n} ${n}`} preserveAspectRatio="none">
            {event.type === 'reject' &&
              candidate &&
              (attackers ?? []).map((r) => (
                <line
                  key={r}
                  x1={queens[r] + 0.5}
                  y1={r + 0.5}
                  x2={candidate.col + 0.5}
                  y2={candidate.row + 0.5}
                />
              ))}
          </svg>

          {Array.from({ length: n * n }, (_, i) => {
            const r = Math.floor(i / n);
            const c = i % n;
            const occupied = queens[r] === c;
            const isCandidate = candidate?.row === r && candidate.col === c;

            const classes = [styles.square, (r + c) % 2 ? styles.dark : styles.light];
            if (occupied) classes.push(styles.occupied);
            if (occupied && attackerSet.has(r)) classes.push(styles.attacker);
            if (isCandidate && event.type === 'reject') classes.push(styles.bad);
            if (isCandidate && (event.type === 'try' || event.type === 'undo'))
              classes.push(styles.cursor);
            if (row === r && event.type !== 'solution' && event.type !== 'done')
              classes.push(styles.activeRow);

            return (
              <button
                key={i}
                className={classes.join(' ')}
                title={`${String.fromCharCode(97 + c)}${n - r} — jump to the next visit`}
                onClick={() =>
                  seek(
                    (candidateEvent) =>
                      (candidateEvent.type === 'place' || candidateEvent.type === 'reject') &&
                      candidateEvent.payload.row === r &&
                      candidateEvent.payload.col === c,
                  )
                }
              >
                <span className={styles.queen}>♛</span>
              </button>
            );
          })}
        </div>
      </div>
      <p className={styles.hint}>Click any square to jump to the next time the search visits it.</p>
    </>
  );
}
