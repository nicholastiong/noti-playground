'use client';

import type { StatSpec, Tone } from '@/lib/algorithm';
import type { Mark } from '@/lib/trace';
import styles from './Readouts.module.css';

/* ── the running commentary ───────────────────────────── */

export function StatusBar({ message, tone }: { message: string; tone: Tone }) {
  return (
    <div className={`${styles.status} ${styles[tone]}`} role="status" aria-live="polite">
      <span className={styles.dot} />
      {/* Numbers are emphasised so the sentence is scannable at speed. */}
      <span>
        {message.split(/(\d+)/).map((part, i) =>
          /^\d+$/.test(part) ? <b key={i}>{part}</b> : <span key={i}>{part}</span>,
        )}
      </span>
    </div>
  );
}

/* ── counters ─────────────────────────────────────────── */

export function StatGrid({
  specs,
  stats,
  step,
}: {
  specs: StatSpec[];
  stats: Readonly<Record<string, number>>;
  step: number;
}) {
  return (
    <div className={styles.stats}>
      <div className={styles.stat}>
        <div className={styles.key}>Step</div>
        <div className={styles.value}>{step}</div>
      </div>
      {specs.map((spec) => (
        <div key={spec.key} className={`${styles.stat} ${styles[spec.tone ?? 'plain']}`}>
          <div className={styles.key}>{spec.label}</div>
          <div className={styles.value}>{stats[spec.key] ?? 0}</div>
        </div>
      ))}
    </div>
  );
}

/* ── bookmarks ────────────────────────────────────────── */

export function MarksStrip({
  marks,
  index,
  empty,
  onPick,
  children,
}: {
  marks: Mark[];
  index: number;
  empty: string;
  onPick: (markIndex: number) => void;
  /** Optional per-mark thumbnails, in the same order as `marks`. */
  children?: React.ReactNode[];
}) {
  if (marks.length === 0) return <div className={styles.empty}>{empty}</div>;

  const shown = marks.slice(0, 120);

  return (
    <div className={styles.strip}>
      {shown.map((mark, i) => {
        const reached = index >= mark.index;
        const current = index === mark.index;
        return (
          <button
            key={mark.index}
            className={[styles.mark, reached ? styles.reached : '', current ? styles.current : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onPick(mark.index)}
            title={`Jump to ${mark.label}`}
          >
            {children?.[i]}
            <span className={styles.caption}>{mark.label}</span>
          </button>
        );
      })}
      {marks.length > shown.length && (
        <div className={styles.empty}>+{marks.length - shown.length} more</div>
      )}
    </div>
  );
}
