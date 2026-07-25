'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Slider position (0-100) to steps per second, on a log scale from 1 to ~400. */
export function stepsPerSecond(slider: number): number {
  return Math.round(Math.pow(10, (slider / 100) * 2.6));
}

/** Most steps we will consume in a single frame, so a fast run stays responsive. */
const MAX_STEPS_PER_FRAME = 4000;

export interface TracePlayer {
  index: number;
  playing: boolean;
  speed: number;
  rate: number;
  setSpeed: (slider: number) => void;
  goto: (index: number) => void;
  stepForward: () => void;
  stepBack: () => void;
  reset: () => void;
  toEnd: () => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
}

/**
 * Owns the playhead. Playback advances the index inside one rAF loop and paints
 * a single frame per tick, so 400 steps/sec costs the same render budget as 1.
 */
export function useTracePlayer(length: number): TracePlayer {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(46);

  const indexRef = useRef(0);
  const speedRef = useRef(speed);
  const lastIndex = Math.max(0, length - 1);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // A new trace (different params) invalidates the playhead.
  useEffect(() => {
    indexRef.current = 0;
    setIndex(0);
    setPlaying(false);
  }, [length]);

  const goto = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(lastIndex, next));
      indexRef.current = clamped;
      setIndex(clamped);
    },
    [lastIndex],
  );

  const pause = useCallback(() => setPlaying(false), []);

  const play = useCallback(() => {
    if (indexRef.current >= lastIndex) goto(0);
    setPlaying(true);
  }, [goto, lastIndex]);

  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);

  const stepForward = useCallback(() => {
    pause();
    goto(indexRef.current + 1);
  }, [goto, pause]);

  const stepBack = useCallback(() => {
    pause();
    goto(indexRef.current - 1);
  }, [goto, pause]);

  const reset = useCallback(() => {
    pause();
    goto(0);
  }, [goto, pause]);

  const toEnd = useCallback(() => {
    pause();
    goto(lastIndex);
  }, [goto, lastIndex, pause]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = 0;
    let carry = 0;

    const tick = (time: number) => {
      if (!last) last = time;
      carry += ((time - last) / 1000) * stepsPerSecond(speedRef.current);
      last = time;

      const whole = Math.floor(carry);
      if (whole > 0) {
        carry -= whole;
        const next = Math.min(lastIndex, indexRef.current + Math.min(whole, MAX_STEPS_PER_FRAME));
        indexRef.current = next;
        setIndex(next);
        if (next >= lastIndex) {
          setPlaying(false);
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, lastIndex]);

  return {
    index,
    playing,
    speed,
    rate: stepsPerSecond(speed),
    setSpeed,
    goto,
    stepForward,
    stepBack,
    reset,
    toEnd,
    play,
    pause,
    toggle,
  };
}
