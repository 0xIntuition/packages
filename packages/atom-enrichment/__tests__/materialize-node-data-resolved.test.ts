import { describe, expect, test } from 'bun:test';
import {
	createOpenGraphPlugin,
	isAllowedOpenGraphPageSource,
	materializeNodeDataResolved,
	materializeProcessDataResolved,
	selectPermissiveImage,
} from '../src';
import {
	DATA_RESOLVED_MAX_BYTES,
	sanitizeProjectedDataResolvedWithinBudget,
} from '../src/data-resolved-schema';
import { createPinAwareFetch } from '../src/plugins/providers/__shared__/http';
import { createMockAtomInput, createMockPluginContext, createMockRequest } from '../src/testing';
import type { EnrichmentArtifact } from '../src/types';

const resolvePublicTestHostname = async () => [{ address: '93.184.216.34', family: 4 as const }];

describe('TMDB details poster selection', () => {
	const logo = 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Fixture_logo.svg';
	const poster = 'https://image.tmdb.org/t/p/original/selected.jpg';
	const details: EnrichmentArtifact = {
		artifact_type: 'tmdb',
		data: { posterUrl: poster },
		meta: { pluginId: 'tmdb', provider: 'tmdb', fetchedAt: '2026-10-20T00:00:00.000Z' },
	};
	const sidecar = {
		artifactKind: 'tmdb-images',
		data: { posters: [{ file_path: '/alternative.jpg' }] },
	};

	test.each([
		'TVSeries',
		'Movie',
	])('%s details poster replaces the Commons base logo', (schemaType) => {
		for (const baseSource of ['classification', 'stored']) {
			const base = { '@type': schemaType, name: 'Fixture', image: logo };
			const result = materializeNodeDataResolved({
				classification: { schemaType, ...(baseSource === 'classification' ? { data: base } : {}) },
				...(baseSource === 'stored' ? { dataResolved: base } : {}),
				artifacts: [sidecar, details],
			});
			expect(result.image).toBe(poster);
		}
	});

	test.each(['TVSeries', 'Movie'])('%s keeps the base without a details poster', (schemaType) => {
		for (const artifacts of [[], [sidecar], [sidecar, { artifactKind: 'tmdb', data: {} }]]) {
			const result = materializeNodeDataResolved({
				classification: { schemaType, data: { '@type': schemaType, image: logo } },
				artifacts,
			});
			expect(result.image).toBe(logo);
		}
	});

	test.each([
		'TVSeries',
		'Movie',
	])('%s uses the details poster without a base image', (schemaType) => {
		expect(
			materializeNodeDataResolved({
				classification: { schemaType },
				artifacts: [sidecar, details],
			}).image
		).toBe(poster);
	});

	test('Book keeps the base before provider artwork', () => {
		expect(
			materializeNodeDataResolved({
				classification: { schemaType: 'Book', data: { '@type': 'Book', image: logo } },
				artifacts: [details, { artifactKind: 'openlibrary', data: { coverId: 42 } }],
			}).image
		).toBe(logo);
	});

	test.each([
		'TVSeries',
		'Movie',
	])('%s preserves later artifact and sidecar fallback order', (schemaType) => {
		const artifactImage = 'https://upload.wikimedia.org/fixture.jpg';
		const artifact = { artifactKind: 'wikidata', data: { image: artifactImage } };
		for (const artifacts of [[sidecar, artifact], [sidecar]]) {
			expect(materializeNodeDataResolved({ classification: { schemaType }, artifacts }).image).toBe(
				artifacts.length === 2
					? artifactImage
					: 'https://image.tmdb.org/t/p/original/alternative.jpg'
			);
		}
	});

	test.each([
		'TVSeries',
		'Movie',
	])('%s keeps the base photograph over a malformed details poster', (schemaType) => {
		const photo = 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Fixture_photo.jpg';
		for (const posterUrl of [
			'https://www.themoviedb.org/movie/550',
			'https://image.tmdb.org/t/p/original/',
			'https://image.tmdb.org/t/p/original/not-an-image.html',
		]) {
			const result = materializeNodeDataResolved({
				classification: { schemaType, data: { '@type': schemaType, image: photo } },
				artifacts: [{ artifactKind: 'tmdb', data: { posterUrl } }],
			});
			expect(result.image).toBe(photo);
		}
	});

	test.each([
		'TVSeries',
		'Movie',
	])('%s rematerialization retains the interim poster on repeat', (schemaType) => {
		const input = {
			classification: { schemaType },
			dataResolved: { '@type': schemaType, name: 'Fixture', image: poster },
			artifacts: [details],
		};
		const first = materializeNodeDataResolved(input);
		expect(first.image).toBe(poster);
		expect(materializeNodeDataResolved({ ...input, dataResolved: first })).toEqual(first);
		expect(buildEnrichmentPromotedFields(first, input.artifacts)).toBeUndefined();
	});
});

function materializeProcessFacets(facets: Record<string, unknown>) {
	return materializeProcessDataResolved({
		classification: {
			resolved: {
				atoms: [
					{
						data: {
							'@type': 'Movie',
							genre: ['Q42'],
							name: 'Valid fixture',
							...facets,
						},
						schemaType: 'Movie',
					},
				],
			},
		},
		enrichment: { artifacts: [] },
	});
}

describe('shared node data_resolved materialization', () => {
	test('feeds restored TMDB artifacts into display facets and canonical aliases', () => {
		const result = materializeNodeDataResolved({
			artifacts: [
				{
					artifactKind: 'tmdb',
					data: {
						identifierRung: [
							{ scheme: 'tmdb', value: 'movie:550' },
							{ scheme: 'imdb', value: 'title:tt0137523' },
						],
						overview: 'An insomniac and a soap maker form an underground club.',
						releaseDate: '1999-10-15',
						sameAs: [
							'https://www.themoviedb.org/movie/550',
							'https://www.imdb.com/title/tt0137523/',
						],
						title: 'Fight Club',
						tmdbApiPayload: { id: 550, title: 'Fight Club' },
					},
					meta: { sourceUrl: 'https://www.themoviedb.org/movie/550' },
				},
			],
			classification: { data: { '@type': 'Movie' }, schemaType: 'Movie' },
		});

		expect(result).toMatchObject({
			'@type': 'Movie',
			description: 'An insomniac and a soap maker form an underground club.',
			name: 'Fight Club (1999)',
			sameAs: ['https://www.imdb.com/title/tt0137523/', 'https://www.themoviedb.org/movie/550'],
			url: 'https://www.themoviedb.org/movie/550',
		});
	});

	test('preserves the classified title and prefers the licensed TMDB details poster', () => {
		const result = materializeNodeDataResolved({
			classification: {
				canonicalIid: 'int:wd:film:Q751921',
				data: {
					'@context': 'https://schema.org/',
					'@type': 'Movie',
					datePublished: '1975-08-14',
				},
				sameAs: [
					'https://letterboxd.com/film/the-rocky-horror-picture-show/',
					'https://letterboxd.com/tmdb/36685',
					'https://www.themoviedb.org/movie/36685',
					'https://www.wikidata.org/entity/Q751921',
				],
				schemaType: 'Movie',
				title: 'The Rocky Horror Picture Show',
			},
			artifacts: [
				{
					artifactKind: 'opengraph',
					data: {
						description: 'A musical comedy horror film.',
						image: 'https://image.tmdb.org/t/p/original/selected.jpg',
						url: 'https://letterboxd.com/film/the-rocky-horror-picture-show/',
					},
					meta: { sourceUrl: 'https://letterboxd.com/film/the-rocky-horror-picture-show/' },
				},
				{
					artifactKind: 'tmdb',
					data: {
						title: 'A provider TMDB title',
						posterUrl: 'https://image.tmdb.org/t/p/original/selected.jpg',
					},
				},
			],
		});

		expect(result).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'Movie',
			datePublished: '1975-08-14',
			description: 'A musical comedy horror film.',
			identifier: 'int:wd:film:Q751921',
			identifierRung: [{ rung: 'wd:film', value: 'Q751921' }],
			image: 'https://image.tmdb.org/t/p/original/selected.jpg',
			name: 'The Rocky Horror Picture Show (1975)',
			sameAs: [
				'https://www.wikidata.org/entity/Q751921',
				'https://letterboxd.com/film/the-rocky-horror-picture-show/',
				'https://letterboxd.com/tmdb/36685',
				'https://www.themoviedb.org/movie/36685',
			],
			url: 'https://www.wikidata.org/entity/Q751921',
		});
	});

	test('promotes an existing permissive Wikipedia image_any value for TV', () => {
		const result = materializeNodeDataResolved({
			classification: {
				canonicalIid: 'int:wd:television-series:Q1',
				data: { '@type': 'TVSeries', name: 'Fixture Series', datePublished: '2019' },
				sameAs: ['https://en.wikipedia.org/wiki/Fixture_Series'],
				schemaType: 'TVSeries',
				title: 'Fixture Series',
			},
			artifacts: [
				{
					artifactKind: 'opengraph',
					data: {
						image: '',
						image_any: 'https://upload.wikimedia.org/fixture-nonfree.jpg',
						image_any_license: { nonfree: true },
						url: 'https://en.wikipedia.org/wiki/Fixture_Series',
					},
					meta: { sourceUrl: 'https://en.wikipedia.org/wiki/Fixture_Series' },
				},
			],
		});

		expect(result.image).toBe('https://upload.wikimedia.org/fixture-nonfree.jpg');
		expect(result.name).toBe('Fixture Series (2019)');
	});

	test('is idempotent', () => {
		const input = {
			classification: {
				canonicalIid: 'int:isrc:USRC17607839',
				data: { '@type': 'MusicRecording', name: 'Fixture Track' },
				sameAs: ['https://open.spotify.com/track/fixture'],
				schemaType: 'MusicRecording',
				title: 'Fixture Track',
			},
			artifacts: [],
		} as const;
		const first = materializeNodeDataResolved(input);
		const second = materializeNodeDataResolved({ ...input, dataResolved: first });
		expect(second).toEqual(first);
	});

	test('preserves a user-edited display name during rematerialization', () => {
		const result = materializeNodeDataResolved({
			classification: {
				data: { '@type': 'Movie', datePublished: '1999', name: 'Provider Title' },
				schemaType: 'Movie',
				title: 'Provider Title',
			},
			artifacts: [],
			dataResolved: {
				'@type': 'Movie',
				datePublished: '1999',
				name: 'My Edited Title',
			},
		});

		expect(result.name).toBe('My Edited Title');
	});

	test('uses the Goodreads page identity and excludes favicon artifacts', () => {
		const faviconUrl = 'https://www.google.com/s2/favicons?domain=www.goodreads.com&sz=64';
		const result = materializeNodeDataResolved({
			classification: {
				canonicalIid: 'int:goodreads:book:4671',
				data: { '@type': 'Book' },
				schemaType: 'Book',
			},
			artifacts: [
				{
					artifactKind: 'favicon',
					data: { url: faviconUrl },
					meta: { sourceUrl: 'https://www.goodreads.com/book/show/4671' },
				},
				{
					artifactKind: 'opengraph',
					data: {
						title: 'The Left Hand of Darkness',
						url: 'https://www.goodreads.com/book/show/4671',
					},
					meta: { sourceUrl: 'https://www.goodreads.com/book/show/4671' },
				},
			],
			dataResolved: {
				'@type': 'Book',
				sameAs: [faviconUrl],
				url: faviconUrl,
			},
		});

		expect(result.url).toBe('https://www.goodreads.com/book/show/4671');
		expect(result.sameAs).toEqual(['https://www.goodreads.com/book/show/4671']);
		expect(JSON.stringify(result.sameAs)).not.toContain('favicons');
	});

	test('omits favicon-only inherited identity fields', () => {
		const faviconUrl = 'https://www.google.com/s2/favicons?domain=example.com&sz=64';
		const result = materializeNodeDataResolved({
			artifacts: [
				{
					artifactKind: 'favicon',
					data: { url: faviconUrl },
					meta: { sourceUrl: 'https://example.com/page' },
				},
			],
			classification: { data: { '@type': 'Thing' } },
			dataResolved: { '@type': 'Thing', sameAs: [faviconUrl], url: faviconUrl },
		});

		expect(result).not.toHaveProperty('url');
		expect(result).not.toHaveProperty('sameAs');
	});

	test('uses explicit inherited sameAs provenance across aliases and shallow clones', () => {
		const faviconUrl = 'https://icons.example.com/favicon.ico';
		const inherited = { '@type': 'Thing', sameAs: [faviconUrl], url: faviconUrl };
		const project = (classificationData: Record<string, unknown>) =>
			materializeNodeDataResolved({
				artifacts: [{ artifactKind: 'favicon', data: { url: faviconUrl } }],
				classification: {
					data: classificationData,
					sameAs: [faviconUrl],
					sameAsProvenance: 'inherited',
				},
				dataResolved: inherited,
			});

		expect(project(inherited)).toEqual({ '@type': 'Thing' });
		expect(project({ ...inherited })).toEqual({ '@type': 'Thing' });
	});

	test('cleans favicon identity fields carried in app process classification data', () => {
		const faviconUrl = 'https://icons.example.com/favicon.ico';
		const result = materializeProcessDataResolved({
			classification: {
				resolved: {
					atoms: [
						{
							data: { '@type': 'Thing', sameAs: [faviconUrl], url: faviconUrl },
							sameAs: [],
							schemaType: 'Thing',
						},
					],
				},
			},
			enrichment: { artifacts: [{ artifact_type: 'favicon', data: { url: faviconUrl } }] },
		});

		expect(result).toEqual({ '@context': 'https://schema.org/', '@type': 'Thing' });
	});

	test('quarantines a scalar actor facet at the process seam', () => {
		expect(materializeProcessFacets({ actor: 'Actor One' })).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'Movie',
			genre: ['Q42'],
			name: 'Valid fixture',
		});
	});

	test('quarantines a null optional aggregate-rating field at the process seam', () => {
		expect(
			materializeProcessFacets({ aggregateRating: { ratingCount: null, ratingValue: 8.5 } })
		).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'Movie',
			aggregateRating: { ratingValue: 8.5 },
			genre: ['Q42'],
			name: 'Valid fixture',
		});
	});

	test('quarantines an unknown identifier-rung entry at the process seam', () => {
		expect(
			materializeProcessFacets({
				identifierRung: [
					{ rung: 'unknown:rung', value: 'fixture' },
					{ rung: 'imdb:title', value: ' tt0111161 ' },
				],
			})
		).toEqual({
			'@context': 'https://schema.org/',
			'@type': 'Movie',
			genre: ['Q42'],
			identifierRung: [{ rung: 'imdb:title', value: 'tt0111161' }],
			name: 'Valid fixture',
		});
	});

	test('treats independently classified sameAs as page evidence by default', () => {
		const pageUrl = 'https://example.com/page';
		const result = materializeNodeDataResolved({
			artifacts: [{ artifactKind: 'favicon', data: { url: pageUrl } }],
			classification: { data: { '@type': 'Thing' }, sameAs: [pageUrl] },
		});

		expect(result.url).toBe(pageUrl);
		expect(result.sameAs).toEqual([pageUrl]);
	});

	test('keeps a page identity independently supplied by a page artifact', () => {
		const pageUrl = 'https://example.com/page';
		const result = materializeNodeDataResolved({
			artifacts: [
				{
					artifactKind: 'favicon',
					data: { url: pageUrl },
					meta: { sourceUrl: pageUrl },
				},
				{
					artifactKind: 'opengraph',
					data: { url: pageUrl },
					meta: { sourceUrl: pageUrl },
				},
			],
			classification: { data: { '@type': 'Thing' } },
			dataResolved: {
				'@type': 'Thing',
				sameAs: [pageUrl, 'https://alias.example/item'],
				url: pageUrl,
			},
		});

		expect(result.url).toBe(pageUrl);
		expect(result.sameAs).toContain(pageUrl);
	});

	test.each([
		['scheme', 'http://icons.example.com/favicon.ico', 'https://icons.example.com/favicon.ico'],
		[
			'www prefix',
			'https://icons.example.com/favicon.ico',
			'https://www.icons.example.com/favicon.ico',
		],
		[
			'fragment',
			'https://icons.example.com/favicon.ico',
			'https://icons.example.com/favicon.ico#legacy',
		],
		[
			'non-root trailing slash',
			'https://icons.example.com/assets/favicon.ico',
			'https://icons.example.com/assets/favicon.ico/',
		],
		[
			'default port',
			'https://icons.example.com/favicon.ico',
			'https://icons.example.com:443/favicon.ico',
		],
		[
			'uppercase host',
			'https://icons.example.com/favicon.ico',
			'https://ICONS.EXAMPLE.COM/favicon.ico',
		],
		['root trailing slash', 'http://icons.example.com', 'https://ICONS.EXAMPLE.COM/'],
	] as const)('drops inherited non-page identity across %s variants', (_variant, artifactUrl, inheritedUrl) => {
		const result = materializeNodeDataResolved({
			artifacts: [{ artifactKind: 'favicon', data: { url: artifactUrl } }],
			classification: { data: { '@type': 'Thing' } },
			dataResolved: { '@type': 'Thing', sameAs: [inheritedUrl], url: inheritedUrl },
		});

		expect(result).not.toHaveProperty('url');
		expect(result).not.toHaveProperty('sameAs');
	});

	test('rejects hostile image values instead of retaining them through classifier data', () => {
		const hostileImages = [
			'http://example.com/poster.jpg',
			'http://169.254.169.254/latest/meta-data',
			'https://localhost/admin.png',
			'data:image/svg+xml,<svg/>',
			'javascript:alert(1)',
			'//example.com/poster.jpg',
			'not a url',
		];

		for (const image of hostileImages) {
			const result = materializeNodeDataResolved({
				classification: {
					data: { '@type': 'Movie', image, name: 'Fixture' },
					schemaType: 'Movie',
					sourceUrl: 'https://letterboxd.com/film/fixture/',
				},
				artifacts: [],
			});

			expect(result).not.toHaveProperty('image');
		}
	});

	test('drops unknown and nested classifier fields and bounds plain-text descriptions', () => {
		const result = materializeNodeDataResolved({
			classification: {
				data: {
					'@type': 'Thing',
					description: `<p>${'x'.repeat(20 * 1024)}</p><script>alert(1)</script>`,
					name: 'Fixture',
					nested: { child: { tooDeep: { value: true } } },
					privateEmail: 'person@example.test',
					rawHtml: '<script>alert(1)</script>',
				},
				schemaType: 'Thing',
			},
			artifacts: [],
		});

		expect(result).not.toHaveProperty('nested');
		expect(result).not.toHaveProperty('privateEmail');
		expect(result).not.toHaveProperty('rawHtml');
		expect(String(result.description)).not.toContain('<');
		expect(new TextEncoder().encode(JSON.stringify(result)).byteLength).toBeLessThanOrEqual(
			64 * 1024
		);
		expect(() =>
			materializeNodeDataResolved({
				classification: {
					data: { '@type': 'Thing', description: 'x'.repeat(2 * 1024 * 1024) },
					schemaType: 'Thing',
				},
				artifacts: [],
			})
		).toThrow('dataResolved exceeds 65536 serialized bytes.');
	});

	test('retains a 20 KB plain-text seed description unchanged', () => {
		const description = 'x'.repeat(20 * 1024);
		const result = materializeNodeDataResolved({
			classification: {
				data: { '@type': 'Article', description, name: 'Long-form fixture' },
				schemaType: 'Article',
			},
			artifacts: [],
		});

		expect(result.description).toBe(description);
	});

	test('keeps a provider array entry at the exact 64 KiB document boundary', () => {
		const shell = { '@type': 'Movie', actor: ['Provider actor'], description: '' };
		const description = 'x'.repeat(
			DATA_RESOLVED_MAX_BYTES - new TextEncoder().encode(JSON.stringify(shell)).byteLength
		);
		const projected = { ...shell, description };
		const result = sanitizeProjectedDataResolvedWithinBudget(projected, {
			'@type': 'Movie',
			description,
		});

		expect(result.actor).toEqual(['Provider actor']);
		expect(new TextEncoder().encode(JSON.stringify(result)).byteLength).toBe(
			DATA_RESOLVED_MAX_BYTES
		);
	});

	test('drops provider tails before pre-existing document array entries', () => {
		const exactShell = { '@type': 'Movie', actor: ['Existing actor'], description: '' };
		const description = 'x'.repeat(
			DATA_RESOLVED_MAX_BYTES - new TextEncoder().encode(JSON.stringify(exactShell)).byteLength
		);
		const result = sanitizeProjectedDataResolvedWithinBudget(
			{ ...exactShell, actor: ['Existing actor', 'Provider actor'], description },
			{ ...exactShell, description }
		);

		expect(result.actor).toEqual(['Existing actor']);
	});

	test('trims trailing TMDB actor entries instead of failing the projected wave row', () => {
		const actors = Array.from({ length: 128 }, (_, index) => ({
			name: `${String(index).padStart(3, '0')}-${'a'.repeat(508)}`,
			order: index,
		}));
		const result = materializeNodeDataResolved({
			artifacts: [
				{
					artifactKind: 'tmdb',
					data: {
						mediaType: 'movie',
						tmdbApiPayload: { credits: { cast: actors } },
						tmdbId: 603,
					},
				},
			],
			classification: {
				canonicalIid: 'int:tmdb:movie:603',
				data: { '@type': 'Movie', name: 'Budget fixture' },
				schemaType: 'Movie',
				sourceFamily: 'tmdb_movie',
			},
		});

		expect(result.actor?.length).toBeLessThan(128);
		expect(result.actor?.[0]).toBe(actors[0]?.name);
		expect(new TextEncoder().encode(JSON.stringify(result)).byteLength).toBeLessThanOrEqual(
			DATA_RESOLVED_MAX_BYTES
		);
	});

	test.each([
		{ entry: 'é'.repeat(64), name: 'multibyte BMP' },
		{ entry: '😀'.repeat(32), name: 'astral' },
	])('uses UTF-8 bytes and trims the trailing $name provider entry', ({ entry }) => {
		const exactShell = { '@type': 'Movie', description: '', keywords: ['kept'] };
		const description = 'x'.repeat(
			DATA_RESOLVED_MAX_BYTES - new TextEncoder().encode(JSON.stringify(exactShell)).byteLength
		);
		const result = sanitizeProjectedDataResolvedWithinBudget(
			{ ...exactShell, description, keywords: ['kept', entry] },
			{ '@type': 'Movie', description }
		);

		expect(result.keywords).toEqual(['kept']);
		expect(new TextEncoder().encode(JSON.stringify(result)).byteLength).toBe(
			DATA_RESOLVED_MAX_BYTES
		);
	});

	test('retains seed-projected fields for every supported classification', () => {
		for (const schemaType of ['NewsArticle', 'Book', 'Person']) {
			const result = materializeNodeDataResolved({
				classification: {
					data: {
						'@type': schemaType,
						about: ['Parity'],
						author: 'Fixture Author',
						datePublished: '2026-08-27',
						name: `${schemaType} fixture`,
					},
					schemaType,
				},
				artifacts: [],
			});

			expect(result).toMatchObject({
				about: ['Parity'],
				author: 'Fixture Author',
				datePublished: '2026-08-27',
			});
		}
	});

	test('canonically orders sameAs with the preferred URL first', () => {
		const project = (sameAs: string[]) =>
			materializeNodeDataResolved({
				classification: {
					canonicalIid: 'int:wd:film:Q42',
					data: { '@type': 'Movie', name: 'Fixture' },
					sameAs,
					schemaType: 'Movie',
				},
				artifacts: [],
			});
		const aliases = [
			'https://www.themoviedb.org/movie/42',
			'https://letterboxd.com/film/fixture/',
			'https://www.wikidata.org/entity/Q42',
		];

		expect(project(aliases).sameAs).toEqual(project([...aliases].reverse()).sameAs);
		expect(project(aliases).sameAs).toEqual([
			'https://www.wikidata.org/entity/Q42',
			'https://letterboxd.com/film/fixture/',
			'https://www.themoviedb.org/movie/42',
		]);
	});
});

describe('shared permissive image policy', () => {
	test('permits licensed TMDB pages, approved publishers and generic pasted pages', () => {
		expect(isAllowedOpenGraphPageSource('https://www.themoviedb.org/movie/603')).toBe(true);
		expect(isAllowedOpenGraphPageSource('https://letterboxd.com/film/the-matrix/')).toBe(true);
		expect(isAllowedOpenGraphPageSource('https://en.wikipedia.org/wiki/The_Matrix')).toBe(true);
		expect(
			isAllowedOpenGraphPageSource('https://publisher.example/article', {
				genericUserPasted: true,
			})
		).toBe(true);
	});

	test('promotes image_any only when image is empty', () => {
		expect(selectPermissiveImage({ image: '', imageAny: 'https://example.com/any.jpg' })).toBe(
			'https://example.com/any.jpg'
		);
		expect(
			selectPermissiveImage({
				image: 'https://example.com/original.jpg',
				imageAny: 'https://example.com/any.jpg',
			})
		).toBe('https://example.com/original.jpg');
	});

	test('admits a licensed TMDB page redirect with its provenance', async () => {
		const calls: string[] = [];
		const plugin = createOpenGraphPlugin({
			fetch: createPinAwareFetch(async (input) => {
				calls.push(String(input));
				if (calls.length === 1) {
					return new Response(null, {
						headers: { location: 'https://www.themoviedb.org/movie/550' },
						status: 302,
					});
				}
				return new Response('<meta property="og:title" content="Licensed TMDB Title">', {
					status: 200,
				});
			}),
			resolveHostname: resolvePublicTestHostname,
		});
		const request = createMockRequest({
			input: createMockAtomInput({ hints: { url: 'https://letterboxd.com/tmdb/550' } }),
		});

		const artifacts = await plugin.enrich(request, createMockPluginContext());
		expect(artifacts).toHaveLength(1);
		expect(artifacts[0]).toMatchObject({
			data: { title: 'Licensed TMDB Title' },
			meta: {
				imagePolicy: { authorizedUrl: 'https://www.themoviedb.org/movie/550', kind: 'allowlisted' },
			},
		});
		expect(calls).toEqual([
			'https://letterboxd.com/tmdb/550',
			'https://www.themoviedb.org/movie/550',
		]);
	});

	test('carries generic pasted-page authorization through image materialization', async () => {
		const sourceUrl = 'https://publisher.example/article';
		const image = 'https://cdn.publisher.example/article.jpg';
		const plugin = createOpenGraphPlugin({
			fetch: createPinAwareFetch(
				async () =>
					new Response(
						`<meta property="og:title" content="Publisher article"><meta property="og:image" content="${image}">`,
						{ status: 200 }
					)
			),
			resolveHostname: resolvePublicTestHostname,
		});
		const request = createMockRequest({
			input: createMockAtomInput({ hints: { name: 'Publisher article', url: sourceUrl } }),
		});
		const artifacts = await plugin.enrich(request, createMockPluginContext());
		const materialized = materializeNodeDataResolved({
			classification: {
				data: { '@type': 'Article', name: 'Publisher article' },
				schemaType: 'Article',
				sourceUrl,
			},
			artifacts,
		});

		expect(artifacts[0]?.data.image).toBe(image);
		expect(materialized.image).toBe(image);
	});

	test('rejects private DNS image answers and accepts a public Wikimedia answer', async () => {
		const addresses: Record<string, string> = {
			'127.0.0.1.nip.io': '127.0.0.1',
			'10.0.0.1.sslip.io': '10.0.0.1',
			'publisher.example': '93.184.216.34',
			'upload.wikimedia.org': '208.80.154.240',
		};
		const resolveHostname = async (hostname: string) => [
			{ address: addresses[hostname] ?? '93.184.216.35', family: 4 as const },
		];
		const materializeImage = async (image: string) => {
			const plugin = createOpenGraphPlugin({
				fetch: createPinAwareFetch(
					async () => new Response(`<meta property="og:image" content="${image}">`, { status: 200 })
				),
				resolveHostname,
			});
			const request = createMockRequest({
				input: createMockAtomInput({ hints: { url: 'https://publisher.example/article' } }),
			});
			const artifacts = await plugin.enrich(request, createMockPluginContext());
			return materializeNodeDataResolved({
				classification: { data: { '@type': 'Article' }, schemaType: 'Article' },
				artifacts,
			});
		};

		expect(await materializeImage('https://127.0.0.1.nip.io/image.jpg')).not.toHaveProperty(
			'image'
		);
		expect(await materializeImage('https://10.0.0.1.sslip.io/image.jpg')).not.toHaveProperty(
			'image'
		);
		expect(await materializeImage('https://upload.wikimedia.org/image.jpg')).toHaveProperty(
			'image',
			'https://upload.wikimedia.org/image.jpg'
		);
	});
});

describe('provider placeholder name guard (ENG-15388)', () => {
	const spotifyArtifact = {
		artifactKind: 'spotify',
		data: {
			data: {
				albumName: 'New Years Hits!',
				artists: [{ name: 'Don Toliver', spotifyId: '4Gso3d4CscCijv0lmajZWs' }],
				imageUrl: 'https://i.scdn.co/image/ab67616d0000b2734c91154801bca0812d1f9a44',
				isrc: 'USAT22302146',
				name: 'No Pole',
				spotifyId: '0JHfuwniPQima9xHV42pbS',
				type: 'track',
			},
		},
		meta: { sourceUrl: 'https://open.spotify.com/track/0JHfuwniPQima9xHV42pbS' },
	};

	test('stored Spotify placeholder name is displaced by the artifact title', () => {
		const result = materializeNodeDataResolved({
			artifacts: [spotifyArtifact],
			classification: { schemaType: 'MusicRecording', sourceFamily: 'spotify_track' },
			dataResolved: {
				'@type': 'MusicRecording',
				name: 'Spotify Track 0JHfuwniPQima9xHV42pbS',
			},
		});
		expect(result.name).toBe('No Pole');
	});

	test('classifier Spotify placeholder never wins over artifact evidence at write time', () => {
		const result = materializeNodeDataResolved({
			artifacts: [spotifyArtifact],
			classification: {
				data: { '@type': 'MusicRecording', name: 'Spotify Track 0JHfuwniPQima9xHV42pbS' },
				schemaType: 'MusicRecording',
			},
		});
		expect(result.name).toBe('No Pole');
	});

	test('genuine user-edited names keep top priority over artifact titles', () => {
		const result = materializeNodeDataResolved({
			artifacts: [spotifyArtifact],
			classification: { schemaType: 'MusicRecording' },
			dataResolved: { '@type': 'MusicRecording', name: 'My Renamed Song' },
		});
		expect(result.name).toBe('My Renamed Song');
	});

	test.each([
		'Spotify Album 4iVix2mcSsRolteBz3znEt',
		'Spotify Artist 4Gso3d4CscCijv0lmajZWs',
		'Spotify Episode 1oDCRxbYSF1TxovWMNSbmM',
		'Spotify Playlist 37i9dQZF1DXcBWIGoYBM5M',
		'Spotify Show 4rOoJ6Egrf8K2IrywzwOMk',
		'IMDb Title tt0137523',
		'IMDb Person nm0000138',
		'YouTube Video dQw4w9WgXcQ',
		'GitHub Repo 0xIntuition/intuition-v2',
	])('placeholder family "%s" is displaced by artifact titles', (placeholder) => {
		const result = materializeNodeDataResolved({
			artifacts: [
				{
					artifactKind: 'opengraph',
					data: { title: 'The Real Title' },
					meta: { sourceUrl: 'https://example.com/page' },
				},
			],
			classification: { schemaType: 'Thing' },
			dataResolved: { '@type': 'Thing', name: placeholder },
		});
		expect(result.name).toBe('The Real Title');
	});

	test('a placeholder with no artifact evidence is retained rather than dropped', () => {
		const result = materializeNodeDataResolved({
			artifacts: [],
			classification: { schemaType: 'MusicRecording' },
			dataResolved: {
				'@type': 'MusicRecording',
				name: 'Spotify Track 0JHfuwniPQima9xHV42pbS',
			},
		});
		expect(result.name).toBe('Spotify Track 0JHfuwniPQima9xHV42pbS');
	});
});

test('process fallback finds the canonical source among classifier sameAs entries', () => {
	expect(
		materializeProcessDataResolved({
			classification: {
				resolved: {
					atoms: [
						{
							schemaType: 'Unadmitted',
							canonicalId: 'unknown:fixture',
							title: 'Fixture',
							sameAs: ['not-a-url', 'http://www.example.com/page/?utm_source=fixture#fragment'],
							data: {},
						},
					],
				},
			},
			enrichment: { artifacts: [] },
		})?.identifier
	).toBe('int:url:https://example.com/page');
});

test.each([
	true,
	false,
])('process materialization honours Wikipedia title flag %s for all identity URLs', (titleOnly) => {
	const pageUrl = 'https://en.wikipedia.org/wiki/Suspiria';
	const artifact = {
		artifact_type: 'wikipedia',
		data: { title: 'Suspiria', extract: 'Film text', pageUrl },
		meta: { sourceUrl: pageUrl, ...(titleOnly ? { identityStrength: 'title' } : {}) },
	};
	const result = materializeProcessDataResolved({
		classification: {
			resolved: {
				atoms: [{ schemaType: 'MusicAlbum', data: { '@type': 'MusicAlbum', name: 'Suspiria' } }],
			},
		},
		enrichment: { artifacts: [artifact] },
	});
	expect(result?.sameAs ?? []).toEqual(titleOnly ? [] : [pageUrl]);
	expect(result?.url).toBe(titleOnly ? undefined : pageUrl);
	// Inherited URLs survive only with independent identity evidence.
	const inherited = materializeNodeDataResolved({
		classification: { schemaType: 'MusicAlbum' },
		dataResolved: { url: pageUrl, sameAs: [pageUrl] },
		artifacts: [artifact],
	});
	expect(inherited.sameAs ?? []).toEqual(titleOnly ? [] : [pageUrl]);
	expect(inherited.url).toBe(titleOnly ? undefined : pageUrl);
});

const titleArtifacts: EnrichmentArtifact[] = [
	{
		artifact_type: 'wikidata',
		data: {
			entityId: 'Q546900',
			label: 'Suspiria',
			claims: {
				P2002: [
					{ mainsnak: { snaktype: 'value', datavalue: { type: 'string', value: 'acme_fixture' } } },
				],
			},
		},
		meta: {
			pluginId: 'wikidata',
			provider: 'wikidata',
			fetchedAt: '2026-01-01T00:00:00.000Z',
			sourceUrl: 'https://www.wikidata.org/wiki/Q546900',
			identityStrength: 'title',
		},
	},
	{
		artifact_type: 'wikipedia',
		data: { pageUrl: 'https://en.wikipedia.org/wiki/Suspiria_film', title: 'Suspiria film' },
		meta: {
			pluginId: 'wikipedia',
			provider: 'wikipedia',
			fetchedAt: '2026-01-01T00:00:00.000Z',
			identityStrength: 'title',
		},
	},
];

for (const path of ['process', 'worker'] as const)
	test.each([
		'https://www.wikidata.org/entity/Q546900',
		'https://wikidata.org/wiki/Q546900',
		'https://wikidata.org/wiki/Special:EntityData/Q546900.json',
		'https://www.wikidata.org/entity/Special:EntityData/Q546900.json',
		'https://x.com/acme_fixture',
		'https://en.m.wikipedia.org/wiki/Suspiria%20film',
	])(`title quarantine drops inherited alias %s through ${path}`, (alias) => {
		const base = { '@type': 'MusicAlbum', name: 'Suspiria', sameAs: [alias], url: alias };
		const process = materializeProcessDataResolved({
			classification: { resolved: { atoms: [{ schemaType: 'MusicAlbum', data: base }] } },
			enrichment: { artifacts: titleArtifacts },
		});
		const worker = buildEnrichmentPromotedFields(base, titleArtifacts)?.dataResolved;
		for (const result of [path === 'process' ? process : worker]) {
			expect(result).toBeDefined();
			expect(result).not.toHaveProperty('url');
			expect((result as Record<string, unknown>).sameAs ?? []).toEqual([]);
		}
	});

test.each([
	'unflagged',
	'input',
	'inherited',
])('title quarantine preserves supported identity: %s', (support) => {
	const alias =
		support === 'inherited'
			? 'https://www.wikidata.org/entity/Q3978305'
			: 'https://x.com/acme_fixture';
	const base = { '@type': 'MusicAlbum', name: 'Suspiria', sameAs: [alias], url: alias };
	const artifacts =
		support === 'unflagged'
			? [
					...titleArtifacts,
					{
						...titleArtifacts[0]!,
						data: { url: alias },
						meta: { ...titleArtifacts[0]!.meta, identityStrength: undefined },
					},
				]
			: titleArtifacts;
	const result = materializeNodeDataResolved({
		dataResolved: base,
		artifacts,
		classification: {
			schemaType: 'MusicAlbum',
			sameAs: [alias],
			sameAsProvenance: 'inherited',
			...(support === 'input' ? { sourceUrl: alias } : {}),
		},
	});
	expect(result.sameAs).toContain(alias);
	expect(result.url).toBe(alias);
	const worker = buildEnrichmentPromotedFields(base, artifacts)?.dataResolved ?? base;
	if (support !== 'input') {
		expect((worker as Record<string, unknown>).sameAs).toContain(alias);
		expect((worker as Record<string, unknown>).url).toBe(alias);
	}
});

test('Wikipedia wikibaseItem alone quarantines an inherited entity route', () => {
	const alias = 'https://wikidata.org/entity/Q546900';
	const result = materializeNodeDataResolved({
		classification: { schemaType: 'MusicAlbum', sameAsProvenance: 'inherited' },
		dataResolved: { '@type': 'MusicAlbum', sameAs: [alias], url: alias },
		artifacts: [
			{
				...titleArtifacts[1]!,
				data: { pageUrl: 'https://en.wikipedia.org/wiki/Suspiria', wikibaseItem: 'Q546900' },
			},
		],
	});
	expect(result.sameAs ?? []).toEqual([]);
	expect(result.url).toBeUndefined();
});

describe('materialized primary trailer lifecycle', () => {
	const video = { key: 'abcdefghijk', site: 'YouTube', type: 'Trailer' };
	test.each([
		'Movie',
		'TVSeries',
	])('replaces and removes an existing %s trailer while preserving identity', (schemaType) => {
		const classification = { schemaType };
		const existing = materializeNodeDataResolved({
			classification,
			artifacts: [],
			dataResolved: {
				'@type': schemaType,
				identifier: 'int:tmdb:movie:550',
				identifierRung: [{ rung: 'tmdb:movie', value: '550' }],
				sameAs: ['https://www.themoviedb.org/movie/550'],
			},
		});
		const result = materializeNodeDataResolved({
			classification,
			dataResolved: { ...existing, trailer: { '@type': 'VideoObject', url: 'old' } },
			artifacts: [{ artifactKind: 'tmdb_sidecar', data: { videos: { results: [video] } } }],
		});
		expect(result.trailer).toEqual({
			'@type': 'VideoObject',
			url: 'https://www.youtube.com/watch?v=abcdefghijk',
			embedUrl: 'https://www.youtube.com/embed/abcdefghijk',
			thumbnailUrl: 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg',
		});
		for (const key of ['sameAs', 'identifier', 'identifierRung'] as const)
			expect(result[key]).toEqual(existing[key]);
		const removed = materializeNodeDataResolved({
			artifactsAreComplete: true,
			classification,
			dataResolved: result,
			artifacts: [],
		});
		expect(removed).toEqual(existing);
		expect(removed).not.toHaveProperty('trailer');
	});
	test.each([
		'Book',
		'MusicAlbum',
	])('removes a stale trailer for %s even with TMDB videos', (schemaType) => {
		const result = materializeNodeDataResolved({
			classification: { schemaType },
			dataResolved: { trailer: { url: 'stale' } },
			artifacts: [
				{ artifactKind: 'tmdb', data: { tmdbApiPayload: { videos: { results: [video] } } } },
			],
		});
		expect(result).not.toHaveProperty('trailer');
	});
	test.each([
		{ status: 'inactive' },
		{ error: 'withdrawn' },
	])('does not use withdrawn artifacts %j', (state) => {
		expect(
			materializeNodeDataResolved({
				classification: { schemaType: 'Movie' },
				artifacts: [{ artifactKind: 'tmdb-videos', data: { results: [video] }, ...state }],
			})
		).not.toHaveProperty('trailer');
	});
});

describe('S-F2 partial trailer evidence', () => {
	const trailer = {
		'@type': 'VideoObject' as const,
		url: 'https://www.youtube.com/watch?v=abcdefghijk',
		embedUrl: 'https://www.youtube.com/embed/abcdefghijk',
		thumbnailUrl: 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg',
	};
	const base = { '@type': 'Movie', name: 'Stored title' };
	test.each([
		undefined,
		false,
		true,
	])('preserves current trailer only with partial evidence (%s)', (artifactsAreComplete) => {
		const current = { ...base, trailer };
		const result = materializeNodeDataResolved({
			classification: { schemaType: 'Movie' },
			dataResolved: current,
			artifacts: [{ artifactKind: 'tmdb', data: { tmdbApiPayload: { videos: { results: [] } } } }],
			artifactsAreComplete,
		});
		expect(JSON.stringify(result)).toBe(JSON.stringify(artifactsAreComplete ? base : current));
	});
	test.each([
		undefined,
		false,
		true,
	])('new evidence always replaces the current trailer (%s)', (artifactsAreComplete) => {
		const result = materializeNodeDataResolved({
			classification: { schemaType: 'Movie' },
			dataResolved: { ...base, trailer },
			artifactsAreComplete,
			artifacts: [
				{
					artifactKind: 'tmdb-videos',
					data: { results: [{ site: 'YouTube', type: 'Trailer', key: 'zzzzzzzzzzz' }] },
				},
			],
		});
		expect(result.trailer?.url).toBe('https://www.youtube.com/watch?v=zzzzzzzzzzz');
	});
	test('removes an invalid current Vimeo trailer with partial evidence', () => {
		expect(
			materializeNodeDataResolved({
				classification: {},
				dataResolved: { ...base, trailer: { ...trailer, url: 'https://vimeo.com/123' } },
				artifacts: [],
			})
		).toEqual(base);
	});
	test('removes a valid current trailer from a non-Movie type with partial evidence', () => {
		expect(
			materializeNodeDataResolved({
				classification: {},
				dataResolved: { '@type': 'Book', name: 'Book', trailer },
				artifacts: [],
			})
		).toEqual({ '@type': 'Book', name: 'Book' });
	});
	test('F1 materializer drops the trailer rather than rejecting a document at the byte cap', () => {
		const current = { '@type': 'Movie', description: '' };
		current.description = 'x'.repeat(DATA_RESOLVED_MAX_BYTES - JSON.stringify(current).length);
		const result = materializeNodeDataResolved({
			classification: {},
			dataResolved: current,
			artifacts: [
				{
					artifactKind: 'tmdb-videos',
					data: { results: [{ site: 'YouTube', type: 'Trailer', key: 'abcdefghijk' }] },
				},
			],
		});
		expect(JSON.stringify(result)).toBe(JSON.stringify(current));
	});
});

// Worker projection boundary, inlined to keep the package tests standalone.
function buildEnrichmentPromotedFields(
	dataResolved: unknown,
	artifacts: readonly EnrichmentArtifact[],
	options: { artifactsAreComplete?: boolean } = {}
): { dataResolved: unknown } | undefined {
	const base = isRecord(dataResolved) ? dataResolved : {};
	const identifier = readString(base.identifier);
	const projected = materializeNodeDataResolved({
		dataResolved: base,
		artifacts,
		artifactsAreComplete: options.artifactsAreComplete,
		classification: {
			...(identifier?.startsWith('int:') ? { canonicalIid: identifier } : {}),
			data: base,
			sameAs: Array.isArray(base.sameAs)
				? base.sameAs.filter((value): value is string => typeof value === 'string')
				: [],
			sameAsProvenance: 'inherited',
			schemaType: readString(base['@type']),
			title: readString(base.name),
		},
	});

	return sameJson(projected, dataResolved) ? undefined : { dataResolved: projected };
}

function readString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sameJson(left: unknown, right: unknown): boolean {
	return canonicalJson(left) === canonicalJson(right);
}

function canonicalJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
	if (isRecord(value)) {
		return `{${Object.keys(value)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
			.join(',')}}`;
	}
	return JSON.stringify(value) ?? 'null';
}
