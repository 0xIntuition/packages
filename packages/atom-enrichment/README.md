# @0xintuition/atom-enrichment

Composable enrichment engine, provider adapters, field extraction, and cache contracts for classified atoms. Published as typed ESM for Node.js 20+ and Bun.

```sh
npm install @0xintuition/atom-enrichment@0.1.0-alpha.0
```

```ts
import {
  createEnrichmentEngine,
  createMemoryCacheAdapter,
  createOpenGraphPlugin,
} from '@0xintuition/atom-enrichment';

const engine = createEnrichmentEngine({
  plugins: [createOpenGraphPlugin()],
  cache: createMemoryCacheAdapter({ maxEntries: 1_000 }),
});

const result = await engine.enrich({
  runtime: 'server',
  input: {
    atomType: 'thing',
    jsonLd: { '@context': 'https://schema.org', '@type': 'Thing' },
    hints: { url: 'https://example.com' },
    source: {
      classificationEngine: 'my-application',
      classifiedAt: new Date().toISOString(),
    },
  },
});
```

## Ownership and integration

This library executes enrichment plugins and extracts metadata. `@0xintuition/classifications` owns canonical entity specifications and required fields; `@0xintuition/iid-registry` owns IID provider planning. The local classification registry validates provider artifact payloads. It is not a replacement for either canonical contract. The `provider-plan` and `handoff` entry points adapt those contracts without importing Core services.

Applications select plugins and presets, inject credentials and fetch implementations, configure cache adapters, and own worker scheduling, retries, persistence, network policy, and logging. Provider constructors accept options; `createServerDefaultPresetOptions(env)` maps an explicitly supplied environment into preset options. `createUpstashCacheAdapterFromEnv()` optionally reads `process.env` when invoked. Importing the runtime performs no environment lookup, network request, or filesystem access.

Reusable memory and HTTP cache adapters are included. Creating a cache adapter does not provision infrastructure. Server providers need the appropriate upstream credentials; browser consumers should select plugins whose declared runtime is compatible and pass any required environment explicitly.

The extraction preserves Core's existing plugin and artifact contracts, including renderer metadata and builtin presets. Changes to their semantics belong in separately reviewed API changes.

## Entry points

- Root: engine, registries, providers, presets, handoff helpers, and public types.
- `engine`, `plugins`, `plugin-registry`, `providers`, `presets`, `cache`: runtime composition.
- `types`, `handoff`, `provider-data`, `provider-external-data`, `provider-plan`, `slug-aliases`: integration contracts.
- `classifications`, `classifications/defaults`, `classifications/registry`, `classifications/schemas`: provider artifact validation.
- `extraction`: structured metadata extraction using canonical classification specifications.
- `testing`: deterministic fixtures and `runPluginConformanceSuite`. This entry point uses `node:test` and `node:assert/strict`, works under Node and Bun test runners, and is intended for tests rather than browser bundles.

See [provider payload documentation](./docs/README.md) for individual provider contracts.

## Development

From this directory in the packages repository:

```sh
bun run build
bun run typecheck
bun run test
bun run test:node
bun run check
bun run pack:dry-run
```

Tests inject provider responses and run without live credentials. Builds emit JavaScript and declarations under `dist`, normalize ESM import extensions, and preserve every documented subpath export. `test:node` builds the package and executes the public testing entry point in Node.
