import type { ComponentType } from 'react';
import type { Trace, TraceEvent } from './trace';

export type Tone = 'plain' | 'gold' | 'red' | 'green';

export interface StatSpec {
  key: string;
  label: string;
  tone?: Tone;
}

/** Jump the playhead to the first event (after the current one) matching a test. */
export type Seek<P> = (predicate: (event: TraceEvent<P>) => boolean) => void;

export interface StageProps<Params, P> {
  event: TraceEvent<P>;
  params: Params;
  /** Lets a stage make itself clickable — "jump to the next time X happens". */
  seek: Seek<P>;
}

export interface ParamsProps<Params> {
  value: Params;
  onChange: (next: Params) => void;
}

/**
 * Everything a visualizer needs to exist. Adding an algorithm means writing one
 * of these — the frame, playback, code sync, timeline and keyboard handling are
 * all shared.
 */
export interface AlgorithmDef<Params, P> {
  slug: string;
  title: string;
  /** Small caps line above the title, e.g. "Backtracking / Study №1". */
  kicker: string;
  /** One sentence explaining the problem. */
  blurb: string;
  /** Name of the function shown in the code panel header. */
  fnName: string;
  /** Header name when Python is selected; falls back to fnName. */
  pyFnName?: string;
  /** The source, one string per line. Event `line` numbers index into this. */
  code: string[];
  /** Python rendering of the same source, toggled in the code panel. */
  pyCode: string[];
  /** JS event line → Python line. Unmapped lines highlight nothing. */
  pyLine: Record<number, number>;
  stats: StatSpec[];
  defaultParams: Params;
  build(params: Params): Trace<P>;
  Params: ComponentType<ParamsProps<Params>>;
  Stage: ComponentType<StageProps<Params, P>>;
  /** Optional panel under the code — call stack, queue contents, etc. */
  Inspector?: ComponentType<{ event: TraceEvent<P>; params: Params }>;
  /** Heading for the bookmarks strip, e.g. "Solutions found". */
  marksLabel: string;
  /** Empty-state line for the bookmarks strip. */
  marksEmpty: string;
  /** Optional thumbnail for a bookmark; falls back to a plain label chip. */
  MarkThumb?: ComponentType<{ mark: { index: number; label: string }; params: Params; trace: Trace<P> }>;
  /** Shown when the recorder hits its cap. */
  truncatedHint?: string;
}

/** Helper so each algorithm module can export a well-typed def without generics noise. */
export function defineAlgorithm<Params, P>(def: AlgorithmDef<Params, P>): AlgorithmDef<Params, P> {
  return def;
}

/**
 * The registry and the frame hold definitions of differing shapes side by side.
 * TypeScript has no existential types, so this is the escape hatch — it is only
 * ever used where the params and payload genuinely cannot be known statically.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyAlgorithmDef = AlgorithmDef<any, any>;
