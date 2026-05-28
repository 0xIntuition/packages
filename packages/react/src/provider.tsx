'use client';

import {
	getMultiVaultAddressFromChainId,
	intuitionMainnet,
	intuitionTestnet,
} from '@0xintuition/deployments';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import type { Chain } from 'viem';

import type { IntuitionConfig, IntuitionNetwork } from './types';

const IntuitionContext = createContext<IntuitionConfig | null>(null);

const networkToChain: Record<IntuitionNetwork, Chain> = {
	mainnet: intuitionMainnet,
	testnet: intuitionTestnet,
};

type IntuitionProviderProps = {
	children: ReactNode;
} & (
	| {
			/**
			 * Use a preset network: `"mainnet"` (chain 1155) or `"testnet"` (chain 13579).
			 * Contract addresses are resolved automatically from protocol deployments.
			 *
			 * @example
			 * ```tsx
			 * <IntuitionProvider network="mainnet">
			 *   <App />
			 * </IntuitionProvider>
			 * ```
			 */
			network: IntuitionNetwork;
			config?: never;
	  }
	| {
			/**
			 * Provide a fully custom configuration with chain and contract address.
			 * Useful for local or custom deployments.
			 *
			 * @example
			 * ```tsx
			 * <IntuitionProvider config={{ chain: myChain, chainId: 31337, multivaultAddress: '0x...' }}>
			 *   <App />
			 * </IntuitionProvider>
			 * ```
			 */
			config: IntuitionConfig;
			network?: never;
	  }
);

/**
 * Provides Intuition protocol configuration to all descendant hooks.
 *
 * Use either `network` for preset chains or `config` for custom deployments.
 * This must wrap any component that uses Intuition hooks.
 *
 * @example
 * ```tsx
 * import { IntuitionProvider } from '@0xintuition/react'
 * import { WagmiProvider } from 'wagmi'
 * import { QueryClientProvider } from '@tanstack/react-query'
 *
 * function App() {
 *   return (
 *     <WagmiProvider config={wagmiConfig}>
 *       <QueryClientProvider client={queryClient}>
 *         <IntuitionProvider network="mainnet">
 *           <YourApp />
 *         </IntuitionProvider>
 *       </QueryClientProvider>
 *     </WagmiProvider>
 *   )
 * }
 * ```
 */
export function IntuitionProvider({ children, ...props }: IntuitionProviderProps): ReactNode {
	const value = useMemo<IntuitionConfig>(() => {
		if (props.config) {
			return props.config;
		}

		const chain = networkToChain[props.network];
		const multivaultAddress = getMultiVaultAddressFromChainId(chain.id);

		return {
			chain,
			chainId: chain.id,
			multivaultAddress,
		};
	}, [props.config, props.network]);

	return <IntuitionContext.Provider value={value}>{children}</IntuitionContext.Provider>;
}

/**
 * Returns the current Intuition protocol configuration from the nearest
 * {@link IntuitionProvider}. Throws if no provider is found.
 *
 * @example
 * ```tsx
 * const { chainId, multivaultAddress } = useIntuitionConfig()
 * ```
 */
export function useIntuitionConfig(): IntuitionConfig {
	const config = useContext(IntuitionContext);
	if (!config) {
		throw new Error('useIntuitionConfig must be used within an <IntuitionProvider>.');
	}
	return config;
}

/**
 * Resolves the MultiVault address and chain ID for a given chain override.
 * If `chainIdOverride` is provided, dynamically looks up the contract address
 * for that chain. Otherwise, returns the provider's default configuration.
 *
 * This is an internal helper used by read hooks to support per-call chain overrides.
 *
 * @param chainIdOverride - Optional chain ID to override the provider's default.
 * @returns `{ chainId, multivaultAddress }` for the resolved chain.
 *
 * @example
 * ```tsx
 * // Inside a hook:
 * const { chainId, multivaultAddress } = useChainConfig(options?.chainId)
 * ```
 */
export function useChainConfig(chainIdOverride?: number): {
	chainId: number;
	multivaultAddress: `0x${string}`;
} {
	const config = useIntuitionConfig();

	return useMemo(() => {
		if (chainIdOverride === undefined || chainIdOverride === config.chainId) {
			return {
				chainId: config.chainId,
				multivaultAddress: config.multivaultAddress,
			};
		}

		const multivaultAddress = getMultiVaultAddressFromChainId(chainIdOverride);
		return {
			chainId: chainIdOverride,
			multivaultAddress,
		};
	}, [chainIdOverride, config.chainId, config.multivaultAddress]);
}
