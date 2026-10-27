# Action plan envelopes

## Pure action plan ownership

Client-free, JSON-serializable envelope builders live in `@0xintuition/sdk/actions`.
They accept caller-supplied read context and compose the SDK's quote and transaction
preparation actions. The CLI aliases retain their inputs and output format for one
release and are deprecated. Import the SDK names for new integrations. The
`intuition` executable currently exposes encoder commands; it has no plan command.

| Deprecated CLI name | SDK actions name |
| --- | --- |
| `buildBaseTrustBridgeToIntuitionPlan` | `baseTrustBridgeToIntuitionEnvelope` |
| `buildIntuitionTrustBridgeToBasePlan` | `intuitionTrustBridgeToBaseEnvelope` |
| `buildBaseERC20BridgeToIntuitionPlan` | `baseERC20BridgeToIntuitionEnvelope` |
| `buildIntuitionERC20BridgeToBasePlan` | `intuitionERC20BridgeToBaseEnvelope` |
| `buildTrustBondingClaimPlan` | `trustBondingClaimEnvelope` |
| `buildTrustBondingLockPlan` | `trustBondingLockEnvelope` |
| `buildTrustBondingClaimAndRestakePlan` | `trustBondingClaimAndRestakeEnvelope` |
| `buildFeeProxyCreateAtomsWithUrisPlan` | `feeProxyCreateAtomsWithUrisEnvelope` |
| `buildMultiVaultDepositPlan` | `multiVaultDepositEnvelope` |
| `buildMultiVaultRedeemPlan` | `multiVaultRedeemEnvelope` |
| `buildMultiVaultCreateAndSeedPlan` | `multiVaultCreateAndSeedEnvelope` |
| `buildMultiVaultOnBehalfOfCreationPlan` | `multiVaultOnBehalfOfCreationEnvelope` |
| `buildMultiVaultMulticallPlan` | `multiVaultMulticallEnvelope` |
| `buildDynamicFeeCurveDepositPlan` | `dynamicFeeCurveDepositEnvelope` |
| `buildDynamicFeeCurveClaimPlan` | `dynamicFeeCurveClaimEnvelope` |
