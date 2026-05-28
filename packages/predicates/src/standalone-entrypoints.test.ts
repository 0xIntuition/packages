import { describe, expect, it } from 'vitest';

import {
	atomData,
	follow,
	followAtomData,
	followId,
	id,
	key,
	predicate,
} from './standalone/follow.js';

describe('standalone predicate modules', () => {
	it('exposes predicate-specific constants from generated catalog data', () => {
		expect(key).toBe('follow');
		expect(predicate).toBe(follow);
		expect(id).toBe(followId);
		expect(atomData).toBe(followAtomData);
		expect(follow.name).toBe('follow');
		expect(follow.category).toBe('Social/Reputation');
		expect(followId).toMatch(/^0x[0-9a-f]{64}$/i);
		expect(followAtomData).toContain('"@type":"DefinedTerm"');
	});
});
