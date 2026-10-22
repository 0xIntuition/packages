# Build your first Intuition atom

Intuition represents entities as **atoms** and relationships as **triples**. An
atom's ID is derived from its exact data bytes. A triple connects three atom IDs:
subject, predicate, and object. Building these values is an offline operation;
creating them on-chain is a separate wallet transaction.

## Install only the layers you need

The packages are ESM-only. Use `import`, and set `"type": "module"` in a Node
application. The examples use TypeScript and `viem` 2.x.

```bash
npm install @0xintuition/primitives@alpha viem@^2
```

The IID packages and anchor API are new in this release candidate. Until the
candidate is published, npm's existing `alpha` tag does not include them. To try
the checked-out candidate, use the repository's workspace packages after
`bun install --frozen-lockfile` and `bun run build`.

| Task | Package |
| --- | --- |
| Build atom data and deterministic IDs | `@0xintuition/primitives` |
| Parse, inspect, or canonicalize an IID | `@0xintuition/iid` |
| Select an identifier from provider/import input | `@0xintuition/iid-ladder` |
| Resolve an IID to a classification or provider plan | `@0xintuition/iid-registry` |
| Render classification fields and relationship suggestions | `@0xintuition/classifications` |
| Choose shared predicates | `@0xintuition/predicates` |
| Compose higher-level transaction plans and API reads | `@0xintuition/sdk` |
| Generate calldata and plans from a command line | `@0xintuition/cli` |
| Read, simulate, encode, or write contract calls | `@0xintuition/protocol` |
| Integrate contract calls with React and wagmi | `@0xintuition/react` |

Install packages you import directly, even when another package also depends on
them. This keeps your application independent of dependency hoisting.

## Build a canonical identity

An **Intuition Identifier (IID)** such as `int:isrc:USRC17607839` identifies a
real-world entity using a registered identifier scheme. A **classification**
such as `music-recording` supplies an ordered identity ladder: it tries stronger
identifiers before falling back to a derivation from fields.

```ts
import { buildIidAnchor } from '@0xintuition/primitives/anchor';

const result = buildIidAnchor(
  'music-recording',
  { isrc: 'US-RC1-76-07839' },
  { contextUris: ['https://example.com/tracks/1'] },
);

if (!result.success) throw new Error(result.errors.join('; '));

const atom = result.value;
console.log(atom.iid);     // int:isrc:USRC17607839
console.log(atom.profile); // p0
console.log(atom.data);    // int:isrc:USRC17607839
console.log(atom.dataHex); // UTF-8 bytes encoded as hex, ready for a contract call
console.log(atom.id);      // deterministic bytes32 atom ID
```

The builder has no wallet, RPC, API key, or provider dependency. A provider plan
contains capability names for an application to resolve; it does not fetch data.

## Understand which bytes define identity

| Representation | Atom data | Use |
| --- | --- | --- |
| P0 | Canonical IID text | Eligible identifiers whose type is unambiguous |
| P1 | Deterministic JSON with type, identifier, and applicable identity fields | Derived (`gen1`) or polymorphic identifiers that require more evidence |
| Legacy descriptive JSON-LD | Serialized fields from `buildAtom`, `buildPerson`, and other existing builders | Compatibility with existing descriptive atoms |

The builder chooses P0 when legal and P1 otherwise. Explicitly requesting P0 for
an ineligible identifier returns a structured error. An IID is not the same as
the bytes32 atom ID: representation changes can produce different atom IDs for
the same IID. Retain existing serialized data when migrating an application;
do not silently rebuild existing atoms with a different profile.

URI context is additional discovery information emitted at creation. Changing
`contextUris` does **not** change `data`, `dataHex`, or `id`. Entries are trimmed,
deduplicated, and kept in first-occurrence order. The offline limits are five
URIs of at most 700 UTF-8 bytes each; pass the live contract limits when known.

## Connect identity to application behavior

```ts
import { inspectIntuitionId } from '@0xintuition/iid';
import { classificationForIid, providersForIid } from '@0xintuition/iid-registry';

const iid = 'int:isrc:USRC17607839';
const inspection = inspectIntuitionId(iid);
const classification = classificationForIid(iid); // slug: music-recording
const providers = providersForIid(iid);           // ordered capability names
```

Inspection distinguishes malformed, unknown-scheme, and noncanonical input.
Canonicalization is scheme-specific: do not lowercase or trim an entire IID
yourself. Some valid identifiers have no unambiguous classification. An empty
provider plan means the registry has no supported enrichment route.

For forms, import a focused Creation Profile:

```ts
import { musicRecordingCreationProfile } from '@0xintuition/classifications/creation/music-recording';

const { fields, relationships } = musicRecordingCreationProfile;
```

`fields` describes atom inputs; `relationships` suggests graph edges. These
shared conventions help apps produce compatible data. They do not prove a
claim's truth or replace application validation.

## Move from offline data to a transaction

Use `@0xintuition/deployments` to select the network/address, then compose
`@0xintuition/protocol` with viem clients. Before sending a URI-aware creation:

1. Read `getAtomCost` and `getAtomUriConfig`, and check whether the atom exists.
2. Encode each context string with viem's `stringToHex`.
3. Supply one assets entry per atom, including its creation cost; `value` must
   equal the sum of the assets array.
4. Use `multiVaultCreateAtomsWithUris` to validate, simulate, and submit.
5. Parse the receipt with the expected emitting contract address and associate
   context by atom ID. The transaction recipient may be a router.

See the [protocol README](../packages/protocol/README.md) for the exact API and
[contract release prerequisites](./contract-artifacts.md) for this candidate's
unpublished contract dependencies. React's existing creation hooks currently
use `createAtoms`; URI-aware creation is available through the protocol helpers.

Further reading: [IID explainer](../packages/iid-spec/explainer.md),
[identifier projection](../packages/iid-ladder/README.md),
[primitives API](../packages/primitives/README.md), and
[conformance limits](../conformance/README.md).
