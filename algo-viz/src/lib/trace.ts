/**
 * The core idea of this whole app.
 *
 * An algorithm is not animated directly. Instead it is run once, up front,
 * instrumented so that every interesting moment is recorded as a `TraceEvent`.
 * The UI then becomes a pure function of `(trace, index)` — which is what makes
 * scrubbing, stepping backwards and jumping to a bookmark all fall out for free.
 *
 * Each event carries the source line it corresponds to, which is how the code
 * panel stays in sync with the picture.
 */

export interface TraceEvent<P> {
  /** Discriminator the stage switches on, e.g. "relax" | "reject". */
  type: string;
  /** 1-indexed line in the algorithm's `code` array to highlight. */
  line: number;
  /** Human sentence shown in the status bar. */
  msg: string;
  /** Everything the stage needs to draw this moment. Treat as immutable. */
  payload: P;
  /** Running counters, snapshotted. Shared by reference when unchanged. */
  stats: Readonly<Record<string, number>>;
}

/** A bookmarked moment — a solution, a goal reached — shown in the marks strip. */
export interface Mark {
  index: number;
  label: string;
}

export interface Trace<P> {
  events: TraceEvent<P>[];
  marks: Mark[];
  /** True when the recorder hit its event cap and the run was cut short. */
  truncated: boolean;
  limit: number;
}

/** Thrown internally to unwind out of a deep recursion once the cap is hit. */
const TRACE_LIMIT = Symbol('trace-limit');

export const DEFAULT_LIMIT = 220_000;

/**
 * Records events while an algorithm runs.
 *
 * Algorithms stay readable: they call `push` at the points that matter and are
 * otherwise written the way you would write them normally.
 */
export class TraceRecorder<P> {
  private readonly events: TraceEvent<P>[] = [];
  private readonly marks: Mark[] = [];
  private counters: Record<string, number> = {};
  private snapshot: Readonly<Record<string, number>> = {};
  private dirty = true;
  private truncated = false;

  constructor(private readonly limit: number = DEFAULT_LIMIT) {}

  /** Increment a counter shown in the stat grid. */
  bump(key: string, by = 1): void {
    this.counters[key] = (this.counters[key] ?? 0) + by;
    this.dirty = true;
  }

  set(key: string, value: number): void {
    this.counters[key] = value;
    this.dirty = true;
  }

  count(key: string): number {
    return this.counters[key] ?? 0;
  }

  push(type: string, line: number, msg: string, payload: P): void {
    if (this.events.length >= this.limit) {
      this.truncated = true;
      throw TRACE_LIMIT;
    }
    // Counters rarely change between events, so reuse the last snapshot object
    // instead of allocating one per event.
    if (this.dirty) {
      this.snapshot = { ...this.counters };
      this.dirty = false;
    }
    this.events.push({ type, line, msg, payload, stats: this.snapshot });
  }

  /** Bookmark the event just pushed. */
  mark(label: string): void {
    this.marks.push({ index: this.events.length - 1, label });
  }

  /** Stop the run early but keep everything recorded so far (not a truncation). */
  halt(): never {
    throw TRACE_LIMIT;
  }

  /**
   * Run `fn`, absorbing the internal unwind, and hand back the finished trace.
   *
   * `finalize` still runs after an early `halt()` — that is how a run that stops
   * at the first solution can record its closing event — but is skipped when the
   * cap was hit, since there is no room left to push anything.
   */
  run(fn: () => void, finalize?: () => void): Trace<P> {
    try {
      fn();
    } catch (err) {
      if (err !== TRACE_LIMIT) throw err;
    }
    if (finalize && !this.truncated) {
      try {
        finalize();
      } catch (err) {
        if (err !== TRACE_LIMIT) throw err;
      }
    }
    return {
      events: this.events,
      marks: this.marks,
      truncated: this.truncated,
      limit: this.limit,
    };
  }
}
