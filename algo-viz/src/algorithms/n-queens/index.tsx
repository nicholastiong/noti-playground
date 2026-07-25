'use client';

import { defineAlgorithm } from '@/lib/algorithm';
import type { Trace, TraceEvent } from '@/lib/trace';
import Board from './Board';
import boardStyles from './Board.module.css';
import { buildNQueensTrace, CODE, type NQueensParams, type NQueensPayload } from './trace';

const SIZES = [4, 5, 6, 7, 8, 9, 10, 11, 12];

function Params({
  value,
  onChange,
}: {
  value: NQueensParams;
  onChange: (next: NQueensParams) => void;
}) {
  return (
    <div className={boardStyles.setup}>
      <div className="seg">
        {SIZES.map((n) => (
          <button
            key={n}
            aria-pressed={value.n === n}
            onClick={() => onChange({ ...value, n })}
            title={`${n}×${n} board`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className={boardStyles.mode}>
        <button
          className="switch"
          role="switch"
          aria-checked={value.findAll}
          aria-label="Enumerate every solution"
          onClick={() => onChange({ ...value, findAll: !value.findAll })}
        />
        <span>{value.findAll ? 'enumerate every solution' : 'stop at first solution'}</span>
      </div>
    </div>
  );
}

/** The board as it stood at a bookmarked solution. */
function MarkThumb({
  mark,
  params,
  trace,
}: {
  mark: { index: number };
  params: NQueensParams;
  trace: Trace<NQueensPayload>;
}) {
  const { n } = params;
  const queens = trace.events[mark.index].payload.queens;
  return (
    <div className={boardStyles.thumb} style={{ gridTemplateColumns: `repeat(${n},1fr)` }}>
      {Array.from({ length: n * n }, (_, i) => {
        const r = Math.floor(i / n);
        const c = i % n;
        const cls =
          queens[r] === c ? boardStyles.tQueen : (r + c) % 2 ? undefined : boardStyles.tLight;
        return <i key={i} className={cls} />;
      })}
    </div>
  );
}

/** Depth of the recursion, plus the sets that make the safety check O(1). */
function Inspector({
  event,
  params,
}: {
  event: TraceEvent<NQueensPayload>;
  params: NQueensParams;
}) {
  const { n } = params;
  const queens = event.payload.queens;

  const cols = new Set(queens);
  const diagA = new Set(queens.map((c, r) => r - c));
  const diagB = new Set(queens.map((c, r) => r + c));

  const chips = (present: Set<number>, universe: number[]) =>
    universe.map((v) => (
      <span key={v} className={present.has(v) ? 'chip on' : 'chip ghost'}>
        {v}
      </span>
    ));

  return (
    <>
      <div className="lab">Call stack</div>
      <div className={boardStyles.stack}>
        {Array.from({ length: Math.min(queens.length + 1, n + 1) }, (_, r) => {
          const active = r === queens.length;
          const solved = r === n;
          return (
            <div
              key={r}
              className={active ? `${boardStyles.frameLine} ${boardStyles.act}` : boardStyles.frameLine}
            >
              <span>
                place(<b>{r}</b>)
              </span>
              <span className={boardStyles.frameCol}>
                {solved ? '✦ solution' : r < queens.length ? `col ${queens[r]}` : 'searching…'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="lab">Occupancy sets</div>
      <div className={boardStyles.setRow}>
        <span className={boardStyles.setName}>cols</span>
        <span className={boardStyles.setChips}>
          {chips(cols, Array.from({ length: n }, (_, i) => i))}
        </span>
      </div>
      <div className={boardStyles.setRow}>
        <span className={boardStyles.setName}>diagA</span>
        <span className={boardStyles.setChips}>
          {chips(diagA, [...diagA].sort((a, b) => a - b))}
        </span>
      </div>
      <div className={boardStyles.setRow}>
        <span className={boardStyles.setName}>diagB</span>
        <span className={boardStyles.setChips}>
          {chips(diagB, [...diagB].sort((a, b) => a - b))}
        </span>
      </div>
    </>
  );
}

export default defineAlgorithm<NQueensParams, NQueensPayload>({
  slug: 'n-queens',
  title: 'N-Queens',
  kicker: 'Backtracking / Study №1',
  blurb:
    'Place n queens on an n×n board so that no two share a row, column, or diagonal. Step the search, watch it fail, watch it undo.',
  fnName: 'solveNQueens',
  code: CODE,
  stats: [
    { key: 'placed', label: 'Placed', tone: 'gold' },
    { key: 'backtracks', label: 'Backtracks', tone: 'red' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'solutions', label: 'Solutions', tone: 'gold' },
  ],
  defaultParams: { n: 6, findAll: false },
  build: buildNQueensTrace,
  Params,
  Stage: Board,
  Inspector,
  MarkThumb,
  marksLabel: 'Solutions found',
  marksEmpty: 'none yet — the strip fills as the search succeeds.',
  truncatedHint:
    'Trace capped at 220,000 steps — full enumeration at this size is bigger than the page will hold. Switch back to “stop at first solution” for the complete story.',
});
