# Trace — algorithm studies

Step through classic algorithms one decision at a time. Each study shows the
picture on the left and the source on the right, with the current line lit up.

```bash
npm run dev
```

## How it works

Nothing is animated directly. Each algorithm is **run once, up front**,
instrumented so every interesting moment is recorded as a `TraceEvent`:

```ts
rec.push('relax', 22, `${d} + ${w} = ${alt}, cheaper than ${current}`, snapshot);
```

The UI is then a pure function of `(trace, index)`. Scrubbing, stepping
backwards, jumping to a bookmark and replaying at 400 steps/sec all fall out of
that for free — there is no animation state to unwind.

Every event carries the source line it corresponds to, which is what keeps the
code panel in sync.

| File | Role |
| --- | --- |
| `src/lib/trace.ts` | `TraceRecorder` — records events, snapshots counters, caps runaway traces |
| `src/lib/algorithm.ts` | The `AlgorithmDef` contract each study implements |
| `src/lib/useTracePlayer.ts` | Owns the playhead; batches fast playback to one paint per frame |
| `src/components/VisualizerFrame.tsx` | The shared two-pane shell, keyboard transport, seeking |
| `src/algorithms/*/` | One folder per study |

## Adding a study

1. Create `src/algorithms/<slug>/`.
2. Write `trace.ts`: export the source as a `string[]`, plus a `build(params)`
   that runs the algorithm against a `TraceRecorder`. Line numbers in the events
   index into that array.
3. Write a `Stage` component. It receives one `TraceEvent` and draws that
   moment — no animation logic, no timers. Optionally a `Params` editor and an
   `Inspector` for the algorithm's internal state.
4. `export default defineAlgorithm({ ... })` in `index.tsx`.
5. Register it in `src/algorithms/registry.ts` **and** `src/algorithms/meta.ts`.

The route, playback, timeline, code sync, stat grid, bookmarks and keyboard
handling are all inherited.

`meta.ts` is split from `registry.ts` deliberately: definitions carry React
components and cannot cross the server/client boundary, so server components
(the index page, route metadata, `generateStaticParams`) read the plain metadata
instead.

## Keyboard

`space` play/pause · `←` `→` step · `R` reset
