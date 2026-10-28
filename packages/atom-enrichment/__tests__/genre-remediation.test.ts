import { describe, expect, test } from 'bun:test';
import { projectCorpusDataResolvedFromArtifacts } from '../src/corpus-data-resolved-projection';
import {
	DATA_RESOLVED_MAX_BYTES,
	dataResolvedSchema,
	sanitizeMaterializedDataResolved,
	sanitizeProjectedDataResolvedWithinBudget,
} from '../src/data-resolved-schema';
import { materializeNodeDataResolved } from '../src/materialize-node-data-resolved';

const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).byteLength;
const tmdb = (genres: unknown[], mediaType = 'movie') => [
	{
		artifactKind: 'tmdb',
		status: 'active',
		data: { mediaType, genres },
	},
];
function padded(
	fields: Record<string, unknown>
): Record<string, unknown> & { description: string } {
	const value = { ...fields, description: '' };
	value.description = 'x'.repeat(DATA_RESOLVED_MAX_BYTES - bytes(value));
	expect(bytes(value)).toBe(65_536);
	return value;
}

describe('genre remediation reviewer probes', () => {
	test('F2 spec lowercase junk is discarded when merging a valid Drama artifact', () => {
		const dataResolved = { '@type': 'Movie', name: 'Example', genre: ['science fiction'] };
		const artifacts = tmdb([{ id: 18, name: 'Drama' }]);
		const projected = projectCorpusDataResolvedFromArtifacts({ dataResolved, artifacts });
		expect(projected).toEqual({ ...dataResolved, genre: ['Drama'] });
		expect(dataResolvedSchema.safeParse(projected).success).toBe(true);
	});
	test.each([
		'Preserved',
		'science fiction',
	])('F2 drops stored %s before corpus merge and materialization', (junk) => {
		const dataResolved = { '@type': 'Movie', name: 'Probe', genre: [junk] };
		const artifacts = tmdb([{ id: 878, name: 'Science Fiction' }]);
		const projected = projectCorpusDataResolvedFromArtifacts({ dataResolved, artifacts });
		expect(projected).toEqual({ ...dataResolved, genre: ['Science Fiction'] });
		expect(dataResolvedSchema.safeParse(projected).success).toBe(true);
		expect(
			materializeNodeDataResolved({
				classification: { schemaType: 'Movie' },
				dataResolved,
				artifacts,
			}).genre
		).toEqual(['Science Fiction']);
	});
	test.each([
		'Preserved',
		'science fiction',
	])('F2 drops artifact-less %s but direct validation rejects it', (junk) => {
		const dataResolved = { '@type': 'Movie', name: 'Example', genre: [junk] };
		expect(dataResolvedSchema.safeParse(dataResolved).success).toBe(false);
		expect(sanitizeMaterializedDataResolved(dataResolved)).toEqual({
			'@type': 'Movie',
			name: 'Example',
		});
		expect(
			materializeNodeDataResolved({
				classification: { schemaType: 'Movie' },
				dataResolved,
				artifacts: [],
			})
		).toEqual({ '@type': 'Movie', name: 'Example' });
	});
	test.each([
		'Science-fiction',
		'science fiction',
	])('F3 pinned ID wins over object name %s', (name) => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: { '@type': 'Movie' },
			artifacts: tmdb([{ id: 878, name }]),
		});
		expect(projected).toEqual({ '@type': 'Movie', genre: ['Science Fiction'] });
	});
	test('F3 unknown numeric IDs cannot borrow a pinned name; name-only entries stay exact', () => {
		const projected = projectCorpusDataResolvedFromArtifacts({
			dataResolved: { '@type': 'Movie' },
			artifacts: tmdb([
				{ id: 999999, name: 'Drama' },
				{ name: 'science fiction' },
				{ name: 'Science Fiction' },
				'Sci-Fi & Fantasy',
				'War & Politics',
			]),
		});
		expect(projected).toEqual({ '@type': 'Movie', genre: ['Science Fiction'] });
	});
	test('F4 direct QID document at exactly 65536 bytes remains valid and unchanged', () => {
		const value = padded({ genre: ['Q110593091'] });
		expect(dataResolvedSchema.parse(value)).toEqual(value);
		expect(
			dataResolvedSchema.safeParse({ ...value, description: `${value.description}x` }).success
		).toBe(false);
	});
	test('F4 exactly 65536 bytes retains the appended keyword and every non-genre field', () => {
		const value = padded({ '@type': 'Movie', genre: ['Q110593091'], keywords: ['keyword'] });
		const { keywords: _keywords, ...before } = value;
		const result = sanitizeProjectedDataResolvedWithinBudget(value, before);
		expect(result).toEqual(value);
		expect(bytes(result)).toBe(65_536);
	});
	test('F4 provider-backed expansion at the cap retains QIDs without evicting keywords', () => {
		const value = padded({ '@type': 'TVSeries', genre: ['Q110593091'], keywords: ['keyword'] });
		const artifacts = tmdb([{ id: 10759, name: 'Action & Adventure' }], 'tv');
		const projected = projectCorpusDataResolvedFromArtifacts({ dataResolved: value, artifacts });
		expect(projected).toEqual(value);
		const result = materializeNodeDataResolved({
			classification: { schemaType: 'TVSeries' },
			dataResolved: value,
			artifacts,
		});
		expect(result).toEqual(value);
		expect(bytes(result)).toBe(65_536);
	});
	test.each([
		{ label: 'movie', genre: ['Q130232'] },
		{ label: 'TV', genre: ['Q1366112'] },
		{ label: 'movie plus TV', genre: ['Q130232', 'Q1366112'] },
	])('F5 artifact-less Drama input $label retains original QIDs at every boundary', ({ genre }) => {
		const value = { '@type': 'Movie', genre: [...genre] };
		expect(dataResolvedSchema.parse(value)).toEqual(value);
		expect(sanitizeMaterializedDataResolved(value)).toEqual(value);
		expect(
			materializeNodeDataResolved({
				classification: { schemaType: 'Movie' },
				dataResolved: value,
				artifacts: [],
			})
		).toEqual(value);
	});
	test('F4 provider labels fill eight spare bytes without changing other fields and remain idempotent', () => {
		const value = padded({ '@type': 'TVSeries', genre: ['Q110593091'], keywords: ['keyword'] });
		value.description = value.description.slice(8);
		const artifacts = tmdb([{ id: 10759, name: 'Action & Adventure' }], 'tv');
		const once = projectCorpusDataResolvedFromArtifacts({ dataResolved: value, artifacts });
		expect(once).toEqual({ ...value, genre: ['Action & Adventure'] });
		expect(bytes(once)).toBe(65_536);
		expect(projectCorpusDataResolvedFromArtifacts({ dataResolved: once, artifacts })).toEqual(once);
	});
	test('F3 exact root strings survive an empty API payload genre array', () => {
		const artifacts = [
			{
				artifactKind: 'tmdb',
				status: 'active',
				data: {
					mediaType: 'movie',
					genres: ['Science Fiction'],
					tmdbApiPayload: { genres: [] },
				},
			},
		];
		expect(
			projectCorpusDataResolvedFromArtifacts({ dataResolved: { '@type': 'Movie' }, artifacts })
		).toEqual({ '@type': 'Movie', genre: ['Science Fiction'] });
	});
	test('F5 only QIDs recoverable from category-aware provider evidence translate', () => {
		const artifacts = tmdb([{ id: 18, name: 'Drama' }]);
		const originalArtifacts = JSON.stringify(artifacts);
		const input = {
			classification: { schemaType: 'Movie' },
			dataResolved: { '@type': 'Movie', genre: ['Q130232', 'Q1366112'] },
			artifacts,
		};
		const once = materializeNodeDataResolved(input);
		expect(once.genre).toEqual(['Drama', 'Q1366112']);
		expect(materializeNodeDataResolved({ ...input, dataResolved: once })).toEqual(once);
		expect(JSON.stringify(artifacts)).toBe(originalArtifacts);
	});
});
