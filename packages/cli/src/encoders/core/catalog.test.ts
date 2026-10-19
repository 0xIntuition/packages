import { describe, expect, it } from 'vitest';
import {
	coreEncoderCatalog,
	formatCoreEncoderHelp,
	listCoreEncoderContracts,
	listCoreEncoders,
} from './catalog';

describe('core encoder catalog', () => {
	it('lists all contracts in stable order', () => {
		expect(listCoreEncoderContracts()).toEqual([
			'multivault',
			'trust',
			'trustbonding',
			'wrapped-trust',
			'base-emissions-controller',
			'satellite-emissions-controller',
			'dynamic-fee-flat-price-curve',
			'atom-warden',
		]);
	});

	it('supports contract and kind filtering', () => {
		const multivaultWrites = listCoreEncoders({
			contract: 'multivault',
			kind: 'write',
		});
		expect(multivaultWrites.length).toBeGreaterThan(0);
		expect(multivaultWrites.every((entry) => entry.contract === 'multivault')).toBe(true);
		expect(multivaultWrites.every((entry) => entry.kind === 'write')).toBe(true);
	});

	it('splits read/write across the complete catalog', () => {
		const reads = listCoreEncoders({ kind: 'read' });
		const writes = listCoreEncoders({ kind: 'write' });
		expect(reads.length).toBeGreaterThan(0);
		expect(writes.length).toBeGreaterThan(0);
		expect(reads.length + writes.length).toBe(coreEncoderCatalog.length);
	});

	it('formats a help view for agents', () => {
		const help = formatCoreEncoderHelp({ contract: 'trustbonding', kind: 'write' });
		expect(help).toContain('Core encoder catalog');
		expect(help).toContain('Filter contract: trustbonding');
		expect(help).toContain('Filter kind: write');
		expect(help).toContain('Contracts:');
	});
});
