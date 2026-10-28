# @0xintuition/atom-runtime

Shared Promise-based composition for classification and enrichment. Requires Node.js 20 or newer.

```ts
import { createProcessingRuntime } from '@0xintuition/atom-runtime'

const runtime = createProcessingRuntime({
  env: {},
  cache: { provider: 'memory' },
})
const classification = runtime.classification.engine()
const enrichment = runtime.enrichment.engine('default')
// Use the engines' classify/enrich methods with your application's requests.
runtime.dispose()
```

`createProcessingRuntime({ config, runtime, overrides })` also accepts explicit clock, logger,
cache fetcher and private plugin overrides. Engines and caches are shared within a runtime.
Enrichment instances are memoized by preset and identity capability. Dispose prevents new engine
lookups; applications remain responsible for cancelling requests already in flight.

Public subpaths: `presets`, `fingerprint`, `consumers`, `config`, `adapters/upstash`, and `package.json`.
The root exports configuration schemas, `pickProcessingEnv`, preset factories, `defaultScopes`,
cache/runtime factories, consumer adapters, and `computeProcessingConfigFingerprint`.
The `default` preset uses the server-default provider bundle, matching the reference application.
The `createEngine` methods remain aliases for reference consumers.

Provider credentials must be injected. Only named FromEnv adapter helpers read the environment
when called. Classifier error observers are optional and cannot change classification results.
Fingerprints include secret presence, never secret values; plugin overrides affect runtime fingerprints.
The frozen reference default with caching disabled is
`processing-v1:8950483d4d7ec82b080b7f638bfaa0cc2aa6d6298e442c38a68a2e16c0d84b1a`.

Applications own persistence, queueing, retry policy, and Effect integration.

The reference HEAD configuration hashes to `d8e665…`; the fingerprint helper aliases only that
exact digest to the required `895048…` base namespace. Changed configurations retain their own hashes.
