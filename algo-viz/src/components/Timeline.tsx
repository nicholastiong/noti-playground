'use client';

import type { TracePlayer } from '@/lib/useTracePlayer';
import styles from './Timeline.module.css';

interface Props {
  player: TracePlayer;
  length: number;
}

export default function Timeline({ player, length }: Props) {
  const last = Math.max(0, length - 1);

  return (
    <div className={styles.deck}>
      <div className={styles.controls}>
        <button className="btn" onClick={player.reset} title="Reset (R)">
          ⏮ reset
        </button>
        <button
          className="btn"
          onClick={player.stepBack}
          disabled={player.index === 0}
          title="Step back (←)"
        >
          ◀ step
        </button>
        <button className="btn pri" onClick={player.toggle} title="Play / pause (space)">
          {player.playing ? '❚❚ pause' : '▶ play'} <span className="kbd">space</span>
        </button>
        <button
          className="btn"
          onClick={player.stepForward}
          disabled={player.index >= last}
          title="Step forward (→)"
        >
          step ▶
        </button>
        <button className="btn" onClick={player.toEnd} title="Jump to the end">
          end ⏭
        </button>

        <label className={styles.speed}>
          <span className={styles.num}>speed</span>
          <input
            type="range"
            min={0}
            max={100}
            value={player.speed}
            onChange={(e) => player.setSpeed(Number(e.target.value))}
            aria-label="Playback speed"
          />
          <span className={styles.num}>{player.rate} /s</span>
        </label>
      </div>

      <div className={styles.scrub}>
        <span className={styles.num}>{player.index}</span>
        <input
          type="range"
          min={0}
          max={last}
          value={player.index}
          onChange={(e) => {
            player.pause();
            player.goto(Number(e.target.value));
          }}
          aria-label="Scrub through the trace"
        />
        <span className={styles.num}>/ {last}</span>
      </div>
    </div>
  );
}
