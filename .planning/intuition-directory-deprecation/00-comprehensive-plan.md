# Intuition package convergence and prototype-directory deprecation

Status: proposed execution plan

Prepared: 2026-08-13

## Objective

Make `github.com/0xIntuition/packages` the sole reusable TypeScript authority for
Intuition identifiers, semantic modeling, deterministic IDs, protocol transport,
and supported client surfaces. The private Stacks monorepo and public Intuition
Core must consume immutable NPM artifacts rather than maintain shadow
implementations.

The final cleanup deletes `intuition-v2/intuition/`, but deletion is the last
verification step. It is not the migration mechanism.

## Audited repository state

| Repository | Audited state | Relevant fact |
| --- | --- | --- |
| `packages` | `update/v1.1.0-alpha` at `6a484dc`, plus 43 working-tree entries (29 modified, 14 untracked) | P00-P05 are committed. `iid-ladder`, URI-enabled protocol work, artifact provenance, and release hardening exist locally but are not yet an immutable reviewed release candidate. |
| private Stacks monorepo | `main` at `3b2adef2a`; IID merge `63ab74814` | The IID implementation is integrated. The `intuition/` subtree has not changed after the IID merge. It contains 16 package directories. |
| Intuition Core | branch at `d217b19` | The durable URI reader and most IID cutover behavior are implemented in a 189-file branch diff, but production package wiring remains fail-closed pending publication and release-age qualification. |

Read-only checks run during this audit passed:

- package registry integrity for all 14 currently registered public packages;
- exact `contracts-v2@1.1.0-alpha.0` protocol artifact parity;
- supply-chain policy and all six exception-policy tests;
- `git diff --check` for the package candidate.

The existing full candidate ledger records workspace build, test, typecheck,
format, pack, and Node/Bun tarball smoke as green. Those claims must be repeated
from the exact reviewed commit before publication.

## Executive decision

Use three release waves and two consumer cutovers:

1. **Wave A — release-critical identity and URI contracts.** Finish and publish
   the packages Core and the Stacks IID writer need now.
2. **Wave B — private-prototype surface drain.** Reconcile the remaining public
   package compatibility gaps and move `cli`, `sdk`, and `stacks` to an explicit
   destination.
3. **Wave C — shared processing extraction.** Converge duplicated atom parser,
   classifier, and enrichment libraries used by Stacks and Core.
4. **Stacks cutover.** Adopt eligible exact NPM versions, wire URI-aware writes,
   and remove local package directories incrementally.
5. **Core cutover.** Adopt the same eligible versions, run reader-first canaries,
   and prove independent reconstruction.

Wave A blocks the IID/URI release. Wave B blocks deletion of `intuition/`.
Wave C is strategically required to eliminate semantic drift, but should not
delay Wave A unless a Wave A fixture exposes a shared-processing contract defect.

## Non-negotiable invariants

### Identity

- Atom, triple, and counter-triple term IDs remain `bytes32` and are calculated
  from the exact atom/triple bytes.
- URI context never changes IID bytes, atom bytes, or atom ID.
- New identifiers are canonical, registered IIDs. An IID-shaped provider-local
  value such as `int:spotify:*` is not accepted while its scheme is unregistered.
- P0 is bare IID and only for anchor-eligible Class A/B, unambiguously typed
  schemes. Class C and polymorphic schemes floor at P1.
- Legacy JSON-LD bytes and legacy `createAtoms` remain supported throughout the
  compatibility window.

### Ownership

- `iid` owns grammar, canonicalization, inspection, profiles, and conformance.
- `classifications` owns schema-backed classification records and declarative
  identity ladders.
- `iid-registry` owns pure IID-to-classification/provider/hint policy.
- `iid-ladder` owns heterogeneous input projection to a valid IID or an explicit
  fallback.
- `primitives` owns the supported high-level anchor and URI-manifest builder.
- `ids` owns content-addressed term hashing, not semantic identity policy.
- `contracts-v2` owns Solidity artifacts; `protocol` owns public TypeScript ABI,
  transaction helpers, and receipt parsing; `deployments` owns network/address
  metadata.
- Network fetches, credentials, persistence, display policy, and application
  categories stay outside the pure semantic packages.

### Release and operations

- Consumers install immutable exact versions; no committed `file:`, tarball,
  Git, source-path, or sibling-workspace dependency is allowed.
- Internal public-package dependencies are exact and published in topological
  order.
- Both consumer repositories keep the 14-day package-age policy. Do not create
  a broad first-party exception merely to accelerate cutover.
- NPM versions are never reused or unpublished as a rollback strategy.
- Reader support deploys before IID-default writers are enabled.

## Package disposition map

The private `intuition/` directory contains 16 packages. The public repository
currently registers 14 packages, including `deployments`, which has no separate
private prototype directory.

| Prototype/public package | Permanent disposition | Release wave |
| --- | --- | --- |
| `iid-spec` | Public normative package; source of conformance documents and vectors. | A |
| `iid` | Public pure runtime; no Stacks/Core adapters. | A |
| `classifications` | Public semantic data and identity ladders. App category/display/visibility policy stays private. | A/B |
| `iid-registry` | Public pure semantic/provider bridge. | A |
| `iid-ladder` | Public pure projection boundary with registered-IID success invariant. | A |
| `primitives` | Public canonical builder. Add the missing ladder-result/candidate-IID composition seam before release. | A |
| `ids` | Public term-ID and OAuth-ID utilities. Move private auth-user wallet derivation to an app-owned adapter rather than widening `ids`. | B |
| `schema-org` | Public generated vocabulary authority. | B/no bump unless changed |
| `predicates` | Public predicate authority. | B/no bump unless changed |
| `curves` | Public curve math. Port or replace the five gross-up helpers still consumed by Stacks, with golden vectors. | B |
| `deployments` | Public network/deployment authority. Stacks must stop importing network/address metadata from `protocol`. | B |
| `protocol` | Public ABI, reads/writes, event parsing, and URI-aware creation. | A |
| `periphery` | Public bridge/router transport. Move SDK bridge policy here only if it is generic and protocol-owned. | B |
| `react` | Public hooks over public protocol/deployments only. No dependency on the private SDK. URI write hooks are additive and may follow Wave A if not a launch writer. | A/B |
| `cli` | Move to the public repo, regenerate from the exact URI-enabled artifacts, and add URI config/write/event coverage before first publish. The scoped NPM name is currently unused. | B |
| `sdk` | Do not publish the private source as `0.1.0`. `@0xintuition/sdk` already has a public 3.x line. Either ship a reviewed backward-compatible 3.x update or a 4.0 prerelease; the local facade must consume `ids`, `protocol`, `deployments`, and `periphery` rather than reimplement them. | B |
| `stacks` | Extract as a network-free public semantic/content package if the taxonomy is intended as ecosystem contract. Split deterministic JSON/CID logic from the private Pinata transport first. If the taxonomy is product-private, move it to a normal private `packages/*` adapter and reserve the public name; either decision removes it from `intuition/`. | B |

## Confirmed compatibility gaps

### Public API versus current Stacks imports

An AST audit of imports outside `intuition/` found 28 root exports currently used
by Stacks but absent from the packed public package declarations:

| Package | Missing imports | Required disposition |
| --- | ---: | --- |
| `classifications` | 11 | Replace `buildAtomAnchor` with the `primitives` builder; promote only generally reusable lookups/aliases; keep `AtomCategory`, native-atom policy, catalogue presets, and visibility policy in private adapters. |
| `curves` | 5 | Port gross-up math if it is contract-general; otherwise relocate call sites to a private pricing adapter. Preserve numeric golden vectors. |
| `ids` | 6 | Keep auth-user wallet identity out of general term IDs; move it to an app-owned package with wallet-address parity tests. |
| `protocol` | 6 | Import chains, deployments, and address lookup from `deployments`; add only genuinely generic override types there. |

There are also two direct source imports from `../../intuition/ids/src` in data
import scripts. They must become declared package imports before any directory is
removed.

### Ladder-to-builder join is not yet a public contract

The private application projects a candidate through `iid-ladder` and passes it
to `buildAtomAnchor(..., { candidateIid })`. The public `buildIidAnchor` currently
derives only from classification values and has no candidate-IID input.

The current tarball smoke tests exercise `projectIdentifierLadder` and
`buildIidAnchor` independently. They do not prove the real application join.

Before Wave A release, add one explicit public seam, for example:

```ts
buildIidAnchor(classificationSlug, values, {
  candidateIid,
  contextUris,
  uriLimits,
})
```

The exact spelling may change, but the contract must:

- accept only a canonical registered IID;
- enforce P0 eligibility and classification coherence;
- preserve deterministic P1 serialization rules;
- return structured errors rather than throw for expected validation failures;
- preserve ordered/deduplicated context URIs without including them in atom-ID
  calculation; and
- allow callers to degrade explicitly to legacy bytes when the ladder returns
  `unregistered-provider`, `url-over-cap`, or another envelope fallback.

### The private writer still uses legacy creation

The Stacks application now emits IID atom bytes behind its flag, but the on-chain
paths still call `multiVaultCreateAtoms`. They do not submit context URIs or parse
`AtomContextRegistered` receipts. The public protocol candidate supplies those
APIs, but the application adapter has not consumed them.

### Core runtime is intentionally not connected yet

Core contains package-neutral inspection/registry/provider adapters and a durable
URI read path. Its production worker composition root does not yet depend on
`iid` or `iid-registry`; that is intentionally blocked until exact NPM versions
are published and eligible.

### Shared processing code is diverging

Both consumers carry private copies of atom-processing packages. Current
file-level comparison shows modest divergence in `atom-parser` but extensive
divergence in `atom-classification` and `atom-enrichment`. Continuing to evolve
them independently will recreate the same shadow-authority problem after the IID
packages are public.

## Execution plan

### Phase 0 — Freeze inputs and convert the audit into contracts

1. Record immutable source revisions for all three repositories and the exact
   contract artifact version/integrity.
2. Preserve the existing dirty package worktree. Split it into reviewed commits;
   do not merge or publish directly from the mixed state.
3. Create one machine-readable package/consumer matrix containing:
   package name, owner, target version, public exports, runtime dependencies,
   consumers, publication state, release-age date, and removal PR.
4. Freeze shared golden fixtures for:
   IID parse/format/inspection, ladder results, P0/P1 bytes, atom/triple IDs,
   provider plans/hints, URI manifests, calldata, events, auth wallet addresses,
   and pinned Stacks term/predicate IDs.
5. Mark each fixture as normative, public behavior, or application compatibility
   so accidental app policy does not become protocol law.

Exit gate: every prototype directory and every consumer import has an owner and
destination; no file is categorized as “copy later.”

### Phase 1 — Finish Wave A on the package integration branch

Land these review units in order against `update/v1.1.0-alpha`:

1. **P04b — `iid-ladder`.** Review the deliberate fail-closed delta for
   provider-local namespaces and its effect on current Stacks/seed fixtures.
2. **P06a — supply-chain exception.** Land the exact, expiring
   `contracts-v2@1.1.0-alpha.0` exception and its guard tests.
3. **P06 — artifacts/provenance.** Land deterministic ABI/bytecode sync and
   semantic parity.
4. **P07 — protocol URI API.** Land URI config reads, direct URI creation,
   receipt parsing, and term-ID-based event association while preserving legacy
   calls.
5. **P07b — ladder/builder composition.** Add the candidate-IID seam, structured
   fallbacks, context manifest contract, and app/seed parity fixtures.
6. **P09 — React URI flow, only if it is an in-scope supported writer.** Otherwise
   record it as an additive follow-up and do not block Core.
7. **P10 — true cross-package conformance.** From packed tarballs only, execute:
   ladder -> builder -> atom ID -> URI calldata -> receipt decode, under Node and
   Bun. Include the Stacks application and Core golden fixtures.
8. **P11 — migration documentation.** Document profile rules, fail-closed
   provider behavior, URI security, legacy compatibility, and consumer adapters.
9. **P12 — immutable release candidate.** Re-run the complete gate in a clean
   detached worktree and record tarball SHA-512 integrity, sizes, exports, ABI
   fingerprint, approvers, and release-age dates.

Wave A release set:

1. `iid-spec@0.1.0-alpha.0`
2. `iid@0.1.0-alpha.0`
3. `classifications@0.1.0-alpha.1`
4. `iid-registry@0.1.0-alpha.0`
5. `iid-ladder@0.1.0-alpha.0`
6. `primitives@0.1.0-alpha.1`
7. `protocol@3.1.0`
8. `react@0.1.0-alpha.1` only if its changed protocol pin/API is in scope

Release `ids`, `schema-org`, `predicates`, `curves`, `deployments`, or
`periphery` only when their public data, exports, or exact dependency pins
actually change.

### Phase 2 — Publish Wave A safely

1. Verify package-name ownership, NPM identity, organization rights, 2FA/OIDC,
   and provenance from the release environment before merge approval.
2. Verify every exact version is unused.
3. Publish dependencies one at a time in topological order. After each publish,
   install it from NPM in a clean consumer and compare integrity/exports with the
   reviewed tarball before publishing dependants.
4. Publish `protocol@3.1.0` with an explicit prerelease/canary dist-tag first.
   The current public default is the 2.x line while 3.0.0 is on `alpha`; moving
   `latest` to 3.1.0 is a separate release-owner decision after consumer canary.
   Do not rely on the manifest's default tag behavior for that change.
5. Record the exact eligibility timestamp for both consumer repositories. Let
   the versions age for 14 days.
6. If a defect appears, publish the next version and deprecate the bad version;
   never reuse or unpublish.

### Phase 3 — Reconcile and publish/move Wave B

#### 3A. Public package compatibility

1. Replace private builder usage with the public `primitives` seam.
2. Move network/address imports from `protocol` to `deployments`.
3. Port reusable curve gross-up functions with contract-equivalent golden tests.
4. Move auth-user atom/wallet derivation into a private app adapter and pin its
   existing addresses/IDs byte-for-byte.
5. Promote only reusable classification helpers. Keep product display/category,
   native-atom, visibility, and catalogue policy private.

#### 3B. `cli`

1. Move source/history/docs into `packages/packages/cli` in a reviewable PR.
2. Replace copied ABI authority with generation from the exact public protocol or
   contracts artifact.
3. Add `createAtomsWithUris`, URI config, and context-event commands/encoders.
4. Add packed executable smoke tests, offline help generation, Node compatibility,
   and live-eval opt-in boundaries.
5. Publish a new alpha only after the core encoder catalog and protocol API are
   semantically identical.

#### 3C. `sdk`

1. Inventory the existing public 3.x SDK contract before choosing a version.
2. Treat the private package as a candidate implementation, not the release
   source of truth.
3. Replace reimplemented/re-exported ID, protocol, deployment, and bridge logic
   with exact public dependencies.
4. Decide whether formatting helpers and deterministic AtomWallet address
   calculation belong in SDK, protocol, or a small public utility package.
5. Add IID anchor + URI-aware write ergonomics without changing underlying
   transaction semantics.
6. Release as a compatible 3.x update only if verified non-breaking; otherwise
   use a 4.0 prerelease with a migration guide and dual-major canary.

#### 3D. `stacks`

1. Decide whether category/want/predicate/content registries are public ecosystem
   contracts or private product taxonomy.
2. Split deterministic JSON serialization/CID calculation into a network-free
   public utility; keep Pinata credentials/client transport private.
3. Freeze every exported term, predicate, root atom, CID, and atom ID.
4. If public, add compiled exports and subpath tarball tests and publish a new
   alpha. If private, move it to `intuition-v2/packages/stacks-domain` and keep
   its dependency boundary explicit.
5. In either case, remove the `intuition/stacks` prototype only after every app,
   backend, database, script, and E2E consumer is switched.

### Phase 4 — Stacks consumer cutover

Use one package family per PR. For each PR:

1. Install eligible exact versions with Bun and a frozen lockfile.
2. Update all runtime/dev dependencies, direct source imports, test mocks,
   tsconfig paths, Turbo filters, Dockerfile manifest copies, deploy filters, and
   cache guards.
3. Prove the consumer against installed NPM artifacts with the corresponding
   local prototype directory absent. A same-name workspace package must never be
   allowed to make an NPM adoption test pass accidentally.
4. Remove that prototype directory in the same PR only when no remaining local
   package depends on it; otherwise first convert remaining prototype manifests
   to the eligible exact NPM dependency.
5. Run focused package tests, affected app/backend typechecks, Docker context
   guards, supply-chain guard, and the cross-repository fixture suite.

Recommended drain order:

```text
iid-spec (docs) -> iid -> schema-org/ids/curves/deployments
  -> classifications -> iid-registry -> iid-ladder
  -> predicates -> primitives -> protocol -> periphery -> react
  -> cli/sdk/stacks disposition -> remove intuition/* workspace glob
```

The writer cutover is a separate feature-gated step:

1. Replace `emitAppAtomData` internals with public ladder + public candidate
   builder while keeping OFF-path bytes identical.
2. Treat unregistered provider handles as explicit legacy-envelope fallback;
   never mint a new unregistered IID-shaped value.
3. Build context URI manifests from approved canonical/source evidence and pass
   live `getAtomUriConfig` limits.
4. Call `createAtomsWithUris` for the IID-aware path, preserving legacy
   `createAtoms` as rollback.
5. Associate creation/context receipt events by exact term ID, never log order.
6. Enable for an allowlist/canary only after Core readers have proved the same
   fixture end to end.

### Phase 5 — Core adoption and release

After Wave A versions are eligible:

1. Add exact `iid`, `iid-registry`, and updated `classifications` dependencies to
   the real worker composition root. Core readers do not need `iid-ladder`.
2. Replace the sibling-package acceptance harness with normal package imports and
   assert exact package manifests/provenance at startup.
3. Finish/review the existing C01-C14 Core PR stack rather than merging the
   189-file branch as one unit.
4. Run canonical ISRC and ISBN through parse -> classification -> provider plan ->
   enrichment -> identity persistence -> API/Explorer using only public exports.
5. Run URI-enabled devnet mint -> event ingestion -> Timescale -> KG -> API and
   repeat replay to prove idempotency and byte/order preservation.
6. Run historical reconciliation report-only, approve bounded apply, resume from
   checkpoints, and prove convergence.
7. Roll out readers first: migrations/readers flags off -> recognition canary ->
   semantic reads -> ISRC resolution -> ISBN resolution -> wider explicit scheme
   matrix -> external writers.
8. Preserve explicit unsupported provider states; never silently drop registry
   provider slugs.

### Phase 6 — Shared processing extraction (Wave C)

Converge duplicated libraries after Wave A contracts are stable:

1. Start with `atom-parser`: it has the smallest divergence. Define a pure local
   parse API, publish conformance fixtures, and keep remote inspection behind an
   injected port.
2. Extract `atom-classification` engine/contracts separately from product plugin
   bundles. Plugins that require application policy or credentials remain
   consumer-owned.
3. Extract `atom-enrichment` core, provider request/response contracts, retry
   taxonomy, artifact provenance, and URI security policy. Credentials, caches,
   queues, and persistence are adapters.
4. Decide separately on `atom-rules-engine`, `graph-flags`, and example plugins;
   do not pull them into the identity release merely because both repos contain
   copies.
5. For each extraction, compare Stacks and Core behavior against the same corpus,
   publish an alpha, age it, adopt it in both repos, then delete both shadow
   copies.

## Verification gates

### Package gate

- Frozen install, build, typecheck, test, formatting/lint, generated-data drift,
  schema checks, supply-chain guard, pack inspection, and Node/Bun tarball smoke.
- Tarballs contain only documented files/exports and no private planning/source
  paths.
- Exact internal pins and topological publish order are mechanically enforced.
- No `.DS_Store`, build cache, coverage, or workspace-only config ships.

### Identity gate

- Every registered scheme has positive, negative, canonicalization, typing, and
  profile fixtures.
- Parser splits only the first two colons and Node/Bun produce identical output.
- Ladder success always passes public IID validation.
- App and seed emitters produce the canonical package bytes/ID for registered
  identifiers and explicit legacy fallback for unregistered providers.
- URI reorder/content changes never change atom ID.
- Auth wallet and pinned Stacks IDs remain byte-identical.

### Protocol gate

- ABI semantics and bytecode provenance match the exact contract artifact.
- `createAtomsWithUris` selector, argument ordering, creator, value, array
  alignment, empty lists, limits, duplicate URIs, opaque bytes, and reverts are
  covered.
- Receipt parsing joins `AtomCreated` and `AtomContextRegistered` by term ID.
- Legacy `createAtoms`, deposit, redeem, and event APIs remain compatible.

### Consumer gate

- Clean Stacks and Core worktrees install from NPM only with frozen lockfiles.
- TypeScript compiles every currently imported public symbol/subpath.
- No source import, workspace alias, sibling path, or dynamic arbitrary package
  loader bypasses the public contract.
- Stacks app/seed and Core readers pass the same golden fixtures.
- Core boots as an independent operator with documented configuration and no
  private service required for IID recognition/classification.

### Production gate

- Exact versions have completed the 14-day age policy.
- Migrations/replays are idempotent and query/load budgets are recorded.
- Provider canaries meet retry/rate/latency expectations.
- Writer, resolver, recognition, and semantic-read rollback switches are
  rehearsed.
- Release owner signs the package/contract/container/fixture evidence ledger.

## Final deletion gate for `intuition-v2/intuition/`

Delete the directory only when all of these are true:

- every one of the 16 prototype packages has a published or private-adapter
  destination recorded in the disposition matrix;
- `rg` finds no runtime/test/script imports or direct paths into `intuition/`;
- no manifest contains `workspace:*` for a removed public package;
- Dockerfiles, deploy filters, cache guards, tsconfig references, and the root
  workspace list no longer mention `intuition/*`;
- both consumers pass frozen clean installs and the shared conformance suite with
  the directory physically absent;
- production readers are live, at least one writer canary is proven, and legacy
  rollback remains available; and
- the deletion is a dedicated, easily revertible PR with the last known
  prototype commit/tag recorded.

## Rollback model

- **Package defect:** pin the last good exact version, publish a corrected next
  version, deprecate the bad one, and move dist-tags only after verification.
- **Writer defect:** disable IID/URI emission first; continue legacy
  `createAtoms`. Do not mutate already-created atom identity.
- **Resolver defect:** disable the affected scheme/provider while preserving raw
  identity, URI evidence, and artifacts.
- **Reader defect:** disable semantic presentation while continuing durable event
  ingestion.
- **Directory-removal defect:** revert the dedicated deletion PR; do not restore
  split-brain development after the issue is fixed.

## Decisions required before execution

1. Is `@0xintuition/stacks` public ecosystem vocabulary or private product
   taxonomy?
2. Does the existing public `@0xintuition/sdk` evolve on 3.x or move to a 4.0
   prerelease?
3. Is React URI-aware creation part of the first Wave A release or an additive
   follow-up?
4. Which currently missing classification/curve helpers are stable public APIs
   versus private adapters?
5. Who explicitly approves promotion of `protocol@3.1.0` from canary/alpha to
   `latest`?

These choices do not block P04b/P06a/P06/P07 review. They must be closed before
Wave B publication or the final `intuition/` deletion PR.
