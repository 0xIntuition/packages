import { describe, expect, it } from 'bun:test';
import { SCHEME_NAMES } from '@0xintuition/iid';
import { PROVIDER_SLUGS, providersForScheme } from '@0xintuition/iid-registry';

import { serverDefaultPreset } from '../src/presets';

/**
 * Drift guard for the registry's provider dimension (A3 plan §7): the
 * `@0xintuition/iid-registry` provider slugs are a contract on THIS package's
 * plugin ids. The registry declares desired capability (a slug may appear
 * before its identifier gate ships — D-A3-5), but every slug must name a real
 * registered plugin so gate selection can never reference a phantom provider.
 */
describe('iid-registry provider-slug alignment', () => {
	const registeredIds = new Set(serverDefaultPreset().map((plugin) => plugin.id));

	it('every registry ProviderSlug is a registered server-default plugin id', () => {
		for (const slug of PROVIDER_SLUGS) {
			expect(registeredIds.has(slug), `${slug} is not a registered enrichment plugin id`).toBe(
				true
			);
		}
	});

	it('every provider the registry routes any scheme to is registered', () => {
		for (const scheme of SCHEME_NAMES) {
			for (const slug of providersForScheme(scheme)) {
				expect(registeredIds.has(slug), `${scheme} -> ${slug}`).toBe(true);
			}
		}
	});
});
