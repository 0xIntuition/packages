import { describe, expect, it } from 'vitest';
import { CLASSIFICATION_SPECS } from './classifications.js';
import {
	IDENTITY_SCHEME_CLASS,
	IDENTITY_SCHEME_TYPING,
	rungClass,
	topRungAnchorEligible,
} from './identity.js';
import type { ClassificationSpec, IdentityRung, IdentityValueSource } from './types.js';

const CLASS_ORDER = { A: 0, B: 1, C: 2 } as const;

function specFieldKeys(spec: ClassificationSpec): Set<string> {
	return new Set(spec.fields.map((field) => field.key));
}

/** Every spec field a declarative source reads, or null when engine-owned. */
function sourceFieldKeys(source: IdentityValueSource): readonly string[] | null {
	switch (source.kind) {
		case 'field':
		case 'url-origin':
		case 'podcast-guid':
			return [source.key];
		case 'same-as':
			return ['sameAs'];
		case 'geohash':
			return ['latitude', 'longitude'];
		case 'derivation':
			// Derivation input contracts are engine-owned; covered below.
			return DERIVATION_INPUTS[source.name] ?? null;
	}
}

/** The spec fields each named derivation reads (scheme-registry.md). */
const DERIVATION_INPUTS: Record<string, readonly string[]> = {
	'acct-strong': ['platform', 'platformUserId'],
	'acct-weak': ['platform', 'username'],
	'appid-bundle': ['operatingSystem', 'bundleId'],
	'rss-item': ['feedGuid', 'itemGuid'],
	'termset-term': ['inDefinedTermSet', 'termCode'],
	'caip10-eoa': ['address'],
	'caip10-contract': ['chainId', 'address'],
	'caip19-erc20': ['chainId', 'address'],
};

describe('identity ladders', () => {
	it('every classification declares identity (or explicit null)', () => {
		for (const spec of CLASSIFICATION_SPECS) {
			expect(spec.identity !== undefined, `${spec.slug} must declare identity`).toBe(true);
		}
	});

	it('only aggregate-rating is outside IID scope (D23)', () => {
		const outOfScope = CLASSIFICATION_SPECS.filter((spec) => spec.identity === null).map(
			(spec) => spec.slug
		);
		expect(outOfScope).toEqual(['aggregate-rating']);
	});

	it('ladders are non-empty and ordered A ≥ B ≥ C', () => {
		for (const spec of CLASSIFICATION_SPECS) {
			if (!spec.identity) continue;
			expect(spec.identity.ladder.length, `${spec.slug} ladder is empty`).toBeGreaterThan(0);
			const order = spec.identity.ladder.map((rung) => CLASS_ORDER[rungClass(rung)]);
			for (let index = 1; index < order.length; index++) {
				expect(
					order[index] >= order[index - 1],
					`${spec.slug}: rung ${index} (${order[index]}) outranks rung ${index - 1}`
				).toBe(true);
			}
		}
	});

	it('every source reads only fields the classification declares', () => {
		for (const spec of CLASSIFICATION_SPECS) {
			if (!spec.identity) continue;
			const declared = specFieldKeys(spec);
			for (const rung of spec.identity.ladder) {
				if (rung.kind !== 'scheme') continue;
				const keys = sourceFieldKeys(rung.source);
				expect(
					keys,
					`${spec.slug}: unknown derivation in ${JSON.stringify(rung.source)}`
				).not.toBeNull();
				for (const key of keys ?? []) {
					expect(declared.has(key), `${spec.slug}: source reads undeclared field "${key}"`).toBe(
						true
					);
				}
			}
		}
	});

	it('gen1 recipes reference declared fields only (D21 surface)', () => {
		for (const spec of CLASSIFICATION_SPECS) {
			if (!spec.identity) continue;
			const declared = specFieldKeys(spec);
			for (const rung of spec.identity.ladder) {
				if (rung.kind !== 'gen1') continue;
				expect(rung.recipe.length, `${spec.slug} gen1 r${rung.tag}: empty recipe`).toBeGreaterThan(
					0
				);
				for (const recipeField of rung.recipe) {
					const reads =
						recipeField.from === 'field'
							? recipeField.key
							: recipeField.from === 'geohash'
								? null // reads latitude/longitude, checked via declared coords below
								: recipeField.of;
					if (reads !== null) {
						expect(
							declared.has(reads),
							`${spec.slug} gen1 r${rung.tag}: recipe reads undeclared field "${reads}"`
						).toBe(true);
					} else {
						expect(
							declared.has('latitude') && declared.has('longitude'),
							`${spec.slug}: geohash recipe needs coords`
						).toBe(true);
					}
				}
			}
		}
	});

	it('gen1 rung tags are unique per ladder (D22)', () => {
		for (const spec of CLASSIFICATION_SPECS) {
			if (!spec.identity) continue;
			const tags = spec.identity.ladder
				.filter((rung): rung is Extract<IdentityRung, { kind: 'gen1' }> => rung.kind === 'gen1')
				.map((rung) => rung.tag);
			expect(new Set(tags).size, `${spec.slug}: duplicate gen1 tags`).toBe(tags.length);
		}
	});

	it('scheme registry maps cover every scheme exactly once', () => {
		expect(Object.keys(IDENTITY_SCHEME_CLASS).sort()).toEqual(
			Object.keys(IDENTITY_SCHEME_TYPING).sort()
		);
		for (const spec of CLASSIFICATION_SPECS) {
			if (!spec.identity) continue;
			for (const rung of spec.identity.ladder) {
				if (rung.kind === 'scheme') {
					expect(
						IDENTITY_SCHEME_CLASS[rung.scheme],
						`${spec.slug}: unregistered scheme`
					).toBeDefined();
				}
			}
		}
	});

	it('anchor eligibility matches D30 expectations for the flagship lanes', () => {
		const bySlug = new Map(CLASSIFICATION_SPECS.map((spec) => [spec.slug, spec]));
		// Unambiguous Class A top rungs → P0 anchors.
		for (const slug of ['music-recording', 'book', 'product', 'ethereum-erc20']) {
			expect(topRungAnchorEligible(bySlug.get(slug) as ClassificationSpec), slug).toBe(true);
		}
		// Polymorphic or Class C top rungs → floored at P1.
		for (const slug of ['person', 'thing', 'web-page', 'ethereum-account']) {
			expect(topRungAnchorEligible(bySlug.get(slug) as ClassificationSpec), slug).toBe(false);
		}
	});
});
