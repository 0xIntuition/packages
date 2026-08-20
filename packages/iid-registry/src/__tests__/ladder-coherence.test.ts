/**
 * The registry is the identity ladders' read-side inverse: when a
 * classification's ladder mints from an unambiguous scheme, resolving that
 * scheme back through the registry must land on the same classification.
 * Asymmetry here is a wiring bug in one of the two tables.
 */
import { CLASSIFICATION_SPECS } from '@0xintuition/classifications';
import { SCHEME_TYPING } from '@0xintuition/iid';
import { describe, expect, it } from 'vitest';

import { classificationForScheme } from '../classification.js';
import { SCHEME_CLASSIFICATIONS } from '../classification-map.js';
import type { UnambiguousScheme } from '../types.js';

describe('ladder => registry coherence', () => {
	it('direct-scheme ladder rungs resolve back to their own classification', () => {
		const issues: string[] = [];

		for (const spec of CLASSIFICATION_SPECS) {
			if (!spec.identity) {
				continue;
			}

			for (const rung of spec.identity.ladder) {
				if (rung.kind !== 'scheme' || SCHEME_TYPING[rung.scheme] !== 'unambiguous') {
					continue;
				}

				const entry = SCHEME_CLASSIFICATIONS[rung.scheme as UnambiguousScheme];

				// Value-typed schemes fan out across classifications — their
				// coherence is asserted per type segment below.
				if (entry.kind !== 'direct') {
					continue;
				}

				if (entry.slug !== spec.slug) {
					issues.push(`${spec.slug} ladder rung ${rung.scheme} resolves to ${entry.slug}`);
				}
			}
		}

		expect(issues).toEqual([]);
	});

	it('value-typed segments cohere with the ladders that mint them', () => {
		// music-group / music-album / music-recording all carry mbid rungs.
		expect(
			classificationForScheme('mbid', 'artist:056e4f3e-d505-4dad-8ec1-d04f521cbb56')?.slug
		).toBe('music-group');
		expect(
			classificationForScheme('mbid', 'release-group:1b022e01-4da6-387b-8658-8678046e4cef')?.slug
		).toBe('music-album');
		expect(
			classificationForScheme('mbid', 'recording:9d30e408-1559-448b-b491-2f8de1583ccf')?.slug
		).toBe('music-recording');

		// person and book both carry olid rungs (author vs work suffix).
		expect(classificationForScheme('olid', 'OL26320A')?.slug).toBe('person');
		expect(classificationForScheme('olid', 'OL45804W')?.slug).toBe('book');

		// ethereum-erc20's ladder mints eip155/erc20 CAIP-19 values.
		expect(
			classificationForScheme('caip19', 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
				?.slug
		).toBe('ethereum-erc20');
	});
});
