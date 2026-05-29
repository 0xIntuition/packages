import { describe, expect, it } from 'vitest';

import {
	BOOTSTRAP_ATOMS,
	CONTAIN_ID,
	getLaunchPredicateBootstrapTriples,
	HAS_TYPE_ID,
	LAUNCH_PREDICATE_KEYS,
	MARKET_PATTERN_ATOM_DATA,
	MARKET_PATTERN_IDS,
	PREDICATE_DEFS,
	PREDICATE_IDS,
	PREDICATE_REGISTRY_DATA,
	PREDICATE_REGISTRY_ID,
} from './index';

describe('@0xintuition/predicates bootstrap helpers', () => {
	it('defines bootstrap atoms for registry and market-pattern markers', () => {
		expect(BOOTSTRAP_ATOMS).toHaveLength(4);
		expect(PREDICATE_REGISTRY_DATA).toContain('"name":"predicate registry"');
		expect(PREDICATE_REGISTRY_ID).toMatch(/^0x/);
		expect(MARKET_PATTERN_ATOM_DATA.depositional).toContain('"name":"depositional"');
		expect(MARKET_PATTERN_IDS.depositional).toMatch(/^0x/);
	});

	it('produces launch bootstrap triples for routing and registry membership', () => {
		const triples = getLaunchPredicateBootstrapTriples();

		expect(triples).toHaveLength(LAUNCH_PREDICATE_KEYS.length * 2);

		for (const key of LAUNCH_PREDICATE_KEYS) {
			expect(triples).toContainEqual({
				kind: 'market-pattern',
				predicateKey: key,
				subject: PREDICATE_IDS[key],
				predicate: HAS_TYPE_ID,
				object: MARKET_PATTERN_IDS[PREDICATE_DEFS[key].marketPattern],
			});
			expect(triples).toContainEqual({
				kind: 'registry-membership',
				predicateKey: key,
				subject: PREDICATE_REGISTRY_ID,
				predicate: CONTAIN_ID,
				object: PREDICATE_IDS[key],
			});
		}
	});
});
