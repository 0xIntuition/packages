import * as deployments from '@0xintuition/deployments';
import { describe, expect, it } from 'vitest';

import * as vendoredCore from './core/index';
import * as vendoredPeriphery from './periphery/index';

// The encoder generators read these vendored copies, not the packages, so an ABI regen in
// @0xintuition/deployments that skips `bun run vendor:abis` leaves the CLI encoding and decoding
// against a stale ABI.
describe('vendored ABIs', () => {
	it.each(Object.entries(vendoredCore))('%s matches @0xintuition/deployments', (name, abi) => {
		expect(abi).toEqual((deployments as Record<string, unknown>)[name]);
	});

	it.each(Object.entries(vendoredPeriphery))('%s matches @0xintuition/deployments', (name, abi) => {
		expect(abi).toEqual((deployments as Record<string, unknown>)[name]);
	});
});
