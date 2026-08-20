# Target package contracts

## Dependency graph

```text
iid-spec                 contracts-v2 (root dev/provenance dependency only)
   |                                      |
   v                                      v
 iid ------------------------------> protocol
   |                                      |
   v                                      v
classifications                       react
   |
   v
iid-registry
   |
   +------> iid-ladder
   |
   v
primitives -----> ids
   |
   +-----------> predicates (legacy triple/builder support)
```

There is no runtime dependency from `iid` to classifications and no dependency from protocol to semantic packages. Consumers can use the semantic and transaction layers independently.

## `@0xintuition/iid-spec`

Owns the normative specification, scheme documents, representation profiles, governance rules, and versioned machine-readable conformance vectors.

Required package contents:

- `README.md`, explainer, specification sections, and per-scheme definitions;
- explicit draft/stability status;
- `conformance/*.json` with a schema/version field;
- implementation-notes document listing known deviations;
- no runtime code and no private-monorepo links as normative references.

## `@0xintuition/iid`

Owns pure grammar and derivation:

- `parseIntuitionId`, `formatIntuitionId`, `validateIntuitionId`, `isIntuitionId`;
- closed scheme registry, canonicalizers, identity class, and scheme typing;
- NORM-1, `gen1`, hashes/UUID/geohash helpers needed by declared derivations;
- P0 eligibility and P1/P2 profile types;
- declarative identity-ladder types and a pure derivation engine;
- supported conformance fixture export.

Key design change from the private reference: source callbacks are not the public ladder contract. The public classifications package already declares serializable `IdentityValueSource` and recipe unions. Move or share those types through `iid`, and make the derivation engine interpret them without importing classifications.

Parsing splits only the first two colons. Validation distinguishes valid grammar, registered scheme, canonical value, and P0 eligibility.

## `@0xintuition/classifications`

Owns schema.org classification records and declarative identity ladders.

Required changes:

- consume IID-owned scheme/class/typing and ladder types;
- remove duplicate definitions from `identity.ts`/`types.ts` once compatibility exports are established;
- keep generated ladder data and provenance checks deterministic;
- expose lookup by slug/type and the ladder needed by the builder/registry;
- add reverse-coherence tests without embedding provider routing;
- preserve the legacy JSON-LD builder as an explicitly named compatibility path.

Do not port private `AtomCategory` into this package merely to satisfy the registry. Registry classification results should use public classification fields such as `slug`, schema `type`, display/category metadata, and provenance. Core/application runtime categories belong in adapters.

## `@0xintuition/iid-registry`

Owns the pure semantic bridge:

```ts
classificationForScheme(scheme, value?)
classificationForIid(iid)
listUnambiguousSchemeClassifications()
providersForScheme(scheme)
providersForIid(iid)
identifierHintsForIid(iid)
```

Required behavior:

- total provider policy over every registered scheme;
- total classification decision over unambiguous schemes, including explicit unmapped cases;
- value-aware typing for MBID, OLID, CAIP-19, and `gen1`;
- `undefined` classification for polymorphic/unmapped inputs without blocking provider hints;
- lenient recognition of canonicalizable historical values, but no claim that they are valid new anchors;
- deterministic provider ordering and no network I/O;
- provider slugs are capability identifiers, not imports of provider implementations.

Ratification fixtures include: EIDR -> movie, ISWC unmapped, MBID release -> music album, MBID label -> company, and CAIP-19 classification only for canonical supported ERC-20 values.

## `@0xintuition/iid-ladder`

Owns the shared application/seed projection from heterogeneous source identity to a canonical IID candidate:

```ts
projectIdentifierLadder({
  strongIdentifiers,
  strongIdentifierOrder,
  providerCanonicalId,
  canonicalUrl,
})
```

The precedence order is registered strong identifier, registered provider-handle translation, canonical URL, then explicit envelope fallback. It is pure and offline. It does not own classification, provider clients, atom serialization, or URI-context enrichment.

Provider-local prefixes are an audited compatibility inventory, not implicit IID scheme registrations. A successful result must always pass the public IID validator. Until a provider namespace is ratified, the ladder returns `unregistered-provider` rather than producing a value such as `int:spotify:*` that the public parser rejects.

## `@0xintuition/primitives`

Owns the supported high-level builder. Proposed result shape:

```ts
type AtomAnchor = {
  classification?: string
  profile: 'p0' | 'p1' | 'p2'
  iid: string
  data: string
  dataHex: `0x${string}`
  id: `0x${string}`
  contextUris: readonly string[]
  providerPlan: readonly string[]
  values: Readonly<Record<string, unknown>>
}
```

The final names can change, but the builder must:

- select the strongest available identity rung;
- prevent polymorphic/Class C bare P0 anchors;
- produce deterministic P0/P1/P2 bytes;
- compute the matching atom ID through `@0xintuition/ids`;
- construct an ordered, deduplicated URI manifest;
- validate policy limits offline and optionally validate live contract limits supplied by the caller;
- expose structured errors rather than submit transactions;
- preserve current JSON-LD builders under an explicit compatibility API.

The builder does not call wallets, contracts, or enrichment providers.

## `@0xintuition/protocol`

Owns exact consumer contract artifacts and low-level viem helpers.

Required direct MultiVault surface:

```ts
multiVaultGetAtomUriConfig(config)
multiVaultCreateAtomsWithUris(config, {
  args: [creator, atomDatas, assets, uris],
  value,
})
multiVaultCreateAtomsWithUrisEncode(creator, atomDatas, assets, uris)
eventParseAtomContextRegistered(client, hash)
eventParseAtomUriConfigUpdated(client, hash)
```

The ABI source also includes URI errors and the timelock setter, even if no convenience write helper is exposed for governance.

Contract facts that tests must preserve:

- `createAtomsWithUris(address, bytes[], uint256[], bytes[][])` is payable and returns `bytes32[]`;
- creator/registrant semantics use the explicit `creator` argument and CREATION approval;
- the three outer arrays have equal length;
- `msg.value` equals the sum of `assets`;
- URI bytes are opaque, emitted, not stored, and excluded from atom ID;
- `AtomContextRegistered(bytes32 indexed termId, address indexed registrant, bytes[] uris)`;
- effective defaults are 5 entries and 700 bytes per entry, but clients read `getAtomUriConfig` rather than hardcode them.

Existing `createAtoms` helpers remain unchanged.

## FeeProxy surface

The contracts artifact also exposes `FeeProxy` and `createAtomsWithUrisVia`. Treat this as its own child PR because it introduces a new public contract family and configuration/deployment questions.

If included in the release, add:

- `FeeProxyAbi` and bytecode/provenance as appropriate;
- URI-aware encoder/simulate/write helper;
- fee-guard and forwarded-value tests;
- event parsing where the public SDK already promises FeeProxy events;
- deployment metadata only after addresses/activation are confirmed.

Direct MultiVault URI support must not wait on FeeProxy deployment decisions.

## `@0xintuition/react`

Owns wallet-oriented convenience, not semantic derivation.

Add an additive `useCreateAtomsWithUris`/flow API or a discriminated URI input to the existing flow. Prefer an explicit new method to avoid silently changing `createAtom` semantics.

It must:

- accept `creator`, aligned data/assets/URI arrays, and transaction value;
- preflight outer-array alignment and URI bounds when config is loaded;
- call the protocol helper/ABI;
- parse both atom IDs and context events from the receipt;
- preserve the existing non-URI hook;
- not depend on `primitives`; callers can compose the builder and hook themselves.
