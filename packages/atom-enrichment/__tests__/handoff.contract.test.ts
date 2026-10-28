import { describe, expect, it } from 'bun:test';

import {
	normalizeResolvedClassificationInput,
	resolveClassifiedAtomPolicy,
	toClassifiedAtomInput,
} from '../src/handoff';
import {
	type ClassifiedAtomPolicy,
	classifiedAtomInputSchema,
	classifiedAtomPolicySchema,
} from '../src/types';

describe('classification to enrichment handoff', () => {
	it('classifies valid IID input without applying the plain-text thing downgrade', () => {
		const policy: ClassifiedAtomPolicy = resolveClassifiedAtomPolicy('INT:ISRC:us-um7-17-03861', {
			atomType: 'thing',
			schemaType: 'Thing',
		});

		expect(policy).toEqual({
			rawInputKind: 'iid',
			allowUrlOnlyProviders: true,
		});
		expect(classifiedAtomPolicySchema.parse(policy)).toEqual(policy);
	});

	it('keeps URL and plain-text policy behavior unchanged', () => {
		expect(
			resolveClassifiedAtomPolicy('https://example.com/resource', {
				atomType: 'thing',
				schemaType: 'Thing',
			})
		).toEqual({ rawInputKind: 'url', allowUrlOnlyProviders: true });
		expect(
			resolveClassifiedAtomPolicy('ordinary words', {
				atomType: 'thing',
				schemaType: 'Thing',
			})
		).toEqual({ rawInputKind: 'plain-text', allowUrlOnlyProviders: false });
	});

	it('constructs an identifier-first input and carries classifier anchor eligibility by value', () => {
		const classificationResult = {
			resolved: {
				atoms: [
					{
						category: 'song' as const,
						schemaType: 'MusicRecording',
						title: 'int:isrc:USUM71703861',
						canonicalId: 'int:isrc:USUM71703861',
						sameAs: [],
						hints: { identifiers: { isrc: 'USUM71703861' } },
						// Deliberately false for this ISRC fixture: handoff must carry
						// the classifier's value rather than re-derive eligibility.
						metadata: { pluginId: 'int', provider: 'int', anchorEligible: false },
						data: {
							'@context': 'https://schema.org/',
							'@type': 'MusicRecording',
							identifier: 'int:isrc:USUM71703861',
						},
					},
				],
			},
		};

		const input = toClassifiedAtomInput('int:isrc:USUM71703861', classificationResult);

		expect(input).toMatchObject({
			atomType: 'song',
			identifier: {
				iid: 'int:isrc:USUM71703861',
				scheme: 'isrc',
				value: 'USUM71703861',
				anchorEligible: false,
			},
			hints: { identifiers: { isrc: 'USUM71703861' } },
			jsonLd: classificationResult.resolved.atoms[0]?.data,
		});
		expect(input?.hints).not.toHaveProperty('name');
		expect(input?.jsonLd).not.toHaveProperty('name');
		expect(input?.jsonLd).not.toHaveProperty('url');
		expect(input?.policy).toBeUndefined();
		expect(classifiedAtomInputSchema.safeParse(input).success).toBe(true);
		expect(classificationResult.resolved.atoms[0]?.metadata).toEqual({
			pluginId: 'int',
			provider: 'int',
			anchorEligible: false,
		});
	});

	it('round-trips and canonicalizes IID canonical ids through @0xintuition/iid', () => {
		const cases = [
			['MusicRecording', { identifier: 'INT:ISRC:us-um7-17-03861' }, 'int:isrc:USUM71703861'],
			['Book', { isbn: '0-684-83272-0' }, 'int:isbn:9780684832722'],
			[
				'EthereumAccount',
				{ address: '0xD8dA6BF26964aF9D7eEd9e03E53415D37aA96045', chainId: '1' },
				'int:caip10:eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
			],
			[
				'EthereumSmartContract',
				{ address: '0x1111111111111111111111111111111111111111', chainId: '8453' },
				'int:caip10:eip155:8453:0x1111111111111111111111111111111111111111',
			],
			[
				'EthereumERC20',
				{ address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chainId: '1' },
				'int:caip19:eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
			],
		] as const;

		for (const [type, data, expected] of cases) {
			const normalized = normalizeResolvedClassificationInput({
				resolved: {
					publishable: [{ type, data, meta: {} }],
				},
			});
			expect(normalized?.canonicalId).toBe(expected);
		}
	});

	it('keeps non-identifier canonical-id fallbacks unchanged', () => {
		expect(
			normalizeResolvedClassificationInput({
				resolved: {
					publishable: [
						{
							type: 'Thing',
							data: { identifier: 'legacy-provider:id' },
							meta: {},
						},
					],
				},
			})?.canonicalId
		).toBe('legacy-provider:id');
		expect(
			normalizeResolvedClassificationInput({
				resolved: {
					publishable: [
						{
							type: 'Thing',
							data: { url: 'https://example.com/canonical' },
							meta: {},
						},
					],
				},
			})?.canonicalId
		).toBe('https://example.com/canonical');
		expect(
			normalizeResolvedClassificationInput({
				resolved: {
					publishable: [
						{
							type: 'Thing',
							data: { sameAs: ['https://example.com/same-as'] },
							meta: {},
						},
					],
				},
			})?.canonicalId
		).toBe('https://example.com/same-as');
	});

	it('preserves podcast atoms from resolved atom output', () => {
		const input = toClassifiedAtomInput('https://open.spotify.com/episode/episode-id', {
			resolved: {
				atoms: [
					{
						category: 'podcast',
						schemaType: 'PodcastEpisode',
						title: 'AI Acceleration',
						sameAs: ['https://open.spotify.com/episode/episode-id'],
					},
				],
			},
		});

		expect(input?.atomType).toBe('podcast');
		expect(input?.jsonLd?.['@type']).toBe('PodcastEpisode');
	});

	it('maps canonical podcast envelopes to podcast atom type', () => {
		const input = toClassifiedAtomInput('https://open.spotify.com/show/show-id', {
			resolved: {
				publishable: [
					{
						type: 'PodcastSeries',
						data: {
							name: 'The AI Daily Brief',
							sameAs: ['https://open.spotify.com/show/show-id'],
						},
						meta: {
							sourceUrl: 'https://open.spotify.com/show/show-id',
						},
					},
				],
			},
		});

		expect(input?.atomType).toBe('podcast');
		expect(input?.jsonLd?.['@type']).toBe('PodcastSeries');
	});

	it('emits a first-class identifier for IID-classified atoms (Track D W4)', () => {
		const input = toClassifiedAtomInput('int:isrc:USUM71703861', {
			resolved: {
				publishable: [
					{
						type: 'MusicRecording',
						data: {
							'@type': 'MusicRecording',
							identifier: 'int:isrc:USUM71703861',
						},
						meta: {},
					},
				],
			},
		});

		expect(input?.identifier).toEqual({
			iid: 'int:isrc:USUM71703861',
			scheme: 'isrc',
			value: 'USUM71703861',
		});
	});

	it('never promotes a raw IID as the display name or name hint (D-7)', () => {
		const input = toClassifiedAtomInput('int:isrc:USUM71703861', {
			resolved: {
				publishable: [
					{
						type: 'MusicRecording',
						data: {
							'@type': 'MusicRecording',
							identifier: 'int:isrc:USUM71703861',
						},
						meta: {},
					},
				],
			},
		});

		expect(input?.hints?.name).toBeUndefined();
		expect(input?.jsonLd?.name).toBeUndefined();
	});

	it('canonicalizes non-canonical embedded identifiers into the typed identifier', () => {
		const input = toClassifiedAtomInput('int:isbn:0-684-83272-0', {
			resolved: {
				publishable: [
					{
						type: 'Book',
						data: {
							'@type': 'Book',
							identifier: 'int:isbn:0-684-83272-0',
							name: 'The Old Man and the Sea',
						},
						meta: {},
					},
				],
			},
		});

		expect(input?.identifier).toEqual({
			iid: 'int:isbn:9780684832722',
			scheme: 'isbn',
			value: '9780684832722',
		});
		expect(input?.hints?.name).toBe('The Old Man and the Sea');
	});

	it('derives a first-class identifier from canonicalized isbn data on URL atoms', () => {
		const input = toClassifiedAtomInput('https://example.com/book', {
			resolved: {
				publishable: [
					{
						type: 'Book',
						data: {
							'@type': 'Book',
							isbn: '9780684832722',
							name: 'The Old Man and the Sea',
						},
						meta: { sourceUrl: 'https://example.com/book' },
					},
				],
			},
		});

		expect(input?.identifier).toEqual({
			iid: 'int:isbn:9780684832722',
			scheme: 'isbn',
			value: '9780684832722',
		});
		expect(input?.jsonLd?.name).toBe('The Old Man and the Sea');
	});

	it('leaves non-IID canonical ids without a first-class identifier', () => {
		const input = toClassifiedAtomInput('https://example.com/article', {
			resolved: {
				publishable: [
					{
						type: 'Article',
						data: {
							'@type': 'Article',
							name: 'A Plain Web Article',
						},
						meta: { sourceUrl: 'https://example.com/article' },
					},
				],
			},
		});

		expect(input?.identifier).toBeUndefined();
	});

	it('carries resolver provider provenance into the enrichment source', () => {
		const input = toClassifiedAtomInput('https://www.goodreads.com/book/show/52036', {
			resolved: {
				publishable: [
					{
						type: 'Book',
						data: {
							'@type': 'Book',
							name: 'Goodreads Book 52036',
							url: 'https://www.goodreads.com/book/show/52036',
						},
						meta: {
							provider: 'goodreads',
							sourceUrl: 'https://www.goodreads.com/book/show/52036',
						},
					},
				],
			},
		});

		expect(input?.source).toMatchObject({ provider: 'goodreads' });
		expect(classifiedAtomInputSchema.safeParse(input).success).toBe(true);
	});

	it('carries the resolved fallback stage through canonical and atom handoff shapes', () => {
		const canonicalInput = toClassifiedAtomInput('https://open.spotify.com/track/ABCDEFGH', {
			resolved: {
				publishable: [
					{
						type: 'MusicRecording',
						data: {
							name: 'Spotify Track ABCDEFGH',
							url: 'https://open.spotify.com/track/ABCDEFGH',
						},
						meta: {
							provider: 'spotify',
							sourceUrl: 'https://open.spotify.com/track/ABCDEFGH',
						},
					},
				],
				atoms: [
					{
						category: 'song',
						schemaType: 'MusicRecording',
						title: 'Spotify Track ABCDEFGH',
						metadata: { fallbackStage: 'opengraph', provider: 'spotify' },
					},
				],
			},
		});
		const atomInput = toClassifiedAtomInput('https://open.spotify.com/track/ABCDEFGH', {
			resolved: {
				atoms: [
					{
						category: 'song',
						schemaType: 'MusicRecording',
						title: 'Spotify Track ABCDEFGH',
						metadata: { fallbackStage: 'generic', provider: 'spotify' },
					},
				],
			},
		});

		expect(canonicalInput?.source).toMatchObject({
			fallbackStage: 'opengraph',
			provider: 'spotify',
		});
		expect(atomInput?.source).toMatchObject({ fallbackStage: 'generic', provider: 'spotify' });
		expect(classifiedAtomInputSchema.safeParse(canonicalInput).success).toBe(true);
		expect(classifiedAtomInputSchema.safeParse(atomInput).success).toBe(true);
	});

	it('does not enrich a terminal TMDB identity-only acquisition', () => {
		const input = toClassifiedAtomInput('https://www.themoviedb.org/movie/550', {
			resolved: {
				atoms: [
					{
						category: 'thing',
						schemaType: 'Movie',
						title: "We can't source this title from TMDB; try the Letterboxd or Wikipedia link",
						canonicalId: 'tmdb:movie:550',
						sameAs: ['https://www.themoviedb.org/movie/550'],
						metadata: {
							provider: 'tmdb',
							acquisitionOutcome: {
								status: 'unavailable',
								reason: 'identity_bridge_not_found',
								terminal: true,
							},
						},
						data: {
							'@type': 'Movie',
							identifier: 'tmdb:movie:550',
						},
					},
				],
			},
		});

		expect(input).toBeNull();
	});

	it('keeps a degraded non-terminal provider-local identity eligible for enrichment', () => {
		const input = toClassifiedAtomInput('https://letterboxd.com/film/moonlight/', {
			resolved: {
				atoms: [
					{
						category: 'thing',
						schemaType: 'Movie',
						title: 'Moonlight',
						canonicalId: 'letterboxd:film:moonlight',
						sameAs: ['https://letterboxd.com/film/moonlight/'],
						metadata: {
							provider: 'letterboxd-opengraph',
							acquisitionOutcome: {
								status: 'degraded',
								terminal: false,
							},
						},
						data: { '@type': 'Movie', name: 'Moonlight' },
					},
				],
			},
		});

		expect(input).not.toBeNull();
		expect(input?.source.provider).toBe('letterboxd-opengraph');
		expect(input?.jsonLd?.name).toBe('Moonlight');
	});
});
