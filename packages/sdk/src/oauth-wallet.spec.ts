import { BeaconProxyBytecode } from '@0xintuition/deployments/bytecode';
import { calculateOAuthAtomId } from '@0xintuition/ids';
import type { Address } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import {
	computeAtomWalletAddress,
	computeAtomWalletDeploymentData,
	computeOAuthAtomWalletAddress,
	readAtomWalletAddress,
	readAtomWalletDerivationConfig,
} from './oauth-wallet';

const derivationConfig = {
	multiVault: '0x1111111111111111111111111111111111111111' as Address,
	entryPoint: '0x2222222222222222222222222222222222222222' as Address,
	atomWalletBeacon: '0x3333333333333333333333333333333333333333' as Address,
	atomWalletFactory: '0x4444444444444444444444444444444444444444' as Address,
	beaconProxyCreationCode: BeaconProxyBytecode,
};

describe('OAuth atom wallet helpers', () => {
	it('builds BeaconProxy deployment data for AtomWallet initialization', () => {
		const atomId = calculateOAuthAtomId({
			provider: 'google',
			providerAccountId: '123',
		});
		const deploymentData = computeAtomWalletDeploymentData({
			...derivationConfig,
			atomId,
		});

		expect(deploymentData.startsWith(BeaconProxyBytecode)).toBe(true);
		expect(deploymentData).toContain(derivationConfig.atomWalletBeacon.slice(2).toLowerCase());
		expect(deploymentData).toContain(derivationConfig.entryPoint.slice(2).toLowerCase());
		expect(deploymentData).toContain(derivationConfig.multiVault.slice(2).toLowerCase());
		expect(deploymentData).toContain(atomId.slice(2).toLowerCase());
	});

	it('locks the pure CREATE2 wallet vector', () => {
		const atomId = calculateOAuthAtomId({
			provider: 'google',
			providerAccountId: '123',
		});

		expect(
			computeAtomWalletAddress({
				...derivationConfig,
				atomId,
			})
		).toBe('0x8732894BC3ca18167c4d062a3F2df2a39572A8e3');
	});

	it('derives an OAuth atom wallet in one call', () => {
		expect(
			computeOAuthAtomWalletAddress({
				...derivationConfig,
				provider: 'google',
				providerAccountId: '123',
			})
		).toBe('0x8732894BC3ca18167c4d062a3F2df2a39572A8e3');
	});

	it('changes the address when derivation config changes', () => {
		const input = {
			...derivationConfig,
			provider: 'google',
			providerAccountId: '123',
		};

		expect(
			computeOAuthAtomWalletAddress({
				...input,
				atomWalletFactory: '0x5555555555555555555555555555555555555555',
			})
		).not.toBe(computeOAuthAtomWalletAddress(input));
	});

	it('fails closed for incomplete derivation config', () => {
		expect(() =>
			computeOAuthAtomWalletAddress({
				...derivationConfig,
				atomWalletBeacon: '' as Address,
				provider: 'google',
				providerAccountId: '123',
			})
		).toThrow('atomWalletBeacon must be a valid address');
	});

	it('wraps the MultiVault read-through wallet helper', async () => {
		const publicClient = {
			readContract: vi.fn().mockResolvedValue('0x12DFa153C10e76c4d41854c4AF383997bB16A6bc'),
		};
		const atomId = calculateOAuthAtomId({
			provider: 'google',
			providerAccountId: '123',
		});

		await expect(
			readAtomWalletAddress(
				{
					address: derivationConfig.multiVault,
					publicClient: publicClient as never,
				},
				{ atomId }
			)
		).resolves.toBe('0x12DFa153c10e76c4D41854C4aF383997Bb16a6Bc');
		expect(publicClient.readContract).toHaveBeenCalledWith(
			expect.objectContaining({
				address: derivationConfig.multiVault,
				functionName: 'computeAtomWalletAddr',
				args: [atomId],
			})
		);
	});

	it('reads and normalizes wallet derivation config from MultiVault', async () => {
		const publicClient = {
			readContract: vi.fn().mockResolvedValue({
				entryPoint: derivationConfig.entryPoint,
				atomWarden: '0x5555555555555555555555555555555555555555',
				atomWalletBeacon: derivationConfig.atomWalletBeacon,
				atomWalletFactory: derivationConfig.atomWalletFactory,
			}),
		};

		await expect(
			readAtomWalletDerivationConfig({
				address: derivationConfig.multiVault,
				publicClient: publicClient as never,
				chainId: 1,
			})
		).resolves.toEqual({
			...derivationConfig,
			chainId: 1,
		});
	});
});
