# Publish contract artifacts before merging this release

The SDK branch contains newer MultiVault, dynamic-fee, FeeProxy, and router artifacts than
the currently pinned npm source. The contract changes have not yet been
published. Keep the intended newer code; release the matching contract artifacts
and reconcile this repository against them before merging PR #15.

## Package names and locations

| Name | Role / location |
| --- | --- |
| **`@0xintuition/contracts-v2`** | Public npm package containing Solidity source, ABIs, and bytecode; published from [0xIntuition/intuition-contracts-v2](https://github.com/0xIntuition/intuition-contracts-v2), whose root `package.json` owns the npm name/version |
| `intuition-contracts-v2` | Private application-monorepo workspace at `contracts/core`; not the public scoped npm package |
| `intuition-contracts-v2-periphery` | Private application-monorepo workspace at `contracts/periphery`; contains router sources and is not configured for npm publication |
| `@0xintuition/deployments` | Central ABI/bytecode source in `packages/deployments/src/abis` and `src/bytecode`; also owns core/periphery addresses |
| `@0xintuition/protocol` | Low-level wrappers in `packages/protocol`; re-exports central core artifacts |
| `@0xintuition/periphery` | Public SDK in `packages/periphery`; provides FeeProxy/router wrappers and re-exports central artifacts; it is not the Solidity source package |

This repository consumes `@0xintuition/contracts-v2` in these places:

- Root `package.json`: exact **development** dependency, currently `1.1.0-alpha.0`.
- `bun.lock`: version and npm tarball SHA-512 integrity.
- `scripts/sync-protocol-artifacts.mjs`: expected package/version, registry
  verification, and MultiVault/MigrationMode generated-file comparison.
- `packages/protocol/src/contracts/contracts-v2-provenance.ts`: generated
  verification record for MultiVault/MigrationMode. It currently says `source: unpublished`, `verified: false`; do not restore the old npm verification flag.
- `packages/protocol/src/contracts/abi-parity.unit.test.ts`: migration-mode semantic comparison with the installed npm artifact and URI/event invariants. Changed MultiVault parity is enforced by the release gate.
- `scripts/check-release-contracts.ts`: broader release-only artifact comparison.

SDK consumers do not install the Solidity source package at runtime.

## Current differences to resolve

Against `@0xintuition/contracts-v2@1.1.0-alpha.0`:

- MultiVault ABI and bytecode differ after integrating PR #38; the bytecode has an unresolved MultiVaultLib link placeholder. MultiVaultMigrationMode and AtomWarden still match the pinned artifact.
- DynamicFeeFlatPriceCurve ABI/bytecode differ. The candidate has `vaultStake`
  and `DepositBandRecorded`; the published source has `vaultAssets` and a
  different `DepositRecorded` layout. Published deposit-fee math advances across
  gross bands; the candidate helper uses net-anchored gross-up.
- FeeProxy ABI/bytecode differ, including `maxFeeBps` versus `maxBps` and affiliate
  event names.
- TrustSwapAndBridgeRouter, TimelockController, and IBaseCurve are not exported by the pinned source package.

`contract-artifacts.json` fingerprints the complete candidate export set from PR #38 plus the retained MigrationMode artifacts. `bun run artifacts:check` detects drift but does **not** certify npm provenance or deployment compatibility. The old MultiVault verification record has been invalidated. `bun run release:contracts` deliberately fails until their sources
are reconciled. It currently checks all listed contracts against the core
artifact. If the router gets a separate public artifact package, add its exact
root dependency and route the comparison to that package; do not simply exclude
the router from verification.

## Contract repository release checklist

Run this in the public contract publishing repository, on the reviewed contract
revision. The scripts below are present in its package manifest.

1. Port the intended `contracts/core` and `contracts/periphery` source changes
   from the application monorepo. Preserve their tested compiler/Foundry settings.
   Confirm the source commit with the contract maintainers.
2. Ensure `extract-abis.ts` and `extract-bytecodes.ts` export MultiVault,
   MultiVaultMigrationMode, AtomWarden, DynamicFeeFlatPriceCurve, FeeProxy, and the
   bridge router, plus the base-curve interface and TimelockController added in PR #38. Include library link references for unlinked MultiVault bytecode. Include the router in this artifact or establish a separately
   versioned public package with equivalent source/build provenance.
3. Choose an **unused** version. `1.1.0-alpha.1` is an example next candidate,
   not a reserved version. Check the live inventory first:

   ```bash
   npm view @0xintuition/contracts-v2 versions dist-tags --json
   ```

4. Update the publishing repository's root `package.json` version and lockfile.
   Build and verify the actual package:

   ```bash
   bun install --frozen-lockfile
   bun run test
   bun run build:package
   npm pack --dry-run --json
   npm pack --ignore-scripts
   ```

   Inspect the tarball's `src`, `dist/abis`, `dist/bytecodes`, declarations, and
   `package.json`. Install that tarball in a temporary consumer and compare its
   exports to the SDK artifacts. Verify dynamic-fee quotes against the intended
   Solidity revision, including band crossings and overflow/revert boundaries.
   Record the source commit, compiler version, tarball integrity, and tests.
5. The release owner publishes from that repository after contract review:

   ```bash
   npm whoami
   npm publish --access public --tag alpha
   npm view @0xintuition/contracts-v2@<new-version> version dist.integrity dist.tarball --json
   ```

   Replace `<new-version>` with the actual version. Keep `latest` unchanged.
   Publishing an npm artifact does not deploy or upgrade an on-chain contract.

## Repin and verify this packages repository

1. Update the root exact `@0xintuition/contracts-v2` devDependency and
   `EXPECTED_VERSION` in `scripts/sync-protocol-artifacts.mjs` together. Update the
   version-bound provenance tests and regenerate `bun.lock`. If a separate router
   package is introduced, add its exact pin and verification mapping too.
2. Respect `bunfig.toml`'s 14-day minimum release age. Wait for eligibility or
   obtain a new exact, time-bounded exception using the existing
   `supply-chain-exceptions.json` process. The old exception is expired and does
   not authorize this new version. Do not disable the policy globally.
3. Install and check the new source:

   ```bash
   bun install --frozen-lockfile
   bun run protocol:sync-artifacts -- --verify-registry
   bun run protocol:check-artifacts -- --verify-registry
   bun run release:contracts
   bun run artifacts:check
   ```

   The sync script refuses to overwrite changed ABI/bytecode. If it reports a
   difference, review and regenerate the affected contract files deliberately,
   update the reviewed `contract-artifacts.json` fingerprints and affected wrappers/tests, then rerun. The central files live in `packages/deployments/src/abis` and `src/bytecode`; also run the CLI's `vendor:abis` command and its ABI parity tests after changes.
   Do not use the old source to overwrite the newer intended contract behavior.
   Extend recorded provenance to every newly shipped artifact family.
4. Run all [release validation](./release.md#required-validation), including
   clean-room tarball imports/types and dynamic-fee parity tests against the new
   artifact. Confirm deployment addresses separately; an npm version alone does
   not establish the code running at an address.
5. Attach the exact contract source commit/version/integrity and SDK commit to
   PR #15. Merge only once contract provenance, identity decisions, and consumer
   acceptance in [release readiness](./release-readiness.md) are resolved.

The current working session prepared these instructions and checks; it did not
publish contracts, publish SDK packages, or change deployed contracts.
