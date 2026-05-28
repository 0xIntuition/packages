import { describe, expect, it } from 'vitest';

import * as metaBridge from './index';

describe('meta-bridge index exports', () => {
	it('exports recipient formatting, quote, and transfer helpers', () => {
		expect(typeof metaBridge.metaBridgeRecipientToBytes32).toBe('function');
		expect(typeof metaBridge.metaERC20HubQuoteTransferRemote).toBe('function');
		expect(typeof metaBridge.metaERC20HubTransferRemote).toBe('function');
		expect(typeof metaBridge.metaERC20SpokeQuoteTransferRemote).toBe('function');
		expect(typeof metaBridge.metaERC20SpokeTransferRemote).toBe('function');
		expect(typeof metaBridge.metaNativeSpokeQuoteTransferRemote).toBe('function');
		expect(typeof metaBridge.metaNativeSpokeTransferRemote).toBe('function');
	});
});
