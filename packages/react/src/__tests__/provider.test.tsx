import { intuitionMainnet, intuitionTestnet } from '@0xintuition/deployments';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { IntuitionProvider, useIntuitionConfig } from '../provider';
import type { IntuitionConfig } from '../types';

function wrapWithNetwork(network: 'mainnet' | 'testnet') {
	return function Wrapper({ children }: { children: ReactNode }) {
		return <IntuitionProvider network={network}>{children}</IntuitionProvider>;
	};
}

function wrapWithConfig(config: IntuitionConfig) {
	return function Wrapper({ children }: { children: ReactNode }) {
		return <IntuitionProvider config={config}>{children}</IntuitionProvider>;
	};
}

describe('IntuitionProvider', () => {
	it('provides testnet config when network="testnet"', () => {
		const { result } = renderHook(() => useIntuitionConfig(), {
			wrapper: wrapWithNetwork('testnet'),
		});

		expect(result.current.chainId).toBe(intuitionTestnet.id);
		expect(result.current.chain).toBe(intuitionTestnet);
		expect(result.current.multivaultAddress).toBeDefined();
		expect(result.current.multivaultAddress).toMatch(/^0x/);
	});

	it('provides mainnet config when network="mainnet"', () => {
		const { result } = renderHook(() => useIntuitionConfig(), {
			wrapper: wrapWithNetwork('mainnet'),
		});

		expect(result.current.chainId).toBe(intuitionMainnet.id);
		expect(result.current.chain).toBe(intuitionMainnet);
		expect(result.current.multivaultAddress).toBeDefined();
	});

	it('provides custom config when config prop is used', () => {
		const customConfig: IntuitionConfig = {
			chain: intuitionTestnet,
			chainId: 31337,
			multivaultAddress: '0x1234567890abcdef1234567890abcdef12345678',
		};

		const { result } = renderHook(() => useIntuitionConfig(), {
			wrapper: wrapWithConfig(customConfig),
		});

		expect(result.current.chainId).toBe(31337);
		expect(result.current.multivaultAddress).toBe('0x1234567890abcdef1234567890abcdef12345678');
	});

	it('throws when useIntuitionConfig is used outside provider', () => {
		expect(() => {
			renderHook(() => useIntuitionConfig());
		}).toThrow('useIntuitionConfig must be used within an <IntuitionProvider>');
	});
});
