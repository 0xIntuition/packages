# Integration and release runbook

## Branch model

PR #15 is a temporary release integration branch, not a permanent development branch.

For each child PR:

1. Confirm all listed dependency PRs are merged into `update/v1.1.0-alpha`.
2. Update local integration branch from `origin/update/v1.1.0-alpha`.
3. Create the child feature branch from that exact head.
4. Open the PR with base `update/v1.1.0-alpha`, not `main`.
5. Put the P-number, changed packages, target versions, identity impact, and fixture impact in the PR body.
6. Require full CI and the named cross-owner review.
7. Squash/merge into the integration branch.
8. Rebase only unmerged dependent branches; do not force-push someone else's branch.
9. Re-run the umbrella PR checks after each merge.

Suggested commands:

```bash
git fetch origin
git switch update/v1.1.0-alpha
git pull --ff-only origin update/v1.1.0-alpha
git switch -c feat/iid
gh pr create --base update/v1.1.0-alpha --head feat/iid
```

Independent P01 and P06 branches can start after P00. P06 may remain draft while the exact contracts dependency ages; this should not block the semantic lane.

## Review ownership

| PR family | Primary reviewer | Required cross-review |
| --- | --- | --- |
| P01–P02 | IID/spec owner | Core parser consumer |
| P03 | classifications/schema owner | IID owner and primitives consumer |
| P04 | semantic registry owner | enrichment/Core consumer |
| P05 | primitives owner | seed/application writer and IDs owner |
| P06–P08 | protocol SDK owner | Solidity contract owner and Core indexer consumer |
| P09 | React owner | protocol SDK owner |
| P10 | integration lead | one reviewer from each lane |
| P11 | DevRel/API owner | implementing engineers validate samples |
| P12 | release owner | security/supply-chain and package owners |

The author of a producer contract should not be its only consumer-side reviewer.

## Version policy on the integration branch

This is an explicitly scoped coordinated release branch, so package manifests may carry their final target versions as their feature PRs merge. That lets exact internal pins resolve to workspace packages and lets clean tarball tests operate before NPM publication.

Rules:

- New packages begin at `0.1.0-alpha.0`.
- Existing alpha packages take the next alpha number only when behavior or exact dependencies change.
- Protocol URI functions are additive, so `3.1.0` is the proposed semver target.
- Do not bump `ids`, `schema-org`, `predicates`, `deployments`, or `periphery` without an actual change.
- All internal runtime dependencies are exact versions, never `workspace:*` in packed manifests.
- The root package is private and remains `0.0.0`; the branch/PR name carries the release-train label.

## Contract artifact provenance

Authoritative artifact:

```text
package:   @0xintuition/contracts-v2@1.1.0-alpha.0
published: 2026-08-04T19:56:37.884Z
integrity: sha512-vt9GFaFXYAeigLyl/4i6hPpLO4NBrZDyWJrM2M7aHuQ39/qSpxqMmIzetoAtpBWWx4AzM5wccUsXJvVST02saA==
eligible under 14-day policy: 2026-08-18T19:56:37.884Z
```

Preferred implementation:

- exact root dev dependency on the eligible artifact;
- deterministic script generating/checking the subset exported by `protocol`;
- checked manifest with source package/version/integrity and ABI fingerprint;
- CI fails on drift.

Before the eligibility date, developers may inspect or generate from the verified local/tarball artifact without committing a bypass or a Git dependency. P06 remains draft until normal frozen install succeeds.

## Package order and exact pins

Target changed-package graph:

```text
iid-spec@0.1.0-alpha.0
iid@0.1.0-alpha.0
classifications@0.1.0-alpha.1 -> iid@0.1.0-alpha.0
iid-registry@0.1.0-alpha.0 -> iid@0.1.0-alpha.0 + classifications@0.1.0-alpha.1
primitives@0.1.0-alpha.1 -> iid + iid-registry + classifications + existing ids/predicates
protocol@3.1.0 -> existing curves pin
react@0.1.0-alpha.1 -> protocol@3.1.0 + existing deployments/ids pins
```

The central package registry introduced in P00 should be the single source used by pack dry-run, smoke, release documentation, and publish-order checks.

## Required validation at merge join

Run after P10 and again on P12:

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

Also run:

- IID spec/conformance drift check;
- classification ladder generation/coherence check;
- contract artifact/ABI parity check;
- cross-package identity fixture check;
- compiled documentation example check.

## Publication sequence

1. Merge all child PRs into `update/v1.1.0-alpha`.
2. Complete P12 evidence and obtain release approval.
3. Merge umbrella PR #15 into `main`.
4. Create/review release tag or commit reference according to repository policy.
5. Verify NPM identity and organization permissions.
6. Pack every changed package from the exact merged commit.
7. Publish in topological order.
8. After each publish, verify version, dist integrity, unpacked exports, and clean install before proceeding.
9. Set dist-tags deliberately: new alpha packages may receive `alpha` and `latest` per current policy; `protocol@3.1.0` becomes `latest` only after verification; React/classification/primitives alpha tags follow their established line.
10. Run the clean consumer against NPM artifacts rather than local tarballs.
11. Record publish evidence and immutable integrity values.
12. Notify Core/application owners of exact versions and their release-age eligibility dates.

## Rollback

NPM releases are immutable. Do not unpublish or reuse versions.

- Broken new alpha package: publish the next alpha, move tags, and deprecate the faulty version.
- Broken protocol release: leave `latest` on `3.0.0` or move it back, publish `3.1.1`, and document ABI/helper impact.
- Identity/canonicalization defect: stop downstream writer adoption immediately; do not silently change an existing scheme. Follow the scheme/version governance rule and publish explicit migration guidance.
- ABI mismatch: stop protocol/Core adoption, correct from the exact contracts artifact, and publish a superseding version.
- Documentation/sample defect only: fix docs separately unless the packed public API is wrong.

## Umbrella PR #15 exit criteria

- All in-scope child PRs are merged and linked in its body.
- Package versions and exact pins match the release manifest.
- Contract source and eligibility facts are recorded.
- Full CI and cross-package tarball smoke pass.
- Core and private application can consume packed tarballs in clean environments.
- No unresolved blocking decision remains for P0 eligibility, registry mappings, builder profiles, FeeProxy scope, or deployments.
- Release owner has an executable publish and rollback checklist.
