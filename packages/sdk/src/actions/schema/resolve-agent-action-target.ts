import {
	getBaseBridgeAssetAddress,
	getMetaERC20HubAddressFromChainId,
	getMetaERC20SpokeAddressFromChainId,
	getMetaNativeSpokeAddressFromChainId,
	getTrustSwapAndBridgeRouterAddressFromChainId,
} from '@0xintuition/periphery';
import { getContractAddressFromChainId } from '@0xintuition/protocol';

import type {
	AgentActionTarget,
	AgentActionTargetIntent,
	SupportedAgentActionChainId,
} from './types';

function assertSupportedChainId(chainId: number): asserts chainId is SupportedAgentActionChainId {
	if (chainId === 1155 || chainId === 13579 || chainId === 8453 || chainId === 84532) {
		return;
	}

	throw new Error(`Unsupported chain ID ${chainId}. Supported chains: 1155, 13579, 8453, 84532.`);
}

function expectChain(
	contract: string,
	chainId: number,
	supportedChainIds: readonly number[]
): void {
	if (supportedChainIds.includes(chainId)) {
		return;
	}

	throw new Error(
		`Contract ${contract} is not supported on chain ID ${chainId}. Supported chains: ${supportedChainIds.join(', ')}.`
	);
}

export function resolveAgentActionTarget(intent: AgentActionTargetIntent): AgentActionTarget {
	const { chainId } = intent;
	assertSupportedChainId(chainId);

	switch (intent.contract) {
		case 'trust': {
			expectChain(intent.contract, chainId, [8453, 84532]);

			if (chainId === 84532) {
				return {
					chainId: 84532,
					chainName: 'Base Sepolia',
					surface: 'core',
					flow: 'trust',
					contract: intent.contract,
					deploymentName: 'Trust',
					address: getContractAddressFromChainId('Trust', 84532),
				};
			}

			return {
				chainId: 8453,
				chainName: 'Base',
				surface: 'core',
				flow: 'trust',
				contract: intent.contract,
				deploymentName: 'Trust',
				address: getContractAddressFromChainId('Trust', 8453),
			};
		}
		case 'multivault': {
			expectChain(intent.contract, chainId, [1155, 13579]);

			if (chainId === 13579) {
				return {
					chainId: 13579,
					chainName: 'Intuition Testnet',
					surface: 'core',
					flow: 'multivault',
					contract: intent.contract,
					deploymentName: 'MultiVault',
					address: getContractAddressFromChainId('MultiVault', 13579),
				};
			}

			return {
				chainId: 1155,
				chainName: 'Intuition',
				surface: 'core',
				flow: 'multivault',
				contract: intent.contract,
				deploymentName: 'MultiVault',
				address: getContractAddressFromChainId('MultiVault', 1155),
			};
		}
		case 'trustbonding': {
			expectChain(intent.contract, chainId, [1155, 13579]);

			if (chainId === 13579) {
				return {
					chainId: 13579,
					chainName: 'Intuition Testnet',
					surface: 'core',
					flow: 'trustbonding',
					contract: intent.contract,
					deploymentName: 'TrustBonding',
					address: getContractAddressFromChainId('TrustBonding', 13579),
				};
			}

			return {
				chainId: 1155,
				chainName: 'Intuition',
				surface: 'core',
				flow: 'trustbonding',
				contract: intent.contract,
				deploymentName: 'TrustBonding',
				address: getContractAddressFromChainId('TrustBonding', 1155),
			};
		}
		case 'wrapped-trust': {
			expectChain(intent.contract, chainId, [1155, 13579]);

			if (chainId === 13579) {
				return {
					chainId: 13579,
					chainName: 'Intuition Testnet',
					surface: 'core',
					flow: 'wrapped-trust',
					contract: intent.contract,
					deploymentName: 'WrappedTrust',
					address: getContractAddressFromChainId('WrappedTrust', 13579),
				};
			}

			return {
				chainId: 1155,
				chainName: 'Intuition',
				surface: 'core',
				flow: 'wrapped-trust',
				contract: intent.contract,
				deploymentName: 'WrappedTrust',
				address: getContractAddressFromChainId('WrappedTrust', 1155),
			};
		}
		case 'base-emissions-controller': {
			expectChain(intent.contract, chainId, [8453, 84532]);

			if (chainId === 84532) {
				return {
					chainId: 84532,
					chainName: 'Base Sepolia',
					surface: 'core',
					flow: 'base-emissions-controller',
					contract: intent.contract,
					deploymentName: 'BaseEmissionsController',
					address: getContractAddressFromChainId('BaseEmissionsController', 84532),
				};
			}

			return {
				chainId: 8453,
				chainName: 'Base',
				surface: 'core',
				flow: 'base-emissions-controller',
				contract: intent.contract,
				deploymentName: 'BaseEmissionsController',
				address: getContractAddressFromChainId('BaseEmissionsController', 8453),
			};
		}
		case 'satellite-emissions-controller': {
			expectChain(intent.contract, chainId, [1155, 13579]);

			if (chainId === 13579) {
				return {
					chainId: 13579,
					chainName: 'Intuition Testnet',
					surface: 'core',
					flow: 'satellite-emissions-controller',
					contract: intent.contract,
					deploymentName: 'SatelliteEmissionsController',
					address: getContractAddressFromChainId('SatelliteEmissionsController', 13579),
				};
			}

			return {
				chainId: 1155,
				chainName: 'Intuition',
				surface: 'core',
				flow: 'satellite-emissions-controller',
				contract: intent.contract,
				deploymentName: 'SatelliteEmissionsController',
				address: getContractAddressFromChainId('SatelliteEmissionsController', 1155),
			};
		}
		case 'base-bridge-asset': {
			expectChain(intent.contract, chainId, [8453]);

			return {
				chainId: 8453,
				chainName: 'Base',
				surface: 'periphery',
				flow: 'bridge-asset',
				contract: intent.contract,
				deploymentName: 'BaseBridgeAsset',
				address: getBaseBridgeAssetAddress(intent.asset),
				asset: intent.asset,
			};
		}
		case 'trust-swap-and-bridge-router': {
			expectChain(intent.contract, chainId, [8453]);

			return {
				chainId: 8453,
				chainName: 'Base',
				surface: 'periphery',
				flow: 'trust-swap-and-bridge-router',
				contract: intent.contract,
				deploymentName: 'TrustSwapAndBridgeRouter',
				address: getTrustSwapAndBridgeRouterAddressFromChainId(8453),
			};
		}
		case 'meta-native-spoke': {
			expectChain(intent.contract, chainId, [1155]);

			return {
				chainId: 1155,
				chainName: 'Intuition',
				surface: 'periphery',
				flow: 'meta-bridge',
				contract: intent.contract,
				deploymentName: 'MetaNativeSpoke',
				address: getMetaNativeSpokeAddressFromChainId(1155),
			};
		}
		case 'meta-erc20-hub': {
			expectChain(intent.contract, chainId, [8453]);

			return {
				chainId: 8453,
				chainName: 'Base',
				surface: 'periphery',
				flow: 'meta-bridge',
				contract: intent.contract,
				deploymentName: 'MetaERC20Hub',
				address: getMetaERC20HubAddressFromChainId(8453, intent.asset),
				asset: intent.asset,
			};
		}
		case 'meta-erc20-spoke': {
			expectChain(intent.contract, chainId, [1155]);

			return {
				chainId: 1155,
				chainName: 'Intuition',
				surface: 'periphery',
				flow: 'meta-bridge',
				contract: intent.contract,
				deploymentName: 'MetaERC20Spoke',
				address: getMetaERC20SpokeAddressFromChainId(1155, intent.asset),
				asset: intent.asset,
			};
		}
		case 'atom-warden': {
			expectChain(intent.contract, chainId, [1155, 13579]);

			if (chainId === 13579) {
				return {
					chainId: 13579,
					chainName: 'Intuition Testnet',
					surface: 'core',
					flow: 'atom-warden',
					contract: intent.contract,
					deploymentName: 'AtomWarden',
					address: getContractAddressFromChainId('AtomWarden', 13579),
				};
			}

			return {
				chainId: 1155,
				chainName: 'Intuition',
				surface: 'core',
				flow: 'atom-warden',
				contract: intent.contract,
				deploymentName: 'AtomWarden',
				address: getContractAddressFromChainId('AtomWarden', 1155),
			};
		}
		case 'dynamic-fee-flat-price-curve': {
			expectChain(intent.contract, chainId, [1155, 13579]);

			if (chainId === 13579) {
				return {
					chainId: 13579,
					chainName: 'Intuition Testnet',
					surface: 'core',
					flow: 'dynamic-fee-flat-price-curve',
					contract: intent.contract,
					deploymentName: 'DynamicFeeFlatPriceCurve',
					address: intent.address,
				};
			}

			return {
				chainId: 1155,
				chainName: 'Intuition',
				surface: 'core',
				flow: 'dynamic-fee-flat-price-curve',
				contract: intent.contract,
				deploymentName: 'DynamicFeeFlatPriceCurve',
				address: intent.address,
			};
		}
		case 'fee-proxy': {
			expectChain(intent.contract, chainId, [1155, 13579]);

			if (chainId === 13579) {
				return {
					chainId: 13579,
					chainName: 'Intuition Testnet',
					surface: 'periphery',
					flow: 'fee-proxy',
					contract: intent.contract,
					deploymentName: 'FeeProxy',
					address: intent.address,
				};
			}

			return {
				chainId: 1155,
				chainName: 'Intuition',
				surface: 'periphery',
				flow: 'fee-proxy',
				contract: intent.contract,
				deploymentName: 'FeeProxy',
				address: intent.address,
			};
		}
	}
}
