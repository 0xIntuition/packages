import { decodeFunctionData, toHex, zeroAddress } from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { MultiVaultAbi } from '../../contracts';
import {
	multiVaultCreateAtomsWithUris,
	multiVaultValidateCreateAtomsWithUris,
} from './create-atoms-with-uris';
import { multiVaultCreateAtomsWithUrisEncode } from './create-atoms-with-uris-encode';

const creator = '0x0000000000000000000000000000000000000001';
const address = '0x0000000000000000000000000000000000000002';
const baseInputs = {
	args: [
		creator,
		[toHex('int:isrc:USUM71703861')],
		[10n],
		[[toHex('https://example.test/song')]],
	] as const,
	value: 10n,
	uriLimits: { maxUriCount: 3, maxUriLength: 128 },
};

describe('createAtomsWithUris', () => {
	it('encodes the exact contract argument order', () => {
		const encoded = multiVaultCreateAtomsWithUrisEncode(baseInputs);
		const decoded = decodeFunctionData({ abi: MultiVaultAbi, data: encoded });
		expect(decoded.functionName).toBe('createAtomsWithUris');
		expect(decoded.args).toEqual(baseInputs.args);
	});

	it('rejects zero creators, misaligned arrays, payment mismatches, and URI limits', () => {
		expect(() =>
			multiVaultValidateCreateAtomsWithUris({
				...baseInputs,
				args: [zeroAddress, ...baseInputs.args.slice(1)] as typeof baseInputs.args,
			})
		).toThrow('zero address');
		expect(() =>
			multiVaultValidateCreateAtomsWithUris({
				...baseInputs,
				args: [creator, baseInputs.args[1], [], baseInputs.args[3]],
			})
		).toThrow('same length');
		expect(() => multiVaultValidateCreateAtomsWithUris({ ...baseInputs, value: 9n })).toThrow(
			'sum'
		);
		expect(() =>
			multiVaultValidateCreateAtomsWithUris({
				...baseInputs,
				uriLimits: { maxUriCount: 0, maxUriLength: 128 },
			})
		).toThrow('count');
		expect(() =>
			multiVaultValidateCreateAtomsWithUris({
				...baseInputs,
				uriLimits: { maxUriCount: 3, maxUriLength: 4 },
			})
		).toThrow('byte length');
	});

	it('simulates before submitting the exact request', async () => {
		const request = { address, abi: MultiVaultAbi, functionName: 'createAtomsWithUris' };
		const simulateContract = vi.fn().mockResolvedValue({ request });
		const writeContract = vi.fn().mockResolvedValue('0x01');
		const result = await multiVaultCreateAtomsWithUris(
			{
				address,
				publicClient: { simulateContract } as never,
				walletClient: { account: creator, writeContract } as never,
			},
			baseInputs
		);
		expect(simulateContract).toHaveBeenCalledWith(
			expect.objectContaining({ args: baseInputs.args, value: 10n })
		);
		expect(writeContract).toHaveBeenCalledWith(request);
		expect(result).toBe('0x01');
	});
});
