import { describe, expect, it } from 'bun:test';
import {
	IDENTITY_CATEGORY_ALIAS_ONLY_POLICY,
	IDENTITY_CATEGORY_RUNG_POLICY,
} from '@0xintuition/iid-ladder';

import { buildCacheKey } from '../src/cache';
import {
	DATA_RESOLVED_MAX_BYTES,
	dataResolvedSchema,
	sanitizeMaterializedDataResolved,
} from '../src/data-resolved-schema';
import { FACET_REGISTRY, IDENTITY_RUNG_TOKENS, MATERIALIZED_FIELDS } from '../src/facet-registry';
import { materializeNodeDataResolved } from '../src/materialize-node-data-resolved';

const EXISTING_MATERIALIZED_FIELDS = [
	'@context',
	'@type',
	'about',
	'author',
	'byArtist',
	'datePublished',
	'description',
	'identifier',
	'image',
	'inAlbum',
	'isbn',
	'isrcCode',
	'name',
	'sameAs',
	'url',
] as const;

const V2_MATERIALIZED_FIELDS = [
	'identifierRung',
	'genre',
	'keywords',
	'duration',
	'director',
	'actor',
	'countryOfOrigin',
	'inLanguage',
	'aggregateRating',
	'startDate',
	'endDate',
	'isBasedOn',
] as const;

describe('facet registry contract', () => {
	it('keeps the registry and materialized allowlist exactly aligned', () => {
		const registryFields = FACET_REGISTRY.map((entry) => entry.schemaOrgKey);

		expect(registryFields).toEqual([...EXISTING_MATERIALIZED_FIELDS, ...V2_MATERIALIZED_FIELDS]);
		expect([...MATERIALIZED_FIELDS]).toEqual(registryFields);
		expect(new Set(registryFields).size).toBe(registryFields.length);
	});

	it('uses exactly the ladder vocabulary and validates every rung', () => {
		expect([...IDENTITY_RUNG_TOKENS]).toEqual(
			[
				...new Set([
					...Object.values(IDENTITY_CATEGORY_RUNG_POLICY).flat(),
					...Object.values(IDENTITY_CATEGORY_ALIAS_ONLY_POLICY).flat(),
				]),
			].sort()
		);
		for (const rung of IDENTITY_RUNG_TOKENS) {
			expect(
				dataResolvedSchema.safeParse({
					'@type': 'Thing',
					identifierRung: [{ rung, value: 'fixture' }],
				}).success
			).toBe(true);
		}
	});
});

describe('data_resolved v2 facets', () => {
	it('accepts every v2 field and deduplicates union facets', () => {
		const result = sanitizeMaterializedDataResolved({
			'@type': 'Movie',
			actor: ['Actor One', ' Actor One ', 'Q42'],
			aggregateRating: { bestRating: 10, ratingCount: 1234, ratingValue: 8.5 },
			countryOfOrigin: ['US', 'US'],
			director: ['Director One', 'Director One'],
			duration: 'PT2H16M',
			endDate: '2026-09-01',
			genre: ['Q130232', 'Q130232', 'Q200092'],
			identifierRung: [
				{ rung: 'imdb:title', value: 'tt0111161' },
				{ rung: 'imdb:title', value: ' tt0111161 ' },
				{ rung: 'tmdb:movie', value: '278' },
			],
			inLanguage: ['en', 'en'],
			isBasedOn: ['Q172241', 'https://example.com/source', 'Q172241'],
			keywords: ['prison', 'friendship', 'prison'],
			startDate: '2026-08-31',
		});

		expect(result).toMatchObject({
			actor: ['Actor One', 'Q42'],
			countryOfOrigin: ['US'],
			director: ['Director One'],
			// Schema validation has no provider evidence and must preserve QIDs.
			genre: ['Q130232', 'Q200092'],
			identifierRung: [
				{ rung: 'imdb:title', value: 'tt0111161' },
				{ rung: 'tmdb:movie', value: '278' },
			],
			inLanguage: ['en'],
			isBasedOn: ['Q172241', 'https://example.com/source'],
			keywords: ['prison', 'friendship'],
		});
	});

	it.each([
		[
			'identifierRung',
			Array.from({ length: 33 }, (_, index) => ({ rung: 'imdb:title', value: `tt${index + 1}` })),
		],
		['genre', Array.from({ length: 65 }, (_, index) => `Q${index + 1}`)],
		['keywords', Array.from({ length: 65 }, (_, index) => `keyword-${index}`)],
		['director', Array.from({ length: 33 }, (_, index) => `Director ${index}`)],
		['actor', Array.from({ length: 129 }, (_, index) => `Actor ${index}`)],
		['countryOfOrigin', Array.from({ length: 17 }, (_, index) => `Country ${index}`)],
		['inLanguage', Array.from({ length: 17 }, (_, index) => `language-${index}`)],
		['isBasedOn', Array.from({ length: 33 }, (_, index) => `Q${index + 1}`)],
	] as const)('fails loudly when %s exceeds its item bound', (field, value) => {
		expect(() => sanitizeMaterializedDataResolved({ '@type': 'Thing', [field]: value })).toThrow();
	});

	it('fails loudly when a keyword exceeds 128 characters', () => {
		expect(() =>
			sanitizeMaterializedDataResolved({ '@type': 'Thing', keywords: ['k'.repeat(129)] })
		).toThrow();
	});

	it.each([
		['identifierRung', [{ rung: 'unknown:rung', value: 'fixture' }]],
		['genre', ['Q0']],
		['duration', '2 hours'],
		['aggregateRating', { ratingValue: '8.5' }],
		['startDate', '2026-02-30'],
		['endDate', '09/01/2026'],
		['isBasedOn', ['not-a-url-or-qid']],
	] as const)('strictly rejects an invalid %s shape on direct schema input', (field, value) => {
		expect(() => dataResolvedSchema.parse({ '@type': 'Thing', [field]: value })).toThrow();
	});

	it.each([
		['actor scalar', { actor: 'Actor One' }],
		['null aggregate-rating count', { aggregateRating: { ratingCount: null, ratingValue: 8.5 } }],
	] as const)('keeps direct schema validation strict for %s', (_probe, facets) => {
		expect(() => dataResolvedSchema.parse({ '@type': 'Thing', ...facets })).toThrow();
	});

	it('deduplicates shared genre and identifier-rung inputs before enforcing bounds', () => {
		const result = dataResolvedSchema.parse({
			'@type': 'Movie',
			genre: Array.from({ length: 65 }, () => 'Q42'),
			identifierRung: Array.from({ length: 33 }, (_, index) => ({
				rung: 'imdb:title',
				value: index % 2 === 0 ? 'tt0111161' : ' tt0111161 ',
			})),
		});

		expect(result.genre).toEqual(['Q42']);
		expect(result.identifierRung).toEqual([{ rung: 'imdb:title', value: 'tt0111161' }]);
	});

	it('merges identifier rungs additively without changing the authoritative IID', () => {
		const result = materializeNodeDataResolved({
			artifacts: [],
			classification: {
				canonicalIid: 'int:imdb:tt0111161',
				data: {
					'@type': 'Movie',
					identifierRung: [{ rung: 'imdb:title', value: 'tt0111161' }],
				},
			},
			dataResolved: {
				'@type': 'Movie',
				identifierRung: [
					{ rung: 'imdb:title', value: 'tt0111161' },
					{ rung: 'tmdb:movie', value: '278' },
				],
			},
		});

		expect(result.identifier).toBe('int:imdb:tt0111161');
		expect(result.identifierRung).toEqual([
			{ rung: 'imdb:title', value: 'tt0111161' },
			{ rung: 'tmdb:movie', value: '278' },
		]);
	});

	it('never admits identifierRung into IID cache keying', () => {
		const base = {
			atomType: 'thing',
			jsonLd: {
				'@type': 'Thing',
				identifier: 'int:imdb:tt0111161',
			},
		};
		const withRungs = {
			...base,
			jsonLd: {
				...base.jsonLd,
				identifierRung: [{ rung: 'tmdb:movie', value: '278' }],
			},
		};

		expect(buildCacheKey('fixture', withRungs)).toBe(buildCacheKey('fixture', base));
	});

	it('does not fingerprint identifierRung for ordinary non-IID cache keys', () => {
		const base = {
			atomType: 'thing',
			hints: { url: 'https://example.com/ordinary-item' },
			jsonLd: { '@type': 'Thing', name: 'Ordinary Item' },
		};
		const withRungs = {
			...base,
			jsonLd: {
				...base.jsonLd,
				identifierRung: [{ rung: 'tmdb:movie', value: '278' }],
			},
		};

		expect(buildCacheKey('fixture', withRungs)).toBe(buildCacheKey('fixture', base));
	});

	it('keeps identifierRung absent from IID input modules', async () => {
		const iidInputModules = [
			'handoff.ts',
			'identifier.ts',
			'iid-data-resolved-projection.ts',
			'types.ts',
		] as const;

		for (const file of iidInputModules) {
			const source = await Bun.file(new URL(`../src/${file}`, import.meta.url)).text();
			expect(source).not.toContain('identifierRung');
		}
	});

	it('keeps the 64KB document budget with v2 fields present', () => {
		const oversized = {
			'@type': 'Movie',
			actor: Array.from({ length: 128 }, (_, index) => `${index}-${'a'.repeat(510)}`),
			duration: 'PT2H16M',
			genre: ['Q130232'],
			identifierRung: [{ rung: 'imdb:title', value: 'tt0111161' }],
		};

		expect(new TextEncoder().encode(JSON.stringify(oversized)).byteLength).toBeGreaterThan(
			DATA_RESOLVED_MAX_BYTES
		);
		expect(() => dataResolvedSchema.parse(oversized)).toThrow();
	});
});
