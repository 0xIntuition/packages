# Step-by-step child PR plan

Every child PR targets `update/v1.1.0-alpha`. Branch from the latest integration head after its dependencies merge. Titles below are recommendations, and the P-numbers should appear in PR bodies/labels even if branch naming changes.

## P00 — Program contract and release tooling foundation

- Title: `chore(release): define the IID and atom URI release train`
- Branch: `chore/iid-release-foundation`
- Depends on: none
- Can run with: nothing until merged; it establishes the shared base

Scope:

- Add this planning packet.
- Restore the private root package version to `0.0.0` or otherwise document it as non-publishable; do not imply every package becomes `1.1.0`.
- Add one central package-order/metadata module consumed by pack and tarball smoke scripts, eliminating duplicated hard-coded arrays.
- Support both compiled packages and documentation-only packages in tarball assertions.
- Add topological-order and exact-internal-version assertions.
- Add PR template fields: package impact, identity impact, fixture impact, contract artifact, target versions, rollout notes.

Non-goals: no IID logic, ABI changes, or package publication.

Gate:

- Existing ten-package packed-tarball smoke remains byte/behavior compatible.
- Full CI passes before semantic or protocol child PRs branch.

## P01 — Publishable IID specification and conformance corpus

- Title: `feat(iid-spec): add the normative IID specification package`
- Branch: `feat/iid-spec`
- Depends on: P00
- Target package: `@0xintuition/iid-spec@0.1.0-alpha.0`

Scope:

- Port the private `intuition/iid-spec` content after removing private repository references and unresolved implementation claims.
- Add per-scheme documents and representation profile rules.
- Add versioned machine-readable conformance fixtures and their JSON schema.
- Document normative versus informative material and the scheme freeze/governance rule.
- Add package manifest, LICENSE, README, pack script, repository URLs, and tarball-content tests.
- Add `iid-spec` to the central release registry before `iid`.

Review focus: semantic governance, not TypeScript implementation.

Gate:

- Every registered scheme has positive, negative, and canonicalization fixtures.
- P0/P1/P2 and colon-bearing value fixtures exist.
- Tarball contains all normative documents/fixtures and no private planning paths.

## P02 — Pure IID reference implementation

- Title: `feat(iid): add canonical IID parsing and derivation`
- Branch: `feat/iid`
- Depends on: P01
- Target package: `@0xintuition/iid@0.1.0-alpha.0`

Scope:

- Port parser, formatter, validation, canonicalizers, NORM-1, gen1, hash/UUID/geohash utilities, and scheme metadata.
- Redesign ladder input around the public declarative source/recipe types rather than private executable callbacks.
- Add profile types and explicit P0 eligibility.
- Export typed error/result APIs so callers can distinguish malformed, unknown scheme, noncanonical, and profile-ineligible cases.
- Add stable fixture/conformance export for Core and external implementations.
- Add build/dist exports, README, public-entrypoint tests, and package metadata.
- Add `iid` to release/pack/smoke immediately after `iid-spec`.

Non-goals: no classification lookup, provider list, network I/O, contract calls, or JSON-LD builder.

Gate:

- All normative conformance vectors pass.
- Parsing preserves everything after the second colon.
- Canonicalization is deterministic in Node and Bun.
- Packed tarball exposes only documented entrypoints and compiled output.

## P03 — Classification identity contract reconciliation

- Title: `refactor(classifications): consume public IID identity contracts`
- Branch: `refactor/classification-iid-contracts`
- Depends on: P02
- Target package: `@0xintuition/classifications@0.1.0-alpha.1`

Scope:

- Add an exact dependency on the workspace `iid` target version.
- Replace duplicate scheme/class/typing and ladder type definitions with IID-owned types, retaining temporary re-exports if needed for compatibility.
- Adapt every generated classification ladder to the finalized declarative contract.
- Update generation/provenance checks so identity changes cannot be hand-edited without fixtures.
- Export ladder lookups needed by derivation and the registry.
- Preserve existing classification slugs, schema types, creation profiles, metadata predicates, and legacy JSON-LD output.
- Add a clearly named legacy builder/compatibility contract before later changing default creation behavior.

Non-goals: no provider routing and no new default IID builder yet.

Gate:

- All 37 classification specs pass generated/provenance tests.
- Existing JSON-LD snapshots remain unchanged unless an approved bug fixture says otherwise.
- Ladder types originate from one package and no circular dependency exists.

## P04 — Public IID semantic registry

- Title: `feat(iid-registry): add classification and provider resolution`
- Branch: `feat/iid-registry`
- Depends on: P03
- Target package: `@0xintuition/iid-registry@0.1.0-alpha.0`

Scope:

- Port classification, provider, canonical input, and identifier-hint behavior from the private reference.
- Adapt `IidClassification` to public classification fields; do not port private `AtomCategory`.
- Add totality, ladder-coherence, vocabulary, provider-order, value-narrowing, and public-entrypoint tests.
- Ratify and fixture the explicit unmapped/value-typed outcomes.
- Add README examples and package release metadata.
- Add `iid-registry` after classifications in pack/publish order.

Non-goals: no provider client code, credentials, caching, HTTP, or application label policy.

Gate:

- Adding/removing a scheme fails registry totality until mapped.
- Every emitted classification slug exists publicly.
- Every provider slug is unique, ordered, and explained as desired capability.
- Packed clean consumer can resolve the golden ISRC and polymorphic fixtures.

## P05 — Canonical IID atom builder

- Title: `feat(primitives): build canonical IID atom anchors`
- Branch: `feat/primitives-iid-anchor`
- Depends on: P04
- Target package: `@0xintuition/primitives@0.1.0-alpha.1`

Scope:

- Add exact dependencies on IID/registry and updated classifications.
- Add the single supported high-level IID atom anchor builder.
- Interpret classification ladders, choose profile, serialize canonical bytes, calculate atom ID through `ids`, and return classification/provider hints.
- Add ordered/deduplicated URI-manifest construction and policy/live-limit validation.
- Extend `isValidAtomData` or add a new validator that recognizes canonical IID/profile data without reclassifying arbitrary strings.
- Keep legacy JSON-LD builders as explicit compatibility APIs with unchanged outputs.
- Add builder subpath exports and TypeScript examples.

Non-goals: no wallet calls, provider fetches, live config reads, or automatic on-chain duplicate checks.

Gate:

- Golden P0 ISRC yields the exact expected UTF-8 bytes and atom ID.
- Class C/polymorphic identities cannot accidentally emit bare P0.
- URI changes do not change the atom ID.
- Reordered equivalent source input produces deterministic output where the contract promises it.
- Legacy builder snapshots remain stable.

## P06 — Contract artifact sync and provenance

- Title: `chore(protocol): sync URI-enabled contract artifacts`
- Branch: `chore/protocol-uri-artifacts`
- Depends on: P00
- Can run in parallel with: P01–P05
- Source artifact: `@0xintuition/contracts-v2@1.1.0-alpha.0`

Scope:

- Add a repeatable artifact sync/check script using an exact root dev dependency or verified supplied artifact.
- Record version, NPM integrity, ABI fingerprint, and generated file provenance.
- Regenerate MultiVault and MultiVaultMigrationMode ABI/bytecode as required.
- Include `createAtomsWithUris`, URI config read/setter, URI events, and URI errors.
- Add semantic ABI parity tests that compare names, mutability, input/output types, indexed fields, tuple components, and error signatures.
- Decide explicitly whether `FeeProxy` artifacts are included now or staged for P08.

Non-goals: no ergonomic API helpers or React work.

Supply-chain gate:

- `contracts-v2@1.1.0-alpha.0` is normally eligible under the repository policy on 2026-08-18. Keep this PR draft or use a verified local artifact for development until the exact dependency can pass normal CI. Do not add a release-age bypass.

Gate:

- Running artifact check on a clean tree produces no diff.
- ABI parity covers `AtomContextRegistered` indexed fields and the `bytes[][]` write shape.
- Existing protocol unit/integration tests remain compatible.

## P07 — Direct MultiVault URI APIs

- Title: `feat(protocol): add URI-aware atom creation APIs`
- Branch: `feat/protocol-atom-uris`
- Depends on: P06
- Target package: `@0xintuition/protocol@3.1.0`

Scope:

- Add `getAtomUriConfig` read helper and typed resolver if required.
- Add `createAtomsWithUris` encoder and simulate/write helper.
- Add `AtomContextRegistered` and `AtomUriConfigUpdated` receipt parsers.
- Add local validation helpers for outer-array alignment, nonzero creator, `msg.value`, and optional supplied URI limits without pretending to replace simulation.
- Update protocol indexes, entrypoint tests, README, and integration tests.
- Keep `createAtoms` and existing event parsers unchanged.

Gate:

- Calldata matches the exact contract function selector and argument ordering.
- One receipt fixture links `AtomCreated.termId` with `AtomContextRegistered.termId` without assuming log adjacency.
- Empty URI lists, maximum limits, misaligned arrays, opaque bytes, approval errors, and duplicate atom failure are covered.
- Existing `3.0.0` usage compiles against the additive API.

## P08 — FeeProxy URI API (separately reviewable)

- Title: `feat(protocol): add FeeProxy URI-aware creation`
- Branch: `feat/protocol-fee-proxy-uris`
- Depends on: P07 and a launch-scope decision
- Target package: included in `protocol@3.1.0` if merged before release

Scope:

- Add/sync `FeeProxyAbi` and required public types.
- Add encoder/simulate/write for `createAtomsWithUrisVia` and fee guards.
- Test creator/registrant preservation, gross/forwarded assets, affiliate fees, refund behavior, approval failure, and length mismatch.
- Add deployment metadata only in a separate conditional deployment PR when addresses and activation blocks are authoritative.

Non-goals: do not block direct MultiVault URI creation on FeeProxy readiness.

Gate:

- Direct and proxy helpers cannot be confused by naming or argument shapes.
- Tests prove URI context does not affect term IDs and the end user remains registrant.

## P09 — React URI-aware creation flow

- Title: `feat(react): add URI-aware atom creation flow`
- Branch: `feat/react-atom-uris`
- Depends on: P07; P08 only if a proxy hook is included
- Target package: `@0xintuition/react@0.1.0-alpha.1`

Scope:

- Add explicit URI-aware low-level hook and transaction-flow hook.
- Read/expose effective URI config.
- Validate aligned arrays and byte lengths before wallet interaction.
- Parse term IDs and context events from receipts.
- Preserve `useCreateAtom` and `useCreateAtomFlow` behavior.
- Add hook tests for idle/submitting/confirming/success/error/reset and callback behavior.

Non-goals: no classification/IID builder dependency and no context fetching.

Gate:

- Existing React tests remain unchanged.
- URI hook passes creator, arrays, and value exactly once.
- Receipt result associates context by `termId`, not event position.

## P10 — Cross-package conformance harness

- Title: `test(conformance): verify IID anchors through protocol encoding`
- Branch: `test/iid-uri-conformance`
- Depends on: P05 and P07; include P08/P09 fixtures when those PRs are in scope

Scope:

- Extend clean-room tarball smoke to import IID spec, IID, classifications, registry, primitives, protocol, and React public exports.
- Execute the shared fixture end to end: derive -> classify -> build -> hash -> encode -> decode.
- Add ABI fingerprint and atom-ID parity assertions.
- Run under both Node and Bun from packed tarballs only.
- Add negative fixtures for invalid scheme, noncanonical value, profile misuse, URI count/length, and legacy JSON.

Gate:

- No test imports `src/`, workspace aliases, or private monorepo code.
- Packed manifests contain exact internal versions and install together without registry fallbacks.
- Golden outputs match the Core migration fixture contract.

## P11 — Public documentation and examples

- Title: `docs(iid): document identifier-first atom creation`
- Branch: `docs/iid-atom-creation`
- Depends on: P10 API freeze

Scope:

- Update root package table and architecture narrative.
- Add IID quickstart: validate/derive -> registry lookup -> primitive builder.
- Add protocol quickstart: config read -> simulation/write -> event parsing.
- Update hackathon example to create an IID atom with URI context.
- Document P0/P1/P2, legacy compatibility, canonicalization freeze, provider-plan semantics, and URI security/bounds.
- Add migration notes for `classifications`, `primitives`, `protocol`, and `react` consumers.

Gate:

- Every code sample is compiled/executed in CI against packed public exports.
- Examples never use `int:src:*` or another unregistered/noncanonical sample.
- Docs state that URI context does not affect atom ID.

## P12 — Release candidate, NPM publish, and evidence

- Title: `chore(release): prepare IID and atom URI package train`
- Branch: `release/iid-v1.1.0-alpha`
- Depends on: P10–P11 and every in-scope feature PR
- This is the final child PR before merging #15

Scope:

- Freeze target package versions and exact internal pins.
- Verify topological publish order and dist-tag plan.
- Update changelogs/release notes with identity-sensitive changes.
- Run full validation, pack inspection, clean-room smoke, supply-chain guard, and registry preflight.
- Record tarball filenames, shasums/integrities, unpacked sizes, exports, ABI fingerprint, and approvers.
- Confirm package-name ownership for all three new NPM names.
- Publish only after PR #15 merges to `main`, following the repository's release runbook.
- Verify NPM metadata/imports and start Core's package-age eligibility clock.

Publish order:

1. `iid-spec`
2. `iid`
3. updated `classifications`
4. `iid-registry`
5. updated `primitives`
6. updated `protocol`
7. updated `react`
8. conditional deployment/periphery packages only when changed

Gate:

- No package version already exists on NPM.
- All exact dependencies are published earlier in the train.
- `latest`/`alpha` tags follow policy; protocol `latest` moves to `3.1.0` only after verification.
- Rollback/deprecation commands are prepared before publish.

## Conditional PRs

These do not belong in the critical path unless facts require them:

- `feat(deployments): add URI-capable deployment activation metadata` — only with authoritative addresses/blocks.
- `feat(protocol): expose FeeProxy deployment helpers` — only when deployed and product-supported.
- `fix(schema-org): add missing vocabulary type` — only if registry output fails vocabulary grounding.
- `fix(ids): correct term ID calculation` — only if parity reveals a real defect; this becomes identity-critical and stops the train.
- `feat(periphery): ...` — not expected; the current periphery package is bridge/router infrastructure, not MultiVault creation.
