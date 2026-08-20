# IID package release-candidate evidence — 2026-08-12

Status: local candidate green; not an immutable or publish-authorized release

Branch: `update/v1.1.0-alpha`

Committed base: `6a484dc` (`feat(primitives): build canonical IID atom anchors (P05)`)

The evidence below includes uncommitted P06-P07, package-gateway, and release-readiness changes. It must be repeated from the exact reviewed commit in a clean detached worktree before publication.

## Candidate package graph

```text
@0xintuition/iid-spec@0.1.0-alpha.0
  -> @0xintuition/iid@0.1.0-alpha.0
     +-> @0xintuition/classifications@0.1.0-alpha.1
     |     -> @0xintuition/iid-registry@0.1.0-alpha.0
     |            -> @0xintuition/primitives@0.1.0-alpha.1
     +-> @0xintuition/iid-ladder@0.1.0-alpha.0

@0xintuition/protocol@3.1.0
  -> @0xintuition/react@0.1.0-alpha.1
```

Existing exact internal dependencies (`ids`, `predicates`, `schema-org`, `curves`, and `deployments`) remain on their already-published versions. React was advanced from `0.1.0-alpha.0` to `0.1.0-alpha.1` because its exact protocol dependency changed and NPM versions are immutable.

## Approved contract-source exception

```text
package:     @0xintuition/contracts-v2@1.1.0-alpha.0
integrity:   sha512-vt9GFaFXYAeigLyl/4i6hPpLO4NBrZDyWJrM2M7aHuQ39/qSpxqMmIzetoAtpBWWx4AzM5wccUsXJvVST02saA==
published:   2026-08-04T19:56:37.884Z
removeAfter: 2026-08-18T19:56:37.884Z
```

Because Bun supports package-name exclusions rather than version-qualified exclusions, `supply-chain-exceptions.json` is the approval record and `guard-supply-chain-policy.mjs` binds it to the exact root manifest version and Bun lockfile integrity. The guard also rejects extra exclusions and expires this record when the normal 14-day age is reached.

## Local validation ledger

| Gate | Result |
| --- | --- |
| `bun install --frozen-lockfile` | passed; 585 installs across 609 packages checked with no changes |
| `bun run guard:supply-chain` | passed |
| `bun run guard:supply-chain:test` | 6/6 passed, including malformed policy, exclusion/version/integrity drift, and frozen-install cases |
| `bun run protocol:check-artifacts` | passed against exact contracts-v2 `1.1.0-alpha.0` |
| `bun run registry:check` | superseded 2026-08-13: passed for all 14 registered packages after adding the latest private `iid-ladder` boundary |
| `bun run test` | passed for the complete workspace |
| `bun run typecheck` | passed for the complete workspace |
| `bun run check` | passed for the complete workspace |
| `bun run build` | passed for the complete workspace |
| `bun run schema:validate` | passed |
| generated schema/classification/predicate drift checks | passed |
| `bun run pack:dry-run` | passed for all registered public packages |
| `bun run smoke:tarballs` | passed clean-room tarball installation/import checks under Node and Bun |
| Core sibling-package acceptance | 6/6 passed for IID inspection/registry enrichment, semantic identity persistence, and exact runtime manifest binding |
| `git diff --check` | passed |

The first full clean test run exposed a classifications test that imported its own built subpath while its build task cleaned `dist` concurrently. The redundant self-import assertion was removed; the public subpath remains covered by manifest checks and the clean-room tarball consumer. A subsequent full run passed.

## Registry preflight

As of 2026-08-12, the following exact candidate versions return NPM `E404` and therefore remain unpublished:

- `@0xintuition/iid-spec@0.1.0-alpha.0`
- `@0xintuition/iid@0.1.0-alpha.0`
- `@0xintuition/classifications@0.1.0-alpha.1`
- `@0xintuition/iid-registry@0.1.0-alpha.0`
- `@0xintuition/iid-ladder@0.1.0-alpha.0`
- `@0xintuition/primitives@0.1.0-alpha.1`
- `@0xintuition/protocol@3.1.0`
- `@0xintuition/react@0.1.0-alpha.1`

## Remaining release gates

1. Split P04b, P06 artifact/provenance, P07 protocol APIs, and the package-gateway/release work into reviewable commits or child PRs against PR #15.
2. Review the generated ABI/bytecode diff and URI helper/event semantics with the Solidity and Core consumers.
3. Restore NPM release credentials: `npm whoami` and organization access preflight currently return `E401`, so this machine is not publish-capable.
4. Complete P10-P12 documentation, cross-consumer evidence, NPM organization/2FA/provenance preflight, and release approval.
5. Repeat this ledger from the exact clean reviewed commit and archive logs plus produced tarball checksums.
6. Merge PR #15, publish only with explicit release-owner authorization in dependency order, verify each immutable registry artifact before publishing its dependants, and record integrity plus Core eligibility dates.

GitHub authentication is healthy enough to inspect PRs. At this snapshot, umbrella PR #15 and draft child PR #22 are the only open package PRs; no P06/P07 child PR exists yet.

No package has been published by this work session.

## Exact PR split for the active worktree

Apply these in order against `update/v1.1.0-alpha`; do not duplicate files across PRs.

| PR | Primary files | Review focus |
| --- | --- | --- |
| P06a `chore(security): approve exact contracts-v2 release-age exception` | exact root contracts-v2 dev dependency/lock, `bunfig.toml`, `supply-chain-exceptions.json`, supply-chain guard and tests, exception/runbook documentation | approval scope, exact version/integrity binding, extra-exclusion rejection, frozen install, automatic expiry on 2026-08-18 |
| P06 `chore/protocol-uri-artifacts` | `scripts/sync-protocol-artifacts.mjs`, generated MultiVault/MigrationMode ABI and bytecode, `contracts-v2-provenance.ts`, protocol version | exact NPM source/integrity, deterministic generation, semantic ABI/bytecode provenance, no manual artifact drift |
| P07 `feat(protocol): add direct atom URI APIs` | `create-atoms-with-uris*`, `get-atom-uri-config.ts`, event parsers/context joiner, MultiVault exports/tests, necessary v1.1 signature updates in approve/redeem helpers | calldata shape, URI ordering/duplicates/opaque bytes, term-ID event joining without adjacency, legacy API compatibility |
| P12a `chore(release): harden IID train candidate` | React `0.1.0-alpha.1` version/exact protocol pin, classifications clean-test race fix, release evidence and remaining planning updates | immutable version availability, package graph, public subpath coverage in tarball smoke, publish authorization/authentication |

P06a must land before P06 CI can install the young contracts artifact. P07 depends on P06's generated contract surface. P12a follows P07 and must rerun the complete ledger from the resulting immutable commit. If maintainers prefer three PRs, fold P06a into P06 but keep the security approval as a distinct commit and review section.
