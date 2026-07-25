'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AnyAlgorithmDef, Tone } from '@/lib/algorithm';
import type { Lang } from '@/lib/highlight';
import type { TraceEvent } from '@/lib/trace';
import { useTracePlayer } from '@/lib/useTracePlayer';
import CodePanel from './CodePanel';
import Timeline from './Timeline';
import { MarksStrip, StatGrid, StatusBar } from './Readouts';
import styles from './VisualizerFrame.module.css';

/**
 * The two-pane shell shared by every visualizer: stage and controls on the
 * left, source on the right. Everything here is algorithm-agnostic — the def
 * supplies the stage, the code, and the trace.
 */
export default function VisualizerFrame({ def }: { def: AnyAlgorithmDef }) {
  const [params, setParams] = useState(def.defaultParams);
  const [lang, setLang] = useState<Lang>('js');

  // Re-running the algorithm is the expensive part, so it is keyed on params.
  const trace = useMemo(() => def.build(params), [def, params]);
  const player = useTracePlayer(trace.events.length);

  const event: TraceEvent<unknown> | undefined = trace.events[player.index];

  const seek = useCallback(
    (predicate: (candidate: TraceEvent<unknown>) => boolean) => {
      player.pause();
      const { events } = trace;
      // Search forward from the playhead, then wrap — "find the next time this
      // happens" is almost always what you mean when you click something.
      for (let i = player.index + 1; i < events.length; i++) {
        if (predicate(events[i])) return player.goto(i);
      }
      for (let i = 0; i <= player.index; i++) {
        if (predicate(events[i])) return player.goto(i);
      }
    },
    [player, trace],
  );

  // Keyboard transport. Ignored while a control has focus so arrow keys still
  // adjust the sliders.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT')) {
        if (e.key !== ' ') return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        player.toggle();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        player.stepForward();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        player.stepBack();
      } else if (e.key === 'r' || e.key === 'R') {
        player.reset();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [player]);

  if (!event) return null;

  const tone: Tone = toneFor(event.type);
  const { Stage, Params, Inspector, MarkThumb } = def;

  return (
    <div className={styles.shell}>
      {/* ══════════ stage ══════════ */}
      <section className={styles.left}>
        <div className={styles.intro}>
          <div>
            <p className={styles.kicker}>{def.kicker}</p>
            <h1 className={styles.title}>{def.title}</h1>
          </div>
          <p className={styles.blurb}>{def.blurb}</p>
        </div>

        <div className="lab">Setup</div>
        <Params value={params} onChange={setParams} />

        <div className={styles.workbench}>
          <div className={styles.stageCol}>
            <Stage event={event} params={params} seek={seek} />
          </div>

          <div className={styles.sideCol}>
            <StatusBar message={event.msg} tone={tone} />
            <StatGrid specs={def.stats} stats={event.stats} step={player.index} />
            <div className="lab">{def.marksLabel}</div>
            <MarksStrip
              marks={trace.marks}
              index={player.index}
              empty={def.marksEmpty}
              onPick={(i) => {
                player.pause();
                player.goto(i);
              }}
            >
              {MarkThumb
                ? trace.marks
                    .slice(0, 120)
                    .map((mark) => (
                      <MarkThumb key={mark.index} mark={mark} params={params} trace={trace} />
                    ))
                : undefined}
            </MarksStrip>
          </div>
        </div>

        <Timeline player={player} length={trace.events.length} />
      </section>

      {/* ══════════ source ══════════ */}
      <section className={styles.right}>
        <div className={styles.codeHead}>
          <span className={styles.fnName}>
            {lang === 'py' ? (def.pyFnName ?? def.fnName) : def.fnName}
          </span>
          <span className={styles.codeTag}>line-synced</span>
          <div className="seg">
            <button aria-pressed={lang === 'js'} onClick={() => setLang('js')}>
              JS
            </button>
            <button aria-pressed={lang === 'py'} onClick={() => setLang('py')}>
              Python
            </button>
          </div>
        </div>

        {trace.truncated && (
          <p className={styles.warn}>
            {def.truncatedHint ??
              `Trace capped at ${trace.limit.toLocaleString()} steps — this run is bigger than the page will hold.`}
          </p>
        )}

        <CodePanel
          code={lang === 'py' ? def.pyCode : def.code}
          lang={lang}
          activeLine={lang === 'py' ? (def.pyLine[event.line] ?? 0) : event.line}
          instant={player.playing && player.rate > 30}
        />

        {Inspector && (
          <div className={styles.inspector}>
            <Inspector event={event} params={params} />
          </div>
        )}
      </section>
    </div>
  );
}

/** Event types ending in these suffixes get a consistent colour across algorithms. */
function toneFor(type: string): Tone {
  if (/reject|skip|undo|stale|dead|cycle/.test(type)) return 'red';
  if (/solution|goal|done|found|path|accept|converge|span/.test(type)) return 'green';
  return 'plain';
}
