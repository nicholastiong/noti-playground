'use client';

import { useEffect, useRef } from 'react';
import { tokenize, type Lang } from '@/lib/highlight';
import styles from './CodePanel.module.css';

interface Props {
  code: string[];
  lang?: Lang;
  /** 1-indexed line to highlight, or 0 for none. */
  activeLine: number;
  /** Skip smooth scrolling while the trace is running fast. */
  instant?: boolean;
}

export default function CodePanel({ code, lang = 'js', activeLine, instant = false }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // Keep the highlighted line in view, but only when it has drifted off.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const line = activeRef.current;
    if (!scroller || !line) return;

    const top = line.offsetTop;
    const height = scroller.clientHeight;
    if (top < scroller.scrollTop + 24 || top > scroller.scrollTop + height - 48) {
      scroller.scrollTo({ top: top - height / 2, behavior: instant ? 'auto' : 'smooth' });
    }
  }, [activeLine, instant]);

  return (
    <div className={styles.scroller} ref={scrollerRef}>
      {code.map((line, i) => {
        const number = i + 1;
        const active = number === activeLine;
        return (
          <div
            key={number}
            ref={active ? activeRef : undefined}
            className={active ? `${styles.line} ${styles.active}` : styles.line}
          >
            <span className={styles.gutter}>{number}</span>
            <span className={styles.text}>
              {tokenize(line, lang).map((token, j) => (
                <span key={j} className={styles[token.kind]}>
                  {token.text}
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
