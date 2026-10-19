import { describe, expect, it } from 'vitest';
import {
	formatPeripheryEncoderHelp,
	listPeripheryEncoderContracts,
	listPeripheryEncoders,
	peripheryEncoderCatalog,
} from './catalog';
import { metaBridgeEncoderManifest } from './meta-bridge';
import { trustSwapAndBridgeRouterEncoderManifest } from './trust-swap-and-bridge-router';

describe('periphery encoder catalog', () => {
	it('lists all contracts in stable order', () => {
		expect(listPeripheryEncoderContracts()).toEqual([
			'trust-swap-and-bridge-router',
			'meta-bridge',
			'fee-proxy',
		]);
	});

	it('supports contract and kind filtering', () => {
		const metaBridgeReads = listPeripheryEncoders({
			contract: 'meta-bridge',
			kind: 'read',
		});
		expect(metaBridgeReads.length).toBeGreaterThan(0);
		expect(metaBridgeReads.every((entry) => entry.contract === 'meta-bridge')).toBe(true);
		expect(metaBridgeReads.every((entry) => entry.kind === 'read')).toBe(true);
	});

	it('splits read/write across the complete catalog', () => {
		const reads = listPeripheryEncoders({ kind: 'read' });
		const writes = listPeripheryEncoders({ kind: 'write' });
		expect(reads.length).toBeGreaterThan(0);
		expect(writes.length).toBeGreaterThan(0);
		expect(reads.length + writes.length).toBe(peripheryEncoderCatalog.length);
	});

	it('formats a help view with concrete methods', () => {
		const help = formatPeripheryEncoderHelp({
			contract: 'meta-bridge',
			kind: 'write',
			includeMethods: true,
		});
		expect(help).toContain('Periphery encoder catalog');
		expect(help).toContain('Filter contract: meta-bridge');
		expect(help).toContain('Filter kind: write');
		expect(help).toContain('Methods:');
		expect(help).toContain('metaERC20HubTransferRemoteEncode');
	});

	it('includes expected wrappers and excludes composite helpers', () => {
		const sourceWrappers = new Set(peripheryEncoderCatalog.map((entry) => entry.sourceWrapper));

		for (const entry of trustSwapAndBridgeRouterEncoderManifest) {
			expect(sourceWrappers.has(entry.sourceWrapper)).toBe(true);
		}
		for (const entry of metaBridgeEncoderManifest) {
			expect(sourceWrappers.has(entry.sourceWrapper)).toBe(true);
		}

		expect(sourceWrappers.has('trustSwapAndBridgeRouterFindBestRoute')).toBe(false);
		expect(sourceWrappers.has('metaBridgeRecipientToBytes32')).toBe(false);
	});
});
