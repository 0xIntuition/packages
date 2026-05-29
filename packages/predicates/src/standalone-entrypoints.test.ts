import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
	atomData,
	follow,
	followAtomData,
	followId,
	followSpec,
	id,
	key,
	predicate,
	spec,
} from './standalone/follow.js';

describe('standalone predicate modules', () => {
	it('exposes predicate-specific constants from the per-predicate source spec', () => {
		expect(key).toBe('follow');
		expect(predicate).toBe(follow);
		expect(spec).toBe(followSpec);
		expect(followSpec.key).toBe('follow');
		expect(id).toBe(followId);
		expect(atomData).toBe(followAtomData);
		expect(follow.name).toBe('follow');
		expect(follow.category).toBe('Social/Reputation');
		expect(followId).toMatch(/^0x[0-9a-f]{64}$/i);
		expect(followAtomData).toContain('"@type":"DefinedTerm"');
	});

	it('does not import the aggregate predicate registry from standalone modules', () => {
		const source = readFileSync(new URL('./standalone/follow.ts', import.meta.url), 'utf8');

		expect(source).toContain('../generated/specs/follow.js');
		expect(source).not.toContain('../predicates.js');
		expect(source).not.toContain('getPredicateRecord');
	});
});
