import { TraceRecorder, type Trace } from '@/lib/trace';

export interface NQueensParams {
  n: number;
  /** Enumerate every solution, or stop at the first one. */
  findAll: boolean;
}

export interface NQueensPayload {
  /** Column of the queen in each filled row. Length is the current depth. */
  queens: readonly number[];
  row?: number;
  col?: number;
  /** Rows of the queens attacking the candidate square, for the threat rays. */
  attackers?: readonly number[];
}

/** Source shown in the code panel. Line numbers below index into this array. */
export const CODE = [
  'function solveNQueens(n) {',
  '  const solutions = [];',
  '  const queens    = [];          // queens[r] = column of queen in row r',
  '  const cols      = new Set();   // columns already occupied',
  '  const diagA     = new Set();   // ↘ diagonals, keyed by row - col',
  '  const diagB     = new Set();   // ↙ diagonals, keyed by row + col',
  '',
  '  function place(row) {',
  '    if (row === n) {                    // every row filled',
  '      solutions.push([...queens]);      // record a solution',
  '      return;',
  '    }',
  '',
  '    for (let col = 0; col < n; col++) {',
  '      if (cols.has(col) ||',
  '          diagA.has(row - col) ||',
  '          diagB.has(row + col)) continue;   // square is attacked',
  '',
  '      queens[row] = col;                // commit: place the queen',
  '      cols.add(col);',
  '      diagA.add(row - col);',
  '      diagB.add(row + col);',
  '',
  '      place(row + 1);                   // descend to the next row',
  '',
  '      queens.pop();                     // undo the choice',
  '      cols.delete(col);',
  '      diagA.delete(row - col);',
  '      diagB.delete(row + col);',
  '    }',
  '  }',
  '',
  '  place(0);',
  '  return solutions;',
  '}',
];

const LINE = {
  call: 8,
  solution: 10,
  try: 14,
  reject: 17,
  place: 19,
  recurse: 24,
  undo: 26,
  exhaust: 30,
  done: 34,
} as const;

/** The same algorithm in Python, for the code panel's language toggle. */
export const PY_CODE = [
  'def solve_n_queens(n):',
  '    solutions = []',
  '    queens = []      # queens[r] = column of queen in row r',
  '    cols   = set()   # columns already occupied',
  '    diag_a = set()   # ↘ diagonals, keyed by row - col',
  '    diag_b = set()   # ↙ diagonals, keyed by row + col',
  '',
  '    def place(row):',
  '        if row == n:                     # every row filled',
  '            solutions.append(queens[:])  # record a solution',
  '            return',
  '',
  '        for col in range(n):',
  '            if (col in cols or',
  '                    row - col in diag_a or',
  '                    row + col in diag_b):',
  '                continue                 # square is attacked',
  '',
  '            queens.append(col)           # commit: place the queen',
  '            cols.add(col)',
  '            diag_a.add(row - col)',
  '            diag_b.add(row + col)',
  '',
  '            place(row + 1)               # descend to the next row',
  '',
  '            queens.pop()                 # undo the choice',
  '            cols.discard(col)',
  '            diag_a.discard(row - col)',
  '            diag_b.discard(row + col)',
  '        # every column tried — fall back to the previous row',
  '',
  '    place(0)',
  '    return solutions',
];

const PY = {
  call: 8,
  solution: 10,
  try: 13,
  reject: 17,
  place: 19,
  recurse: 24,
  undo: 26,
  exhaust: 30,
  done: 33,
} as const satisfies Record<keyof typeof LINE, number>;

export const PY_LINE: Record<number, number> = Object.fromEntries(
  (Object.keys(LINE) as (keyof typeof LINE)[]).map((key) => [LINE[key], PY[key]]),
);

/** Algebraic-ish name for a square, so the commentary reads like chess notation. */
function square(row: number, col: number, n: number): string {
  return `${String.fromCharCode(97 + col)}${n - row}`;
}

export function buildNQueensTrace({ n, findAll }: NQueensParams): Trace<NQueensPayload> {
  const rec = new TraceRecorder<NQueensPayload>();

  const cols = new Set<number>();
  const diagA = new Set<number>();
  const diagB = new Set<number>();

  // Snapshots are shared by reference between events that did not change the
  // board, which keeps a 200k-event trace affordable.
  let queens: readonly number[] = [];
  let solutions = 0;

  const attackersOf = (row: number, col: number): number[] => {
    const rows: number[] = [];
    for (let r = 0; r < queens.length; r++) {
      const c = queens[r];
      if (c === col || r - c === row - col || r + c === row + col) rows.push(r);
    }
    return rows;
  };

  function place(row: number): void {
    rec.push('call', LINE.call, `place(${row}) — search row ${row}`, { queens, row });

    if (row === n) {
      solutions++;
      rec.bump('solutions');
      rec.push(
        'solution',
        LINE.solution,
        `solution #${solutions} found — all ${n} queens are safe`,
        { queens, row },
      );
      rec.mark(`#${solutions}`);
      if (!findAll) rec.halt();
      return;
    }

    for (let col = 0; col < n; col++) {
      rec.push('try', LINE.try, `row ${row}: try column ${col} (${square(row, col, n)})`, {
        queens,
        row,
        col,
      });

      if (cols.has(col) || diagA.has(row - col) || diagB.has(row + col)) {
        const attackers = attackersOf(row, col);
        rec.bump('rejected');
        rec.push(
          'reject',
          LINE.reject,
          `${square(row, col, n)} is attacked by ${attackers.length} queen${
            attackers.length > 1 ? 's' : ''
          } — skip`,
          { queens, row, col, attackers },
        );
        continue;
      }

      queens = [...queens, col];
      cols.add(col);
      diagA.add(row - col);
      diagB.add(row + col);
      rec.bump('placed');
      rec.push('place', LINE.place, `place queen at ${square(row, col, n)}`, { queens, row, col });
      rec.push('recurse', LINE.recurse, `descend to row ${row + 1}`, { queens, row, col });

      place(row + 1);

      queens = queens.slice(0, -1);
      cols.delete(col);
      diagA.delete(row - col);
      diagB.delete(row + col);
      rec.bump('backtracks');
      rec.push(
        'undo',
        LINE.undo,
        `dead end below — lift the queen off ${square(row, col, n)}`,
        { queens, row, col },
      );
    }

    rec.push(
      'exhaust',
      LINE.exhaust,
      row === 0
        ? 'row 0 exhausted — the whole search tree has been explored'
        : `row ${row} has no legal column left — return to row ${row - 1}`,
      { queens, row },
    );
  }

  return rec.run(
    () => place(0),
    () => {
      queens = [];
      rec.push(
        'done',
        LINE.done,
        `search complete — ${solutions} solution${solutions === 1 ? '' : 's'} found`,
        { queens },
      );
    },
  );
}
