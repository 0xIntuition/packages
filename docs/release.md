# Release Strategy and Runbook

This repository publishes the public `@0xintuition/*` package family. Treat
release metadata, package exports, schema URLs, and npm dist-tags as part of the
product contract.

## Current Policy

- `main` is the integration branch.
- Package roots are directly publishable npm artifacts.
- Release work should happen in dedicated release PRs unless the change is a
  docs-only correction.
- Ordinary feature/fix PRs should not bump versions.
- Published versions must never be reused. Supersede with a new version.
- Do not publish `@0xintuition/cli`, `@0xintuition/sdk`, or
  `@0xintuition/stacks` from this repo unless that scope is explicitly added.

## Dist-Tag Policy

The first public package set has two release tracks:

| Package family | Current version line | Intended dist-tags |
| --- | --- | --- |
| Fresh public packages | `0.1.0-alpha.*` | `alpha` and `latest` can both point at the current alpha while no stable line exists |
| `@0xintuition/protocol` | `3.x` | `latest` should point at the current v3 release; `alpha` may also point at v3 while the package family remains alpha-oriented |

For new packages, using both `alpha` and `latest` is acceptable because there is
no previous stable public line to protect. Consumer docs may still prefer
`@alpha` while the API is settling.

For `@0xintuition/protocol`, do not leave `latest` on the legacy `2.0.2` line
once `3.0.0` is the intended public protocol package. The legacy version remains
installable by exact version.

Known registry check from 2026-06-22:

```txt
@0xintuition/deployments latest = 0.1.0-alpha.0, alpha = 0.1.0-alpha.0
@0xintuition/classifications latest = 0.1.0-alpha.0, alpha = 0.1.0-alpha.0
@0xintuition/protocol latest = 2.0.2, alpha = 3.0.0
```

If `@0xintuition/protocol@3.0.0` is still the accepted current release, correct
the protocol dist-tag with:

```bash
npm dist-tag add @0xintuition/protocol@3.0.0 latest
```

Use a temp npm cache if the local npm cache has ownership issues:

```bash
NPM_CONFIG_CACHE=/tmp/npm-cache-intuition-packages npm dist-tag add @0xintuition/protocol@3.0.0 latest
```

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
alpha, some focused changes cascade:

| Changed package | Usually publish | Why |
| --- | --- | --- |
| `deployments` | `deployments`, then `periphery` and `react` if their pins or behavior should consume the new deployment data | Runtime dependents pin deployments exactly |
| `curves` | `curves`, then `protocol` if protocol should consume the new curve version | Protocol re-exports/uses curve helpers |
| `schema-org` | `schema-org`; also `classifications` if generated creation profiles or schema validation output changes | Schema.org is a foundation/dev input for classifications |
| `ids` | `ids`, then `predicates`, `primitives`, and `react` if their pins or ID behavior should move together | ID helpers sit below predicate, primitive, and React flows |
| `classifications` | `classifications`, then `primitives` if primitive builders or pins should consume the new classification version | Primitives compose classification specs |
| `predicates` | `predicates`, then `primitives`; also `classifications` if metadata predicates or creation profiles change | Predicates feed primitive builders and classification creation profiles |
| `primitives` | `primitives` only, unless downstream docs/examples need updates | High-level builders sit above the data packages |
| `protocol` | `protocol`, then `react` if React should consume the new protocol version | React depends on protocol |
| `periphery` | `periphery` only, unless shared deployment data changed | Periphery is a leaf package |
| `react` | `react` only | React is a leaf package |

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

If local npm cache ownership blocks registry commands, use:

```bash
NPM_CONFIG_CACHE=/tmp/npm-cache-intuition-packages npm view @0xintuition/protocol dist-tags version --json
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
