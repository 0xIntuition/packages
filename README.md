# Intuition Packages

Public alpha package workspace for Intuition protocol and semantic engineering libraries.

These packages split Intuition's protocol, identity, and knowledge-graph modeling tools into focused ESM-only TypeScript packages. Builders can install only the layers they need while still converging on shared Intuition vocabulary, deterministic IDs, and graph modeling conventions.

[View the @0xintuition npm organization](https://www.npmjs.com/org/0xintuition).

## Start Here

The fastest way to see the packages working together is the hackathon quickstart:

```bash
cd examples/hackathon-quickstart
bun run dev
```

The example is dry-run only: no wallet, API key, or live submission service is required. It shows how Creation Profiles drive atom data, metadata predicate relationships, sameAs identity links, deterministic IDs, and generated UI surfaces.

## What You Can Build

Use these packages to build Intuition-aligned knowledge graph flows:

- schema-backed atom creation forms with shared classification fields
- metadata predicate pickers that suggest valid relationship triples
- deterministic atom, predicate, triple, and counter-triple IDs before writing on-chain
- sameAs identity-linking flows that separate atom payload choices from graph-growth choices
- generated creation UIs from package data instead of app-local shadow maps
- protocol read/write surfaces once your app owns submission and wallet flow

For known creation flows, start from a Creation Profile:

```ts
import { musicRecordingCreationProfile } from '@0xintuition/classifications/creation/music-recording'

const fields = musicRecordingCreationProfile.fields
const relationships = musicRecordingCreationProfile.relationships
```

Use `fields` to render atom inputs and `relationships` to suggest triples such as
`MusicRecording -> inPlaylist -> MusicPlaylist`.

## Package Layers

| Layer | Packages | Purpose |
| --- | --- | --- |
| Semantic / data modeling | `schema-org`, `classifications`, `predicates` | Canonical vocabulary, schema references, recommended atom fields, metadata predicates, and relationship guardrails |
| Identity | `ids` | Deterministic content-addressable IDs for atoms, predicates, triples, counter-triples, and OAuth atoms |
| Builder helpers | `primitives` | Higher-level atom, predicate, triple, discovery, and validation helpers |
| Protocol plumbing | `protocol`, `deployments`, `periphery`, `curves`, `react` | ABIs, bytecode, chain/deployment metadata, bridge/router and fee-proxy helpers, curve math, and React hooks |
| Integration and agents | `sdk`, `cli` | Action planning and read helpers over the protocol packages, plus side-effect-free calldata encoders, plan builders, and the `intuition` executable |

## Packages

- [`@0xintuition/schema-org`](https://www.npmjs.com/package/@0xintuition/schema-org) - pinned schema.org vocabulary with inherited property lookup.
- [`@0xintuition/classifications`](https://www.npmjs.com/package/@0xintuition/classifications) - Intuition classification specs, Creation Profiles, recommended atom fields, and metadata predicates.
- [`@0xintuition/predicates`](https://www.npmjs.com/package/@0xintuition/predicates) - canonical predicate registry, deterministic predicate IDs, launch constants, and display helpers.
- [`@0xintuition/ids`](https://www.npmjs.com/package/@0xintuition/ids) - deterministic atom, predicate, triple, counter-triple, and OAuth atom IDs.
- [`@0xintuition/primitives`](https://www.npmjs.com/package/@0xintuition/primitives) - high-level builders and validators for off-chain Intuition data.
- [`@0xintuition/protocol`](https://www.npmjs.com/package/@0xintuition/protocol) - core contract wrappers, event parsers, and protocol interaction helpers; re-exports core ABIs, deployment addresses, and chain metadata from `@0xintuition/deployments`.
- [`@0xintuition/deployments`](https://www.npmjs.com/package/@0xintuition/deployments) - the single source of Intuition contract ABIs, deploy bytecode, core and periphery deployment addresses, and chain metadata.
- [`@0xintuition/periphery`](https://www.npmjs.com/package/@0xintuition/periphery) - periphery bridge/router and FeeProxy helpers and calldata utilities; addresses come from `@0xintuition/deployments`.
- [`@0xintuition/curves`](https://www.npmjs.com/package/@0xintuition/curves) - bonding curve math helpers, including dynamic-fee curve quotes and exact-net gross-up quotes.
- [`@0xintuition/sdk`](https://www.npmjs.com/package/@0xintuition/sdk) - integration SDK with API reads, onchain action planning helpers, and deterministic utilities.
- [`@0xintuition/cli`](https://www.npmjs.com/package/@0xintuition/cli) - agent-oriented calldata encoders, action plan builders, and the `intuition` executable.
- [`@0xintuition/react`](https://www.npmjs.com/package/@0xintuition/react) - React provider and hooks for protocol reads/writes.

## Install

Most fresh packages are alpha packages:

```bash
bun add @0xintuition/classifications@alpha @0xintuition/predicates@alpha
```

`@0xintuition/protocol` uses the `4.x` line: `3.x` superseded the previous monolithic protocol package, and `4.0.0` carries the v1.1.0 contract ABIs with breaking wrapper changes. `@0xintuition/sdk` also continues an existing npm line at `4.x`.

## Validation

```bash
bun install --frozen-lockfile
bun run build
bun run typecheck
bun run test
bun run check
bun run schema:validate
bun run schema-org:check-generated
bun run classifications:check-creation-profiles
bun run predicates:check-generated
bun run guard:supply-chain
bun run pack:dry-run
bun run smoke:tarballs
```

## Contributing and Releases

- [Contributing guide](./CONTRIBUTING.md)
- [Release strategy and runbook](./docs/release.md)

Package roots are npm-publishable artifacts. Release PRs should follow the validation gate, dist-tag policy, and publish order documented in [docs/release.md](./docs/release.md).
