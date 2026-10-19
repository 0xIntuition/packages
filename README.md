# Intuition Packages

TypeScript libraries for building applications on Intuition’s identity and knowledge graph protocol.

These packages split Intuition's protocol, identity, and knowledge-graph modeling tools into focused ESM-only TypeScript packages. Builders can install only the layers they need while still converging on shared Intuition vocabulary, deterministic IDs, and graph modeling conventions.

[View the @0xintuition npm organization](https://www.npmjs.com/org/0xintuition).

## Start Here

Start with the [offline getting-started guide](./docs/getting-started.md) to build
an atom, understand deterministic identity, and choose the packages your app
needs. No wallet, RPC, or API key is needed to build atom data.

```ts
import { buildIidAnchor } from '@0xintuition/primitives/anchor';

const result = buildIidAnchor('music-recording', { isrc: 'US-RC1-76-07839' });
if (!result.success) throw new Error(result.errors.join('; '));

result.value.iid;     // int:isrc:USRC17607839
result.value.profile; // p0: the atom data is the canonical IID
result.value.dataHex; // hex bytes for contract calls
result.value.id;      // deterministic bytes32 atom ID
```

The IID packages and anchor API are new in this release candidate; the existing
npm `alpha` tags do not yet contain them. See [release readiness](./docs/release-readiness.md)
for the remaining gates, including [publishing the updated contract artifacts](./docs/contract-artifacts.md).

To run the dry-run UI example from a checkout, use Node 22.12+ and the Bun version
pinned in `package.json`:

```bash
bun install --frozen-lockfile
bun run build
cd examples/hackathon-quickstart
bun run dev
```

The example uses Creation Profiles to demonstrate atom inputs, metadata
relationships, sameAs links, and deterministic IDs without submitting transactions.

## Core Concepts

- **Atom:** an entity represented by data bytes, with a deterministic bytes32 ID.
- **Triple:** a relationship between a subject atom, predicate atom, and object atom.
- **IID:** a canonical identifier such as `int:isrc:USRC17607839`; it describes identity,
  while an atom ID hashes the exact representation stored on-chain.
- **Classification and Creation Profile:** shared data describing entity types,
  fields, identity ladders, and suggested relationships.
- **Vault:** the on-chain shares/assets associated with an atom or triple on a
  particular bonding curve.

See the [IID explainer](./packages/iid-spec/explainer.md) for identity schemes and
representation profiles. The packages supply deterministic identity and graph
building tools; application-specific enrichment, ranking, and reasoning policies
remain in your application.

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
| Identity | `iid-spec`, `iid`, `iid-registry`, `iid-ladder`, `ids` | Canonical real-world identifiers, semantic/provider resolution, deterministic input projection, and content-addressable protocol IDs |
| Builder helpers | `primitives` | Higher-level atom, predicate, triple, discovery, and validation helpers |
| Protocol plumbing | `protocol`, `deployments`, `periphery`, `curves`, `react` | ABIs, chain/deployment metadata, bridge/router helpers, curve math, and React hooks |

## Packages

- [`@0xintuition/schema-org`](https://www.npmjs.com/package/@0xintuition/schema-org) - pinned schema.org vocabulary with inherited property lookup.
- [`@0xintuition/classifications`](https://www.npmjs.com/package/@0xintuition/classifications) - Intuition classification specs, Creation Profiles, recommended atom fields, and metadata predicates.
- [`@0xintuition/predicates`](https://www.npmjs.com/package/@0xintuition/predicates) - canonical predicate registry, deterministic predicate IDs, launch constants, and display helpers.
- [`@0xintuition/ids`](https://www.npmjs.com/package/@0xintuition/ids) - deterministic atom, predicate, triple, counter-triple, and OAuth atom IDs.
- [`@0xintuition/iid-spec`](https://www.npmjs.com/package/@0xintuition/iid-spec) - normative Intuition Identifier specification and conformance corpus.
- [`@0xintuition/iid`](https://www.npmjs.com/package/@0xintuition/iid) - pure IID parsing, canonicalization, validation, and derivation.
- [`@0xintuition/iid-registry`](https://www.npmjs.com/package/@0xintuition/iid-registry) - pure IID-to-classification, provider, and identifier-hint resolution.
- [`@0xintuition/iid-ladder`](https://www.npmjs.com/package/@0xintuition/iid-ladder) - strong identifier, registered provider-handle, and canonical-URL projection for application and seed inputs.
- [`@0xintuition/primitives`](https://www.npmjs.com/package/@0xintuition/primitives) - high-level builders and validators for off-chain Intuition data.
- [`@0xintuition/protocol`](https://www.npmjs.com/package/@0xintuition/protocol) - core contract ABIs, event parsers, and protocol interaction helpers.
- [`@0xintuition/deployments`](https://www.npmjs.com/package/@0xintuition/deployments) - Intuition chain metadata and core protocol deployment addresses.
- [`@0xintuition/periphery`](https://www.npmjs.com/package/@0xintuition/periphery) - periphery bridge/router deployment helpers and calldata utilities.
- [`@0xintuition/curves`](https://www.npmjs.com/package/@0xintuition/curves) - bonding curve math helpers.
- [`@0xintuition/react`](https://www.npmjs.com/package/@0xintuition/react) - React provider and hooks for protocol reads/writes.

## Install

Published packages can be installed with npm, Bun, or another package manager.
The repository itself uses Bun. Packages are ESM-only; use `import`.
For the currently published semantic APIs:

```bash
npm install @0xintuition/classifications@alpha @0xintuition/predicates@alpha viem@^2
```

`@0xintuition/protocol` uses the `3.x` line. This candidate publishes to `alpha`;
changing `latest` is a separate release-owner decision. Consult each package
README for peers and public subpaths.

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
bun run registry:check
bun run registry:test
bun run release:registry:test
bun run conformance:check
bun run protocol:check-artifacts
bun run protocol:sync-artifacts:test
bun run guard:supply-chain:test
bun run guard:supply-chain
bun run pack:dry-run
bun run smoke:tarballs
```

### Conformance harness

After `bun run build`, run `bun run conformance:check` for five public-surface proofs over reference implementation @ 31b62f3. See [the harness guide](./conformance/README.md) for coverage, explicit divergences, and vector maintenance.

## Contributing and Releases

- [Contributing guide](./CONTRIBUTING.md)
- [Release strategy and runbook](./docs/release.md)
- [Contract artifact publishing checklist](./docs/contract-artifacts.md)
- [Review findings and remaining release gates](./docs/release-readiness.md)

Package roots are npm-publishable artifacts. Release PRs should follow the validation gate, dist-tag policy, and publish order documented in [docs/release.md](./docs/release.md).
