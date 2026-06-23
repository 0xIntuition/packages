# Release Strategy and Runbook

This repository publishes the public `@0xintuition/*` packages. When a release
changes how developers install packages, import files, resolve schema URLs, or
receive default npm versions, call that out clearly in the release notes.

## Current Policy

- `main` is the integration branch.
- Package roots are directly publishable npm artifacts.
- Release work should happen in dedicated release PRs unless the change is a
  docs-only correction or the PR is explicitly scoped as a package release.
- Feature/fix PRs should call out package-impacting changes, but package version
  bumps normally happen in the release PR.
- Published versions must never be reused. Supersede with a new version.

## Dist-Tag Policy

The first public package set has two release tracks:

| Package family | Current version line | Intended dist-tags |
| --- | --- | --- |
| Fresh public packages | `0.1.0-alpha.*` | `alpha` and `latest` can both point at the current alpha while no stable line exists |
| `@0xintuition/protocol` | `3.x` | `latest` should point at the current v3 release; `alpha` may also point at v3 while the package family remains alpha-oriented |

For new packages, using both `alpha` and `latest` is acceptable because there is
no previous stable public line to protect. Consumer docs may still prefer
`@alpha` while the API is settling.

For packages with an existing stable line, keep `latest` pointed at the current
recommended public version. Older versions remain installable by exact version.
If a release changes which version should be the default install, update the
dist-tag during the release and call it out in the release notes.

## Versioning Rules

Version by externally visible package behavior.

### Alpha Packages

Most fresh packages currently use `0.1.0-alpha.0`.

Use the next alpha prerelease for changes before a stable release:

- `0.1.0-alpha.1`
- `0.1.0-alpha.2`
- and so on

Breaking API changes are acceptable during alpha, but they still need clear
release notes because downstream builders may already be testing against the
packages.

### Stable / Major Packages

`@0xintuition/protocol` follows normal semver because it supersedes an existing
`2.x` line.

- Patch: compatible fixes and clarifications.
- Minor: backward-compatible API additions.
- Major: breaking API changes, removed exports, changed install/runtime
  prerequisites, or behavior that invalidates existing consumers.

## Required Validation

Run the full gate before publishing or changing release-critical package
surfaces:

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

For docs-only release-strategy edits, at minimum run:

```bash
git diff --check
```

## Package Graph and Publish Order

Publish in dependency order:

1. `@0xintuition/deployments`
2. `@0xintuition/curves`
3. `@0xintuition/ids`
4. `@0xintuition/schema-org`
5. `@0xintuition/classifications`
6. `@0xintuition/predicates`
7. `@0xintuition/primitives`
8. `@0xintuition/protocol`
9. `@0xintuition/periphery`
10. `@0xintuition/react`

This order matches the release packing/smoke scripts and keeps internal
dependency pins resolvable as each package is published.

## Updating Individual Packages

Release the changed package plus any package whose checked-in manifest,
generated output, or public behavior must change as a result.

Because internal `@0xintuition/*` dependency versions are exact pins during
alpha, a lower-level package release may need matching releases for dependents.
Not every lower-level release forces every dependent to move; bump a dependent
when its manifest, generated output, or public behavior should consume the new
version.

Common cascades:

- `deployments`: also release `periphery` and `react` when their address helpers
  or package pins should consume the new deployment data.
- `curves`: also release `protocol` when protocol should consume the new curve
  version.
- `schema-org`: also release `classifications` when schema validation, Creation
  Profiles, or generated classification output changes.
- `ids`: also release `predicates`, `primitives`, or `react` when their ID
  behavior or exact pins should move with the ID package.
- `classifications`: also release `primitives` when primitive builders or pins
  should consume the new classification data.
- `predicates`: also release `primitives`; also release `classifications` when
  metadata predicate refs, matrix rows, or Creation Profiles change.
- `protocol`: also release `react` when React should consume the new protocol
  version.
- Leaf packages such as `primitives`, `periphery`, and `react` usually release
  on their own unless shared data, examples, or docs need to move with them.

Use the dependency graph as the starting point, but validate with the diff:

1. If only implementation inside one leaf package changed, release that package.
2. If a lower-level package changed and dependents need the new exact pin, bump
   and publish the dependents in graph order.
3. If generated artifacts changed, publish the package that owns the generated
   artifacts even if the source change lives elsewhere.
4. If package behavior changes but no dependent needs to move yet, document that
   decision in the release PR.

Keep release PRs small when possible. A package-specific release PR is fine; a
coordinated release PR is better when exact pins or generated outputs must move
together.

## Direct Package-Root Flow

Package roots are publishable npm artifacts. Their manifests point public
entrypoints at `dist`, include only the intended tarball files, and use concrete
internal package versions instead of workspace-only dependency protocols.

Before publishing:

```bash
bun run pack:dry-run
bun run smoke:tarballs
```

Then publish from each package root in the graph order above:

```bash
cd packages/deployments
npm publish --access public
```

Package manifests own their `publishConfig.tag` values. Fresh alpha packages set
`publishConfig.tag = "alpha"`. `@0xintuition/protocol` intentionally omits a
tag in its manifest so npm publishes it to the default `latest` tag unless a
release owner passes an explicit tag.

`bun run --cwd packages/<name> pack:release` remains available as an audit
helper. It builds the package, validates the direct-publish guard, runs
`npm pack` from the package root, and prints the produced tarball path.

Internal package dependencies are pinned to exact package versions in checked-in
manifests. Keep that lockstep policy until the release owner explicitly chooses
semver ranges.

## Registry Verification

Before publishing:

```bash
npm whoami
npm org ls 0xintuition
```

After publishing or changing dist-tags:

```bash
npm view @0xintuition/deployments dist-tags version --json
npm view @0xintuition/classifications dist-tags version --json
npm view @0xintuition/protocol dist-tags version --json
```

## Schema Host Policy

The schema host must serve JSON-compatible content types for:

- `https://schema.intuition.systems/v1/oauth-atom.jsonld`
- `https://schema.intuition.systems/v1/ethereum.jsonld`

Verify live schema hosting with:

```bash
bun run schema:verify-live
```

The live verifier intentionally requires a JSON-compatible response content
type: `application/ld+json`, `application/json`, or another
`application/*+json` media type. Do not loosen this to accept `text/plain` or
`application/octet-stream`.

Treat `/v1/*` schema URLs as identity-sensitive. Breaking schema changes go to
`/v2/*` and require package constants, tests, and migration notes to change
together.

## Identity-Sensitive Changes

Schema URL strings and serialized predicate atom data participate in
deterministic IDs.

Examples of release-sensitive changes:

- changing OAuth atom `@context` URLs,
- changing Ethereum classification context URLs,
- changing predicate names or descriptions used in atom data,
- changing triple subject/predicate/object order,
- changing public classification slugs or predicate keys.

If a release intentionally changes identity, document the fork, expected
dedupe/reconciliation behavior, and downstream migration path before publishing.

## Rollback and Recovery

Prefer deprecation and superseding releases over unpublish.

- Do not reuse a published version.
- If an alpha package ships incorrect metadata, publish the next alpha and
  deprecate the bad version with a clear message.
- If a dist-tag points at the wrong version, fix the tag directly with
  `npm dist-tag add`.
- If a schema URL or deterministic ID surface is wrong, stop adoption, publish a
  corrected version, and document the identity impact.
