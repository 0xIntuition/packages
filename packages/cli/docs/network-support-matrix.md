# Network Support Matrix

Testnet support is a core-only expansion for canonically-deployed contracts. Periphery's canonically-deployed contracts remain mainnet-focused; the address-carrying targets below are the exception (see "Address-carrying targets").

## Core

| Contract | Intuition Mainnet `1155` | Intuition Testnet `13579` | Base Mainnet `8453` | Base Sepolia `84532` |
| --- | --- | --- | --- | --- |
| `wrapped-trust` | supported | supported | unsupported | unsupported |
| `multivault` | supported | supported | unsupported | unsupported |
| `trustbonding` | supported | supported | unsupported | unsupported |
| `satellite-emissions-controller` | supported | supported | unsupported | unsupported |
| `atom-warden` | supported | supported | unsupported | unsupported |
| `trust` | unsupported | unsupported | supported | supported |
| `base-emissions-controller` | unsupported | unsupported | supported | supported |

## Periphery

| Contract | Intuition Mainnet `1155` | Intuition Testnet `13579` | Base Mainnet `8453` | Base Sepolia `84532` |
| --- | --- | --- | --- | --- |
| `meta-native-spoke` | supported | unsupported | unsupported | unsupported |
| `meta-erc20-spoke` | supported | unsupported | unsupported | unsupported |
| `meta-erc20-hub` | unsupported | unsupported | supported | unsupported |
| `trust-swap-and-bridge-router` | unsupported | unsupported | pending redeployment | unsupported |

## Address-carrying targets

`dynamic-fee-flat-price-curve` (core) and `fee-proxy` (periphery) don't fit the tables above: the CLI resolves neither from the deployment map. `DynamicFeeFlatPriceCurve` is resolved per-vault via the `BondingCurveRegistry`, and the deployment map records only the testnet curve. `FeeProxy` is deployed on both Intuition mainnet (`1155`) and Intuition Testnet (`13579`). Both intent variants carry the already-resolved `address` directly instead of looking one up. Both accept `1155` and `13579`; "supported" here means the chain ID is accepted and labeled correctly, not that a canonical address exists to resolve.

## Rules

- `WrappedTrust` is core-owned and resolves from `@0xintuition/protocol`.
- Base-side core contracts resolve from `@0xintuition/protocol`, not `@0xintuition/periphery`.
- Unsupported network/contract pairs fail with explicit support-matrix errors in `resolveAgentActionTarget`.
- Base bridge plans remain mainnet-only because the published periphery surface does not add testnet deployments for those contracts.
- Address-carrying targets (`dynamic-fee-flat-price-curve`, `fee-proxy`) are the exception to "resolves from a canonical map" — see "Address-carrying targets" above.
