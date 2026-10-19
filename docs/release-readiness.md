# PR #15 release readiness review

Reviewed on 2026-10-19, starting from `195939b1b5fa4eacb04745e496969dca3da38007`.
The PR adds the public IID stack, anchor builder, URI-aware creation, new
contract wrappers, dynamic-fee helpers, and deployment overrides across sixteen
packages. This report covers the integrated candidate and the review fixes in
this branch, including PR #38 at `20f3d301926f221ed57d0cb04ae156ffabaa903b`. It is not a Solidity audit or a declaration of complete application
parity.

**Status: keep the PR in draft until the blocking gates below are resolved.**
Package preparation and passing workspace tests do not establish contract-source
parity, identity migration compatibility, or acceptance in the consuming apps.

## Fixed in this review

| Finding | Change and regression coverage |
| --- | --- |
| Receipt helpers accepted identical events from foreign contracts; context association could attach foreign URI data to a legitimate atom | Added an optional emitter address to every event parser, preserving existing calls and JavaScript arity. Context association checks addresses when available; React creation filters by its configured MultiVault. Tests use interleaved ABI-encoded events and foreign emitters. Callers must pass an emitter when using receipt parsers for application decisions. |
| Valid near-total fee schedules exhausted the million-step exact-net solver | Replaced linear adjustment with a bounded interval search. The proof accounts for nonmonotonic net amounts caused by independently rounded fees. Exhaustive small schedules, a very large denominator, and existing randomized round trips cover the fix. The API promises an exact net, not a minimum gross. |
| Provider promotion overwrote a direct identifier in the same scheme | Both candidates now enter the deterministic canonical-IID ordering. Wikidata conflict checks see both sources. Regression cases cover same-scheme ranking and conflicting QIDs. Previously conflicting input can select a different IID; reconcile those records deliberately. |
| React reset/unmount and overlapping execution left promises unresolved; reverted receipts were treated as confirmation | Track one active attempt before wallet submission, reject overlap, settle cancellation, ignore late submissions, and reject reverted receipts. Component tests cover each transition without a browser or live wallet. |
| Five changed packages reused already-published versions | Advance changed packages to unused versions; PR #38 moves deployments/curves/periphery to `0.1.0` and protocol to `4.0.0`. Exact pins and workspace lock metadata follow the combined candidate. |
| Publishing protocol with no explicit tag would move `latest` from the existing v2 line | Set the candidate's tag to `alpha`; leave promotion to a separate release-owner decision. |
| Package registry validation did not detect an omitted public workspace or duplicate names | Check directory coverage, public flags, and duplicate names. New hermetic regression tests cover missing packages and invalid graph/pins. |
| Workspace tests could be cached without changes to manifests or fixture/spec files | Use Turbo's default tracked inputs for test tasks. |
| CI omitted formatting checks, and the consumer smoke omitted direct IID/registry/spec/anchor checks | Add CI gates, direct packed imports, Node/Bun equality, and TypeScript consumers compiled from installed tarballs (core/IID declarations checked fully; React uses `skipLibCheck` because the upstream wagmi declaration graph fails standalone checking). |
| Onboarding skipped setup and some package examples were incomplete or invalid | Add an offline guide, explain IID versus atom ID and representation profiles, show complete React provider setup, fix the linear-curve example, and document migration/release constraints. |

The existing deterministic anchor fixtures and reference oracle files were not
rewritten to make conformance pass. PR #38 changes MultiVault, so the previous
verified provenance was invalidated. Offline fingerprint checks cover the complete
candidate artifact set; authoritative npm parity remains blocked below.

## Blocking gates before merge / publication

### 1. Publish the intended contract revision and repin it

The contract owner confirmed the newer contracts have not yet been published.
The pinned npm artifact is `@0xintuition/contracts-v2@1.1.0-alpha.0`. The candidate
MultiVault, DynamicFeeFlatPriceCurve and FeeProxy ABI/bytecode differ from it, and it does not
export TrustSwapAndBridgeRouter, TimelockController, or IBaseCurve. In particular, the published dynamic-fee source
uses gross-band advancement while this SDK implements net-anchored bands; treating
them as equivalent can produce incorrect quotes.

Follow [the contract publishing and repinning checklist](./contract-artifacts.md).
It identifies the public package, private source workspaces, exact consumers in
this repository, extraction/build commands, and the minimum-release-age policy.
`bun run release:check` must pass after the new artifacts arrive. Add quote/revert
parity coverage against that revision, including uint256 overflow boundaries;
unbounded JavaScript bigint math alone does not establish Solidity parity.

### 2. Resolve identity differences and typed-Wikidata integration

The conformance harness still records **98 divergences**, **23 TODO capabilities**,
and **70 historical typed-Wikidata exclusions**. Of the divergences, 59 concern
the classifications' inline ladders: the IID/ladder/registry packages support
typed Wikidata, but those classification ladders were not migrated. Historical
parser inputs/outputs are missing for 36 excluded cases.

The anchor builder also differs from the reference for P1 evidence, `sameAs`,
and fallback envelopes. For example, the person ISNI anchor now derives the
same IID but omits `sameAs` and therefore produces a different atom ID. Some
differences are deliberate public API decisions; others are recorded defects.

Identity owners must resolve each difference as a fix or a documented public
contract/migration decision. Preserve the oracle, implement the agreed behavior,
and retire divergences only when the unchanged comparison agrees. Do not change
hash fingerprints merely to hide changed identities. See
[conformance evidence](../conformance/README.md) and
[`known-divergences.ts`](../conformance/known-divergences.ts).

### 3. Complete consumer acceptance and scope decisions

- Test the actual packed candidate in Core and the production application, and
  record versions, consumer commits, and owner acceptance.
- Decide whether dedicated URI-aware React hooks are required for this release.
  Current React creation hooks still call `createAtoms`; the protocol URI API is
  available for composition. The UI example demonstrates offline Creation
  Profiles, not URI submission.
- Review the remaining category/provider promotion semantics separately. Scheme
  order does not enforce typed subcategories, and provider fallback may still
  select a mapped identifier outside a supplied strong-scheme order. Consumers
  must not interpret that order as a complete entity-type validator.
- Review the open follow-ups independently: #35 (weak-account eligibility),
  #37 (ladder policy/differential coverage), and #39 (classification parity).
  They are not included in this integration. PR #38 is integrated into this
  umbrella branch, including SDK/CLI and the v1.1.0 artifact/address updates.
- Record release-owner approval, deployment compatibility, and migration notes
  before merge/publication. No live transaction or browser QA was performed in
  this review.

## Candidate versions and migration notes

[`release-plan.json`](../release-plan.json) is the explicit fifteen-package
publish manifest, in dependency order. `schema-org@0.1.0-alpha.0` is unchanged and
already published, so it is installed as a dependency and not republished.
`bun run release:registry` checks current npm availability and internal dependency
coverage; a 401/403/429/server error fails rather than being treated as an unused
version. All proposed publications use `alpha`.

- New `iid-spec`, `iid`, `iid-registry`, and `iid-ladder`: `0.1.0-alpha.0`.
- IDs, classifications, predicates, primitives, and React: `0.1.0-alpha.1`.
- Protocol and SDK: `4.0.0`, tag `alpha`.
- Deployments, curves, periphery, and CLI: `0.1.0`, tag `alpha`.
- Existing serialized identities are not automatically migrated. The P0/P1
  representation choice can change an atom's ID even when its IID is unchanged.
- Router swap calls require a Unix-seconds `deadline`; quotes return
  `[amountOut, success]`, so callers must check `success`. The incompatible Base router address has been removed; canonical lookup throws pending redeployment. Use the matching periphery release and verify the
  intended deployed revision. New v1.1.0 functions are not supported by older mainnet contracts until upgrade.
- Dynamic-fee config now uses `tierWidthGrowthBps`, separate deposit/redeem fulcrum fields, and redeem lots. MultiVault `previewTripleCreate` takes subject, predicate, object, and assets.
- The URI encoder supports both the validated object form and PR #38's positional form; writes retain explicit value validation.
- CLI declarations now declare their protocol/periphery/SDK dependencies, use valid ESM specifiers, and compile in the packed consumer. SDK docs are included in its tarball.
- Receipt filtering is opt-in for existing parser calls; pass the emitting
  contract as the last argument. Context association with addressed logs now
  excludes foreign emitters.
- `GrossDepositQuote.fixupIterations` counts search steps rather than individual
  wei adjustments. Multiple gross amounts may yield the requested exact net.
- Catch transaction-flow promises: reset/unmount now reject pending work, and
  overlapping execution rejects immediately.

## Validation evidence

Local tools: Bun 1.3.11 and Node 24.11.1. CI pins Bun 1.3.3 and Node 22.

- Frozen installation, full build (including the example), typecheck, package
  tests (1,747 Vitest tests plus IID-spec fixture validation), and formatting/lint pass.
- Conformance: 1,027 pass, 23 TODO, zero unexpected failures; the five proofs retain
  737 agreements and 98 explicitly recorded differences.
- Schema assets and generated schema/classification/predicate checks pass.
- Package registry tests: 4 pass; release-registry tests: 9 pass.
- Protocol artifact/provenance tests: 25 pass; candidate artifact guard tests: 3 pass; supply-chain tests: 54 pass.
- Read-only live schema checks pass for OAuth, Ethereum, and social-media-account
  JSON-LD URLs. Registry candidate-version availability passes.
- Package tarball dry-run and clean-room installation of all sixteen packages
  pass. Node and Bun agree on the runtime smoke results. The core/IID/SDK/CLI consumer
  compiles under strict NodeNext without `skipLibCheck`; the React consumer uses
  `strict` with `skipLibCheck`, matching the repository. Standalone checking of
  the upstream wagmi declarations fails independently of these packages; this
  is not a claim that the complete React dependency declaration graph passes.
- The packed CLI binary supports help and deterministic calldata encoding in the Node smoke.
- No npm publication, on-chain operation, browser QA, or merge to `main` was
  performed. The UI example was built; manual UI review remains with maintainers.

The broader `release:contracts` gate is expected to fail against the old pinned
artifact. That failure is a blocking result, not a passing test or a waived gate.
