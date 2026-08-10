# IID and atom-URI package release train

Status: execution-ready PR plan

Umbrella PR: [#15 — Update: v1.1.0-alpha](https://github.com/0xIntuition/packages/pull/15)

Integration branch: `update/v1.1.0-alpha`

Prepared: 2026-08-10

## Objective

Publish the reusable package layer required for Intuition Identifier atoms and creation-time URI context before Intuition Core or application writers switch their defaults.

The release train adds three public IID packages, reconciles the existing classification identity ladders, adds a canonical IID atom builder, updates protocol and React creation APIs, and strengthens the tarball/release gates that bind these packages together.

## How PR #15 is used

PR #15 is the release-train umbrella from `update/v1.1.0-alpha` to `main`. Feature branches open child PRs with `update/v1.1.0-alpha` as their base. Each merged child PR updates the umbrella automatically. PR #15 merges only after the complete packed-tarball consumer and release checklist pass.

The branch name is a program label, not a package-wide version. Packages retain independent semver:

| Package | Target version |
| --- | --- |
| `@0xintuition/iid-spec` | `0.1.0-alpha.0` |
| `@0xintuition/iid` | `0.1.0-alpha.0` |
| `@0xintuition/classifications` | `0.1.0-alpha.1` |
| `@0xintuition/iid-registry` | `0.1.0-alpha.0` |
| `@0xintuition/primitives` | `0.1.0-alpha.1` |
| `@0xintuition/protocol` | `3.1.0` |
| `@0xintuition/react` | `0.1.0-alpha.1` |

`ids`, `schema-org`, `predicates`, `deployments`, and `periphery` release only if their public data or behavior changes. Do not bump them merely to make the train look uniform.

## PR dependency graph

```text
P00 plan + release scaffolding
 ├─> P01 iid-spec -> P02 iid -> P03 classifications -> P04 iid-registry -> P05 primitives
 └─> P06 contract artifact sync -> P07 protocol direct URI API
                                      ├─> P08 protocol FeeProxy API (if in launch scope)
                                      └─> P09 React URI creation

P05 + P07 (+ P08/P09 when included)
 └─> P10 cross-package conformance
      └─> P11 docs + examples
           └─> P12 release candidate and publish manifest
                └─> merge umbrella PR #15
```

P01–P05 are the semantic lane. P06–P09 are the contract lane. They can proceed in parallel after P00. P10 is the integration join.

## Reading order

1. [01-pr-stack.md](./01-pr-stack.md) — exact child PRs, scopes, dependencies, and definitions of done
2. [02-target-package-contracts.md](./02-target-package-contracts.md) — ownership and target public APIs
3. [03-integration-and-release-runbook.md](./03-integration-and-release-runbook.md) — branch workflow, versions, publishing, and package-age constraints
4. [04-acceptance-matrix.md](./04-acceptance-matrix.md) — fixtures and required evidence

## Non-negotiable rules

- `@0xintuition/iid` is pure and offline; provider and classification policy do not live there.
- `@0xintuition/classifications` declares identity ladders; it does not become a network resolver.
- `@0xintuition/iid-registry` is the only scheme-to-classification/provider bridge.
- `@0xintuition/primitives` is the supported high-level atom-anchor builder.
- URI context never changes IID bytes or atom ID.
- `createAtoms` remains supported; URI support is additive.
- Contract ABI and bytecode come from an exact `@0xintuition/contracts-v2` artifact and have checked provenance.
- Internal `@0xintuition/*` dependencies are exact-pinned in packed manifests.
- Feature PRs contain tests and documentation for their public contract; version publishing occurs only after the final release gate.
- No application-specific `AtomCategory` or provider implementation leaks into public semantic packages.

## Current facts affecting execution

- PR #15 currently contains only a private root-package version change.
- None of `iid-spec`, `iid`, or `iid-registry` is currently published on NPM.
- Public classifications already contain declarative identity ladders, but duplicate IID scheme/class/typing definitions and still build legacy JSON-LD atom data.
- Public protocol `3.0.0` lacks `createAtomsWithUris`, `getAtomUriConfig`, `AtomContextRegistered`, and `AtomUriConfigUpdated`.
- `@0xintuition/contracts-v2@1.1.0-alpha.0` was published on 2026-08-04. This repository's 14-day minimum-release-age policy makes it normally installable on 2026-08-18. Protocol work may be prepared in draft against the verified artifact, but the dependency/parity gate must not weaken the policy.
- The authoritative private reference for `iid-spec`, `iid`, and `iid-registry` porting is the `0xIntuition/intuition-v2` repository checkout at `workspace/alpha/intuition/{iid-spec,iid,iid-registry}` (verified at commit `8b9e9aa11`; IID/spec landed in PR #914, registry in PR #1115). The copies under `alpha-capa/`, `alpha-gamma/`, and `intuition-v2/` workspace directories are stale checkouts of the same repo — do not port from them. Record the exact source commit in each porting PR body.

## Completion condition

A clean consumer installed only from packed tarballs can:

1. derive and validate a canonical IID;
2. infer its safe classification and provider plan;
3. build canonical atom bytes, atom ID, and ordered URI context;
4. encode/simulate URI-aware creation;
5. decode `AtomCreated` and `AtomContextRegistered` from the same receipt fixture; and
6. reproduce unchanged behavior for legacy JSON-LD builders and `createAtoms`.
