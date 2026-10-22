# @0xintuition/pipeline-runtime

**Effect-free runtime utilities for classification and enrichment pipelines.**

ESM-only, Node >=20. Shared error and outcome vocabulary, bounded Promise concurrency,
circuit breaking, cancellable cache contracts, bounded response reading, and provider
observation. No runtime or peer dependencies.

## Install

```sh
npm install @0xintuition/pipeline-runtime@alpha
```

## Bounded work and cancellation

```ts
import { forEachBounded } from '@0xintuition/pipeline-runtime/concurrency';

const outcomes = await forEachBounded(urls, async (url, signal) => {
  const response = await fetch(url, { signal });
  return response.status;
}, { concurrency: 4, signal: controller.signal });
```

Results retain input order. Synchronous callback throws produce `defect`; returned
Promise rejections produce `failure`. Nonfinite concurrency becomes 1; other values
are floored and clamped to at least 1. Parent cancellation stops queued work, signals
active callbacks, and rejects with the exact abort reason. Callbacks must honor their
signal to stop underlying I/O; JavaScript cannot forcibly interrupt an arbitrary Promise.

`CircuitBreaker.execute(run, { signal? })` accepts a Promise callback receiving an
`AbortSignal`. It preserves failure thresholds, reset windows, a single half-open
probe, failure filtering, and generation checks against stale completions. Cancellation
of an admitted call passes through `shouldRecordFailure`; cancellation before admission
starts no work and changes no state. `snapshot()` and `refusesRequests()` are read-only.

## Modules

| Subpath | Contents |
| --- | --- |
| `.` | Shared errors and TMDB endpoint builder |
| `./bounded-text` | Bounded streaming response text |
| `./cache` | Cancellable cache contract and memory TTL adapter |
| `./circuit-breaker` | Promise circuit breaker, errors, snapshots |
| `./concurrency` | Ordered bounded Promise execution |
| `./errors` | Pipeline error vocabulary |
| `./outcome` | Plain `Outcome` union and Promise settlement/cancellation/timeout helpers |
| `./provider-observer` | Provider observation contracts and vocabulary |
| `./provider-metrics-contract` | Metrics labels, normalization, and series contract |
| `./retry-after` | Retry-After parsing and bounds |
| `./letterboxd` | Letterboxd provider host policy and circuit state |
| `./letterboxd-page` | Letterboxd page identity parsing |
| `./tmdb` | TMDB provider endpoint policy |
| `./testing/prometheus-exposition` | Prometheus exposition validation and optional promtool invocation (Node) |
| `./package.json` | Package metadata |

Letterboxd and TMDB are **provider host policies**, not universal pipeline rules.
Their app subpath names are retained so consumers can migrate package resolution
without renaming those imports. The pure source modules were copied from the app at
`7fc0c82b4` (formatting and test-runner imports aside).

## Outcome and consumer integrations

`Outcome<A, E>` retains the app's `success`, `failure`, `defect`, `timeout`, and
`interrupted` variants. `runWithSignal(run, { signal?, rejectOnFailure? })` accepts a
lazy Promise callback, settles as an outcome by default, and optionally rejects.
`toOutcome` accepts a `PromiseSettledResult`; `withTimeout(run, timeoutMs)` returns a
lazy callback with a child signal and private timeout identity. Parent listeners and
timeout timers are removed after settlement. Foreign timeout-shaped errors remain
ordinary failures.

Effect integrations stay in the consumer: `services.ts`, `retry.ts`,
`internal/effect-compat.ts`, and the Effect runner/cause/retry machinery in
`internal/outcome-core.ts`. The app's `outcome.ts` is a re-export of that Effect
implementation, so its functions could not be copied verbatim into this dependency-free
package. Promise helpers here do not accept Effect values or `Exit`/`Cause` objects.
Consumer adapters must retain `executeEffect`, `forEachBoundedEffect`, Effect
`toOutcome`/`withTimeout`/`runWithSignal`, and service Layers where needed.

## Verification

Vitest ports the app's pure-module and Promise circuit expectations, including
stale completions, cancellation, per-item failures, and listener cleanup. Tarball
smoke tests exercise the public subpaths from Node and Bun.

## License

MIT.
