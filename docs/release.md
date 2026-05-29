# Alpha Release Runbook

## Hard Gates

- Do not publish to npm before formal team review.
- Do not make the GitHub repository public before the agreed review point.
- Do not push or open a PR from an agent run unless explicitly requested.
- Do not copy or publish `@0xintuition/cli`, `@0xintuition/sdk`, or `@0xintuition/stacks` in this round.
- Do not remove packages or deployment exports from the product codebase in this round.

## Required Validation

```bash
bun install --frozen-lockfile
bun run build
bun run typecheck
bun run test
bun run check
bun run schema:validate
bun run predicates:check-generated
bun run guard:supply-chain
bun run pack:dry-run
bun run smoke:tarballs
```

## Package Graph And Publish Order

1. `@0xintuition/deployments@0.1.0-alpha.0` - no internal dependencies; owns protocol deployment addresses and chain metadata.
2. `@0xintuition/curves@0.1.0-alpha.0` - no internal dependencies.
3. `@0xintuition/ids@0.1.0-alpha.0` - schema-host-gated for `https://schema.intuition.systems/v1/oauth-atom.jsonld`.
4. `@0xintuition/classifications@0.1.0-alpha.0` - schema-host-gated for `https://schema.intuition.systems/v1/ethereum.jsonld`.
5. `@0xintuition/predicates@0.1.0-alpha.0` - depends on ids.
6. `@0xintuition/primitives@0.1.0-alpha.0` - depends on classifications, ids, and predicates.
7. `@0xintuition/protocol@3.0.0-alpha.0` - depends on curves; v3 alpha because deployment exports were extracted in this copy.
8. `@0xintuition/periphery@0.1.0-alpha.0` - depends on deployments for shared Intuition chain IDs; keeps periphery bridge/router addresses in periphery.
9. `@0xintuition/react@0.1.0-alpha.0` - depends on deployments, ids, and protocol; does not depend on the deferred SDK.

Use `--tag alpha` when publishing staged tarballs after review. If protocol deployment extraction is reverted or slips, do not publish protocol as v3.

## Staged Tarball Flow

Package roots intentionally keep source entrypoints for workspace development. The release flow builds `dist/`, stages a temporary package, rewrites entrypoints to `dist/index.js` and `dist/index.d.ts`, strips dev-only metadata, rewrites `workspace:*` dependencies to concrete versions, and packs from the staged copy.

```bash
bun run pack:dry-run
bun run smoke:tarballs
```

Direct `npm publish` from package roots is blocked by `prepublishOnly`. Publish only the staged tarballs produced by `bun run --cwd packages/<name> pack:release` after review.

Internal workspace dependencies are pinned to the exact packed package versions in staged tarballs. Keep that lockstep policy for the first coordinated publication unless the release owner explicitly chooses semver ranges before publishing.

## Schema Host Gate

GitHub Pages must serve:

- `https://schema.intuition.systems/v1/oauth-atom.jsonld`
- `https://schema.intuition.systems/v1/ethereum.jsonld`

This repo includes a separate least-privilege Pages workflow that uploads `schema/` as the artifact root. After Pages and DNS are wired, verify the live host with:

```bash
bun run schema:verify-live
```

Treat `/v1/*` as immutable. Breaking schema changes go to `/v2/*` and require package constants and tests to change together.

## Pre-Publish Human Checks

- Confirm npm org access, package publish permissions, and 2FA before packing release tarballs.
- Human-verify every address in `@0xintuition/deployments` for each supported chain; automated smoke only checks address shape.
- Confirm the `@0xintuition/deployments` API surface intentionally includes small address lookup helpers.
- Confirm whether fresh packages stay on prerelease `0.1.0-alpha.0` with the alpha dist-tag or flip to stable `0.1.0` on `latest`.
- Confirm whether `@0xintuition/protocol` publishes as `3.0.0-alpha.0` on the alpha dist-tag or `3.0.0` on `latest`.
- Confirm the `viem` peer range. Source manifests allow `^2.0.0`; release smoke tests currently install `viem@2.31.4`.

## Rollback Notes

Alpha packages can be deprecated or superseded with a later alpha tag. Do not reuse versions. If a package publishes with incorrect schema URLs or leaked workspace dependency specs, deprecate that exact version and publish a new alpha after the tarball smoke passes.
