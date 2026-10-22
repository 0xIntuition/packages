# Contract artifact provenance

The public SDK uses Solidity artifacts from two canonical npm packages:

| Source | Exact version | Exports used here |
| --- | --- | --- |
| [`@0xintuition/contracts-v2`](https://github.com/0xIntuition/intuition-contracts-v2) | `1.1.0-alpha.1` | Core contracts, FeeProxy, curve interfaces, and TimelockController |
| [`@0xintuition/contracts-v2-periphery`](https://github.com/0xIntuition/intuition-contracts-v2-periphery) | `1.1.0-alpha.0` | TrustSwapAndBridgeRouter ABI and bytecode |

Both are exact root development dependencies. Consumers of the SDK do not need
Solidity source packages at runtime. `bun.lock` records their registry integrity.

## Package ownership

`@0xintuition/deployments` owns the shared ABI/bytecode exports and deployment
address tables. Protocol and periphery wrappers re-export these artifacts. The
CLI vendors selected ABIs from deployments for its generated encoders.

The MultiVault and MigrationMode registry verification record is exported as
`contractsV2Provenance`. It includes the source version, integrity, verification
date, and artifact fingerprints. It does not attest to deployed contracts or to
third-party artifacts.

## Verification

```sh
bun run protocol:check-artifacts -- --verify-registry
bun run release:contracts
bun run artifacts:check
```

Registry checks validate the locked SHA-512 digest and compare installed artifact
modules, including their static imports, with the published tarball. The contract
gate then compares all shared core exports and the separately sourced router
exports with the SDK artifacts. Missing or changed artifacts fail the check.

`contract-artifacts.json` is an offline drift record. Its fingerprints do not
establish registry provenance or deployment compatibility. Metalayer and legacy
OpenZeppelin proxy artifacts remain vendored; composite bubbled-error ABIs are
derived locally. They are not certified by the core provenance record.

## Updating artifacts

1. Publish and validate the intended Solidity source revision in its owning repository.
2. Update exact development pins, the lockfile, and version-bound verification scripts.
3. Review ABI and bytecode differences before regenerating exports. The protocol
   synchronization script deliberately refuses to overwrite changed artifacts.
4. Update reviewed fingerprints and run registry verification. Use
   `bun run protocol:sync-artifacts -- --verify-registry` to record core provenance.
5. Rebuild deployments, run CLI `vendor:abis`, and validate wrappers, encoders,
   packed consumers, and affected application integrations.

The 14-day release-age policy remains enabled. Temporary exceptions must bind an
exact version and registry integrity and expire at normal eligibility. The current
core and router exceptions expire on November 2, 2026; remove each from both
`supply-chain-exceptions.json` and `bunfig.toml` when eligible.

## Compatibility

MigrationMode follows the current base-contract surface: `previewTripleCreate`
accepts subject, predicate, object, and assets. Decoded parameter/event names also
follow the current implementation. Consumers of older migration deployments must
use the ABI appropriate to those deployments.

MultiVault and MigrationMode creation bytecode contains unresolved MultiVaultLib
placeholders. Link the library using the matching source package's link references
before deployment.

Matching artifacts does not establish SDK quote/revert parity. Curve tests must
cover the intended Solidity revision, band crossings, and uint256 overflow/revert
boundaries. Publishing artifacts neither deploys nor upgrades a contract; check
implementation versions and deployment addresses separately.
