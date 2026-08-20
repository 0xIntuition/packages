# IID and atom-URI package release train

Status: execution-ready PR plan

Umbrella PR: [#15 — Update: v1.1.0-alpha](https://github.com/0xIntuition/packages/pull/15)

Integration branch: `update/v1.1.0-alpha`

Prepared: 2026-08-10

## Objective

Publish the reusable package layer required for Intuition Identifier atoms and creation-time URI context before Intuition Core or application writers switch their defaults.

The release train adds four public IID packages, reconciles the existing classification identity ladders, adds a canonical IID atom builder, updates protocol and React creation APIs, and strengthens the tarball/release gates that bind these packages together.

## How PR #15 is used

PR #15 is the release-train umbrella from `update/v1.1.0-alpha` to `main`. Feature branches open child PRs with `update/v1.1.0-alpha` as their base. Each merged child PR updates the umbrella automatically. PR #15 merges only after the complete packed-tarball consumer and release checklist pass.

The branch name is a program label, not a package-wide version. Packages retain independent semver:

| Package | Target version |
| --- | --- |
| `@0xintuition/iid-spec` | `0.1.0-alpha.0` |
| `@0xintuition/iid` | `0.1.0-alpha.0` |
| `@0xintuition/classifications` | `0.1.0-alpha.1` |
| `@0xintuition/iid-registry` | `0.1.0-alpha.0` |
| `@0xintuition/iid-ladder` | `0.1.0-alpha.0` |
| `@0xintuition/primitives` | `0.1.0-alpha.1` |
| `@0xintuition/protocol` | `3.1.0` |
| `@0xintuition/react` | `0.1.0-alpha.1` |

`ids`, `schema-org`, `predicates`, `deployments`, and `periphery` release only if their public data or behavior changes. Do not bump them merely to make the train look uniform.

## PR dependency graph

```text
P00 plan + release scaffolding
 ├─> P01 iid-spec -> P02 iid -> P03 classifications -> P04 iid-registry
 |                                                        ├─> P04b iid-ladder
 |                                                        └─> P05 primitives
 └─> P06 contract artifact sync -> P07 protocol direct URI API
                                      ├─> P08 protocol FeeProxy API (if in launch scope)
                                      └─> P09 React URI creation

P04b + P05 + P07 (+ P08/P09 when included)
 └─> P10 cross-package conformance
      └─> P11 docs + examples
           └─> P12 release candidate and publish manifest
                └─> merge umbrella PR #15
```

P01–P05, including P04b, are the semantic lane. P06–P09 are the contract lane. They can proceed in parallel after P00. P10 is the integration join.

## Reading order

1. [01-pr-stack.md](./01-pr-stack.md) — exact child PRs, scopes, dependencies, and definitions of done
2. [02-target-package-contracts.md](./02-target-package-contracts.md) — ownership and target public APIs
3. [03-integration-and-release-runbook.md](./03-integration-and-release-runbook.md) — branch workflow, versions, publishing, and package-age constraints
4. [04-acceptance-matrix.md](./04-acceptance-matrix.md) — fixtures and required evidence
5. [05-release-candidate-evidence-2026-08-12.md](./05-release-candidate-evidence-2026-08-12.md) — current local validation ledger and remaining release gates

## Non-negotiable rules

- `@0xintuition/iid` is pure and offline; provider and classification policy do not live there.
- `@0xintuition/classifications` declares identity ladders; it does not become a network resolver.
- `@0xintuition/iid-registry` is the only scheme-to-classification/provider bridge.
- `@0xintuition/iid-ladder` is the shared heterogeneous-input projection boundary; successful results must always be valid registered IIDs.
- `@0xintuition/primitives` is the supported high-level atom-anchor builder.
- URI context never changes IID bytes or atom ID.
- `createAtoms` remains supported; URI support is additive.
- Contract ABI and bytecode come from an exact `@0xintuition/contracts-v2` artifact and have checked provenance.
- Internal `@0xintuition/*` dependencies are exact-pinned in packed manifests.
- Feature PRs contain tests and documentation for their public contract; version publishing occurs only after the final release gate.
- No application-specific `AtomCategory` or provider implementation leaks into public semantic packages.

## Current facts affecting execution

- PR #15's integration branch is committed through P05 at `6a484dc`; P04b, P06-P07, and the package-gateway/release changes are locally implemented but still need reviewable commits.
- None of `iid-spec`, `iid`, or `iid-registry` is currently published on NPM.
- Public classifications already contain declarative identity ladders, but duplicate IID scheme/class/typing definitions and still build legacy JSON-LD atom data.
- Published protocol `3.0.0` lacks the URI surface. Candidate `protocol@3.1.0` now implements `createAtomsWithUris`, `getAtomUriConfig`, `AtomContextRegistered`, and `AtomUriConfigUpdated` in the local integration worktree and passes the exact-artifact and tarball gates; it is not released yet.
- `@0xintuition/contracts-v2@1.1.0-alpha.0` was published on 2026-08-04 and is normally eligible on 2026-08-18. Leadership approved one exact, time-bounded exception for P06: `supply-chain-exceptions.json` pins the version, registry SHA-512 integrity, publication time, purpose, and removal time; the repository guard rejects version/lock drift, additional Bun exclusions, and retention after normal eligibility. This approval does not extend to any other dependency.
- The current private implementation reference is `workspace/intuition-v2` at merge `63ab74814` (`Feat: Intuition Identifier Migration`). It introduced `intuition/iid-ladder`, but its provider-local branch can emit IID-shaped values that its own public parser rejects. P04b preserves the useful input precedence and prefix inventory while making valid registered IID output a hard invariant.

## Completion condition

A clean consumer installed only from packed tarballs can:

1. derive and validate a canonical IID;
2. infer its safe classification and provider plan;
3. build canonical atom bytes, atom ID, and ordered URI context;
4. encode/simulate URI-aware creation;
5. decode `AtomCreated` and `AtomContextRegistered` from the same receipt fixture; and
6. reproduce unchanged behavior for legacy JSON-LD builders and `createAtoms`.
